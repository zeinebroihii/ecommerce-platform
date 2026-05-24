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
public without sharing class EscrowBridgeController {
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
    } else {
      syncEscrowStatus(orderNumber, 'DELIVERED');
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
    } else {
      syncEscrowStatus(orderNumber, 'FROZEN');
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
    } else {
      syncEscrowStatus(orderNumber, 'RELEASED');
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
    } else {
      syncEscrowStatus(orderNumber, 'REFUNDED');
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
    List<Order> blockCheck = [
      SELECT EscrowStatus__c
      FROM Order
      WHERE OrderNumber = :orderNumber
      LIMIT 1
    ];
    if (!blockCheck.isEmpty() && blockCheck[0].EscrowStatus__c == 'BLOCKED') {
      return new Map<String, Object>{
        'success' => false,
        'error' => 'Payment release blocked — this order has a HIGH RISK dispute pending senior approval.'
      };
    }
    String body = JSON.serialize(
      new Map<String, Object>{ 'orderId' => orderNumber, 'fromFreeze' => false }
    );
    HttpResponse res = doPost('/api/escrow/release', body);
    if (res.getStatusCode() == 200) {
      syncEscrowStatus(orderNumber, 'RELEASED');
    }
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
    if (res.getStatusCode() == 200) {
      syncEscrowStatus(orderNumber, 'DISPUTED');
    }
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

    // Test mode: wallet starting with 0x0000 skips the bridge entirely
    if (String.isNotBlank(buyerWallet) && buyerWallet.startsWith('0x0000')) {
      try {
        o.PaymentMethod__c = 'USDC_Escrow';
        o.EscrowStatus__c = 'FUNDED';
        update o;
      } catch (Exception e) {
        System.debug(
          '[EscrowBridge] Test bypass DML failed: ' + e.getMessage()
        );
      }
      return new Map<String, Object>{
        'success' => true,
        'txHash' => 'test-mode',
        'state' => 1
      };
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

    Boolean alreadyFunded =
      res.getBody() != null &&
      res.getBody().toLowerCase().contains('already funded');

    if (res.getStatusCode() == 200 || alreadyFunded) {
      // Mark the Order as paid via USDC Escrow
      o.PaymentMethod__c = 'USDC_Escrow';
      o.EscrowStatus__c = 'FUNDED';
      update o;

      if (res.getStatusCode() == 200) {
        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(
          res.getBody()
        );
        data.put('success', true);
        return data;
      }
      return new Map<String, Object>{
        'success' => true,
        'alreadyFunded' => true
      };
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

  // State numbers mirror the LWC ESCROW_STATE constant
  private static final Map<String, Integer> SF_STATE_MAP = new Map<String, Integer>{
    'FUNDED' => 1,
    'DELIVERED' => 2,
    'DISPUTED' => 3,
    'FROZEN' => 4,
    'RELEASING' => 5,
    'RELEASED' => 5,
    'REFUNDING' => 6,
    'REFUNDED' => 6,
    'BLOCKED' => 4
  };

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> getEscrowStatus(String orderNumber) {
    // Always trust Salesforce state — the bridge on-chain tx may be pending or
    // skipped (test mode). This decouples the portal UI from the blockchain.
    List<Order> sfOrders = [
      SELECT EscrowStatus__c, PaymentMethod__c
      FROM Order
      WHERE OrderNumber = :orderNumber
      LIMIT 1
    ];
    if (!sfOrders.isEmpty() && sfOrders[0].PaymentMethod__c == 'USDC_Escrow') {
      String s = sfOrders[0].EscrowStatus__c;
      if (s != null && SF_STATE_MAP.containsKey(s)) {
        return new Map<String, Object>{
          'state' => SF_STATE_MAP.get(s),
          'success' => true
        };
      }
    }

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
        r.orderNumber = resolveOrderNumber(r.orderNumber);
        // Block any action on HIGH RISK orders pending senior approval
        List<Order> blockCheck = [
          SELECT EscrowStatus__c
          FROM Order
          WHERE OrderNumber = :r.orderNumber
          LIMIT 1
        ];
        if (
          !blockCheck.isEmpty() && blockCheck[0].EscrowStatus__c == 'BLOCKED'
        ) {
          result.success = false;
          result.message =
            'Action blocked — HIGH RISK dispute requires senior approval before any escrow action on order ' +
            r.orderNumber +
            '. Ask Agentforce to approve it first.';
          results.add(result);
          continue;
        }
        // Resolve: Agentforce sometimes passes a Salesforce record ID instead of
        // the 8-digit OrderNumber. Detect and fix automatically.
        if (r.orderNumber == null) {
          result.success = false;
          result.message = 'Could not resolve an Order from: ' + r.orderNumber;
          results.add(result);
          continue;
        }
        if (r.action == 'FREEZE') {
          EscrowBridgeController.freezeEscrow(r.orderNumber);
          syncEscrowStatus(r.orderNumber, 'FROZEN');
          result.success = true;
          result.message = 'Freeze initiated for order ' + r.orderNumber;
        } else if (r.action == 'RELEASE') {
          Boolean ff = r.fromFreeze != null ? r.fromFreeze : false;
          EscrowBridgeController.releasePayment(r.orderNumber, ff);
          syncEscrowStatus(r.orderNumber, 'RELEASED');
          result.success = true;
          result.message = 'Release initiated for order ' + r.orderNumber;
        } else if (r.action == 'REFUND') {
          Boolean exp = r.expired != null ? r.expired : false;
          EscrowBridgeController.refundBuyer(r.orderNumber, exp);
          syncEscrowStatus(r.orderNumber, 'REFUNDED');
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

  // ─── Private helpers ─────────────────────────────────────────────────────

  // Agentforce may pass a Salesforce record ID (Case ID, Order ID) instead of
  // the 8-digit OrderNumber. This resolves any input to a proper OrderNumber.
  private static String resolveOrderNumber(String input) {
    if (String.isBlank(input))
      return null;
    // Already an 8-digit order number (e.g. 00000135)
    if (input.isNumeric())
      return input;
    // Salesforce ID: 15 or 18 alphanumeric chars
    if (input.length() == 15 || input.length() == 18) {
      String prefix = input.substring(0, 3);
      if (prefix == '500' || prefix == '5F0') {
        // Case ID — look up Related_Order__c
        List<Case> cases = [
          SELECT Related_Order__c, Related_Order__r.OrderNumber
          FROM Case
          WHERE Id = :input
          LIMIT 1
        ];
        if (!cases.isEmpty() && cases[0].Related_Order__r != null) {
          return cases[0].Related_Order__r.OrderNumber;
        }
        return null;
      }
      if (prefix == '801' || prefix == '8F1') {
        // Order record ID
        List<Order> orders = [
          SELECT OrderNumber
          FROM Order
          WHERE Id = :input
          LIMIT 1
        ];
        return orders.isEmpty() ? null : orders[0].OrderNumber;
      }
    }
    // Fallback: treat as-is (may already be correct)
    return input;
  }

  public static void syncEscrowStatus(String orderNumber, String newStatus) {
    List<Order> orders = [
      SELECT Id
      FROM Order
      WHERE OrderNumber = :orderNumber
      LIMIT 1
    ];
    if (orders.isEmpty())
      return;
    Order o = new Order(Id = orders[0].Id, EscrowStatus__c = newStatus);
    if (newStatus == 'DELIVERED') {
      o.DeliveryConfirmedAt__c = DateTime.now();
    }
    update o;
  }

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
