/**
 * NexusQuoteController
 *
 * Apex controller for the nexusQuoteBuilder LWC (admin / sales-rep side).
 * Provides:
 *   • Product catalogue lookup
 *   • Quote generation delegation → QuoteGenerationService
 *   • All-quotes list for admin dashboard
 *   • Per-opportunity quote list
 *   • Re-score trigger (manual AI refresh)
 *   • Submit to external negotiation platform
 */
public without sharing class NexusQuoteController {
  // ── Wrappers ──────────────────────────────────────────────────────────────

  public class ProductWrapper {
    @AuraEnabled
    public Id productId;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String family;
    @AuraEnabled
    public String imageUrl;
    @AuraEnabled
    public Decimal price;
    @AuraEnabled
    public String availabilityStatus;
    @AuraEnabled
    public String productType;
    @AuraEnabled
    public String billingFrequency;
  }

  public class QuoteDetailWrapper {
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
    public Decimal finalNegotiatedPrice;
    @AuraEnabled
    public String formattedTotal;
    @AuraEnabled
    public String formattedFinalPrice;
    @AuraEnabled
    public String expirationDate;
    @AuraEnabled
    public String paymentTerms;
    @AuraEnabled
    public Decimal bulkDiscount;
    @AuraEnabled
    public Integer versionNumber;
    @AuraEnabled
    public Integer acceptanceProbability;
    @AuraEnabled
    public String aiReason;
    @AuraEnabled
    public Boolean isPrimary;
    @AuraEnabled
    public Boolean isRequested;
    @AuraEnabled
    public String requestedAt;
    @AuraEnabled
    public String opportunityName;
    @AuraEnabled
    public String accountName;
    @AuraEnabled
    public Id opportunityId;
    @AuraEnabled
    public String customerEmail;
    @AuraEnabled
    public String probStyle;
    @AuraEnabled
    public String probColorCls;
    @AuraEnabled
    public Boolean volumeDiscountApplied;
    @AuraEnabled
    public String approvalStatus;
    @AuraEnabled
    public Decimal customerCounterPrice;
    @AuraEnabled
    public String counterMessage;
    @AuraEnabled
    public String escalationComboA;
    @AuraEnabled
    public String escalationComboB;
    @AuraEnabled
    public String requestedPaymentTerms;
    @AuraEnabled
    public Boolean isExpired;
    @AuraEnabled
    public Integer daysUntilExpiry;
    @AuraEnabled
    public Integer negotiationRound;
    @AuraEnabled
    public Boolean isFinalOffer;
    @AuraEnabled
    public Integer roundsRemaining;
    @AuraEnabled
    public List<LineItemWrapper> lineItems;
    @AuraEnabled
    public String docuSignStatus;
    @AuraEnabled
    public Boolean isAmendment;
    @AuraEnabled
    public Boolean isRenewal;
    @AuraEnabled
    public Decimal mrr;
    @AuraEnabled
    public Decimal oneTimeTotal;
    @AuraEnabled
    public Decimal recurringTotal;
    @AuraEnabled
    public String generalTerms;
    @AuraEnabled
    public Integer signatureDeadlineDays;
    @AuraEnabled
    public String messageThread;
  }

  public class LineItemWrapper {
    @AuraEnabled
    public Id lineItemId;
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
    public String formattedNetTotal;
  }

  // ── Product catalogue ─────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<ProductWrapper> getProducts(String searchTerm) {
    String likeStr = String.isNotBlank(searchTerm)
      ? '%' + searchTerm + '%'
      : '%';
    List<ProductWrapper> result = new List<ProductWrapper>();
    for (Product2 p : [
      SELECT
        Id,
        Name,
        Family,
        Image_URL__c,
        Price__c,
        AvailabilityStatus__c,
        Product_Type__c,
        Billing_Frequency__c
      FROM Product2
      WHERE IsActive = TRUE AND Name LIKE :likeStr
      ORDER BY Name ASC
      LIMIT 50
    ]) {
      ProductWrapper w = new ProductWrapper();
      w.productId = p.Id;
      w.name = p.Name;
      w.family = p.Family;
      w.imageUrl = p.Image_URL__c;
      w.price = p.Price__c;
      w.availabilityStatus = p.AvailabilityStatus__c;
      w.productType = p.Product_Type__c;
      w.billingFrequency = p.Billing_Frequency__c;
      result.add(w);
    }
    return result;
  }

  // ── Quote generation (delegates to service) ───────────────────────────────

  @AuraEnabled
  public static QuoteGenerationService.GenerateResult createQuote(
    String requestJSON
  ) {
    return QuoteGenerationService.generateQuote(requestJSON);
  }

  // ── All quotes (admin dashboard) ──────────────────────────────────────────

  @AuraEnabled(cacheable=false)
  public static List<QuoteDetailWrapper> getAllQuotes() {
    return toWrapperList(
      [
        SELECT
          Id,
          Name,
          Status__c,
          NegotiationStatus__c,
          GrandTotal__c,
          FinalNegotiatedPrice__c,
          ExpirationDate__c,
          PaymentTerms__c,
          BulkDiscount__c,
          VersionNumber__c,
          AcceptanceProbability__c,
          AIReason__c,
          IsPrimary__c,
          CreatedDate,
          Opportunity__c,
          Opportunity__r.Name,
          Opportunity__r.Account.Name,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          EscalationComboA__c,
          EscalationComboB__c,
          RequestedPaymentTerms__c,
          NegotiationRound__c,
          IsFinalOffer__c,
          DocuSign_Status__c,
          Is_Amendment__c,
          Is_Renewal__c,
          MRR__c,
          OneTimeTotal__c,
          RecurringTotal__c,
          GeneralTerms__c,
          SignatureDeadlineDays__c,
          MessageThread__c,
          (
            SELECT
              Id,
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
        WHERE Status__c != 'Requested'
        ORDER BY CreatedDate DESC
        LIMIT 100
      ]
    );
  }

  // ── Customer quote requests (Status = Requested) ───────────────────────────

  @AuraEnabled(cacheable=false)
  public static List<QuoteDetailWrapper> getQuoteRequests() {
    return toWrapperList(
      [
        SELECT
          Id,
          Name,
          Status__c,
          NegotiationStatus__c,
          GrandTotal__c,
          FinalNegotiatedPrice__c,
          ExpirationDate__c,
          PaymentTerms__c,
          BulkDiscount__c,
          VersionNumber__c,
          AcceptanceProbability__c,
          AIReason__c,
          IsPrimary__c,
          CreatedDate,
          Opportunity__c,
          Opportunity__r.Name,
          Opportunity__r.Account.Name,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          EscalationComboA__c,
          EscalationComboB__c,
          RequestedPaymentTerms__c,
          NegotiationRound__c,
          IsFinalOffer__c,
          DocuSign_Status__c,
          Is_Amendment__c,
          Is_Renewal__c,
          MRR__c,
          OneTimeTotal__c,
          RecurringTotal__c,
          GeneralTerms__c,
          SignatureDeadlineDays__c,
          MessageThread__c,
          (
            SELECT
              Id,
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
        WHERE Status__c = 'Requested'
        ORDER BY CreatedDate DESC
        LIMIT 50
      ]
    );
  }

  // ── Admin: send official quote to customer ─────────────────────────────────

  @AuraEnabled
  public static void sendToCustomer(Id quoteId, Decimal floorPrice) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        GrandTotal__c,
        ExpirationDate__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        BulkDiscount__c,
        PaymentTerms__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    // Save floor price set by admin at send time
    if (floorPrice != null && floorPrice > 0) {
      update new TALEXO_Quote__c(Id = quoteId, FloorPrice__c = floorPrice);
    }

    // Find the customer portal user for this account
    List<User> custUsers = [
      SELECT Id, Email
      FROM User
      WHERE
        AccountId = :q.Opportunity__r.AccountId
        AND IsActive = TRUE
        AND UserType = 'PowerCustomerSuccess'
      LIMIT 1
    ];

    if (!custUsers.isEmpty() && String.isNotBlank(custUsers[0].Email)) {
      QuoteController.sendQuoteToCustomer(
        quoteId,
        custUsers[0].Email,
        null,
        null,
        null
      );
    } else {
      // No portal user found — update status + advance opp stage
      update new TALEXO_Quote__c(Id = quoteId, Status__c = 'Presented');
      if (q.Opportunity__c != null) {
        update new Opportunity(
          Id = q.Opportunity__c,
          StageName = 'Proposal/Price Quote'
        );
      }
    }
  }

  // ── Admin: approve negotiation combo (A or B) from escalation panel ─────────

  // @AuraEnabled wrapper — converts plain exceptions to AuraHandledException for LWC
  @AuraEnabled
  public static void applyNegotiatedTerms(
    Id quoteId,
    Decimal approvedPrice,
    String approvedPaymentTerms,
    Integer approvedValidityDays,
    String salesNote
  ) {
    try {
      applyNegotiatedTermsCore(
        quoteId,
        approvedPrice,
        approvedPaymentTerms,
        approvedValidityDays,
        salesNote
      );
    } catch (AuraHandledException ahe) {
      throw ahe;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Failed to apply negotiated terms: ' + e.getMessage()
      );
    }
  }

  // Core logic — throws plain Exception so it can be called from any context (REST, Aura, etc.)
  public static void applyNegotiatedTermsCore(
    Id quoteId,
    Decimal approvedPrice,
    String approvedPaymentTerms,
    Integer approvedValidityDays,
    String salesNote
  ) {
    if (approvedPrice == null || approvedPrice <= 0)
      throw new IllegalArgumentException('Invalid approved price.');

    Integer validDays = (approvedValidityDays != null &&
      approvedValidityDays > 0)
      ? approvedValidityDays
      : 30;

    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        GrandTotal__c,
        VersionNumber__c,
        BulkDiscount__c,
        EscalationComboA__c,
        EscalationComboB__c,
        MessageThread__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    // Update the existing quote in-place — keeps the same Name (e.g. QUOTE-0165)
    // so the customer portal always shows the correct record without confusion.
    update new TALEXO_Quote__c(
      Id = q.Id,
      Status__c = 'Presented',
      NegotiationStatus__c = 'Sales Approved',
      GrandTotal__c = approvedPrice,
      FinalNegotiatedPrice__c = approvedPrice,
      FloorPrice__c = approvedPrice,
      PaymentTerms__c = approvedPaymentTerms,
      ExpirationDate__c = Date.today().addDays(validDays),
      IsPrimary__c = true,
      IsFinalOffer__c = true,
      CounterMessage__c = null,
      EscalationComboA__c = null,
      EscalationComboB__c = null,
      Description__c = 'Sales-approved final offer.' +
        (String.isNotBlank(salesNote) ? ' Note: ' + salesNote : '')
    );

    // Admin bell notification
    try {
      insert new TALEXO_Notification__c(
        Title__c = 'Combo Approved: ' + q.Name,
        Message__c = 'Sales approved ' +
          approvedPrice.setScale(2) +
          ' € | ' +
          approvedPaymentTerms +
          ' for ' +
          q.Opportunity__r.Account.Name +
          (String.isNotBlank(salesNote) ? ' — ' + salesNote : ''),
        Type__c = 'Quote',
        IsRead__c = false
      );
    } catch (Exception nx) {
      /* notification is non-blocking */
    }

    // Email the customer + build chat message
    List<User> custUsers = [
      SELECT Id, Email, FirstName
      FROM User
      WHERE
        AccountId = :q.Opportunity__r.AccountId
        AND IsActive = TRUE
        AND UserType = 'PowerCustomerSuccess'
      LIMIT 1
    ];

    String custFirstName = custUsers.isEmpty()
      ? 'there'
      : custUsers[0].FirstName;
    String salesMsg = String.isNotBlank(salesNote)
      ? salesNote
      : 'Hi ' +
        custFirstName +
        ', I\'ve reviewed your request. ' +
        'We can offer ' +
        approvedPrice.setScale(2) +
        ' € with ' +
        approvedPaymentTerms +
        ' payment terms, valid for ' +
        validDays +
        ' days.';

    // Append sales reply to the message thread on the same quote
    String existingThread = String.isNotBlank(q.MessageThread__c)
      ? q.MessageThread__c
      : '[]';
    String msgId = 's' + String.valueOf(DateTime.now().getTime());
    String msgTime = DateTime.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    String newEntry =
      '{"id":"' +
      msgId +
      '","sender":"sales","text":' +
      JSON.serialize(salesMsg) +
      ',"time":"' +
      msgTime +
      '"}';
    String updatedThread = existingThread == '[]'
      ? '[' + newEntry + ']'
      : existingThread.removeEnd(']') + ',' + newEntry + ']';
    update new TALEXO_Quote__c(Id = q.Id, MessageThread__c = updatedThread);

    if (!custUsers.isEmpty()) {
      // In-app portal bell notification — non-blocking
      try {
        NotificationController.push(
          custUsers[0].Id,
          'Your quote ' + q.Name + ' has been updated',
          'Our sales team approved a special offer: ' +
            approvedPrice.setScale(2) +
            ' € | ' +
            approvedPaymentTerms +
            '. Log in to review and sign.',
          'Quote',
          '/ss/s/mes-offres'
        );
      } catch (Exception nx) {
        /* non-blocking */
      }

      // Email notification — non-blocking so it never rolls back DML
      if (String.isNotBlank(custUsers[0].Email)) {
        try {
          Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
          mail.setToAddresses(new List<String>{ custUsers[0].Email });
          mail.setSubject('Nexus — Your negotiated quote is ready: ' + q.Name);
          mail.setPlainTextBody(
            'Dear ' +
              custUsers[0].FirstName +
              ',\n\n' +
              'Great news! Our sales team reviewed your request and approved a special offer:\n\n' +
              '  • Total: ' +
              approvedPrice.setScale(2).toPlainString() +
              ' €\n' +
              '  • Payment terms: ' +
              approvedPaymentTerms +
              '\n' +
              '  • Valid for: ' +
              validDays +
              ' days\n\n' +
              (String.isNotBlank(salesNote)
                ? 'Note from our team: ' + salesNote + '\n\n'
                : '') +
              'Please log in to your portal to review and sign the updated quote.\n\n' +
              'Best regards,\nThe Nexus Sales Team'
          );
          mail.setSaveAsActivity(false);
          Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
        } catch (Exception emailEx) {
          System.debug(
            LoggingLevel.WARN,
            'applyNegotiatedTermsCore email failed: ' + emailEx.getMessage()
          );
        }
      }
    }
  }

  // ── Escalated quotes for the sales Omni-Channel widget ────────────────────

  @AuraEnabled(cacheable=false)
  public static List<QuoteDetailWrapper> getEscalatedQuotes() {
    // CounterMessage__c is LongTextArea — cannot use LIKE in SOQL.
    // Fetch recent primary presented quotes and filter in Apex.
    List<TALEXO_Quote__c> candidates = [
      SELECT
        Id,
        Name,
        Status__c,
        NegotiationStatus__c,
        GrandTotal__c,
        ExpirationDate__c,
        PaymentTerms__c,
        BulkDiscount__c,
        VersionNumber__c,
        AcceptanceProbability__c,
        AIReason__c,
        IsPrimary__c,
        CreatedDate,
        Opportunity__c,
        Opportunity__r.Name,
        Opportunity__r.Account.Name,
        Opportunity__r.AccountId,
        CustomerCounterPrice__c,
        CounterMessage__c,
        EscalationComboA__c,
        EscalationComboB__c,
        RequestedPaymentTerms__c,
        NegotiationRound__c,
        IsFinalOffer__c,
        FinalNegotiatedPrice__c,
        DocuSign_Status__c,
        Is_Amendment__c,
        Is_Renewal__c,
        MRR__c,
        OneTimeTotal__c,
        RecurringTotal__c,
        GeneralTerms__c,
        SignatureDeadlineDays__c,
        MessageThread__c,
        VolumeDiscountApplied__c,
        ApprovalStatus__c,
        (
          SELECT
            Id,
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
      WHERE
        IsPrimary__c = TRUE
        AND Status__c NOT IN ('Accepted', 'Signed', 'Rejected')
      ORDER BY CreatedDate DESC
      LIMIT 100
    ];
    List<TALEXO_Quote__c> escalated = new List<TALEXO_Quote__c>();
    for (TALEXO_Quote__c q : candidates) {
      if (
        String.isNotBlank(q.CounterMessage__c) &&
        q.CounterMessage__c.startsWith('ESCALATION')
      ) {
        escalated.add(q);
      }
    }
    return toWrapperList(escalated);
  }

  // ── Append a customer chat message to a quote thread ─────────────────────

  @AuraEnabled
  public static void postCustomerMessage(Id quoteId, String messageText) {
    if (String.isBlank(messageText))
      return;
    TALEXO_Quote__c q = [
      SELECT Id, MessageThread__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    String existing = String.isNotBlank(q.MessageThread__c)
      ? q.MessageThread__c
      : '[]';
    String msgId = 'c' + String.valueOf(DateTime.now().getTime());
    String msgTime = DateTime.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    String entry =
      '{"id":"' +
      msgId +
      '","sender":"customer","text":' +
      JSON.serialize(messageText.trim()) +
      ',"time":"' +
      msgTime +
      '"}';
    String updated = existing == '[]'
      ? '[' + entry + ']'
      : existing.removeEnd(']') + ',' + entry + ']';
    update new TALEXO_Quote__c(Id = quoteId, MessageThread__c = updated);
  }

  // ── Sales: reply to customer after approval ───────────────────────────────

  @AuraEnabled
  public static void postSalesReply(Id quoteId, String messageText) {
    if (String.isBlank(messageText))
      return;
    TALEXO_Quote__c q = [
      SELECT Id, MessageThread__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    String existing = String.isNotBlank(q.MessageThread__c)
      ? q.MessageThread__c
      : '[]';
    String msgId = 's' + String.valueOf(DateTime.now().getTime());
    String msgTime = DateTime.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    String entry =
      '{"id":"' +
      msgId +
      '","sender":"sales","text":' +
      JSON.serialize(messageText.trim()) +
      ',"time":"' +
      msgTime +
      '"}';
    String updated = existing == '[]'
      ? '[' + entry + ']'
      : existing.removeEnd(']') + ',' + entry + ']';
    update new TALEXO_Quote__c(Id = quoteId, MessageThread__c = updated);
  }

  // ── Sales: approved quotes where customer replied and is waiting ───────────

  @AuraEnabled(cacheable=false)
  public static List<QuoteDetailWrapper> getOpenConversations() {
    List<TALEXO_Quote__c> candidates = [
      SELECT
        Id,
        Name,
        Status__c,
        NegotiationStatus__c,
        GrandTotal__c,
        ExpirationDate__c,
        PaymentTerms__c,
        BulkDiscount__c,
        VersionNumber__c,
        AcceptanceProbability__c,
        AIReason__c,
        IsPrimary__c,
        CreatedDate,
        Opportunity__c,
        Opportunity__r.Name,
        Opportunity__r.Account.Name,
        Opportunity__r.AccountId,
        CustomerCounterPrice__c,
        CounterMessage__c,
        EscalationComboA__c,
        EscalationComboB__c,
        RequestedPaymentTerms__c,
        NegotiationRound__c,
        IsFinalOffer__c,
        FinalNegotiatedPrice__c,
        DocuSign_Status__c,
        Is_Amendment__c,
        Is_Renewal__c,
        MRR__c,
        OneTimeTotal__c,
        RecurringTotal__c,
        GeneralTerms__c,
        SignatureDeadlineDays__c,
        MessageThread__c,
        VolumeDiscountApplied__c,
        ApprovalStatus__c,
        (
          SELECT
            Id,
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
      WHERE
        IsPrimary__c = TRUE
        AND NegotiationStatus__c = 'Sales Approved'
        AND Status__c NOT IN ('Accepted', 'Signed', 'Rejected')
      ORDER BY LastModifiedDate DESC
      LIMIT 50
    ];
    List<TALEXO_Quote__c> pending = new List<TALEXO_Quote__c>();
    for (TALEXO_Quote__c q : candidates) {
      if (String.isNotBlank(q.MessageThread__c)) {
        pending.add(q);
      }
    }
    return toWrapperList(pending);
  }

  private static Boolean customerRepliedLast(String thread) {
    if (String.isBlank(thread))
      return false;
    Integer custIdx = thread.lastIndexOf('"sender":"customer"');
    Integer salesIdx = thread.lastIndexOf('"sender":"sales"');
    return custIdx > salesIdx;
  }

  // ── Admin: one-click approve & send from Requests tab ──────────────────────

  @AuraEnabled
  public static Map<String, String> quickSendFromRequest(Id requestedQuoteId) {
    List<TALEXO_Quote__c> qs = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        ExpirationDate__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name
      FROM TALEXO_Quote__c
      WHERE Id = :requestedQuoteId
      LIMIT 1
    ];
    if (qs.isEmpty())
      throw new AuraHandledException('Quote not found.');
    TALEXO_Quote__c q = qs[0];

    // Re-run AI score
    try {
      QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
      inp.quoteId = q.Id;
      QuoteAIScoringAction.scoreQuote(
        new List<QuoteAIScoringAction.ScoreInput>{ inp }
      );
    } catch (Exception ex) {
      System.debug(LoggingLevel.WARN, 'AI rescore skipped: ' + ex.getMessage());
    }

    // Find the portal user for this account
    Id accountId = q.Opportunity__r != null ? q.Opportunity__r.AccountId : null;
    List<User> custUsers = accountId != null
      ? [
          SELECT Id, Email
          FROM User
          WHERE
            AccountId = :accountId
            AND IsActive = TRUE
            AND UserType = 'PowerCustomerSuccess'
          LIMIT 1
        ]
      : new List<User>();

    String recipientEmail = !custUsers.isEmpty() ? custUsers[0].Email : null;

    if (String.isNotBlank(recipientEmail)) {
      // Full send: email + mark Presented + advance Opp stage
      QuoteController.sendQuoteToCustomer(
        q.Id,
        recipientEmail,
        'Nexus — Your official quote: ' + q.Name,
        null,
        null
      );
    } else {
      // No portal user — still mark Presented so it shows when they log in
      update new TALEXO_Quote__c(
        Id = q.Id,
        Status__c = 'Presented',
        NegotiationStatus__c = 'Sent'
      );
      if (q.Opportunity__c != null) {
        update new Opportunity(
          Id = q.Opportunity__c,
          StageName = 'Proposal/Price Quote'
        );
      }
      recipientEmail = '(no portal account — status updated)';
    }

    return new Map<String, String>{
      'quoteName' => q.Name,
      'recipientEmail' => recipientEmail,
      'accountName' => q.Opportunity__r != null
        ? q.Opportunity__r.Account.Name
        : ''
    };
  }

  // ── Per-opportunity quotes ────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<QuoteDetailWrapper> getOpportunityQuotes(
    Id opportunityId
  ) {
    return toWrapperList(
      [
        SELECT
          Id,
          Name,
          Status__c,
          NegotiationStatus__c,
          GrandTotal__c,
          FinalNegotiatedPrice__c,
          ExpirationDate__c,
          PaymentTerms__c,
          BulkDiscount__c,
          VersionNumber__c,
          AcceptanceProbability__c,
          AIReason__c,
          IsPrimary__c,
          Opportunity__r.Name,
          Opportunity__r.Account.Name,
          DocuSign_Status__c,
          Is_Amendment__c,
          Is_Renewal__c,
          MRR__c,
          OneTimeTotal__c,
          RecurringTotal__c,
          GeneralTerms__c,
          SignatureDeadlineDays__c,
          MessageThread__c,
          (
            SELECT
              Id,
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
        WHERE Opportunity__c = :opportunityId
        ORDER BY VersionNumber__c DESC, CreatedDate DESC
      ]
    );
  }

  // ── Quote settings (CMT — admin-configurable) ─────────────────────────────

  @AuraEnabled(cacheable=true)
  public static QuoteSettingsService.QuoteSettingsWrapper getQuoteSettings() {
    return QuoteSettingsService.getSettings();
  }

  // ── Re-score quote (manual trigger) ──────────────────────────────────────

  @AuraEnabled
  public static void rescoreQuote(Id quoteId) {
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = quoteId;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );
  }

  // ── CPQ Edit: inline edits input classes ─────────────────────────────────

  public class VersionEditInput {
    public Decimal bulkDiscount;
    public String paymentTerms;
    public String expirationDate; // 'YYYY-MM-DD'
    public List<LineEditInput> lineItems;
  }

  public class LineEditInput {
    public String lineItemId;
    public String productName;
    public String productFamily;
    public Integer quantity;
    public Decimal listPrice;
    public Decimal unitPrice;
    public Decimal discount;
    public Decimal netTotal;
  }

  // ── CPQ: create a new version from inline edits (Scenario 5 revised) ─────

  @AuraEnabled
  public static QuoteDetailWrapper createVersionFromEdits(
    Id sourceQuoteId,
    String editsJSON
  ) {
    VersionEditInput edits = (VersionEditInput) JSON.deserialize(
      editsJSON,
      VersionEditInput.class
    );

    TALEXO_Quote__c original = [
      SELECT Id, Opportunity__c, VersionNumber__c
      FROM TALEXO_Quote__c
      WHERE Id = :sourceQuoteId
      LIMIT 1
    ];

    Integer newVer = original.VersionNumber__c != null
      ? Integer.valueOf(original.VersionNumber__c) + 1
      : 2;

    // Demote all existing primaries for this opportunity
    List<TALEXO_Quote__c> primaries = [
      SELECT Id
      FROM TALEXO_Quote__c
      WHERE Opportunity__c = :original.Opportunity__c AND IsPrimary__c = TRUE
    ];
    for (TALEXO_Quote__c p : primaries)
      p.IsPrimary__c = false;
    if (!primaries.isEmpty())
      update primaries;

    // Parse expiration date
    Date expDate = String.isNotBlank(edits.expirationDate)
      ? Date.valueOf(edits.expirationDate)
      : Date.today().addDays(30);

    // Grand total from edited line items
    Decimal grandTotal = 0;
    if (edits.lineItems != null) {
      for (LineEditInput li : edits.lineItems) {
        grandTotal += (li.netTotal != null ? li.netTotal : 0);
      }
    }

    // Create new quote version
    TALEXO_Quote__c newQ = new TALEXO_Quote__c(
      Opportunity__c = original.Opportunity__c,
      Status__c = 'Draft',
      GrandTotal__c = grandTotal,
      ExpirationDate__c = expDate,
      PaymentTerms__c = edits.paymentTerms,
      BulkDiscount__c = edits.bulkDiscount,
      IsPrimary__c = true,
      VersionNumber__c = newVer,
      NegotiationStatus__c = 'Draft',
      Description__c = 'Version ' +
        newVer +
        ' — révisée depuis v' +
        (newVer - 1)
    );
    insert newQ;

    // Create edited line items
    List<NexusQuoteLineItem__c> items = new List<NexusQuoteLineItem__c>();
    if (edits.lineItems != null) {
      for (LineEditInput li : edits.lineItems) {
        Integer qty = li.quantity != null ? li.quantity : 1;
        Decimal price = li.unitPrice != null ? li.unitPrice : 0;
        items.add(
          new NexusQuoteLineItem__c(
            Quote__c = newQ.Id,
            ProductName__c = li.productName,
            ProductFamily__c = li.productFamily,
            Quantity__c = qty,
            ListPrice__c = li.listPrice != null ? li.listPrice : price,
            UnitPrice__c = price,
            Discount__c = li.discount != null ? li.discount : 0,
            NetTotal__c = li.netTotal != null ? li.netTotal : (price * qty)
          )
        );
      }
    }
    if (!items.isEmpty())
      insert items;

    // Re-score the new version
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = newQ.Id;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );

    return toWrapper(
      [
        SELECT
          Id,
          Name,
          Status__c,
          NegotiationStatus__c,
          GrandTotal__c,
          FinalNegotiatedPrice__c,
          ExpirationDate__c,
          PaymentTerms__c,
          BulkDiscount__c,
          VersionNumber__c,
          AcceptanceProbability__c,
          AIReason__c,
          IsPrimary__c,
          CreatedDate,
          Opportunity__c,
          Opportunity__r.Name,
          Opportunity__r.Account.Name,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          NegotiationRound__c,
          IsFinalOffer__c,
          (
            SELECT
              Id,
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
        WHERE Id = :newQ.Id
        LIMIT 1
      ]
    );
  }

  // ── Admin: create a new version of an existing quote (Scenario 5) ────────

  @AuraEnabled
  public static QuoteDetailWrapper createNewVersion(Id quoteId) {
    TALEXO_Quote__c original = [
      SELECT
        Id,
        Opportunity__c,
        GrandTotal__c,
        ExpirationDate__c,
        PaymentTerms__c,
        BulkDiscount__c,
        VersionNumber__c,
        (
          SELECT
            ProductName__c,
            ProductFamily__c,
            Quantity__c,
            ListPrice__c,
            UnitPrice__c,
            Discount__c,
            NetTotal__c,
            Product__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    Integer newVer = original.VersionNumber__c != null
      ? Integer.valueOf(original.VersionNumber__c) + 1
      : 2;

    // Demote all existing primary quotes for this opportunity
    List<TALEXO_Quote__c> primaries = [
      SELECT Id
      FROM TALEXO_Quote__c
      WHERE Opportunity__c = :original.Opportunity__c AND IsPrimary__c = TRUE
    ];
    for (TALEXO_Quote__c p : primaries)
      p.IsPrimary__c = false;
    if (!primaries.isEmpty())
      update primaries;

    // Clone quote as new Draft version
    TALEXO_Quote__c newQ = new TALEXO_Quote__c(
      Opportunity__c = original.Opportunity__c,
      Status__c = 'Draft',
      GrandTotal__c = original.GrandTotal__c,
      ExpirationDate__c = Date.today().addDays(30),
      PaymentTerms__c = original.PaymentTerms__c,
      BulkDiscount__c = original.BulkDiscount__c,
      IsPrimary__c = true,
      VersionNumber__c = newVer,
      NegotiationStatus__c = 'Draft',
      Description__c = 'Version ' + newVer + ' — revised from v' + (newVer - 1)
    );
    insert newQ;

    // Clone all line items
    List<NexusQuoteLineItem__c> items = new List<NexusQuoteLineItem__c>();
    for (NexusQuoteLineItem__c li : original.NexusQuoteLineItems__r) {
      items.add(
        new NexusQuoteLineItem__c(
          Quote__c = newQ.Id,
          Product__c = li.Product__c,
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
    if (!items.isEmpty())
      insert items;

    // Re-score the new version
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = newQ.Id;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );

    return toWrapper(
      [
        SELECT
          Id,
          Name,
          Status__c,
          NegotiationStatus__c,
          GrandTotal__c,
          FinalNegotiatedPrice__c,
          ExpirationDate__c,
          PaymentTerms__c,
          BulkDiscount__c,
          VersionNumber__c,
          AcceptanceProbability__c,
          AIReason__c,
          IsPrimary__c,
          CreatedDate,
          Opportunity__c,
          Opportunity__r.Name,
          Opportunity__r.Account.Name,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          NegotiationRound__c,
          IsFinalOffer__c,
          (
            SELECT
              Id,
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
        WHERE Id = :newQ.Id
        LIMIT 1
      ]
    );
  }

  // ── Scenario 2a: Admin generates formal contract + sends to customer ────────

  @AuraEnabled
  public static Id generateAndSendContract(Id quoteId) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        NegotiationStatus__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        PaymentTerms__c,
        BulkDiscount__c,
        CreatedById
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (q.Status__c != 'Accepted') {
      throw new AuraHandledException(
        'Only accepted quotes can generate a contract.'
      );
    }

    // Resolve AccountId — prefer Opportunity relationship, fall back to
    // the portal user who created the quote (for quotes without an Opportunity).
    Id accountId = q.Opportunity__r.AccountId;
    if (accountId == null && q.CreatedById != null) {
      List<User> creators = [
        SELECT AccountId
        FROM User
        WHERE Id = :q.CreatedById AND AccountId != NULL
        LIMIT 1
      ];
      if (!creators.isEmpty())
        accountId = creators[0].AccountId;
    }
    if (accountId == null) {
      // Last resort: find any active portal user (single-account dev org)
      List<User> anyPortal = [
        SELECT AccountId
        FROM User
        WHERE
          UserType = 'PowerCustomerSuccess'
          AND IsActive = TRUE
          AND AccountId != NULL
        LIMIT 1
      ];
      if (!anyPortal.isEmpty())
        accountId = anyPortal[0].AccountId;
    }
    if (accountId == null) {
      throw new AuraHandledException(
        'Cannot determine the account linked to this quote. Please ensure the opportunity is correctly linked.'
      );
    }

    // Guard: prevent duplicate contracts (NegStatus=Final means contract already generated)
    if (q.NegotiationStatus__c == 'Final') {
      List<Contract> existing = [
        SELECT Id
        FROM Contract
        WHERE AccountId = :accountId AND StartDate = TODAY
        ORDER BY CreatedDate DESC
        LIMIT 1
      ];
      if (!existing.isEmpty())
        return existing[0].Id;
    }

    // Create contract as Draft, then activate
    Id contractId = null;
    try {
      Contract c = new Contract(
        AccountId = accountId,
        StartDate = Date.today(),
        ContractTerm = 12,
        Status = 'Draft',
        Description = 'B2B Contract — ' +
          q.Name +
          ' | ' +
          (q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30')
      );
      insert c;
      contractId = c.Id;
      try {
        update new Contract(Id = c.Id, Status = 'Activated');
      } catch (Exception ex) {
        System.debug(
          LoggingLevel.WARN,
          '[generateAndSendContract] Contract activation skipped: ' +
          ex.getMessage()
        );
      }
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.WARN,
        '[generateAndSendContract] Contract creation skipped: ' +
        ex.getMessage()
      );
    }

    // Signal to portal that contract is awaiting customer signature
    update new TALEXO_Quote__c(Id = quoteId, NegotiationStatus__c = 'Final');

    // Advance opportunity stage if linked
    if (q.Opportunity__c != null) {
      try {
        update new Opportunity(
          Id = q.Opportunity__c,
          StageName = 'Value Proposition'
        );
      } catch (Exception ex) {
        System.debug(
          LoggingLevel.WARN,
          '[generateAndSendContract] Opp stage update skipped: ' +
          ex.getMessage()
        );
      }
    }

    // Send the formal contract document email to the customer (only if contract was created)
    if (contractId != null) {
      sendContractEmailAsync(quoteId, contractId);
    }

    // Initiate DocuSign dual-party e-sign (async — runs after DML is committed)
    DocuSignService.initiateContractSigning(quoteId);

    return contractId;
  }

  // ── US5: One-click Send to DocuSign from quote record page ──────────────────
  @AuraEnabled
  public static void sendQuoteToDocuSign(Id quoteId) {
    // Guard: quote must exist and have an opportunity
    TALEXO_Quote__c q = [
      SELECT Id, Name, Status__c, DocuSign_Status__c, Opportunity__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (q.Opportunity__c == null) {
      throw new AuraHandledException(
        'This quote is not linked to an Opportunity. Please link it before sending.'
      );
    }
    // Dispatches envelope asynchronously — @future handles callout
    DocuSignService.initiateContractSigning(quoteId);
  }

  // ── Scenario 2b: Customer signs the formal contract in the portal ──────────

  // ── Dev/test only: reset quote status ────────────────────────────────────
  @AuraEnabled
  public static void devResetQuoteStatus(Id quoteId, String status) {
    update new TALEXO_Quote__c(Id = quoteId, Status__c = status);
  }

  // ── Dev/test only: simulate invoice email and return result ───────────────
  @AuraEnabled
  public static String devTestInvoiceEmail(Id quoteId, String toEmail) {
    try {
      TALEXO_Quote__c q = [
        SELECT
          Id,
          Name,
          GrandTotal__c,
          BulkDiscount__c,
          PaymentTerms__c,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          Opportunity__r.Account.Name,
          (
            SELECT ProductName__c, Quantity__c, UnitPrice__c, NetTotal__c
            FROM NexusQuoteLineItems__r
          )
        FROM TALEXO_Quote__c
        WHERE Id = :quoteId
        LIMIT 1
      ];
      String resolvedEmail = toEmail;
      if (String.isBlank(resolvedEmail)) {
        List<User> custUsers = [
          SELECT Email
          FROM User
          WHERE
            AccountId = :q.Opportunity__r.AccountId
            AND IsActive = TRUE
            AND UserType = 'PowerCustomerSuccess'
          LIMIT 1
        ];
        resolvedEmail = custUsers.isEmpty() ? null : custUsers[0].Email;
      }
      if (String.isBlank(resolvedEmail))
        return 'FAIL: no email resolved. AccountId=' +
          q.Opportunity__r.AccountId;

      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ resolvedEmail });
      mail.setSubject('TEST — Nexus Invoice · ' + q.Name);
      mail.setHtmlBody(
        '<p>Test invoice for <strong>' +
          q.Name +
          '</strong> | Total: ' +
          q.GrandTotal__c +
          ' | Lines: ' +
          q.NexusQuoteLineItems__r.size() +
          '</p>'
      );
      mail.setSaveAsActivity(false);
      Messaging.SendEmailResult[] results = Messaging.sendEmail(
        new List<Messaging.SingleEmailMessage>{ mail }
      );
      if (results[0].isSuccess())
        return 'OK: email sent to ' + resolvedEmail;
      return 'FAIL: ' + results[0].getErrors()[0].getMessage();
    } catch (Exception ex) {
      return 'EXCEPTION: ' +
        ex.getTypeName() +
        ': ' +
        ex.getMessage() +
        ' | ' +
        ex.getStackTraceString();
    }
  }

  @AuraEnabled
  public static void finalizeContractSign(Id quoteId) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.OwnerId,
        Opportunity__r.Owner.Email,
        Opportunity__r.Account.Name
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (q.Status__c != 'Accepted') {
      throw new AuraHandledException(
        'Le devis doit être accepté avant de signer le contrat.'
      );
    }

    update new TALEXO_Quote__c(
      Id = quoteId,
      Status__c = 'Signed',
      NegotiationStatus__c = 'Final'
    );
    update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');

    // Capture signing user info now (can't use UserInfo in @future)
    User signer = [
      SELECT Name, Email
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    String signedAt = DateTime.now().format('dd/MM/yyyy HH:mm') + ' UTC';

    // Send B2B invoice PDF to customer
    sendB2BInvoiceAsync(
      quoteId,
      'CTR-' + String.valueOf(q.Id).right(6).toUpperCase(),
      signer.Email,
      signer.Name,
      signedAt
    );

    // Notify the opportunity owner (sales rep)
    if (String.isNotBlank(q.Opportunity__r.Owner.Email)) {
      sendContractSignedNotification(
        q.Opportunity__r.Owner.Email,
        q.Opportunity__r.Account.Name,
        q.Name
      );
    }
  }

  // ── @future: formal HTML contract email to customer ───────────────────────

  @future
  private static void sendContractEmailAsync(Id quoteId, Id contractId) {
    try {
      TALEXO_Quote__c q = [
        SELECT
          Id,
          Name,
          GrandTotal__c,
          BulkDiscount__c,
          PaymentTerms__c,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          Opportunity__r.Account.Name,
          (
            SELECT ProductName__c, Quantity__c, UnitPrice__c, NetTotal__c
            FROM NexusQuoteLineItems__r
          )
        FROM TALEXO_Quote__c
        WHERE Id = :quoteId
        LIMIT 1
      ];

      List<User> custUsers = [
        SELECT Email
        FROM User
        WHERE
          AccountId = :q.Opportunity__r.AccountId
          AND IsActive = TRUE
          AND UserType = 'PowerCustomerSuccess'
        LIMIT 1
      ];
      if (custUsers.isEmpty() || String.isBlank(custUsers[0].Email))
        return;

      String accName = q.Opportunity__r.Account.Name;
      String terms = q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30';
      Decimal disc = q.BulkDiscount__c != null ? q.BulkDiscount__c : 0;
      Decimal grand = q.GrandTotal__c != null ? q.GrandTotal__c : 0;
      String ctrRef =
        'CTR-' + String.valueOf(contractId).right(6).toUpperCase();
      String dateStr = Date.today().format();
      String portalUrl = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/mes-offres';

      String rows = '';
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        Integer qty = li.Quantity__c != null
          ? Integer.valueOf(li.Quantity__c)
          : 1;
        Decimal unit = li.UnitPrice__c != null ? li.UnitPrice__c : 0;
        Decimal net = li.NetTotal__c != null ? li.NetTotal__c : (unit * qty);
        rows +=
          '<tr style="border-bottom:1px solid #f1f5f9;">' +
          '<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#0f172a;">' +
          li.ProductName__c +
          '</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:center;">' +
          qty +
          '</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:right;font-weight:700;color:#4f46e5;">' +
          net.setScale(2) +
          ' €</td>' +
          '</tr>';
      }

      String html =
        '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#f8fafc;padding:24px;">' +
        '<div style="background:#0f172a;padding:32px;border-radius:12px 12px 0 0;overflow:hidden;">' +
        '<div style="float:left;">' +
        '<span style="display:inline-block;width:44px;height:44px;background:#4f46e5;border-radius:8px;text-align:center;line-height:44px;font-size:22px;font-weight:900;color:#fff;vertical-align:middle;margin-right:12px;">N</span>' +
        '<span style="font-size:18px;font-weight:900;color:#fff;vertical-align:middle;">NEXUS COMMERCE</span>' +
        '</div>' +
        '<div style="float:right;text-align:right;">' +
        '<div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:0.08em;">CONTRAT B2B</div>' +
        '<div style="font-size:12px;font-weight:700;color:#818cf8;margin-top:4px;">' +
        ctrRef +
        '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">' +
        dateStr +
        '</div>' +
        '</div><div style="clear:both;"></div></div>' +
        '<div style="height:4px;background:#4f46e5;"></div>' +
        '<div style="height:2px;background:#10b981;"></div>' +
        '<div style="background:#fff;padding:32px;">' +
        '<p style="font-size:14px;color:#334155;margin:0 0 8px;">Cher(e) <strong>' +
        accName +
        '</strong>,</p>' +
        '<p style="font-size:13px;color:#64748b;margin:0 0 20px;">Suite à l\'acceptation du devis <strong>' +
        q.Name +
        '</strong>, voici votre contrat B2B officiel. ' +
        'Votre signature électronique est requise pour finaliser cet engagement.</p>' +
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;overflow:hidden;">' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Référence</div>' +
        '<div style="font-size:12px;font-weight:700;color:#4f46e5;">' +
        ctrRef +
        '</div></div>' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Démarrage</div>' +
        '<div style="font-size:12px;font-weight:700;color:#0f172a;">' +
        dateStr +
        '</div></div>' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Durée</div>' +
        '<div style="font-size:12px;font-weight:700;color:#10b981;">12 mois</div></div>' +
        '<div style="clear:both;"></div></div>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">' +
        '<thead><tr style="background:#0f172a;">' +
        '<th style="padding:8px 12px;font-size:9px;color:#94a3b8;text-align:left;font-weight:700;text-transform:uppercase;">Produit</th>' +
        '<th style="padding:8px 12px;font-size:9px;color:#94a3b8;text-align:center;font-weight:700;text-transform:uppercase;">Qté</th>' +
        '<th style="padding:8px 12px;font-size:9px;color:#94a3b8;text-align:right;font-weight:700;text-transform:uppercase;">Montant</th>' +
        '</tr></thead><tbody>' +
        rows +
        '</tbody>' +
        '<tfoot><tr style="border-top:2px solid #0f172a;">' +
        '<td colspan="2" style="padding:10px 12px;text-align:right;font-size:13px;font-weight:900;color:#0f172a;">Total Contrat TTC</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:20px;font-weight:900;color:#4f46e5;">' +
        grand.setScale(2) +
        ' €</td></tr></tfoot>' +
        '</table>' +
        '<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:14px 18px;margin-bottom:20px;">' +
        '<p style="font-size:11px;color:#6b21a8;font-weight:700;margin:0 0 4px;text-transform:uppercase;">Conditions commerciales</p>' +
        '<p style="font-size:12px;color:#374151;margin:0;">Paiement : <strong>' +
        terms +
        '</strong> &nbsp;·&nbsp; Remise volume : <strong>' +
        disc.toPlainString() +
        '%</strong> incluse</p>' +
        '</div>' +
        '<div style="background:#f8fafc;border-left:3px solid #4f46e5;padding:12px 16px;margin-bottom:24px;">' +
        '<p style="font-size:11px;color:#64748b;margin:0;line-height:1.6;">' +
        'Ce contrat engage les deux parties pour 12 mois à compter de la signature. ' +
        'Résiliation possible avec 30 jours de préavis. ' +
        'Document légalement contraignant selon la réglementation eIDAS.</p>' +
        '</div>' +
        '<div style="text-align:center;margin:28px 0;">' +
        '<a href="' +
        portalUrl +
        '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;' +
        'padding:18px 48px;border-radius:12px;font-weight:800;font-size:1rem;display:inline-block;">' +
        '✎ Signer le contrat dans mon espace client</a>' +
        '</div>' +
        '<p style="color:#94a3b8;font-size:11px;text-align:center;">Questions ? <a href="mailto:support@nexus-commerce.com" style="color:#4f46e5;">support@nexus-commerce.com</a></p>' +
        '</div>' +
        '<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;border-radius:0 0 12px 12px;text-align:center;">' +
        '<p style="font-size:9px;color:#94a3b8;margin:0;">Nexus Commerce · 12 Innovation Drive, Paris 75001 · nexus-commerce.com</p>' +
        '<p style="font-size:9px;color:#94a3b8;margin:4px 0 0;">Signature électronique conforme aux normes eIDAS</p>' +
        '</div></div>';

      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ custUsers[0].Email });
      mail.setSubject(
        'Nexus — Votre Contrat B2B à Signer · ' + q.Name + ' · ' + ctrRef
      );
      mail.setHtmlBody(html);
      mail.setSaveAsActivity(false);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.ERROR,
        'sendContractEmailAsync error: ' + ex.getMessage()
      );
    }
  }

  // ── @future: notify sales rep that customer signed the contract ──────────

  @future
  private static void sendContractSignedNotification(
    String ownerEmail,
    String accName,
    String quoteName
  ) {
    try {
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ ownerEmail });
      mail.setSubject('Nexus — Contrat Signé ✓ : ' + accName);
      mail.setPlainTextBody(
        'Bonjour,\n\n' +
          accName +
          ' a signé électroniquement le contrat B2B ' +
          quoteName +
          '.\n\n' +
          'L\'opportunité est passée en Closed Won. La facture a été envoyée au client.\n\n' +
          'Cordialement,\nNexus Platform'
      );
      mail.setSaveAsActivity(false);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.ERROR,
        'sendContractSignedNotification error: ' + ex.getMessage()
      );
    }
  }

  // ── Scenario 1: Convert accepted quote → Order + immediate B2B invoice ───

  @AuraEnabled
  public static Id convertToOrder(Id quoteId) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        Opportunity__c,
        Opportunity__r.AccountId
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (q.Status__c != 'Accepted' && q.Status__c != 'Signed') {
      throw new AuraHandledException(
        'Only Accepted or Signed quotes can be converted to orders.'
      );
    }

    // Get standard pricebook (required for OrderItems)
    Pricebook2 stdPb = [
      SELECT Id
      FROM Pricebook2
      WHERE IsStandard = TRUE
      LIMIT 1
    ];

    Order ord = new Order(
      AccountId = q.Opportunity__r.AccountId,
      Status = 'Draft',
      EffectiveDate = Date.today(),
      Pricebook2Id = stdPb.Id,
      Description = 'B2B Order from Quote ' + q.Name
    );
    insert ord;

    // Copy quote line items → OrderItems so the order has real products & total
    // NexusQuoteLineItem__c has no Product__c lookup — match by ProductName__c
    List<NexusQuoteLineItem__c> lines = [
      SELECT ProductName__c, Quantity__c, UnitPrice__c, NetTotal__c
      FROM NexusQuoteLineItem__c
      WHERE Quote__c = :quoteId
    ];

    // Collect product names to look up Product2 records
    Set<String> productNames = new Set<String>();
    for (NexusQuoteLineItem__c li : lines) {
      if (li.ProductName__c != null)
        productNames.add(li.ProductName__c);
    }

    // Map product name → Product2 Id
    Map<String, Id> nameToProduct2Id = new Map<String, Id>();
    if (!productNames.isEmpty()) {
      for (Product2 p : [
        SELECT Id, Name
        FROM Product2
        WHERE Name IN :productNames AND IsActive = TRUE
      ]) {
        nameToProduct2Id.put(p.Name, p.Id);
      }
    }

    // Collect matched Product2 Ids for PricebookEntry lookup
    Set<Id> matchedProductIds = new Set<Id>(nameToProduct2Id.values());

    // Fetch existing PricebookEntries
    Map<Id, PricebookEntry> prodToPbe = new Map<Id, PricebookEntry>();
    if (!matchedProductIds.isEmpty()) {
      for (PricebookEntry pbe : [
        SELECT Id, Product2Id, UnitPrice
        FROM PricebookEntry
        WHERE
          Product2Id IN :matchedProductIds
          AND Pricebook2Id = :stdPb.Id
          AND IsActive = TRUE
      ]) {
        prodToPbe.put(pbe.Product2Id, pbe);
      }
    }

    // Create missing PricebookEntries
    List<PricebookEntry> pbesToInsert = new List<PricebookEntry>();
    for (NexusQuoteLineItem__c li : lines) {
      if (li.ProductName__c == null)
        continue;
      Id prod2Id = nameToProduct2Id.get(li.ProductName__c);
      if (prod2Id != null && !prodToPbe.containsKey(prod2Id)) {
        pbesToInsert.add(
          new PricebookEntry(
            Product2Id = prod2Id,
            Pricebook2Id = stdPb.Id,
            UnitPrice = li.UnitPrice__c != null ? li.UnitPrice__c : 0,
            IsActive = true
          )
        );
      }
    }
    if (!pbesToInsert.isEmpty()) {
      insert pbesToInsert;
      for (PricebookEntry pbe : pbesToInsert) {
        prodToPbe.put(pbe.Product2Id, pbe);
      }
    }

    // Build OrderItems from matched lines
    List<OrderItem> items = new List<OrderItem>();
    for (NexusQuoteLineItem__c li : lines) {
      Id prod2Id = li.ProductName__c != null
        ? nameToProduct2Id.get(li.ProductName__c)
        : null;
      PricebookEntry pbe = prod2Id != null ? prodToPbe.get(prod2Id) : null;
      if (pbe == null)
        continue;
      items.add(
        new OrderItem(
          OrderId = ord.Id,
          PricebookEntryId = pbe.Id,
          Quantity = li.Quantity__c != null ? li.Quantity__c : 1,
          UnitPrice = li.UnitPrice__c != null ? li.UnitPrice__c : 0
        )
      );
    }

    // Fallback: if no matched line items, create a single summary OrderItem
    if (items.isEmpty()) {
      // Ensure a generic "B2B Quote Order" product exists
      List<Product2> genericProds = [
        SELECT Id
        FROM Product2
        WHERE Name = 'B2B Quote Order'
        LIMIT 1
      ];
      Product2 genericProd;
      if (genericProds.isEmpty()) {
        genericProd = new Product2(
          Name = 'B2B Quote Order',
          IsActive = true,
          ProductCode = 'B2B-ORD'
        );
        insert genericProd;
      } else {
        genericProd = genericProds[0];
      }

      // Get or create PricebookEntry for the generic product
      List<PricebookEntry> genericPbes = [
        SELECT Id
        FROM PricebookEntry
        WHERE
          Product2Id = :genericProd.Id
          AND Pricebook2Id = :stdPb.Id
          AND IsActive = TRUE
        LIMIT 1
      ];
      PricebookEntry genericPbe;
      if (genericPbes.isEmpty()) {
        genericPbe = new PricebookEntry(
          Product2Id = genericProd.Id,
          Pricebook2Id = stdPb.Id,
          UnitPrice = q.GrandTotal__c != null ? q.GrandTotal__c : 0,
          IsActive = true
        );
        insert genericPbe;
      } else {
        genericPbe = genericPbes[0];
      }

      items.add(
        new OrderItem(
          OrderId = ord.Id,
          PricebookEntryId = genericPbe.Id,
          Quantity = 1,
          UnitPrice = q.GrandTotal__c != null ? q.GrandTotal__c : 0,
          Description = 'B2B Order from Quote ' + q.Name
        )
      );
    }

    if (!items.isEmpty())
      insert items;

    update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');
    update new TALEXO_Quote__c(
      Id = quoteId,
      Status__c = 'Signed',
      NegotiationStatus__c = 'Final'
    );

    // Send B2B invoice email (reads quote lines)
    sendB2BInvoiceAsync(
      quoteId,
      'CMD-' + String.valueOf(ord.Id).right(6).toUpperCase(),
      null,
      null,
      null
    );

    return ord.Id;
  }

  // ── Scenario 2: Convert accepted quote → Contract (long-term partnership) ─

  @AuraEnabled
  public static Id convertToContract(Id quoteId) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        PaymentTerms__c,
        BulkDiscount__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (q.Status__c != 'Accepted' && q.Status__c != 'Signed') {
      throw new AuraHandledException(
        'Only Accepted or Signed quotes can be converted to contracts.'
      );
    }

    // Create standard Salesforce Contract (12-month B2B engagement)
    Contract c = new Contract(
      AccountId = q.Opportunity__r.AccountId,
      StartDate = Date.today(),
      ContractTerm = 12,
      Status = 'Activated',
      Description = 'Contrat B2B — ' +
        q.Name +
        ' | ' +
        (q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30') +
        ' | Remise volume : ' +
        (q.BulkDiscount__c != null ? q.BulkDiscount__c : 0) +
        '%',
      SpecialTerms = q.PaymentTerms__c
    );
    insert c;

    update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');
    update new TALEXO_Quote__c(
      Id = quoteId,
      Status__c = 'Signed',
      NegotiationStatus__c = 'Final'
    );

    // Send B2B invoice email for the first order under this contract
    sendB2BInvoiceAsync(
      quoteId,
      'CTR-' + String.valueOf(c.Id).right(6).toUpperCase(),
      null,
      null,
      null
    );

    return c.Id;
  }

  // ── B2B Invoice: @future email using NexusQuoteLineItem__c (no OrderItems) ─

  @future
  private static void sendB2BInvoiceAsync(
    Id quoteId,
    String docRef,
    String customerEmail,
    String signerName,
    String signedAt
  ) {
    try {
      TALEXO_Quote__c q = [
        SELECT
          Id,
          Name,
          GrandTotal__c,
          BulkDiscount__c,
          PaymentTerms__c,
          Opportunity__r.AccountId,
          VolumeDiscountApplied__c,
          ApprovalStatus__c,
          CustomerCounterPrice__c,
          CounterMessage__c,
          Opportunity__r.Account.Name,
          (
            SELECT
              ProductName__c,
              ProductFamily__c,
              Quantity__c,
              UnitPrice__c,
              NetTotal__c
            FROM NexusQuoteLineItems__r
          )
        FROM TALEXO_Quote__c
        WHERE Id = :quoteId
        LIMIT 1
      ];

      // Use passed-in email; fall back to portal user lookup
      String toEmail = customerEmail;
      if (String.isBlank(toEmail)) {
        List<User> custUsers = [
          SELECT Email
          FROM User
          WHERE
            AccountId = :q.Opportunity__r.AccountId
            AND IsActive = TRUE
            AND UserType = 'PowerCustomerSuccess'
          LIMIT 1
        ];
        if (custUsers.isEmpty() || String.isBlank(custUsers[0].Email))
          return;
        toEmail = custUsers[0].Email;
      }

      String accName = q.Opportunity__r.Account.Name;
      String dateStr = Date.today().format();
      String terms = q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30';
      Decimal discount = q.BulkDiscount__c != null ? q.BulkDiscount__c : 0;
      Decimal grand = q.GrandTotal__c != null ? q.GrandTotal__c : 0;

      // Build line item rows
      String itemRows = '';
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        Integer qty = li.Quantity__c != null
          ? Integer.valueOf(li.Quantity__c)
          : 1;
        Decimal unit = li.UnitPrice__c != null ? li.UnitPrice__c : 0;
        Decimal net = li.NetTotal__c != null ? li.NetTotal__c : (unit * qty);
        itemRows +=
          '<tr style="border-bottom:1px solid #f1f5f9;">' +
          '<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#0f172a;">' +
          li.ProductName__c +
          '<br/><span style="font-size:10px;color:#94a3b8;font-weight:400;">' +
          (li.ProductFamily__c != null ? li.ProductFamily__c : '') +
          '</span></td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:center;">' +
          qty +
          '</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:right;">' +
          unit.setScale(2) +
          ' €</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:right;font-weight:700;color:#0f172a;">' +
          net.setScale(2) +
          ' €</td>' +
          '</tr>';
      }

      String html =
        '<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#f8fafc;padding:24px;">' +
        // Header
        '<div style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0;overflow:hidden;">' +
        '<div style="float:left;">' +
        '<span style="display:inline-block;width:40px;height:40px;background:#4f46e5;border-radius:8px;' +
        'text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;' +
        'vertical-align:middle;margin-right:10px;">N</span>' +
        '<span style="font-size:16px;font-weight:900;color:#fff;vertical-align:middle;">NEXUS COMMERCE</span>' +
        '</div>' +
        '<div style="float:right;text-align:right;">' +
        '<div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:0.08em;">FACTURE B2B</div>' +
        '<div style="font-size:12px;font-weight:700;color:#818cf8;margin-top:4px;">' +
        docRef +
        '</div>' +
        '<div style="font-size:9px;color:#94a3b8;margin-top:2px;">' +
        dateStr +
        '</div>' +
        '</div><div style="clear:both;"></div></div>' +
        '<div style="height:4px;background:#4f46e5;"></div>' +
        '<div style="height:2px;background:#10b981;"></div>' +
        // Body
        '<div style="background:#fff;padding:28px 32px;">' +
        '<p style="font-size:13px;color:#64748b;margin:0 0 12px;">Bonjour <strong style="color:#0f172a;">' +
        accName +
        '</strong>,</p>' +
        '<p style="font-size:13px;color:#64748b;margin:0 0 20px;">Voici votre facture suite à l\'acceptation du devis ' +
        '<strong>' +
        q.Name +
        '</strong>.</p>' +
        // Meta row
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:24px;overflow:hidden;">' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Référence</div>' +
        '<div style="font-size:12px;font-weight:700;color:#4f46e5;">' +
        docRef +
        '</div></div>' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Devis</div>' +
        '<div style="font-size:12px;font-weight:700;color:#0f172a;">' +
        q.Name +
        '</div></div>' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Conditions</div>' +
        '<div style="font-size:12px;font-weight:700;color:#10b981;">' +
        terms +
        '</div></div>' +
        '<div style="clear:both;"></div></div>' +
        // Table
        '<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">' +
        '<thead><tr style="background:#0f172a;">' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:left;font-weight:700;text-transform:uppercase;">Produit</th>' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:center;font-weight:700;text-transform:uppercase;">Qté</th>' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:right;font-weight:700;text-transform:uppercase;">Prix net</th>' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:right;font-weight:700;text-transform:uppercase;">Total</th>' +
        '</tr></thead><tbody>' +
        itemRows +
        '</tbody>' +
        '<tfoot>' +
        '<tr><td colspan="3" style="padding:6px 12px;text-align:right;color:#10b981;font-size:11px;">Remise volume (' +
        discount.toPlainString() +
        '%) — incluse dans les prix</td>' +
        '<td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px;color:#10b981;">✓</td></tr>' +
        '<tr style="border-top:2px solid #0f172a;">' +
        '<td colspan="3" style="padding:10px 12px;text-align:right;font-size:14px;font-weight:900;color:#0f172a;">Total TTC</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:20px;font-weight:900;color:#4f46e5;">' +
        grand.setScale(2) +
        ' €</td></tr>' +
        '</tfoot></table>' +
        '<p style="color:#94a3b8;font-size:11px;margin-top:20px;">' +
        'Questions ? <a href="mailto:support@nexus-commerce.com" style="color:#4f46e5;">support@nexus-commerce.com</a></p>' +
        '</div>' +
        // Footer
        '<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;border-radius:0 0 12px 12px;">' +
        '<p style="font-size:9px;color:#94a3b8;margin:0;text-align:center;">' +
        'Nexus Commerce · 12 Innovation Drive, Paris 75001 · nexus-commerce.com</p>' +
        '</div></div>';

      // Generate PDF attachment from B2BInvoiceTemplate VF page
      PageReference pdfPage = Page.B2BInvoiceTemplate;
      pdfPage.getParameters().put('quoteId', quoteId);
      pdfPage.getParameters()
        .put('signerName', signerName != null ? signerName : '');
      pdfPage.getParameters().put('signerEmail', toEmail);
      pdfPage.getParameters()
        .put(
          'signedAt',
          signedAt != null
            ? signedAt
            : DateTime.now().format('dd/MM/yyyy HH:mm') + ' UTC'
        );
      Blob pdfBlob = pdfPage.getContentAsPDF();

      // Save signed contract PDF to Salesforce Files so it appears in Notes & Attachments
      try {
        String cvTitle =
          q.Name.replaceAll('[^A-Za-z0-9_-]', '_') + '_Signed_Contract.pdf';
        ContentVersion cv = new ContentVersion(
          Title = cvTitle,
          PathOnClient = cvTitle,
          VersionData = pdfBlob,
          IsMajorVersion = true
        );
        insert cv;
        cv = [
          SELECT ContentDocumentId
          FROM ContentVersion
          WHERE Id = :cv.Id
          LIMIT 1
        ];
        Id oppId = [
          SELECT Opportunity__c
          FROM TALEXO_Quote__c
          WHERE Id = :quoteId
          LIMIT 1
        ]
        .Opportunity__c;
        Id accId = q.Opportunity__r.AccountId;
        for (Id entityId : new List<Id>{ quoteId, oppId, accId }) {
          if (entityId == null)
            continue;
          try {
            insert new ContentDocumentLink(
              ContentDocumentId = cv.ContentDocumentId,
              LinkedEntityId = entityId,
              ShareType = 'V',
              Visibility = 'AllUsers'
            );
          } catch (Exception ce) {
          }
        }
      } catch (Exception ex) {
        System.debug('PDF save to Files failed: ' + ex.getMessage());
      }

      Messaging.EmailFileAttachment attach = new Messaging.EmailFileAttachment();
      attach.setFileName('Nexus_Contrat_' + q.Name + '.pdf');
      attach.setBody(pdfBlob);
      attach.setContentType('application/pdf');

      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ toEmail });
      mail.setSubject(
        'Nexus — Votre Contrat B2B Signé · ' + q.Name + ' · ' + docRef
      );
      mail.setHtmlBody(html);
      mail.setFileAttachments(
        new List<Messaging.EmailFileAttachment>{ attach }
      );
      mail.setSaveAsActivity(false);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.ERROR,
        'NexusQuoteController.sendB2BInvoiceAsync error: ' + ex.getMessage()
      );
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private static List<QuoteDetailWrapper> toWrapperList(
    List<TALEXO_Quote__c> quotes
  ) {
    List<QuoteDetailWrapper> result = new List<QuoteDetailWrapper>();
    for (TALEXO_Quote__c q : quotes) {
      result.add(toWrapper(q));
    }
    return result;
  }

  private static QuoteDetailWrapper toWrapper(TALEXO_Quote__c q) {
    QuoteDetailWrapper w = new QuoteDetailWrapper();
    w.quoteId = q.Id;
    w.name = q.Name;
    w.status = q.Status__c;
    w.negotiationStatus = q.NegotiationStatus__c;
    w.grandTotal = q.GrandTotal__c;
    w.finalNegotiatedPrice = q.FinalNegotiatedPrice__c;
    w.formattedTotal = q.GrandTotal__c != null
      ? q.GrandTotal__c.format() + ' €'
      : '—';
    w.formattedFinalPrice = q.FinalNegotiatedPrice__c != null
      ? q.FinalNegotiatedPrice__c.format() + ' €'
      : null;
    w.expirationDate = q.ExpirationDate__c != null
      ? q.ExpirationDate__c.format()
      : null;
    w.paymentTerms = q.PaymentTerms__c;
    w.bulkDiscount = q.BulkDiscount__c;
    w.versionNumber = q.VersionNumber__c != null
      ? Integer.valueOf(q.VersionNumber__c)
      : 1;
    w.acceptanceProbability = q.AcceptanceProbability__c != null
      ? Integer.valueOf(q.AcceptanceProbability__c)
      : null;
    w.aiReason = q.AIReason__c;
    w.isPrimary = q.IsPrimary__c;
    w.opportunityName = q.Opportunity__r?.Name;
    w.accountName = q.Opportunity__r?.Account?.Name;
    w.opportunityId = q.Opportunity__c;
    w.isRequested = q.Status__c == 'Requested';
    w.requestedAt = q.CreatedDate != null
      ? q.CreatedDate.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')
      : null;

    // Negotiation fields
    w.volumeDiscountApplied = q.VolumeDiscountApplied__c == true;
    w.approvalStatus = q.ApprovalStatus__c;
    w.customerCounterPrice = q.CustomerCounterPrice__c;
    w.counterMessage = q.CounterMessage__c;
    w.escalationComboA = q.EscalationComboA__c;
    w.escalationComboB = q.EscalationComboB__c;
    w.requestedPaymentTerms = q.RequestedPaymentTerms__c;
    Integer negRound = q.NegotiationRound__c != null
      ? Integer.valueOf(q.NegotiationRound__c)
      : 0;
    w.negotiationRound = negRound;
    w.isFinalOffer = q.IsFinalOffer__c == true;
    w.roundsRemaining = Math.max(0, 3 - negRound);

    // Expiry helpers
    if (q.ExpirationDate__c != null) {
      Integer days = Date.today().daysBetween(q.ExpirationDate__c);
      w.daysUntilExpiry = days;
      w.isExpired = (q.Status__c == 'Expired') || (days < 0);
    } else {
      w.isExpired = false;
      w.daysUntilExpiry = null;
    }

    // DocuSign / amendment / renewal fields
    w.docuSignStatus = q.DocuSign_Status__c;
    w.isAmendment = q.Is_Amendment__c == true;
    w.isRenewal = q.Is_Renewal__c == true;
    w.mrr = q.MRR__c;
    w.oneTimeTotal = q.OneTimeTotal__c;
    w.recurringTotal = q.RecurringTotal__c;
    w.generalTerms = q.GeneralTerms__c;
    w.signatureDeadlineDays = q.SignatureDeadlineDays__c != null
      ? Integer.valueOf(q.SignatureDeadlineDays__c)
      : null;
    w.messageThread = q.MessageThread__c;

    // UI helpers for AI probability display
    Integer prob = w.acceptanceProbability != null
      ? w.acceptanceProbability
      : 0;
    w.probStyle = 'width:' + prob + '%';
    w.probColorCls = prob >= 80
      ? 'prob-high'
      : prob >= 60 ? 'prob-mid' : 'prob-low';

    w.lineItems = new List<LineItemWrapper>();
    for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
      LineItemWrapper lw = new LineItemWrapper();
      lw.lineItemId = li.Id;
      lw.productName = li.ProductName__c;
      lw.productFamily = li.ProductFamily__c;
      lw.quantity = li.Quantity__c != null
        ? Integer.valueOf(li.Quantity__c)
        : 0;
      lw.listPrice = li.ListPrice__c;
      lw.unitPrice = li.UnitPrice__c;
      lw.discount = li.Discount__c;
      lw.netTotal = li.NetTotal__c;
      lw.formattedNetTotal = li.NetTotal__c != null
        ? li.NetTotal__c.setScale(2).toPlainString() + ' €'
        : '—';
      w.lineItems.add(lw);
    }
    return w;
  }
}
