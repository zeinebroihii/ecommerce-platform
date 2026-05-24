/**
 * EscrowCaseInvestigator
 *
 * Fires on every new "Escrow Dispute" Case (via EscrowDisputeCaseTrigger).
 *   1. Posts an internal CaseComment: prior dispute count, order details, risk level, recommendation
 *   2. Emails the buyer's Account Owner (their account manager) with full context
 */
public without sharing class EscrowCaseInvestigator {
  // ── InvocableMethod for Agentforce ──────────────────────────────────────────
  // Agentforce calls this to get the risk assessment for a dispute case.
  // Returns risk level + recommendation so the agent can decide: escalate, refund, or release.

  public class AssessmentRequest {
    @InvocableVariable(label='Case ID or Case Number' required=true)
    public String caseIdentifier;
  }

  public class AssessmentResult {
    @InvocableVariable(label='Success')
    public Boolean success;
    @InvocableVariable(label='Risk Level (LOW / MEDIUM / HIGH)')
    public String riskLevel;
    @InvocableVariable(label='Prior Disputes Count')
    public Integer priorDisputes;
    @InvocableVariable(label='Order Number')
    public String orderNumber;
    @InvocableVariable(label='Amount Frozen (EUR)')
    public Decimal amountFrozen;
    @InvocableVariable(label='Buyer Reason')
    public String buyerReason;
    @InvocableVariable(label='Account Name')
    public String accountName;
    @InvocableVariable(label='Recommendation')
    public String recommendation;
    @InvocableVariable(label='Message')
    public String message;
  }

  @InvocableMethod(
    label='Nexus: Assess Dispute Risk'
    description='Returns risk level and investigation summary for an escrow dispute case. Use when asked to review, assess, investigate, or decide on a dispute.'
  )
  public static List<AssessmentResult> assessDisputeCase(
    List<AssessmentRequest> requests
  ) {
    List<AssessmentResult> results = new List<AssessmentResult>();
    for (AssessmentRequest req : requests) {
      AssessmentResult res = new AssessmentResult();
      try {
        if (String.isBlank(req.caseIdentifier)) {
          res.success = false;
          res.message = 'Case identifier is required.';
          results.add(res);
          continue;
        }
        String input = req.caseIdentifier.trim();
        List<Case> cases = new List<Case>();
        // Try as Salesforce record ID first, then as CaseNumber
        if (input.length() == 15 || input.length() == 18) {
          cases = [
            SELECT
              Id,
              CaseNumber,
              Subject,
              Description,
              AccountId,
              Related_Order__c,
              Account.Name,
              Contact.Name
            FROM Case
            WHERE Id = :input
            LIMIT 1
          ];
        }
        if (cases.isEmpty()) {
          cases = [
            SELECT
              Id,
              CaseNumber,
              Subject,
              Description,
              AccountId,
              Related_Order__c,
              Account.Name,
              Contact.Name
            FROM Case
            WHERE CaseNumber = :input
            LIMIT 1
          ];
        }
        if (cases.isEmpty()) {
          res.success = false;
          res.message = 'Case not found: ' + input;
          results.add(res);
          continue;
        }
        Case c = cases[0];

        Integer priorCount = [
          SELECT COUNT()
          FROM Case
          WHERE
            AccountId = :c.AccountId
            AND Subject LIKE 'Escrow Dispute%'
            AND Id != :c.Id
        ];

        Order o = null;
        if (c.Related_Order__c != null) {
          List<Order> orders = [
            SELECT Id, OrderNumber, TotalAmount
            FROM Order
            WHERE Id = :c.Related_Order__c
            LIMIT 1
          ];
          if (!orders.isEmpty())
            o = orders[0];
        }

        res.success = true;
        res.priorDisputes = priorCount;
        res.accountName = c.Account?.Name ?? '—';
        res.buyerReason = c.Description ?? '—';
        res.orderNumber = o != null ? o.OrderNumber : '—';
        res.amountFrozen = o != null ? o.TotalAmount : null;
        res.message = 'Assessment complete for Case #' + c.CaseNumber;

        if (priorCount == 0) {
          res.riskLevel = 'LOW';
          res.recommendation = 'First-time dispute. Request supporting evidence (photos, delivery proof) before deciding.';
        } else if (priorCount <= 2) {
          res.riskLevel = 'MEDIUM';
          res.recommendation =
            'Repeat disputer (' +
            priorCount +
            ' prior cases). Compare with previous dispute reasons before releasing payment.';
        } else {
          res.riskLevel = 'HIGH';
          res.recommendation =
            'HIGH RISK — ' +
            priorCount +
            ' prior disputes on this account. Escalate to senior review before any action.';
        }
      } catch (Exception e) {
        res.success = false;
        res.message = e.getMessage();
      }
      results.add(res);
    }
    return results;
  }

  public static void investigate(List<Id> caseIds) {
    for (Id caseId : caseIds) {
      investigateOne(caseId);
    }
  }

  private static void investigateOne(Id caseId) {
    Case c = [
      SELECT
        Id,
        CaseNumber,
        Subject,
        Description,
        AccountId,
        Related_Order__c,
        Account.Name,
        Account.OwnerId,
        Contact.Name
      FROM Case
      WHERE Id = :caseId
      LIMIT 1
    ];

    Integer priorDisputes = [
      SELECT COUNT()
      FROM Case
      WHERE
        AccountId = :c.AccountId
        AND Subject LIKE 'Escrow Dispute%'
        AND Id != :caseId
    ];

    Order o = null;
    if (c.Related_Order__c != null) {
      List<Order> orders = [
        SELECT
          Id,
          OrderNumber,
          TotalAmount,
          Status,
          EscrowStatus__c,
          EffectiveDate
        FROM Order
        WHERE Id = :c.Related_Order__c
        LIMIT 1
      ];
      if (!orders.isEmpty())
        o = orders[0];
    }

    postInvestigationComment(c, o, priorDisputes);
    notifyAccountOwner(c, o, priorDisputes);

    // Auto-block HIGH RISK orders — no escrow action until senior approves
    if (priorDisputes > 2 && o != null) {
      try {
        update new Order(Id = o.Id, EscrowStatus__c = 'BLOCKED');
      } catch (Exception e) {
        System.debug(
          '[EscrowCaseInvestigator] Block order failed: ' + e.getMessage()
        );
      }
      SlackNotificationService.sendEscrowBlockedAlert(
        o.OrderNumber,
        c.Id,
        c.CaseNumber,
        c.Account?.Name ?? '—',
        o.TotalAmount ?? 0,
        priorDisputes,
        c.Description ?? '—'
      );
    }
  }

  // ── 1. Internal CaseComment with investigation summary ────────────────────

  private static void postInvestigationComment(
    Case c,
    Order o,
    Integer priorDisputes
  ) {
    String riskLabel = priorDisputes == 0
      ? 'LOW'
      : priorDisputes <= 2 ? 'MEDIUM' : 'HIGH';

    String body = 'Nexus Auto-Investigation\n';
    body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    if (o != null) {
      Integer daysSinceOrder = o.EffectiveDate != null
        ? o.EffectiveDate.daysBetween(Date.today())
        : 0;
      body += 'ORDER DETAILS\n';
      body += '• Order #' + o.OrderNumber + '\n';
      body +=
        '• Amount frozen: ' +
        (o.TotalAmount != null ? o.TotalAmount.setScale(2) + ' €' : '—') +
        '\n';
      body += '• Order placed: ' + daysSinceOrder + ' day(s) ago\n';
      body += '• Order status: ' + o.Status + '\n';
      body += '• Escrow status: ' + (o.EscrowStatus__c ?? 'DISPUTED') + '\n\n';
    }

    body += 'ACCOUNT HISTORY\n';
    body += '• Account: ' + (c.Account?.Name ?? '—') + '\n';
    body += '• Prior escrow disputes: ' + priorDisputes + '\n';
    body += '• Risk level: ' + riskLabel + '\n\n';

    body += 'BUYER\'S REASON\n';
    body += '"' + (c.Description ?? '—') + '"\n\n';

    body += 'RECOMMENDATION\n';
    if (priorDisputes == 0) {
      body += 'First-time dispute for this account. Review the reason carefully.\n';
      body += 'Suggested action: Request supporting evidence (photos / delivery proof) before deciding.';
    } else if (priorDisputes <= 2) {
      body += 'Repeat disputer — ' + priorDisputes + ' prior case(s).\n';
      body += 'Suggested action: Compare with previous dispute reasons before releasing payment.';
    } else {
      body +=
        'HIGH RISK — ' +
        priorDisputes +
        ' prior disputes on this account.\n';
      body += 'Suggested action: Escalate to senior review before any action.';
    }

    try {
      insert new CaseComment(
        ParentId = c.Id,
        CommentBody = body,
        IsPublished = false
      );
    } catch (Exception e) {
      System.debug(
        '[EscrowCaseInvestigator] CaseComment failed: ' + e.getMessage()
      );
    }
  }

  // ── 2. Email to Account Owner (buyer's account manager) ───────────────────

  private static void notifyAccountOwner(
    Case c,
    Order o,
    Integer priorDisputes
  ) {
    if (c.AccountId == null || c.Account?.OwnerId == null)
      return;

    List<User> owners = [
      SELECT Name, Email
      FROM User
      WHERE Id = :c.Account.OwnerId AND IsActive = TRUE
      LIMIT 1
    ];
    if (owners.isEmpty() || String.isBlank(owners[0].Email))
      return;

    String ownerName = owners[0].Name;
    String accountName = c.Account?.Name ?? '—';
    String buyerName = c.Contact?.Name ?? '—';
    String orderNum = o != null ? '#' + o.OrderNumber : '—';
    String amount = o != null &&
      o.TotalAmount != null
      ? o.TotalAmount.setScale(2) + ' €'
      : '—';
    String reason = (c.Description ?? '—').escapeHtml4();
    String caseNum = c.CaseNumber;
    String riskColor = priorDisputes == 0
      ? '#059669'
      : priorDisputes <= 2 ? '#d97706' : '#dc2626';
    String riskLabel = priorDisputes == 0
      ? 'LOW'
      : priorDisputes <= 2 ? 'MEDIUM' : 'HIGH';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ owners[0].Email });
    mail.setSubject(
      '⚠️ Your client ' +
        accountName +
        ' filed an escrow dispute — Case #' +
        caseNum
    );
    mail.setHtmlBody(
      '<div style="font-family:Arial,sans-serif;max-width:600px">' +
        '<div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0">' +
        '<h2 style="color:#fff;margin:0">Client Dispute Notification</h2>' +
        '<p style="color:#93c5fd;margin:6px 0 0">Your client has frozen their escrow — please review within 48 hours</p>' +
        '</div>' +
        '<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">' +
        '<p style="color:#374151;margin:0 0 20px">Hi ' +
        ownerName +
        ',</p>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px">Client</td><td style="font-weight:700">' +
        accountName +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Buyer contact</td><td>' +
        buyerName +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Order</td><td style="font-weight:700">' +
        orderNum +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Amount frozen</td><td style="color:#dc2626;font-weight:900;font-size:18px">' +
        amount +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Case</td><td style="font-weight:700">#' +
        caseNum +
        '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Account risk</td><td style="font-weight:900;color:' +
        riskColor +
        '">' +
        riskLabel +
        ' (' +
        priorDisputes +
        ' prior dispute(s))</td></tr>' +
        '</table>' +
        '<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin-bottom:24px;border-radius:0 4px 4px 0">' +
        '<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase">Buyer\'s reason</p>' +
        '<p style="margin:0;color:#1f2937;line-height:1.6">' +
        reason +
        '</p>' +
        '</div>' +
        '<p style="color:#374151;line-height:1.6">The escrow is <strong>frozen</strong> pending support review. As the account manager for <strong>' +
        accountName +
        '</strong>, you may want to contact your client directly to assist with faster resolution. The support team has 48 hours to decide.</p>' +
        '</div></div>'
    );

    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      System.debug(
        '[EscrowCaseInvestigator] account owner email failed: ' + e.getMessage()
      );
    }
  }

  // ── 3. Deadline expiry warning (called from EscrowMonitorScheduler) ───────
  // Finds FUNDED orders with PaymentDeadline__c exactly 2 days from today
  // and emails the buyer's contact: "Your escrow expires in 2 days."

  public static void sendDeadlineWarnings() {
    Date warningDate = Date.today().addDays(2);
    List<Order> orders = [
      SELECT
        Id,
        OrderNumber,
        TotalAmount,
        PaymentDeadline__c,
        AccountId,
        Account.Name
      FROM Order
      WHERE
        PaymentMethod__c = 'USDC_Escrow'
        AND (EscrowStatus__c = 'FUNDED'
        OR EscrowStatus__c = NULL)
        AND PaymentDeadline__c = :warningDate
      LIMIT 50
    ];
    if (orders.isEmpty())
      return;

    for (Order o : orders) {
      List<Contact> contacts = [
        SELECT Name, Email
        FROM Contact
        WHERE AccountId = :o.AccountId AND Email != NULL
        LIMIT 1
      ];
      if (contacts.isEmpty())
        continue;

      String buyerName = contacts[0].Name;
      String buyerEmail = contacts[0].Email;
      String orderNum = o.OrderNumber;
      String amount = o.TotalAmount != null
        ? o.TotalAmount.setScale(2) + ' €'
        : '—';
      String deadline = o.PaymentDeadline__c.format();
      String accountName = o.Account?.Name ?? '—';

      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ buyerEmail });
      mail.setSubject(
        '⏰ Your escrow for Order #' + orderNum + ' expires in 2 days'
      );
      mail.setHtmlBody(
        '<div style="font-family:Arial,sans-serif;max-width:600px">' +
          '<div style="background:#92400e;padding:20px 24px;border-radius:8px 8px 0 0">' +
          '<h2 style="color:#fff;margin:0">Payment Deadline Approaching</h2>' +
          '<p style="color:#fde68a;margin:6px 0 0">Action required — your escrow expires on ' +
          deadline +
          '</p>' +
          '</div>' +
          '<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">' +
          '<p style="color:#374151;margin:0 0 16px">Hi ' +
          buyerName +
          ',</p>' +
          '<p style="color:#374151;line-height:1.6;margin:0 0 20px">Your USDC escrow payment of <strong>' +
          amount +
          '</strong> for Order <strong>#' +
          orderNum +
          '</strong> will expire on <strong>' +
          deadline +
          '</strong>.</p>' +
          '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:0.75rem;padding:16px;margin-bottom:20px">' +
          '<p style="margin:0 0 8px;font-weight:700;color:#92400e">What to do:</p>' +
          '<p style="margin:0 0 6px;color:#78350f">✅ <strong>If your goods have arrived:</strong> Log in and confirm receipt to release payment to the seller.</p>' +
          '<p style="margin:0;color:#78350f">⚠️ <strong>If goods have NOT arrived:</strong> File a dispute now — once the deadline passes, the escrow will be automatically refunded to your wallet.</p>' +
          '</div>' +
          '<p style="color:#6b7280;font-size:13px">Order: #' +
          orderNum +
          ' · Account: ' +
          accountName +
          '</p>' +
          '</div></div>'
      );

      try {
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
      } catch (Exception e) {
        System.debug(
          '[EscrowCaseInvestigator] deadline warning email failed for ' +
            orderNum +
            ': ' +
            e.getMessage()
        );
      }
    }
  }
}
