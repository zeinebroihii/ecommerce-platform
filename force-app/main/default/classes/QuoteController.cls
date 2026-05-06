public without sharing class QuoteController {
  // ── Wrappers ──────────────────────────────────────────────────────────────

  public class QuoteWrapper {
    @AuraEnabled
    public Id quoteId;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String negotiationStatus;
    @AuraEnabled
    public Decimal grandTotal;
    @AuraEnabled
    public String formattedTotal;
    @AuraEnabled
    public String expirationDate;
    @AuraEnabled
    public String opportunityName;
    @AuraEnabled
    public Id opportunityId;
    @AuraEnabled
    public Boolean canDecide;
    @AuraEnabled
    public Boolean isAccepted;
    @AuraEnabled
    public Boolean isRejected;
    @AuraEnabled
    public Boolean isPrimary;
    @AuraEnabled
    public String description;
    @AuraEnabled
    public Integer acceptanceProbability;
    @AuraEnabled
    public String aiReason;
    @AuraEnabled
    public String paymentTerms;
    @AuraEnabled
    public Decimal bulkDiscount;
    @AuraEnabled
    public Integer versionNumber;
    @AuraEnabled
    public List<LineItemWrap> lineItems;
    // Negotiation fields
    @AuraEnabled
    public Decimal customerCounterPrice;
    @AuraEnabled
    public String counterMessage;
    @AuraEnabled
    public String approvalStatus;
    @AuraEnabled
    public Boolean volumeDiscountApplied;
    @AuraEnabled
    public Boolean isExpired;
    @AuraEnabled
    public Integer daysUntilExpiry;
    @AuraEnabled
    public Boolean canCounter; // customer can submit counter-offer
    @AuraEnabled
    public Integer negotiationRound;
    @AuraEnabled
    public Boolean isFinalOffer;
    @AuraEnabled
    public Integer roundsRemaining;
    @AuraEnabled
    public Decimal floorPrice;
    @AuraEnabled
    public String generalTerms;
    @AuraEnabled
    public Integer signatureDeadlineDays;
    @AuraEnabled
    public String messageThread;
  }

  public class LineItemWrap {
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public Integer quantity;
    @AuraEnabled
    public Decimal listPrice;
    @AuraEnabled
    public Decimal unitPrice;
    @AuraEnabled
    public Decimal discount;
    @AuraEnabled
    public Decimal netTotal;
    @AuraEnabled
    public String chargeType; // 'One-time' | 'Recurring'
    @AuraEnabled
    public String billingFrequency; // 'Monthly' | 'Annual' | 'Quarterly' | 'N/A'
    @AuraEnabled
    public String imageUrl;
  }

  public class CartItemInput {
    public String productId;
    public String name;
    public String family;
    public Integer quantity;
    public Decimal unitPrice;
  }

  // ── Get all quotes for a customer's account ───────────────────────────────

  @AuraEnabled(cacheable=false)
  public static List<QuoteWrapper> getAccountQuotes(Id accountId) {
    List<QuoteWrapper> result = new List<QuoteWrapper>();
    if (accountId == null)
      return result;

    Map<String, String> imageByName = new Map<String, String>();
    for (Product2 p : [
      SELECT Name, Image_URL__c
      FROM Product2
      WHERE Image_URL__c != NULL
    ]) {
      imageByName.put(p.Name, p.Image_URL__c);
    }

    Date today = Date.today();
    for (TALEXO_Quote__c q : [
      SELECT
        Id,
        Name,
        Status__c,
        NegotiationStatus__c,
        GrandTotal__c,
        ExpirationDate__c,
        Opportunity__c,
        Opportunity__r.Name,
        Description__c,
        AcceptanceProbability__c,
        AIReason__c,
        PaymentTerms__c,
        BulkDiscount__c,
        VersionNumber__c,
        IsPrimary__c,
        CustomerCounterPrice__c,
        CounterMessage__c,
        ApprovalStatus__c,
        VolumeDiscountApplied__c,
        NegotiationRound__c,
        IsFinalOffer__c,
        FloorPrice__c,
        GeneralTerms__c,
        SignatureDeadlineDays__c,
        MessageThread__c,
        (
          SELECT
            ProductName__c,
            ProductFamily__c,
            Quantity__c,
            ListPrice__c,
            UnitPrice__c,
            Discount__c,
            NetTotal__c,
            Product_Type__c,
            Billing_Frequency__c,
            Product__r.Image_URL__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Opportunity__r.AccountId = :accountId AND IsPrimary__c = TRUE
      ORDER BY CreatedDate DESC
      LIMIT 20
    ]) {
      QuoteWrapper w = new QuoteWrapper();
      w.quoteId = q.Id;
      w.name = q.Name;
      w.status = q.Status__c;
      w.negotiationStatus = q.NegotiationStatus__c;
      w.grandTotal = q.GrandTotal__c;
      w.formattedTotal = q.GrandTotal__c != null
        ? q.GrandTotal__c.setScale(2).toPlainString()
        : '0.00';
      w.expirationDate = q.ExpirationDate__c != null
        ? q.ExpirationDate__c.format()
        : null;
      w.opportunityName = q.Opportunity__r != null
        ? q.Opportunity__r.Name
        : null;
      w.opportunityId = q.Opportunity__c;
      w.isPrimary = q.IsPrimary__c;
      w.description = q.Description__c;
      w.canDecide = (q.Status__c == 'Presented');
      w.isAccepted = (q.Status__c == 'Accepted');
      w.isRejected = (q.Status__c == 'Rejected');
      // Auto-negotiation: customer can counter any Presented quote
      Integer round = q.NegotiationRound__c != null
        ? Integer.valueOf(q.NegotiationRound__c)
        : 0;
      w.negotiationRound = round;
      w.isFinalOffer = q.IsFinalOffer__c == true;
      w.roundsRemaining = 0; // no longer used
      w.floorPrice = q.FloorPrice__c;
      w.canCounter = (q.Status__c == 'Presented');
      w.customerCounterPrice = q.CustomerCounterPrice__c;
      w.counterMessage = q.CounterMessage__c;
      w.approvalStatus = q.ApprovalStatus__c;
      w.volumeDiscountApplied = q.VolumeDiscountApplied__c == true;
      // Expiry
      if (q.ExpirationDate__c != null) {
        Integer diff = today.daysBetween(q.ExpirationDate__c);
        w.daysUntilExpiry = diff;
        w.isExpired = diff < 0;
      } else {
        w.daysUntilExpiry = null;
        w.isExpired = false;
      }
      w.acceptanceProbability = q.AcceptanceProbability__c != null
        ? Integer.valueOf(q.AcceptanceProbability__c)
        : null;
      w.aiReason = q.AIReason__c;
      w.paymentTerms = q.PaymentTerms__c;
      w.bulkDiscount = q.BulkDiscount__c;
      w.generalTerms = q.GeneralTerms__c;
      w.signatureDeadlineDays = q.SignatureDeadlineDays__c != null
        ? Integer.valueOf(q.SignatureDeadlineDays__c)
        : null;
      w.messageThread = q.MessageThread__c;
      w.versionNumber = q.VersionNumber__c != null
        ? Integer.valueOf(q.VersionNumber__c)
        : 1;
      w.lineItems = new List<LineItemWrap>();
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        LineItemWrap lw = new LineItemWrap();
        lw.productName = li.ProductName__c;
        lw.productFamily = li.ProductFamily__c;
        lw.quantity = li.Quantity__c != null
          ? Integer.valueOf(li.Quantity__c)
          : 1;
        lw.listPrice = li.ListPrice__c;
        lw.unitPrice = li.UnitPrice__c;
        lw.discount = li.Discount__c;
        lw.netTotal = li.NetTotal__c;
        lw.chargeType = String.isNotBlank(li.Product_Type__c)
          ? li.Product_Type__c
          : 'One-time';
        lw.billingFrequency = String.isNotBlank(li.Billing_Frequency__c)
          ? li.Billing_Frequency__c
          : 'N/A';
        lw.imageUrl = (li.Product__r != null &&
          li.Product__r.Image_URL__c != null)
          ? li.Product__r.Image_URL__c
          : imageByName.get(li.ProductName__c);
        w.lineItems.add(lw);
      }
      result.add(w);
    }
    return result;
  }

  // ── Customer: request a quote from their portal cart ──────────────────────

  @AuraEnabled
  public static Map<String, String> requestQuoteFromCart(
    String cartJSON,
    String customerNote
  ) {
    // 1. Get current customer's account
    User u = [
      SELECT Id, AccountId, Account.Name, Email
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    if (u.AccountId == null) {
      throw new AuraHandledException('No account linked to your user profile.');
    }

    // 2. Parse cart items
    List<CartItemInput> items = (List<CartItemInput>) JSON.deserialize(
      cartJSON,
      List<CartItemInput>.class
    );
    if (items == null || items.isEmpty()) {
      throw new AuraHandledException('Cart is empty.');
    }

    // 3. Find or create an open Qualification Opportunity for the account
    List<Opportunity> opps = [
      SELECT Id
      FROM Opportunity
      WHERE
        AccountId = :u.AccountId
        AND StageName = 'Qualification'
        AND IsClosed = FALSE
        AND CreatedDate >= :Date.today().addDays(-30)
      ORDER BY CreatedDate DESC
      LIMIT 1
    ];
    Id oppId;
    if (!opps.isEmpty()) {
      oppId = opps[0].Id;
    } else {
      Opportunity opp = new Opportunity(
        Name = u.Account.Name + ' — Quote Request ' + Date.today().format(),
        AccountId = u.AccountId,
        StageName = 'Qualification',
        CloseDate = Date.today().addDays(30)
      );
      insert opp;
      oppId = opp.Id;
    }

    // 4. Compute subtotal (no discount at request stage — admin sets terms)
    Decimal subtotal = 0;
    for (CartItemInput ci : items) {
      subtotal +=
        (ci.unitPrice != null ? ci.unitPrice : 0) *
        (ci.quantity != null ? ci.quantity : 1);
    }

    // 5. Auto-apply volume discount based on subtotal tiers
    Decimal volDiscount = computeVolumeDiscount(subtotal);
    Decimal discountedTotal = subtotal * (1 - volDiscount / 100);
    Boolean volApplied = volDiscount > 0;

    // 5b. Flag for internal approval if deal > $100k
    String approvalStatus = discountedTotal >= 100000
      ? 'Pending Approval'
      : 'Not Required';

    // Read admin-configurable settings from CMT
    QuoteSettingsService.QuoteSettingsWrapper settings = QuoteSettingsService.getSettings();

    // 6. Create Quote instantly as Presented so AI negotiation can start immediately
    TALEXO_Quote__c q = new TALEXO_Quote__c(
      Opportunity__c = oppId,
      Status__c = 'Presented',
      GrandTotal__c = discountedTotal,
      FloorPrice__c = (discountedTotal * 0.75).setScale(2),
      ExpirationDate__c = Date.today().addDays(settings.defaultValidityDays),
      PaymentTerms__c = settings.defaultPaymentTerms,
      GeneralTerms__c = settings.generalTerms,
      BulkDiscount__c = volDiscount,
      VolumeDiscountApplied__c = volApplied,
      ApprovalStatus__c = approvalStatus,
      IsPrimary__c = true,
      VersionNumber__c = 1,
      NegotiationStatus__c = 'Submitted',
      Description__c = 'AI-generated quote for ' +
        u.Account.Name +
        ' · ' +
        items.size() +
        ' item(s)' +
        (volApplied ? ' · Volume discount ' + volDiscount + '% applied' : '') +
        ' · Auto-presented for immediate AI negotiation' +
        (String.isNotBlank(customerNote)
          ? '\n\nCustomer Note: ' + customerNote
          : '')
    );
    insert q;
    q = [SELECT Id, Name FROM TALEXO_Quote__c WHERE Id = :q.Id LIMIT 1];

    // 6. Create line items (no discount applied yet)
    List<NexusQuoteLineItem__c> lineItems = new List<NexusQuoteLineItem__c>();
    for (CartItemInput ci : items) {
      Decimal price = ci.unitPrice != null ? ci.unitPrice : 0;
      Integer qty = ci.quantity != null ? ci.quantity : 1;
      lineItems.add(
        new NexusQuoteLineItem__c(
          Quote__c = q.Id,
          ProductName__c = ci.name,
          ProductFamily__c = ci.family,
          Quantity__c = qty,
          ListPrice__c = price,
          UnitPrice__c = price,
          Discount__c = 0,
          NetTotal__c = price * qty
        )
      );
    }
    insert lineItems;

    // 7. Run AI scoring immediately
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = q.Id;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );

    // 8. Email notification to admin
    List<User> admins = [
      SELECT Id, Email
      FROM User
      WHERE
        (Profile.Name = 'System Administrator'
        OR Profile.Name = 'Administrateur système')
        AND IsActive = TRUE
        AND UserType = 'Standard'
      LIMIT 1
    ];
    if (admins.isEmpty()) {
      admins = [
        SELECT Id, Email
        FROM User
        WHERE IsActive = TRUE AND UserType = 'Standard'
        LIMIT 1
      ];
    }
    if (!admins.isEmpty()) {
      String productList = '';
      for (CartItemInput ci : items) {
        productList +=
          '  • ' +
          ci.name +
          '  ×' +
          ci.quantity +
          '  @  ' +
          (ci.unitPrice != null ? ci.unitPrice.setScale(2) : 0) +
          ' €\n';
      }
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ admins[0].Email });
      mail.setSubject('Nexus — AI Quote Auto-Generated: ' + u.Account.Name);
      mail.setPlainTextBody(
        'Hello,\n\n' +
          'An AI-generated quote has been automatically created and presented to ' +
          u.Account.Name +
          '.\n\n' +
          'Products:\n' +
          productList +
          '\nTotal: ' +
          discountedTotal.setScale(2) +
          ' €' +
          (volApplied ? ' (after ' + volDiscount + '% volume discount)' : '') +
          '\nFloor price (min): ' +
          (discountedTotal * 0.75).setScale(2) +
          ' €' +
          '\n\nQuote: ' +
          q.Name +
          '\nStatus: Presented — AI negotiation is now LIVE\n\n' +
          'The customer can now negotiate directly with Agentforce. Monitor escalations in Quote Builder.\n\n' +
          'Best regards,\nNexus AI Platform'
      );
      mail.setSaveAsActivity(false);
      try {
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
        System.debug(LoggingLevel.INFO, 'Admin notified: ' + admins[0].Email);
      } catch (Exception emailEx) {
        // Non-fatal — quote is already saved. Log and continue.
        System.debug(
          LoggingLevel.WARN,
          'Admin email skipped: ' + emailEx.getMessage()
        );
      }
    }

    NotificationController.pushAdminBell(
      'AI Quote Live: ' + u.Account.Name,
      u.Account.Name +
        ' — ' +
        q.Name +
        ' auto-generated & presented · ' +
        discountedTotal.setScale(2) +
        ' € · AI negotiation is live.',
      q.Id
    );

    // Customer portal bell: quote is ready for immediate AI negotiation
    try {
      List<User> custUsers = [
        SELECT Id
        FROM User
        WHERE
          AccountId = :u.AccountId
          AND IsActive = TRUE
          AND UserType = 'PowerCustomerSuccess'
        LIMIT 1
      ];
      if (!custUsers.isEmpty()) {
        NotificationController.push(
          custUsers[0].Id,
          'Your quote ' + q.Name + ' is ready!',
          'Your AI-generated quote is live. Start negotiating now — get an instant decision.',
          'Quote',
          '/ss/s/mes-offres'
        );
      }
    } catch (Exception nx) {
      /* non-blocking */
    }

    return new Map<String, String>{ 'quoteId' => q.Id, 'quoteName' => q.Name };
  }

  // ── Customer: accept or reject a quote ────────────────────────────────────

  @AuraEnabled
  public static void processQuoteDecision(
    Id quoteId,
    String decision,
    String reason
  ) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        Opportunity__r.OwnerId,
        Opportunity__r.Owner.Email
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    String newOppStage;
    String notifTitle;
    String notifMsg;
    String adminSubject;
    String adminBody;
    String accName = q.Opportunity__r.Account.Name;

    if (decision == 'Accepted') {
      q.Status__c = 'Accepted';
      newOppStage = 'Negotiation/Review';
      notifTitle = 'Quote Accepted — Contract in Progress';
      notifMsg =
        'Your quote ' +
        q.Name +
        ' has been accepted. Our team is preparing your contract.';
      adminSubject = 'Nexus — Quote Accepted: ' + accName;
      adminBody =
        'Hello,\n\n' +
        accName +
        ' has accepted quote ' +
        q.Name +
        '.\n\nPlease prepare the contract as soon as possible.\n\n' +
        'Best regards,\nNexus Team';
    } else {
      q.Status__c = 'Rejected';
      newOppStage = 'Closed Lost';
      notifTitle = 'Quote Rejected';
      notifMsg =
        'Your quote ' +
        q.Name +
        ' has been rejected.' +
        (String.isNotBlank(reason) ? ' Reason: ' + reason : '');
      adminSubject = 'Nexus — Quote Rejected: ' + accName;
      adminBody =
        'Hello,\n\n' +
        accName +
        ' has rejected quote ' +
        q.Name +
        '.\n\n' +
        (String.isNotBlank(reason) ? 'Reason: ' + reason + '\n\n' : '') +
        'The opportunity has been updated to Closed Lost.\n\n' +
        'Best regards,\nNexus Team';
    }

    update q;
    update new Opportunity(Id = q.Opportunity__c, StageName = newOppStage);

    // Push portal notification to customer
    List<User> custUsers = [
      SELECT Id
      FROM User
      WHERE
        AccountId = :q.Opportunity__r.AccountId
        AND IsActive = TRUE
        AND UserType = 'PowerCustomerSuccess'
      LIMIT 1
    ];
    if (!custUsers.isEmpty()) {
      NotificationController.push(
        custUsers[0].Id,
        notifTitle,
        notifMsg,
        'Quote',
        '/ss/s/mes-offres'
      );
    }

    // Email opp owner
    if (String.isNotBlank(q.Opportunity__r.Owner.Email)) {
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ q.Opportunity__r.Owner.Email });
      mail.setSubject(adminSubject);
      mail.setPlainTextBody(adminBody);
      mail.setSaveAsActivity(false);
      try {
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
      } catch (Exception emailEx) {
        System.debug(
          LoggingLevel.WARN,
          'Owner email skipped: ' + emailEx.getMessage()
        );
      }
    }

    // Bell notification to admin
    NotificationController.pushAdminBell(
      decision == 'Accepted'
        ? 'Quote Accepted: ' + accName
        : 'Quote Rejected: ' + accName,
      decision == 'Accepted'
        ? accName + ' accepted ' + q.Name + '. DocuSign sent automatically.'
        : accName +
          ' rejected ' +
          q.Name +
          (String.isNotBlank(reason) ? ' — ' + reason : ''),
      q.Id
    );

    // Auto-send DocuSign contract on acceptance — no admin action needed
    if (decision == 'Accepted') {
      DocuSignService.initiateContractSigning(q.Id);
    }
  }

  // ── Admin: send quote to customer portal ──────────────────────────────────

  @AuraEnabled
  public static void sendQuoteToCustomer(
    Id quoteId,
    String recipientEmail,
    String emailSubject,
    String bodyNote,
    String bccEmail
  ) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        GrandTotal__c,
        ExpirationDate__c,
        Opportunity__c,
        Opportunity__r.Account.Name,
        BulkDiscount__c,
        PaymentTerms__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    String totalStr = q.GrandTotal__c != null
      ? q.GrandTotal__c.setScale(2).toPlainString() + ' €'
      : '0.00 €';
    String expStr = q.ExpirationDate__c != null
      ? q.ExpirationDate__c.format()
      : 'N/A';
    String discount = q.BulkDiscount__c != null
      ? q.BulkDiscount__c.toPlainString() + '%'
      : '0%';

    String html =
      '<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">' +
      '<div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px;' +
      'border-radius:12px 12px 0 0;text-align:center;">' +
      '<h1 style="color:#fff;font-size:2rem;margin:0;font-weight:900;letter-spacing:0.05em;">NEXUS</h1>' +
      '<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.9rem;">Your Official Quote</p>' +
      '</div>' +
      '<div style="background:#fff;padding:36px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">' +
      '<p style="color:#334155;">Dear client,</p>' +
      '<p style="color:#334155;">We have prepared your official quote <strong>' +
      q.Name +
      '</strong> following your request.</p>' +
      '<div style="background:#f0f4ff;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #c7d2fe;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Total amount</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:900;color:#0f172a;font-size:1.1rem;">' +
      totalStr +
      '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Applied discount</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:700;color:#059669;">' +
      discount +
      '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Payment terms</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:700;color:#4f46e5;">' +
      (q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30') +
      '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Valid until</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;">' +
      expStr +
      '</td></tr>' +
      '</table>' +
      '</div>' +
      (String.isNotBlank(bodyNote)
        ? '<p style="color:#334155;">' + bodyNote + '</p>'
        : '') +
      '<p style="color:#334155;">Log in to your customer portal to review the quote, compare versions, and give your decision.</p>' +
      '<div style="text-align:center;margin:32px 0;">' +
      '<a href="https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/mes-offres" ' +
      'style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;' +
      'text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;' +
      'font-size:1rem;display:inline-block;letter-spacing:0.02em;">View my quote → Respond</a>' +
      '</div>' +
      '<p style="color:#64748b;font-size:0.875rem;">Best regards,<br/><strong style="color:#0f172a;">Nexus Team</strong></p>' +
      '</div></div>';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ recipientEmail });
    if (String.isNotBlank(bccEmail)) {
      mail.setBccAddresses(new List<String>{ bccEmail });
    }
    mail.setSubject(
      String.isNotBlank(emailSubject)
        ? emailSubject
        : 'Nexus — Your official quote: ' + q.Name
    );
    mail.setHtmlBody(html);
    mail.setSaveAsActivity(false);
    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception emailEx) {
      System.debug(
        LoggingLevel.WARN,
        'Customer email skipped: ' + emailEx.getMessage()
      );
    }

    // Mark quote as Presented so customer can act on it
    update new TALEXO_Quote__c(
      Id = quoteId,
      Status__c = 'Presented',
      NegotiationStatus__c = 'Sent'
    );

    // Advance opportunity stage to Proposal/Price Quote
    if (q.Opportunity__c != null) {
      update new Opportunity(
        Id = q.Opportunity__c,
        StageName = 'Proposal/Price Quote'
      );
    }
  }

  // ── Portal: manual quote request form — creates Opportunity + Quote ────────

  @AuraEnabled
  public static void requestQuote(
    String companyName,
    String email,
    String qty,
    String message
  ) {
    Id quoteTarget = null; // captured for bell notification
    // Try to create an Opportunity + Quote for tracked portal users
    try {
      User u = [
        SELECT Id, AccountId, Account.Name
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      if (u.AccountId != null) {
        // Find existing open Qualification opp, or create one
        List<Opportunity> opps = [
          SELECT Id
          FROM Opportunity
          WHERE
            AccountId = :u.AccountId
            AND StageName = 'Qualification'
            AND IsClosed = FALSE
          ORDER BY CreatedDate DESC
          LIMIT 1
        ];
        Id oppId;
        if (!opps.isEmpty()) {
          oppId = opps[0].Id;
        } else {
          Opportunity opp = new Opportunity(
            Name = (String.isNotBlank(companyName)
                ? companyName
                : u.Account.Name) +
              ' — Quote Request ' +
              Date.today().format(),
            AccountId = u.AccountId,
            StageName = 'Qualification',
            CloseDate = Date.today().addDays(30)
          );
          insert opp;
          oppId = opp.Id;
        }
        Integer qtyInt = String.isNotBlank(qty) ? Integer.valueOf(qty) : 1;
        QuoteSettingsService.QuoteSettingsWrapper qs = QuoteSettingsService.getSettings();
        TALEXO_Quote__c newQ = new TALEXO_Quote__c(
          Opportunity__c = oppId,
          Status__c = 'Requested',
          GrandTotal__c = 0,
          ExpirationDate__c = Date.today().addDays(qs.defaultValidityDays),
          PaymentTerms__c = qs.defaultPaymentTerms,
          BulkDiscount__c = 0,
          IsPrimary__c = true,
          VersionNumber__c = 1,
          NegotiationStatus__c = 'Draft',
          Description__c = (String.isNotBlank(message)
              ? message
              : 'Request via portal') +
            ' · Estimated qty: ' +
            qtyInt
        );
        insert newQ;
        quoteTarget = newQ.Id;
      }
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.ERROR,
        'requestQuote Opp/Quote: ' +
          ex.getMessage() +
          '\n' +
          ex.getStackTraceString()
      );
      throw new AuraHandledException(
        'Your request could not be saved: ' + ex.getMessage()
      );
    }

    // Email notification to admin (always)
    List<User> admins = [
      SELECT Email
      FROM User
      WHERE
        (Profile.Name = 'System Administrator'
        OR Profile.Name = 'Administrateur système')
        AND IsActive = TRUE
        AND UserType = 'Standard'
      LIMIT 1
    ];
    if (admins.isEmpty()) {
      admins = [
        SELECT Email
        FROM User
        WHERE IsActive = TRUE AND UserType = 'Standard'
        LIMIT 1
      ];
    }
    if (admins.isEmpty())
      return;
    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ admins[0].Email });
    mail.setSubject('Nexus — New Quote Request: ' + companyName);
    mail.setPlainTextBody(
      'Hello,\n\nNew quote request submitted via the portal.\n\n' +
        'Company: ' +
        companyName +
        '\nEmail: ' +
        email +
        '\nQuantity: ' +
        qty +
        (String.isNotBlank(message) ? '\nMessage: ' + message : '') +
        '\n\nBest regards,\nNexus Platform'
    );
    mail.setSaveAsActivity(false);
    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception emailEx) {
      System.debug(
        LoggingLevel.WARN,
        'requestQuote email skipped: ' + emailEx.getMessage()
      );
    }

    if (quoteTarget != null) {
      NotificationController.pushAdminBell(
        'New Quote Request: ' + companyName,
        companyName +
          ' submitted a quote request via the portal' +
          (String.isNotBlank(qty) ? ' · Qty: ' + qty : ''),
        quoteTarget
      );
    }
  }

  // ── Volume discount: auto-tier rules ─────────────────────────────────────
  // Tiers: 5% off ≥$10k, 10% off ≥$50k, 15% off ≥$100k, 20% off ≥$200k

  public static Decimal computeVolumeDiscount(Decimal subtotal) {
    if (subtotal == null || subtotal <= 0)
      return 0;
    if (subtotal >= 200000)
      return 20;
    if (subtotal >= 100000)
      return 15;
    if (subtotal >= 50000)
      return 10;
    if (subtotal >= 10000)
      return 5;
    return 0;
  }

  // ── Customer: auto-negotiation engine ────────────────────────────────────
  // counter >= floor          → AUTO-ACCEPT
  // counter >= floor × 0.85  → AUTO-COUNTER at midpoint
  // counter < floor × 0.85   → AUTO-REJECT

  // ── Multi-term negotiation result wrapper ─────────────────────────────────
  public class NegotiationResult {
    public String outcome; // ACCEPTED / COUNTERED / REJECTED / ESCALATED
    public Decimal newTotal;
    public String proposedPaymentTerms;
    public Integer proposedValidityDays;
    public String comboA;
    public String comboB;
    public String responseMessage;
  }

  // ── Payment terms risk score (higher = riskier) ────────────────────────────
  private static Integer termsRisk(String terms) {
    if (terms == null)
      return 0;
    if (terms.containsIgnoreCase('90'))
      return 3;
    if (terms.containsIgnoreCase('60'))
      return 2;
    if (terms.containsIgnoreCase('45'))
      return 1;
    return 0; // Net 30 or anything else
  }

  // ── Multi-term counter-offer engine ────────────────────────────────────────
  public static NegotiationResult submitMultiTermOffer(
    Id quoteId,
    Decimal counterPrice,
    String requestedPaymentTerms,
    Integer requestedValidityDays,
    String message
  ) {
    NegotiationResult res = new NegotiationResult();

    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        FloorPrice__c,
        BulkDiscount__c,
        PaymentTerms__c,
        VersionNumber__c,
        NegotiationRound__c,
        ExpirationDate__c,
        SignatureDeadlineDays__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        (
          SELECT
            ProductName__c,
            ProductFamily__c,
            Quantity__c,
            ListPrice__c,
            UnitPrice__c,
            Discount__c,
            NetTotal__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    if (q.Status__c != 'Presented') {
      res.outcome = 'ERROR';
      res.responseMessage =
        'This quote is not in a negotiable state (status: ' +
        q.Status__c +
        ').';
      return res;
    }

    Decimal floor = (q.FloorPrice__c != null &&
      q.FloorPrice__c > 0)
      ? q.FloorPrice__c
      : (q.GrandTotal__c != null ? q.GrandTotal__c * 0.85 : 0);

    // Normalise inputs
    Decimal price = (counterPrice != null &&
      counterPrice > 0)
      ? counterPrice
      : q.GrandTotal__c;
    String reqTerms = String.isNotBlank(requestedPaymentTerms)
      ? requestedPaymentTerms.trim()
      : q.PaymentTerms__c;
    Integer reqValidity = (requestedValidityDays != null &&
      requestedValidityDays > 0)
      ? requestedValidityDays
      : 30;
    Integer risk = termsRisk(reqTerms);

    // ── Hard escalation triggers ──────────────────────────────────────────────
    Boolean bigDeal =
      q.GrandTotal__c != null &&
      q.GrandTotal__c > 100000 &&
      price < floor;
    Boolean net90 = risk >= 3;
    Boolean longValidity = reqValidity > 45;
    Boolean deepDisc = price < floor * 0.80;

    if (bigDeal || net90 || longValidity || deepDisc) {
      // ── TRADE-OFF ENGINE ────────────────────────────────────────────────────
      // Core rule: "If you accept faster payment terms, you get a bigger discount"
      // Combo A → Floor price, customer keeps their requested terms (minimum offer)
      // Combo B → Better price IF customer upgrades to one faster payment tier
      // We NEVER grant both maximum discount AND slow payment simultaneously.
      // ────────────────────────────────────────────────────────────────────────
      Decimal basePct = q.BulkDiscount__c != null ? q.BulkDiscount__c : 0;

      // Combo A: strict floor price — accept their terms, this is our absolute minimum
      Decimal comboAPrice = floor.setScale(2);
      Integer comboADays = Math.min(reqValidity, 30);
      String comboA = buildCombo(
        'A',
        comboAPrice,
        reqTerms,
        comboADays,
        q.GrandTotal__c
      );

      // Combo B: trade-off — upgrade terms one tier, reward with extra discount
      // (Net 90→Net 45 = +5% | Net 60→Net 30 = +3% | Net 45→Net 30 = +2% | Net 30→Net 15 = +3%)
      String comboBTerms = upgradePaymentTerms(reqTerms);
      Decimal comboBDisc = Math.min(
        15.0,
        basePct + termsUpgradeReward(reqTerms)
      );
      Decimal comboBPrice = (q.GrandTotal__c * (1 - comboBDisc / 100))
        .setScale(2);
      if (comboBPrice < floor)
        comboBPrice = floor.setScale(2);
      Integer comboBDays = Math.min(reqValidity, 45);
      String comboB = buildCombo(
        'B',
        comboBPrice,
        comboBTerms,
        comboBDays,
        q.GrandTotal__c
      );

      // Write to quote record
      TALEXO_Quote__c upd = new TALEXO_Quote__c(
        Id = q.Id,
        RequestedPaymentTerms__c = reqTerms,
        RequestedValidityDays__c = reqValidity,
        EscalationComboA__c = comboA,
        EscalationComboB__c = comboB,
        CounterMessage__c = 'ESCALATION [' +
          DateTime.now().format('dd/MM/yyyy HH:mm') +
          ']: ' +
          (String.isNotBlank(message)
            ? message
            : 'Customer requested ' +
              reqTerms +
              ' and ' +
              price.setScale(2) +
              ' €')
      );
      update upd;

      // Slack escalation alert (async @future — after DML)
      try {
        SlackNotificationService.sendEscalationAlert(
          String.valueOf(q.Id),
          q.Name,
          q.Opportunity__r.Account.Name != null
            ? q.Opportunity__r.Account.Name
            : 'Unknown',
          q.GrandTotal__c != null ? q.GrandTotal__c : 0,
          price,
          reqTerms,
          comboA,
          comboB
        );
      } catch (Exception slk) {
        /* Slack alert is non-blocking */
      }

      // Admin bell notification for escalation
      try {
        String accountName = q.Opportunity__r.Account.Name != null
          ? q.Opportunity__r.Account.Name
          : 'Unknown Account';
        Decimal dropPct = q.GrandTotal__c > 0
          ? ((q.GrandTotal__c - price) / q.GrandTotal__c * 100).setScale(1)
          : 0;
        String escReason = bigDeal
          ? 'High-value deal > ' +
            q.GrandTotal__c.setScale(0) +
            ' € below floor'
          : net90
              ? 'Net 90 terms requested — cash-flow risk exceeds auto-approval threshold'
              : longValidity
                  ? 'Extended validity (' +
                    reqValidity +
                    ' days) — exceeds 45-day limit'
                  : 'Deep discount requested — ' +
                    price.setScale(2) +
                    ' € (' +
                    dropPct +
                    '% below list)';
        insert new TALEXO_Notification__c(
          Title__c = 'Escalation Required: ' + q.Name,
          Message__c = accountName +
            ' — ' +
            escReason +
            '\nOption A (Floor / Keep Terms): ' +
            comboA +
            '\nOption B (Trade-off, Recommended): ' +
            comboB,
          Type__c = 'Quote',
          IsRead__c = false
        );
      } catch (Exception nx) {
        /* notification is non-blocking */
      }

      // Escalation email to System Admin
      try {
        List<User> admins = [
          SELECT Email
          FROM User
          WHERE Profile.Name = 'System Administrator' AND IsActive = TRUE
          LIMIT 1
        ];
        if (!admins.isEmpty()) {
          Messaging.SingleEmailMessage alert = new Messaging.SingleEmailMessage();
          alert.setToAddresses(new List<String>{ admins[0].Email });
          alert.setSubject(
            '🚨 Nexus Escalation: ' + q.Name + ' needs your review'
          );
          alert.setPlainTextBody(
            'A quote negotiation requires your approval:\n\n' +
              '  Quote: ' +
              q.Name +
              '\n' +
              '  Account: ' +
              (q.Opportunity__r.Account.Name != null
                ? q.Opportunity__r.Account.Name
                : 'N/A') +
              '\n' +
              '  Customer offer: ' +
              price.setScale(2) +
              ' € | ' +
              reqTerms +
              '\n\n' +
              'AI Trade-off Engine — Two options generated:\n\n' +
              '  OPTION A (Floor Price / Keep Terms):\n' +
              '  ' +
              comboA +
              '\n' +
              '  → We hold the floor price and accept the customer\'s payment terms.\n\n' +
              '  OPTION B (Recommended — Terms Trade-off):\n' +
              '  ' +
              comboB +
              '\n' +
              '  → We offer a bigger discount IF the customer upgrades to ' +
              comboBTerms +
              '.\n' +
              '  → Rule: ' +
              comboBDisc.setScale(1) +
              '% discount authorized ONLY IF customer accepts ' +
              comboBTerms +
              '.\n\n' +
              'Core rule: We do NOT grant maximum discount AND slow payment simultaneously.\n\n' +
              'Open the Nexus Admin Quote Builder to approve an option.\n\n' +
              '— Nexus AI Negotiation System'
          );
          Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ alert });
        }
      } catch (Exception em) {
        /* email is non-blocking */
      }

      res.outcome = 'ESCALATED';
      res.comboA = comboA;
      res.comboB = comboB;
      res.responseMessage =
        'This deal requires sales team approval. ' +
        'I\'ve escalated with two options for our team to review. ' +
        'A representative will respond within 2 business hours.';
      return res;
    }

    // ── Payment terms trade-off (Net 60 with acceptable price) ───────────────
    Boolean wantsNet60 = risk == 2;
    String approvedTerms = q.PaymentTerms__c; // default: keep current

    if (wantsNet60 && price >= floor) {
      // Price is fine but Net 60 is risky — offer trade-off
      Decimal net60Price = (floor * 1.02).setScale(2); // slight premium for risk
      if (price >= net60Price) {
        approvedTerms = 'Net 60'; // can afford the risk at this price
      } else {
        // TRADE-OFF: offer Net 45 at requested price OR Net 60 at higher price
        res.outcome = 'TRADEOFF';
        res.proposedPaymentTerms = 'Net 45';
        res.proposedValidityDays = reqValidity;
        res.newTotal = price;
        res.comboA = buildCombo(
          'A',
          price,
          'Net 45',
          reqValidity,
          q.GrandTotal__c
        );
        res.comboB = buildCombo(
          'B',
          net60Price,
          'Net 60',
          reqValidity,
          q.GrandTotal__c
        );
        res.responseMessage =
          'We can offer two options: ' +
          'Option A — your requested price of ' +
          price.setScale(2) +
          ' € with Net 45 terms. ' +
          'Option B — Net 60 terms with a price of ' +
          net60Price +
          ' €. ' +
          'Which works better for you?';
        return res;
      }
    } else if (risk == 1) {
      approvedTerms = 'Net 45'; // Net 45 always approved
    } else if (risk == 0) {
      approvedTerms = 'Net 30';
    }

    // ── Price decision ────────────────────────────────────────────────────────
    if (price >= floor) {
      // Update negotiated terms + final price FIRST so DocuSign contract is accurate
      TALEXO_Quote__c upd = new TALEXO_Quote__c(
        Id = q.Id,
        GrandTotal__c = price,
        PaymentTerms__c = approvedTerms,
        RequestedPaymentTerms__c = reqTerms,
        RequestedValidityDays__c = reqValidity,
        ExpirationDate__c = Date.today().addDays(reqValidity),
        SignatureDeadlineDays__c = Math.min(reqValidity - 7, 21)
      );
      update upd;

      processQuoteDecision(
        quoteId,
        'Accepted',
        'Accepted via AI negotiation — price and terms within approved limits.'
      );

      res.outcome = 'ACCEPTED';
      res.newTotal = price;
      res.proposedPaymentTerms = approvedTerms;
      res.proposedValidityDays = reqValidity;
      res.responseMessage =
        'Great news — your offer has been accepted! ' +
        'Total: ' +
        price.setScale(2) +
        ' € | Payment: ' +
        approvedTerms +
        ' | Valid for ' +
        reqValidity +
        ' days. ' +
        'You\'ll receive the updated quote and DocuSign link shortly.';
    } else if (price >= floor * 0.85) {
      // AUTO-COUNTER: midpoint price, grant the terms
      Decimal midpoint = ((price + q.GrandTotal__c) / 2).setScale(2);
      createAutoCounterVersionMultiTerm(
        q,
        midpoint,
        approvedTerms,
        reqValidity,
        message
      );

      res.outcome = 'COUNTERED';
      res.newTotal = midpoint;
      res.proposedPaymentTerms = approvedTerms;
      res.proposedValidityDays = reqValidity;
      res.responseMessage =
        'We can meet you halfway: ' +
        midpoint +
        ' € with ' +
        approvedTerms +
        ' terms' +
        ' and ' +
        reqValidity +
        ' days validity. ' +
        'Would you like to accept this counter-proposal?';
    } else {
      // AUTO-REJECT
      processQuoteDecision(
        quoteId,
        'Rejected',
        'Price automatically rejected — below minimum threshold.'
      );
      res.outcome = 'REJECTED';
      res.responseMessage =
        'Unfortunately we\'re unable to go below our minimum price for this configuration. ' +
        'The current best offer is ' +
        floor.setScale(2) +
        ' €. ' +
        'Would you like to accept that, or shall I escalate to our sales team?';
    }

    return res;
  }

  private static String buildCombo(
    String label,
    Decimal price,
    String terms,
    Integer validityDays,
    Decimal originalTotal
  ) {
    Decimal discountPct = originalTotal > 0
      ? ((originalTotal - price) / originalTotal * 100).setScale(1)
      : 0;
    return 'Combo ' +
      label +
      ': ' +
      price.setScale(2) +
      ' € (' +
      discountPct +
      '% discount)' +
      ' | ' +
      terms +
      ' | Validity: ' +
      validityDays +
      ' days';
  }

  // Trade-off: upgrade customer's payment terms by one tier (used for Combo B offer)
  // Net 90→Net 45 | Net 60→Net 30 | Net 45→Net 30 | Net 30→Net 15 | ≤Net 15→unchanged
  private static String upgradePaymentTerms(String terms) {
    if (terms == null)
      return 'Net 30';
    if (terms.containsIgnoreCase('90'))
      return 'Net 45';
    if (terms.containsIgnoreCase('60'))
      return 'Net 30';
    if (terms.containsIgnoreCase('45'))
      return 'Net 30';
    if (terms.containsIgnoreCase('30'))
      return 'Net 15';
    return terms;
  }

  // Trade-off reward: extra discount % authorized ONLY IF customer accepts the upgraded terms
  // Bigger jumps in terms quality = bigger discount reward
  private static Decimal termsUpgradeReward(String terms) {
    if (terms == null)
      return 2.0;
    if (terms.containsIgnoreCase('90'))
      return 5.0; // Net 90→Net 45: 2-tier jump, big reward
    if (terms.containsIgnoreCase('60'))
      return 3.0; // Net 60→Net 30: solid reward
    if (terms.containsIgnoreCase('45'))
      return 2.0; // Net 45→Net 30: standard reward
    if (terms.containsIgnoreCase('30'))
      return 3.0; // Net 30→Net 15: premium for fastest tier
    return 2.0;
  }

  private static void createAutoCounterVersionMultiTerm(
    TALEXO_Quote__c q,
    Decimal midpointPrice,
    String approvedTerms,
    Integer validityDays,
    String customerMessage
  ) {
    Integer nextVersion = q.VersionNumber__c != null
      ? Integer.valueOf(q.VersionNumber__c) + 1
      : 2;

    update new TALEXO_Quote__c(Id = q.Id, IsPrimary__c = false);

    TALEXO_Quote__c newQ = new TALEXO_Quote__c(
      Opportunity__c = q.Opportunity__c,
      Status__c = 'Presented',
      NegotiationStatus__c = 'Auto Counter',
      GrandTotal__c = midpointPrice,
      FloorPrice__c = q.FloorPrice__c,
      BulkDiscount__c = q.BulkDiscount__c != null
        ? Math.min(100, q.BulkDiscount__c)
        : 0,
      PaymentTerms__c = approvedTerms,
      ExpirationDate__c = Date.today().addDays(validityDays),
      SignatureDeadlineDays__c = Math.min(validityDays - 7, 21),
      IsPrimary__c = true,
      VersionNumber__c = nextVersion,
      NegotiationRound__c = (q.NegotiationRound__c != null
          ? q.NegotiationRound__c
          : 0) + 1,
      IsFinalOffer__c = false,
      CustomerCounterPrice__c = null,
      CounterMessage__c = null,
      Description__c = 'AI counter-proposal — midpoint price with negotiated terms.' +
        (String.isNotBlank(customerMessage)
          ? ' Customer: ' + customerMessage
          : '')
    );
    insert newQ;

    List<NexusQuoteLineItem__c> newItems = new List<NexusQuoteLineItem__c>();
    for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
      newItems.add(
        new NexusQuoteLineItem__c(
          Quote__c = newQ.Id,
          ProductName__c = li.ProductName__c,
          ProductFamily__c = li.ProductFamily__c,
          Quantity__c = li.Quantity__c,
          ListPrice__c = li.ListPrice__c,
          UnitPrice__c = li.UnitPrice__c,
          Discount__c = li.Discount__c,
          NetTotal__c = li.NetTotal__c
        )
      );
    }
    if (!newItems.isEmpty())
      insert newItems;

    try {
      QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
      inp.quoteId = newQ.Id;
      QuoteAIScoringAction.scoreQuote(
        new List<QuoteAIScoringAction.ScoreInput>{ inp }
      );
    } catch (Exception ex) {
      System.debug(LoggingLevel.WARN, 'AI rescore skipped: ' + ex.getMessage());
    }
  }

  @AuraEnabled
  public static String submitCounterOffer(
    Id quoteId,
    Decimal counterPrice,
    String message
  ) {
    if (counterPrice == null || counterPrice <= 0) {
      throw new AuraHandledException('Please enter a valid amount.');
    }
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        FloorPrice__c,
        BulkDiscount__c,
        PaymentTerms__c,
        VersionNumber__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        (
          SELECT
            ProductName__c,
            ProductFamily__c,
            Quantity__c,
            ListPrice__c,
            UnitPrice__c,
            Discount__c,
            NetTotal__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (q.Status__c != 'Presented') {
      throw new AuraHandledException(
        'Counter-offers are only accepted on presented quotes.'
      );
    }

    // Fall back to 85% of grand total if admin never set a floor price
    Decimal floor = (q.FloorPrice__c != null &&
      q.FloorPrice__c > 0)
      ? q.FloorPrice__c
      : (q.GrandTotal__c != null ? q.GrandTotal__c * 0.85 : 0);

    if (counterPrice >= floor) {
      // AUTO-ACCEPT
      processQuoteDecision(
        quoteId,
        'Accepted',
        'Price automatically accepted — counter-offer within allowed limits.'
      );
      return 'ACCEPTED';
    } else if (counterPrice >= floor * 0.85) {
      // AUTO-COUNTER: split the difference between counter and original price
      Decimal midpoint = ((counterPrice + q.GrandTotal__c) / 2).setScale(2);
      createAutoCounterVersion(q, midpoint, message);
      return 'COUNTERED';
    } else {
      // AUTO-REJECT
      processQuoteDecision(
        quoteId,
        'Rejected',
        'Price automatically rejected — counter-offer too far below the floor price.'
      );
      return 'REJECTED';
    }
  }

  // Creates a new "Auto Counter" quote version at the midpoint price and emails the customer.
  private static void createAutoCounterVersion(
    TALEXO_Quote__c q,
    Decimal midpointPrice,
    String customerMessage
  ) {
    Integer nextVersion = q.VersionNumber__c != null
      ? Integer.valueOf(q.VersionNumber__c) + 1
      : 2;

    // Mark original as non-primary
    update new TALEXO_Quote__c(Id = q.Id, IsPrimary__c = false);

    // Create new version at midpoint
    TALEXO_Quote__c newQ = new TALEXO_Quote__c(
      Opportunity__c = q.Opportunity__c,
      Status__c = 'Presented',
      NegotiationStatus__c = 'Auto Counter',
      GrandTotal__c = midpointPrice,
      FloorPrice__c = q.FloorPrice__c,
      BulkDiscount__c = q.BulkDiscount__c != null
        ? Math.min(100, q.BulkDiscount__c)
        : 0,
      PaymentTerms__c = q.PaymentTerms__c,
      ExpirationDate__c = Date.today().addDays(7),
      IsPrimary__c = true,
      VersionNumber__c = nextVersion,
      IsFinalOffer__c = false,
      CustomerCounterPrice__c = null,
      CounterMessage__c = null,
      Description__c = 'Automatic Nexus counter-proposal — calculated midpoint price.' +
        (String.isNotBlank(customerMessage)
          ? ' · Customer message: ' + customerMessage
          : '')
    );
    insert newQ;

    // Clone line items
    List<NexusQuoteLineItem__c> newItems = new List<NexusQuoteLineItem__c>();
    for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
      newItems.add(
        new NexusQuoteLineItem__c(
          Quote__c = newQ.Id,
          ProductName__c = li.ProductName__c,
          ProductFamily__c = li.ProductFamily__c,
          Quantity__c = li.Quantity__c,
          ListPrice__c = li.ListPrice__c,
          UnitPrice__c = li.UnitPrice__c,
          Discount__c = li.Discount__c,
          NetTotal__c = li.NetTotal__c
        )
      );
    }
    if (!newItems.isEmpty())
      insert newItems;

    // Re-score AI on new version
    try {
      QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
      inp.quoteId = newQ.Id;
      QuoteAIScoringAction.scoreQuote(
        new List<QuoteAIScoringAction.ScoreInput>{ inp }
      );
    } catch (Exception ex) {
      System.debug(LoggingLevel.WARN, 'AI rescore skipped: ' + ex.getMessage());
    }

    // Email the customer portal user
    List<User> custUsers = [
      SELECT Id, Email, FirstName
      FROM User
      WHERE
        AccountId = :q.Opportunity__r.AccountId
        AND IsActive = TRUE
        AND UserType = 'PowerCustomerSuccess'
      LIMIT 1
    ];
    if (!custUsers.isEmpty() && String.isNotBlank(custUsers[0].Email)) {
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ custUsers[0].Email });
      mail.setSubject('Nexus — Automatic Revised Proposal: ' + q.Name);
      mail.setHtmlBody(
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
          '<div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px;border-radius:12px 12px 0 0;text-align:center;">' +
          '<h1 style="color:#fff;font-size:2rem;margin:0;font-weight:900;letter-spacing:0.05em;">NEXUS</h1>' +
          '<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.9rem;">Automatic Revised Proposal</p>' +
          '</div>' +
          '<div style="background:#fff;padding:36px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">' +
          '<p style="color:#334155;">Hello ' +
          custUsers[0].FirstName +
          ',</p>' +
          '<p style="color:#334155;">We have reviewed your counter-offer and are proposing a mid-point price for quote <strong>' +
          q.Name +
          '</strong>.</p>' +
          '<div style="background:#f0f4ff;border-radius:12px;padding:24px;margin:24px 0;text-align:center;border:1px solid #c7d2fe;">' +
          '<p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:700;">New proposed price</p>' +
          '<p style="margin:0;font-size:36px;font-weight:900;color:#0f172a;">' +
          midpointPrice.setScale(2).toPlainString() +
          ' \u20ac</p>' +
          '</div>' +
          '<p style="color:#64748b;font-size:13px;">This proposal is valid for 7 days. You may accept, reject, or submit a new counter-offer from your customer portal.</p>' +
          '<div style="text-align:center;margin:32px 0;">' +
          '<a href="https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/mes-offres" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:1rem;display:inline-block;">View my quote \u2192</a>' +
          '</div>' +
          '<p style="color:#64748b;font-size:12px;">Best regards,<br/><strong>Nexus Team</strong></p>' +
          '</div></div>'
      );
      mail.setSaveAsActivity(false);
      try {
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
      } catch (Exception emailEx) {
        System.debug(
          LoggingLevel.WARN,
          'Counter-offer email skipped: ' + emailEx.getMessage()
        );
      }
    }
  }

  // ── Auto-expire overdue quotes ─────────────────────────────────────────────

  @AuraEnabled
  public static Integer expireOverdueQuotes() {
    List<TALEXO_Quote__c> overdue = [
      SELECT Id
      FROM TALEXO_Quote__c
      WHERE
        ExpirationDate__c < TODAY
        AND Status__c NOT IN ('Accepted', 'Rejected', 'Signed', 'Expired')
    ];
    for (TALEXO_Quote__c q : overdue) {
      q.Status__c = 'Expired';
      q.NegotiationStatus__c = 'Final';
    }
    if (!overdue.isEmpty())
      update overdue;
    return overdue.size();
  }

  // ── Get signed contract as base64 for client-side blob download ────────────
  @AuraEnabled(cacheable=false)
  public static Map<String, String> getSignedContractBase64(Id quoteId) {
    List<TALEXO_Quote__c> quotes = [
      SELECT Name
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (quotes.isEmpty())
      return null;

    String quoteName = quotes[0].Name;

    // First: look for the PDF linked directly to this quote record (most specific)
    List<ContentDocumentLink> links = [
      SELECT
        ContentDocumentId,
        ContentDocument.Title,
        ContentDocument.FileExtension
      FROM ContentDocumentLink
      WHERE LinkedEntityId = :quoteId AND ContentDocument.FileExtension = 'pdf'
      ORDER BY ContentDocument.CreatedDate DESC
      LIMIT 1
    ];

    if (links.isEmpty())
      return null;

    Id docId = links[0].ContentDocumentId;

    ContentVersion cv = [
      SELECT VersionData, Title
      FROM ContentVersion
      WHERE ContentDocumentId = :docId AND IsLatest = TRUE
      LIMIT 1
    ];

    return new Map<String, String>{
      'base64' => EncodingUtil.base64Encode(cv.VersionData),
      'filename' => cv.Title + '.pdf'
    };
  }
}
