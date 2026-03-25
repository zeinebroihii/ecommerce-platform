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
  }

  public class CartItemInput {
    public String productId;
    public String name;
    public String family;
    public Integer quantity;
    public Decimal unitPrice;
  }

  // ── Get all quotes for a customer's account ───────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<QuoteWrapper> getAccountQuotes(Id accountId) {
    List<QuoteWrapper> result = new List<QuoteWrapper>();
    if (accountId == null)
      return result;

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
      WHERE Opportunity__r.AccountId = :accountId
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
      w.acceptanceProbability = q.AcceptanceProbability__c != null
        ? Integer.valueOf(q.AcceptanceProbability__c)
        : null;
      w.aiReason = q.AIReason__c;
      w.paymentTerms = q.PaymentTerms__c;
      w.bulkDiscount = q.BulkDiscount__c;
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
        w.lineItems.add(lw);
      }
      result.add(w);
    }
    return result;
  }

  // ── Customer: request a quote from their portal cart ──────────────────────

  @AuraEnabled
  public static Id requestQuoteFromCart(String cartJSON) {
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

    // 5. Create Quote with Status = Requested
    TALEXO_Quote__c q = new TALEXO_Quote__c(
      Opportunity__c = oppId,
      Status__c = 'Requested',
      GrandTotal__c = subtotal,
      ExpirationDate__c = Date.today().addDays(30),
      PaymentTerms__c = 'Net 30',
      BulkDiscount__c = 0,
      IsPrimary__c = true,
      VersionNumber__c = 1,
      NegotiationStatus__c = 'Draft',
      Description__c = 'Demande de devis soumise par ' +
        u.Account.Name +
        ' via le portail client · ' +
        items.size() +
        ' produit(s)'
    );
    insert q;

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

    // 8. Email admin notification — try System Admin profile, fall back to org admin
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
      // Last fallback: org default sender / first active internal user
      admins = [
        SELECT Email
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
      mail.setSubject('Nexus — Nouvelle Demande de Devis : ' + u.Account.Name);
      mail.setPlainTextBody(
        'Bonjour,\n\n' +
          u.Account.Name +
          ' a soumis une demande de devis via le portail client.\n\n' +
          'Produits demandés :\n' +
          productList +
          '\n' +
          'Total estimé : ' +
          subtotal.setScale(2) +
          ' €\n\n' +
          'Référence : ' +
          q.Id +
          '\n\n' +
          'Veuillez traiter cette demande dans Nexus Admin → Quote Builder → Requests.\n\n' +
          'Cordialement,\nNexus Platform'
      );
      mail.setSaveAsActivity(false);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    }

    return q.Id;
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
      notifTitle = 'Devis accepté — Contrat en cours';
      notifMsg =
        'Votre devis ' +
        q.Name +
        ' a été accepté. Notre équipe prépare votre contrat.';
      adminSubject = 'Nexus — Acceptation Devis : ' + accName;
      adminBody =
        'Bonjour,\n\n' +
        accName +
        ' a accepté le devis ' +
        q.Name +
        '.\n\nVeuillez préparer le contrat dans les plus brefs délais.\n\n' +
        'Cordialement,\nL\'équipe Nexus';
    } else {
      q.Status__c = 'Rejected';
      newOppStage = 'Closed Lost';
      notifTitle = 'Devis refusé';
      notifMsg =
        'Votre devis ' +
        q.Name +
        ' a été refusé.' +
        (String.isNotBlank(reason) ? ' Raison : ' + reason : '');
      adminSubject = 'Nexus — Refus Devis : ' + accName;
      adminBody =
        'Bonjour,\n\n' +
        accName +
        ' a refusé le devis ' +
        q.Name +
        '.\n\n' +
        (String.isNotBlank(reason) ? 'Raison : ' + reason + '\n\n' : '') +
        'L\'opportunité a été mise à jour en Closed Lost.\n\n' +
        'Cordialement,\nL\'équipe Nexus';
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
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
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
      '<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.9rem;">Votre Devis Officiel</p>' +
      '</div>' +
      '<div style="background:#fff;padding:36px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">' +
      '<p style="color:#334155;">Cher client,</p>' +
      '<p style="color:#334155;">Nous avons préparé votre devis officiel <strong>' +
      q.Name +
      '</strong> suite à votre demande.</p>' +
      '<div style="background:#f0f4ff;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #c7d2fe;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Montant total</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:900;color:#0f172a;font-size:1.1rem;">' +
      totalStr +
      '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Remise appliquée</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:700;color:#059669;">' +
      discount +
      '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Conditions de paiement</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:700;color:#4f46e5;">' +
      (q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30') +
      '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;font-size:0.875rem;">Valide jusqu\'au</td>' +
      '<td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;">' +
      expStr +
      '</td></tr>' +
      '</table>' +
      '</div>' +
      (String.isNotBlank(bodyNote)
        ? '<p style="color:#334155;">' + bodyNote + '</p>'
        : '') +
      '<p style="color:#334155;">Connectez-vous à votre espace client pour examiner le devis, comparer les versions et donner votre accord.</p>' +
      '<div style="text-align:center;margin:32px 0;">' +
      '<a href="https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/mes-offres" ' +
      'style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;' +
      'text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;' +
      'font-size:1rem;display:inline-block;letter-spacing:0.02em;">Voir mon devis → Répondre</a>' +
      '</div>' +
      '<p style="color:#64748b;font-size:0.875rem;">Cordialement,<br/><strong style="color:#0f172a;">L\'équipe Nexus</strong></p>' +
      '</div></div>';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ recipientEmail });
    if (String.isNotBlank(bccEmail)) {
      mail.setBccAddresses(new List<String>{ bccEmail });
    }
    mail.setSubject(
      String.isNotBlank(emailSubject)
        ? emailSubject
        : 'Nexus — Votre devis officiel : ' + q.Name
    );
    mail.setHtmlBody(html);
    mail.setSaveAsActivity(false);
    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });

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
        insert new TALEXO_Quote__c(
          Opportunity__c = oppId,
          Status__c = 'Requested',
          GrandTotal__c = 0,
          ExpirationDate__c = Date.today().addDays(30),
          PaymentTerms__c = 'Net 30',
          BulkDiscount__c = 0,
          IsPrimary__c = true,
          VersionNumber__c = 1,
          NegotiationStatus__c = 'Draft',
          Description__c = (String.isNotBlank(message)
              ? message
              : 'Demande via portail') +
            ' · Qté estimée: ' +
            qtyInt
        );
      }
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.WARN,
        'requestQuote Opp/Quote: ' + ex.getMessage()
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
    mail.setSubject('Nexus — Nouvelle Demande de Devis : ' + companyName);
    mail.setPlainTextBody(
      'Bonjour,\n\nNouvelle demande de devis soumise via le portail.\n\n' +
        'Société : ' +
        companyName +
        '\nEmail : ' +
        email +
        '\nQuantité : ' +
        qty +
        (String.isNotBlank(message) ? '\nMessage : ' + message : '') +
        '\n\nCordialement,\nNexus Platform'
    );
    mail.setSaveAsActivity(false);
    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
  }
}
