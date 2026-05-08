/**
 * EscrowBridgeController
 *
 * Apex layer between Salesforce events and the Vercel bridge API.
 * All methods are @future(callout=true) so they run asynchronously
 * and do not block the transaction that triggered them.
 *
 * The Named Credential "EscrowBridge" must be configured in Setup:
 *   Setup → Named Credentials → New
 *   Label:    EscrowBridge
 *   URL:      https://your-app.vercel.app
 *   Auth:     No Authentication (we handle it via custom header)
 *   Headers:  x-api-key: <your BRIDGE_API_KEY>
 */
public with sharing class EscrowBridgeController {
  private static final String NAMED_CRED = 'callout:EscrowBridge';
  private static final String CONTENT_TYPE = 'application/json';

  // ── Confirm Delivery ──────────────────────────────────────────────────────
  // Called by OrderEscrowTrigger when Order.Status → 'Delivered'
  // Transitions escrow: FUNDED → DELIVERED, starts 24 h safety delay

  @future(callout=true)
  public static void confirmDelivery(String orderNumber) {
    String body = JSON.serialize(
      new Map<String, String>{ 'orderId' => orderNumber }
    );
    HttpResponse res = doPost('/api/escrow/confirm', body);
    if (res.getStatusCode() != 200) {
      System.debug(
        LoggingLevel.ERROR,
        '[EscrowBridge] confirmDelivery failed for order ' +
          orderNumber +
          ' — status: ' +
          res.getStatusCode() +
          ' body: ' +
          res.getBody()
      );
    }
  }

  // ── Freeze Escrow ─────────────────────────────────────────────────────────
  // Called by Agentforce Dispute Handler (via InvocableMethod below)
  // when a case with dispute keywords is opened.
  // Transitions: FUNDED | DELIVERED | DISPUTED → FROZEN

  @future(callout=true)
  public static void freezeEscrow(String orderNumber) {
    String body = JSON.serialize(
      new Map<String, String>{ 'orderId' => orderNumber }
    );
    HttpResponse res = doPost('/api/escrow/freeze', body);
    if (res.getStatusCode() != 200) {
      System.debug(
        LoggingLevel.ERROR,
        '[EscrowBridge] freezeEscrow failed for order ' +
          orderNumber +
          ' — ' +
          res.getBody()
      );
    }
  }

  // ── Release Payment ───────────────────────────────────────────────────────
  // Called by scheduled Apex job after 24 h safety delay
  // or when admin resolves a frozen dispute in the seller's favour.

  @future(callout=true)
  public static void releasePayment(String orderNumber, Boolean fromFreeze) {
    String body = JSON.serialize(
      new Map<String, Object>{
        'orderId' => orderNumber,
        'fromFreeze' => fromFreeze
      }
    );
    HttpResponse res = doPost('/api/escrow/release', body);
    if (res.getStatusCode() != 200) {
      System.debug(
        LoggingLevel.ERROR,
        '[EscrowBridge] releasePayment failed for order ' +
          orderNumber +
          ' — ' +
          res.getBody()
      );
    }
  }

  // ── Refund Buyer ──────────────────────────────────────────────────────────
  // Called when admin resolves dispute in buyer's favour,
  // or when delivery deadline has expired.

  @future(callout=true)
  public static void refundBuyer(String orderNumber, Boolean expired) {
    String body = JSON.serialize(
      new Map<String, Object>{ 'orderId' => orderNumber, 'expired' => expired }
    );
    HttpResponse res = doPost('/api/escrow/refund', body);
    if (res.getStatusCode() != 200) {
      System.debug(
        LoggingLevel.ERROR,
        '[EscrowBridge] refundBuyer failed for order ' +
          orderNumber +
          ' — ' +
          res.getBody()
      );
    }
  }

  // ── Extend Deadline ───────────────────────────────────────────────────────
  // Called by Agentforce Delay Monitor when buyer agrees to extend.

  @future(callout=true)
  public static void extendDeadline(String orderNumber, Long newDeadlineUnix) {
    String body = JSON.serialize(
      new Map<String, Object>{
        'orderId' => orderNumber,
        'newDeadline' => newDeadlineUnix
      }
    );
    HttpResponse res = doPost('/api/escrow/extend', body);
    if (res.getStatusCode() != 200) {
      System.debug(
        LoggingLevel.ERROR,
        '[EscrowBridge] extendDeadline failed for order ' +
          orderNumber +
          ' — ' +
          res.getBody()
      );
    }
  }

  // ── Get Escrow Status (synchronous read — no state change) ────────────────
  // Called by portal LWC (via wire adapter) to show escrow state.

  // ── Confirm Receipt (called from LWC — buyer clicks button in portal) ────────
  // Synchronous callout — immediately skips remaining safety delay.

  @AuraEnabled
  public static Map<String, Object> confirmReceiptFromBuyer(
    String orderNumber
  ) {
    String body = JSON.serialize(
      new Map<String, Object>{ 'orderId' => orderNumber, 'fromFreeze' => false }
    );
    HttpResponse res = doPost('/api/escrow/release', body);
    return new Map<String, Object>{
      'success' => res.getStatusCode() == 200,
      'body' => res.getBody()
    };
  }

  // ── Raise Dispute (called from LWC — buyer clicks "Report an Issue") ─────────

  @AuraEnabled
  public static Map<String, Object> raiseDisputeFromBuyer(String orderNumber) {
    String body = JSON.serialize(
      new Map<String, String>{ 'orderId' => orderNumber }
    );
    HttpResponse res = doPost('/api/escrow/freeze', body);
    return new Map<String, Object>{
      'success' => res.getStatusCode() == 200,
      'body' => res.getBody()
    };
  }

  // ── Fund Escrow (called from LWC — buyer chooses USDC Escrow payment) ───────
  // Locks USDC on-chain and marks the Order as PaymentMethod = USDC_Escrow.
  // Returns the on-chain tx hash and escrow amount so the UI can update.

  @AuraEnabled
  public static Map<String, Object> fundEscrowForOrder(
    String orderNumber,
    String buyerWallet
  ) {
    // Query the Order to get amount + status
    Order[] orders = [
      SELECT Id, OrderNumber, TotalAmount, Status, PaymentDeadline__c
      FROM Order
      WHERE OrderNumber = :orderNumber
      LIMIT 1
    ];
    if (orders.isEmpty()) {
      return new Map<String, Object>{
        'success' => false,
        'error' => 'Order not found: ' + orderNumber
      };
    }
    Order o = orders[0];

    // USDC has 6 decimals — convert EUR total to USDC base units
    Long usdcAmount = (Long) (o.TotalAmount * 1000000);

    // Deadline: use contract payment date if available, else 30 days from now
    Long deadline;
    if (o.PaymentDeadline__c != null) {
      deadline =
        Datetime.newInstance(o.PaymentDeadline__c, Time.newInstance(0, 0, 0, 0))
          .getTime() / 1000;
    } else {
      deadline = (DateTime.now().getTime() / 1000) + (30 * 24 * 3600);
    }

    Map<String, Object> payload = new Map<String, Object>{
      'orderId' => orderNumber,
      'amount' => String.valueOf(usdcAmount),
      'deadline' => deadline
    };
    if (String.isNotBlank(buyerWallet)) {
      payload.put('buyer', buyerWallet);
    }

    HttpResponse res = doPost('/api/escrow/fund', JSON.serialize(payload));

    if (res.getStatusCode() == 200) {
      // Mark the Order as paid via USDC Escrow
      o.PaymentMethod__c = 'USDC_Escrow';
      update o;

      Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      data.put('success', true);
      return data;
    }

    return new Map<String, Object>{
      'success' => false,
      'error' => 'Bridge error ' +
      res.getStatusCode() +
      ': ' +
      res.getBody()
    };
  }

  // ── Get Escrow Status (synchronous read — no state change) ────────────────
  // Called by portal LWC imperatively when order detail modal opens.

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> getEscrowStatus(String orderNumber) {
    HttpRequest req = new HttpRequest();
    req.setEndpoint(NAMED_CRED + '/api/escrow/status?orderId=' + orderNumber);
    req.setMethod('GET');
    req.setHeader('Content-Type', CONTENT_TYPE);

    Http http = new Http();
    HttpResponse res = http.send(req);

    if (res.getStatusCode() == 200) {
      Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      return data;
    }
    return new Map<String, Object>{
      'success' => false,
      'error' => 'Bridge returned ' + res.getStatusCode()
    };
  }

  // ─── InvocableMethod for Agentforce ──────────────────────────────────────
  // Agentforce topics call this to freeze or release escrow.
  // The action accepts a list so Flow/Agentforce can call it in bulk.

  public class EscrowActionRequest {
    @InvocableVariable(label='Order Number' required=true)
    public String orderNumber;

    @InvocableVariable(
      label='Action (FREEZE | RELEASE | REFUND | EXTEND)'
      required=true
    )
    public String action;

    @InvocableVariable(label='New Deadline (Unix timestamp, only for EXTEND)')
    public Long newDeadlineUnix;

    @InvocableVariable(
      label='From Freeze (true = seller wins, only for RELEASE)'
    )
    public Boolean fromFreeze;

    @InvocableVariable(
      label='Expired (true = deadline exceeded, only for REFUND)'
    )
    public Boolean expired;
  }

  public class EscrowActionResult {
    @InvocableVariable(label='Success')
    public Boolean success;

    @InvocableVariable(label='Message')
    public String message;
  }

  @InvocableMethod(
    label='Nexus: Escrow Bridge Action'
    description='Freeze, release, refund, or extend an escrow from Agentforce'
  )
  public static List<EscrowActionResult> executeEscrowAction(
    List<EscrowActionRequest> requests
  ) {
    List<EscrowActionResult> results = new List<EscrowActionResult>();

    for (EscrowActionRequest r : requests) {
      EscrowActionResult result = new EscrowActionResult();
      try {
        if (r.action == 'FREEZE') {
          EscrowBridgeController.freezeEscrow(r.orderNumber);
          result.success = true;
          result.message = 'Freeze initiated for order ' + r.orderNumber;
        } else if (r.action == 'RELEASE') {
          Boolean ff = r.fromFreeze != null ? r.fromFreeze : false;
          EscrowBridgeController.releasePayment(r.orderNumber, ff);
          result.success = true;
          result.message = 'Release initiated for order ' + r.orderNumber;
        } else if (r.action == 'REFUND') {
          Boolean exp = r.expired != null ? r.expired : false;
          EscrowBridgeController.refundBuyer(r.orderNumber, exp);
          result.success = true;
          result.message = 'Refund initiated for order ' + r.orderNumber;
        } else if (r.action == 'EXTEND') {
          EscrowBridgeController.extendDeadline(
            r.orderNumber,
            r.newDeadlineUnix
          );
          result.success = true;
          result.message = 'Deadline extended for order ' + r.orderNumber;
        } else {
          result.success = false;
          result.message = 'Unknown action: ' + r.action;
        }
      } catch (Exception e) {
        result.success = false;
        result.message = e.getMessage();
      }
      results.add(result);
    }
    return results;
  }

  // ─── Private helper ──────────────────────────────────────────────────────

  private static HttpResponse doPost(String path, String body) {
    HttpRequest req = new HttpRequest();
    req.setEndpoint(NAMED_CRED + path);
    req.setMethod('POST');
    req.setHeader('Content-Type', CONTENT_TYPE);
    String apiKey = System.Label.EscrowBridgeApiKey;
    if (String.isNotBlank(apiKey) && apiKey != 'REPLACE_ME') {
      req.setHeader('x-api-key', apiKey);
    }
    req.setBody(body);
    req.setTimeout(30000);
    Http http = new Http();
    return http.send(req);
  }
}
