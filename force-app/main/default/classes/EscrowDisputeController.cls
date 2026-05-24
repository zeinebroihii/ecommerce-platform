/**
 * EscrowDisputeController
 *
 * Called from nexusOrderSystem LWC when buyer clicks "Report an Issue".
 * Single @AuraEnabled method that does three things atomically:
 *   1. Freeze escrow on-chain via the bridge
 *   2. Create a Salesforce Case (Priority: Critical) linked to the Order
 *   3. Email the System Admin with full dispute context
 *
 * without sharing — runs as system so it can query admin users and
 * insert Cases regardless of the portal user's sharing rules.
 */
public without sharing class EscrowDisputeController {
  @AuraEnabled
  public static Map<String, Object> raiseDisputeWithReason(
    String orderNumber,
    String reason
  ) {
    // ── 1. Freeze on-chain ──────────────────────────────────────────────────
    HttpRequest req = new HttpRequest();
    req.setEndpoint('callout:EscrowBridge/api/escrow/freeze');
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    String apiKey = System.Label.EscrowBridgeApiKey;
    if (String.isNotBlank(apiKey) && apiKey != 'REPLACE_ME') {
      req.setHeader('x-api-key', apiKey);
    }
    req.setBody(
      JSON.serialize(new Map<String, String>{ 'orderId' => orderNumber })
    );
    req.setTimeout(30000);

    HttpResponse res = new Http().send(req);
    // Bridge failure is non-blocking — we still freeze in Salesforce and create
    // the Case so admin/Agentforce can act. On-chain freeze will retry when POL
    // gas is available (Agentforce FREEZE action or scheduler).
    Boolean bridgeOk = res.getStatusCode() == 200;

    // ── 2. Sync EscrowStatus__c (DML after callout — allowed) ───────────────
    List<Order> orders = [
      SELECT Id, TotalAmount, Account.Name
      FROM Order
      WHERE OrderNumber = :orderNumber
      LIMIT 1
    ];
    if (!orders.isEmpty()) {
      update new Order(
        Id = orders[0].Id,
        EscrowStatus__c = bridgeOk ? 'FROZEN' : 'DISPUTED'
      );
    }

    // ── 3. Create Case ──────────────────────────────────────────────────────
    String caseNumber = '';
    try {
      Id contactId = null;
      Id accountId = null;
      try {
        User u = [
          SELECT ContactId
          FROM User
          WHERE Id = :UserInfo.getUserId()
          LIMIT 1
        ];
        contactId = u.ContactId;
        if (contactId != null) {
          Contact c = [
            SELECT AccountId
            FROM Contact
            WHERE Id = :contactId
            LIMIT 1
          ];
          accountId = c.AccountId;
        }
      } catch (Exception e) {
      }

      Case disputeCase = new Case(
        Subject = 'Escrow Dispute — Order #' + orderNumber,
        Description = reason,
        Priority = 'Critical',
        Status = 'New',
        Origin = 'Web',
        ContactId = contactId,
        AccountId = accountId,
        Related_Order__c = orders.isEmpty() ? null : orders[0].Id
      );
      insert disputeCase;

      Case inserted = [
        SELECT CaseNumber
        FROM Case
        WHERE Id = :disputeCase.Id
        LIMIT 1
      ];
      caseNumber = inserted.CaseNumber;

      // ── 4. Notify admin ─────────────────────────────────────────────────
      Decimal amount = orders.isEmpty() || orders[0].TotalAmount == null
        ? 0
        : orders[0].TotalAmount;
      String accountName = orders.isEmpty() || orders[0].Account == null
        ? '—'
        : orders[0].Account.Name;
      sendAdminAlert(orderNumber, reason, caseNumber, amount, accountName);
    } catch (Exception e) {
      System.debug(
        LoggingLevel.ERROR,
        '[EscrowDispute] case creation failed: ' + e.getMessage()
      );
    }

    return new Map<String, Object>{
      'success' => true,
      'caseNumber' => caseNumber
    };
  }

  // ── Private: admin email ─────────────────────────────────────────────────

  private static void sendAdminAlert(
    String orderNumber,
    String reason,
    String caseNumber,
    Decimal amount,
    String accountName
  ) {
    List<User> admins = [
      SELECT Email
      FROM User
      WHERE Profile.Name = 'System Administrator' AND IsActive = TRUE
      LIMIT 1
    ];
    if (admins.isEmpty())
      return;

    String amountStr = amount.setScale(2) + ' €';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ admins[0].Email });
    mail.setSubject(
      'Escrow Dispute — Order #' + orderNumber + ' (' + amountStr + ')'
    );
    mail.setHtmlBody(
      '<div style="font-family:Arial,sans-serif;max-width:600px">' +
        '<div style="background:#7f1d1d;padding:20px 24px;border-radius:8px 8px 0 0">' +
        '<h2 style="color:#fff;margin:0">&#9888; Escrow Dispute Filed</h2>' +
        '<p style="color:#fca5a5;margin:4px 0 0">Immediate review required — payment is frozen</p>' +
        '</div>' +
        '<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px">Order</td>' +
        '<td style="padding:8px 0;font-weight:700">#' +
        orderNumber +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Account</td>' +
        '<td style="padding:8px 0">' +
        accountName +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Amount Frozen</td>' +
        '<td style="padding:8px 0;color:#dc2626;font-weight:900;font-size:20px">' +
        amountStr +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Case</td>' +
        '<td style="padding:8px 0;font-weight:700">#' +
        caseNumber +
        '</td></tr>' +
        '</table>' +
        '<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin-bottom:24px;border-radius:0 4px 4px 0">' +
        '<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.08em">Buyer\'s reason</p>' +
        '<p style="margin:0;color:#1f2937;line-height:1.6">' +
        reason.escapeHtml4() +
        '</p>' +
        '</div>' +
        '<p style="color:#374151;margin-bottom:16px">Open the case in Salesforce and resolve:</p>' +
        '<table style="width:100%;border-collapse:collapse">' +
        '<tr>' +
        '<td style="width:48%;background:#ecfdf5;border:1px solid #10b981;padding:14px;border-radius:6px;text-align:center">' +
        '<p style="margin:0;font-weight:700;color:#065f46">Seller is right</p>' +
        '<p style="margin:4px 0 0;font-size:12px;color:#047857">RELEASE payment to seller</p>' +
        '</td>' +
        '<td style="width:4%"></td>' +
        '<td style="width:48%;background:#fff7ed;border:1px solid #f59e0b;padding:14px;border-radius:6px;text-align:center">' +
        '<p style="margin:0;font-weight:700;color:#92400e">Buyer is right</p>' +
        '<p style="margin:4px 0 0;font-size:12px;color:#b45309">REFUND buyer\'s payment</p>' +
        '</td>' +
        '</tr>' +
        '</table>' +
        '</div>' +
        '</div>'
    );

    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      System.debug('[EscrowDispute] admin email failed: ' + e.getMessage());
    }
  }
}
