public without sharing class LeadManagementController {
  // ── Lead detail returned to LWC ───────────────────────────────────────────
  public class LeadDetail {
    @AuraEnabled
    public Id leadId;
    @AuraEnabled
    public String salutation;
    @AuraEnabled
    public String firstName;
    @AuraEnabled
    public String lastName;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String company;
    @AuraEnabled
    public String email;
    @AuraEnabled
    public String phone;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String country;
    @AuraEnabled
    public String city;
    @AuraEnabled
    public String postalCode;
    @AuraEnabled
    public String state;
    @AuraEnabled
    public String industry;
    @AuraEnabled
    public String description;
    @AuraEnabled
    public Integer score;
    @AuraEnabled
    public String initials;
    @AuraEnabled
    public String createdDateStr;
    @AuraEnabled
    public Long createdTimestamp;
    @AuraEnabled
    public String leadSource;
    @AuraEnabled
    public String statusGroup; // 'new' | 'progress' | 'qualified'
    @AuraEnabled
    public Integer aiScore;
    @AuraEnabled
    public String aiReason;
    @AuraEnabled
    public String intent;
    @AuraEnabled
    public String adminDecision;
    @AuraEnabled
    public String website;
  }

  // ── Contact detail returned to LWC ──────────────────────────────────────────
  public class ContactDetail {
    @AuraEnabled
    public Id contactId;
    @AuraEnabled
    public String firstName;
    @AuraEnabled
    public String lastName;
    @AuraEnabled
    public String fullName;
    @AuraEnabled
    public String account;
    @AuraEnabled
    public String email;
    @AuraEnabled
    public String phone;
    @AuraEnabled
    public String title;
    @AuraEnabled
    public String department;
    @AuraEnabled
    public String initials;
  }

  // ── Case detail returned to LWC ──────────────────────────────────────────
  public class CaseDetail {
    @AuraEnabled
    public Id caseId;
    @AuraEnabled
    public String caseNumber;
    @AuraEnabled
    public String subject;
    @AuraEnabled
    public String account;
    @AuraEnabled
    public String contact;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String priority;
    @AuraEnabled
    public String caseDate;
    @AuraEnabled
    public String caseType;
    @AuraEnabled
    public Boolean needsMeeting;
  }

  @AuraEnabled(cacheable=true)
  public static List<CaseDetail> getCases() {
    List<CaseDetail> result = new List<CaseDetail>();
    for (Case c : [
      SELECT
        Id,
        CaseNumber,
        Subject,
        Account.Name,
        Contact.Name,
        Status,
        Priority,
        CreatedDate,
        Type
      FROM Case
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      CaseDetail d = new CaseDetail();
      d.caseId = c.Id;
      d.caseNumber = c.CaseNumber;
      d.subject = c.Subject;
      d.account = c.Account != null ? c.Account.Name : '';
      d.contact = c.Contact != null ? c.Contact.Name : '';
      d.status = c.Status;
      d.priority = c.Priority;
      d.caseDate = c.CreatedDate != null
        ? String.valueOf(c.CreatedDate.date())
        : '';
      d.caseType = c.Type;
      d.needsMeeting = c.Priority == 'High';
      result.add(d);
    }
    return result;
  }

  // ── Opportunity detail returned to LWC ───────────────────────────────────
  public class OpportunityDetail {
    @AuraEnabled
    public Id oppId;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String account;
    @AuraEnabled
    public Decimal amount;
    @AuraEnabled
    public String formattedAmount;
    @AuraEnabled
    public String closeDate;
    @AuraEnabled
    public String stage;
  }

  @AuraEnabled(cacheable=true)
  public static List<OpportunityDetail> getOpportunities() {
    List<OpportunityDetail> result = new List<OpportunityDetail>();
    for (Opportunity o : [
      SELECT Id, Name, Account.Name, Amount, CloseDate, StageName
      FROM Opportunity
      WHERE
        StageName IN (
          'Prospecting',
          'Qualification',
          'Negotiation',
          'Closed Won'
        )
      ORDER BY CloseDate ASC
      LIMIT 100
    ]) {
      OpportunityDetail d = new OpportunityDetail();
      d.oppId = o.Id;
      d.name = o.Name;
      d.account = o.Account != null ? o.Account.Name : '';
      d.amount = o.Amount;
      d.formattedAmount = fmtAmount(o.Amount);
      d.closeDate = o.CloseDate != null ? String.valueOf(o.CloseDate) : '';
      d.stage = o.StageName;
      result.add(d);
    }
    return result;
  }

  @AuraEnabled(cacheable=true)
  public static List<ContactDetail> getContacts() {
    List<ContactDetail> result = new List<ContactDetail>();
    for (Contact c : [
      SELECT
        Id,
        FirstName,
        LastName,
        Account.Name,
        Email,
        Phone,
        Title,
        Department
      FROM Contact
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      ContactDetail d = new ContactDetail();
      d.contactId = c.Id;
      d.firstName = c.FirstName;
      d.lastName = c.LastName;
      d.fullName = ((c.FirstName != null ? c.FirstName + ' ' : '') +
        (c.LastName != null ? c.LastName : ''))
        .trim();
      d.account = c.Account != null ? c.Account.Name : '';
      d.email = c.Email;
      d.phone = c.Phone;
      d.title = c.Title;
      d.department = c.Department;
      d.initials = initials(c.FirstName, c.LastName);
      result.add(d);
    }
    return result;
  }

  // ── Leads with location data for map components ───────────────────────────
  @AuraEnabled(cacheable=true)
  public static List<LeadDetail> getLeadLocations() {
    List<LeadDetail> result = new List<LeadDetail>();
    for (Lead l : [
      SELECT
        Id,
        FirstName,
        LastName,
        Company,
        City,
        State,
        Country,
        PostalCode,
        AIScore__c,
        Intent__c,
        AdminDecision__c,
        Status
      FROM Lead
      WHERE
        IsConverted = FALSE
        AND Company != NULL
        AND (City != NULL
        OR Country != NULL)
      ORDER BY CreatedDate DESC
      LIMIT 200
    ]) {
      LeadDetail d = new LeadDetail();
      d.leadId = l.Id;
      d.firstName = l.FirstName;
      d.lastName = l.LastName;
      d.name = ((l.FirstName != null ? l.FirstName + ' ' : '') +
        (l.LastName != null ? l.LastName : ''))
        .trim();
      d.company = l.Company;
      d.city = l.City;
      d.state = l.State;
      d.country = l.Country;
      d.postalCode = l.PostalCode;
      d.aiScore = l.AIScore__c != null ? l.AIScore__c.intValue() : null;
      d.intent = l.Intent__c;
      d.adminDecision = l.AdminDecision__c;
      d.status = l.Status;
      d.initials = initials(l.FirstName, l.LastName);
      result.add(d);
    }
    return result;
  }

  @AuraEnabled(cacheable=true)
  public static LeadDetail getLeadLocationById(String leadId) {
    for (Lead l : [
      SELECT
        Id,
        FirstName,
        LastName,
        Company,
        City,
        State,
        Country,
        PostalCode,
        AIScore__c,
        Intent__c,
        AdminDecision__c,
        Status
      FROM Lead
      WHERE Id = :leadId
      LIMIT 1
    ]) {
      LeadDetail d = new LeadDetail();
      d.leadId = l.Id;
      d.firstName = l.FirstName;
      d.lastName = l.LastName;
      d.name = ((l.FirstName != null ? l.FirstName + ' ' : '') +
        (l.LastName != null ? l.LastName : ''))
        .trim();
      d.company = l.Company;
      d.city = l.City;
      d.state = l.State;
      d.country = l.Country;
      d.postalCode = l.PostalCode;
      d.aiScore = l.AIScore__c != null ? l.AIScore__c.intValue() : null;
      d.intent = l.Intent__c;
      d.adminDecision = l.AdminDecision__c;
      d.status = l.Status;
      d.initials = initials(l.FirstName, l.LastName);
      return d;
    }
    return null;
  }

  @AuraEnabled(cacheable=true)
  public static List<LeadDetail> getLeadsToConvert() {
    List<LeadDetail> result = new List<LeadDetail>();
    for (Lead l : [
      SELECT
        Id,
        Salutation,
        FirstName,
        LastName,
        Email,
        Phone,
        Company,
        Industry,
        Status,
        Country,
        City,
        PostalCode,
        State,
        Lead_Score__c,
        Description,
        CreatedDate,
        LeadSource,
        AIScore__c,
        AIReason__c,
        Intent__c,
        AdminDecision__c,
        Website
      FROM Lead
      WHERE IsConverted = FALSE
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      LeadDetail d = new LeadDetail();
      d.leadId = l.Id;
      d.salutation = l.Salutation;
      d.firstName = l.FirstName;
      d.lastName = l.LastName;
      d.name = ((l.FirstName != null ? l.FirstName + ' ' : '') +
        (l.LastName != null ? l.LastName : ''))
        .trim();
      d.company = l.Company;
      d.email = l.Email;
      d.phone = l.Phone;
      d.status = l.Status;
      d.country = l.Country;
      d.city = l.City;
      d.postalCode = l.PostalCode;
      d.state = l.State;
      d.industry = l.Industry;
      d.description = l.Description;
      d.score = l.AIScore__c != null
        ? l.AIScore__c.intValue()
        : (l.Lead_Score__c != null ? Integer.valueOf(l.Lead_Score__c) : 0);
      d.aiScore = l.AIScore__c != null ? l.AIScore__c.intValue() : null;
      d.aiReason = l.AIReason__c;
      d.intent = l.Intent__c;
      d.adminDecision = l.AdminDecision__c;
      d.website = l.Website;
      d.initials = initials(l.FirstName, l.LastName);
      d.createdDateStr = l.CreatedDate != null ? l.CreatedDate.format() : '';
      d.createdTimestamp = l.CreatedDate != null ? l.CreatedDate.getTime() : 0;
      d.leadSource = l.LeadSource;
      d.statusGroup = statusGroup(l.Status);
      result.add(d);
    }
    return result;
  }

  // ── Convert lead + update opp + notify admin ──────────────────────────────
  @AuraEnabled
  public static Map<String, Id> convertLeadFull(
    Id leadId,
    String opportunityName,
    Decimal amount,
    String closeDateStr,
    String stage
  ) {
    LeadStatus convStatus;
    try {
      convStatus = [
        SELECT MasterLabel
        FROM LeadStatus
        WHERE IsConverted = TRUE
        LIMIT 1
      ];
    } catch (Exception e) {
      throw new AuraHandledException('Aucun statut "Converti" trouvé.');
    }

    Database.LeadConvert lc = new Database.LeadConvert();
    lc.setLeadId(leadId);
    lc.setConvertedStatus(convStatus.MasterLabel);
    lc.setDoNotCreateOpportunity(String.isBlank(opportunityName));
    if (String.isNotBlank(opportunityName))
      lc.setOpportunityName(opportunityName);

    Database.LeadConvertResult res;
    try {
      res = Database.convertLead(lc);
    } catch (Exception e) {
      if (!e.getMessage().contains('DUPLICATES_DETECTED')) {
        throw new AuraHandledException('Erreur système : ' + e.getMessage());
      }
      // Duplicate detected — link to existing Contact / Account and retry
      Lead ld = [SELECT Email, Company FROM Lead WHERE Id = :leadId LIMIT 1];
      Boolean accountLinked = false;
      if (String.isNotBlank(ld.Email)) {
        List<Contact> cx = [
          SELECT Id, AccountId
          FROM Contact
          WHERE Email = :ld.Email
          LIMIT 1
        ];
        if (!cx.isEmpty()) {
          lc.setContactId(cx[0].Id);
          if (cx[0].AccountId != null) {
            lc.setAccountId(cx[0].AccountId);
            accountLinked = true;
          }
        }
      }
      if (!accountLinked && String.isNotBlank(ld.Company)) {
        List<Account> ax = [
          SELECT Id
          FROM Account
          WHERE Name = :ld.Company
          LIMIT 1
        ];
        if (!ax.isEmpty())
          lc.setAccountId(ax[0].Id);
      }
      try {
        res = Database.convertLead(lc);
      } catch (Exception e2) {
        throw new AuraHandledException(
          'Conversion échouée : ' + e2.getMessage()
        );
      }
    }
    if (!res.isSuccess()) {
      String msg = res.getErrors().isEmpty()
        ? 'Erreur inconnue'
        : res.getErrors()[0].getMessage();
      throw new AuraHandledException('Conversion échouée : ' + msg);
    }

    if (res.getOpportunityId() != null) {
      Date cd;
      try {
        cd = String.isNotBlank(closeDateStr)
          ? Date.valueOf(closeDateStr)
          : Date.today().addDays(30);
      } catch (Exception ignored) {
        cd = Date.today().addDays(30);
      }
      try {
        update new Opportunity(
          Id = res.getOpportunityId(),
          Amount = amount != null ? amount : 0,
          StageName = String.isNotBlank(stage) ? stage : 'Qualification',
          CloseDate = cd
        );
      } catch (DmlException de) {
        throw new AuraHandledException(
          'Opportunité créée mais mise à jour échouée : ' + de.getMessage()
        );
      }
    }

    // Ensure contact has email (lead field mapping may not copy it)
    if (res.getContactId() != null) {
      Lead srcLead = [SELECT Email FROM Lead WHERE Id = :leadId LIMIT 1];
      if (String.isNotBlank(srcLead.Email)) {
        Contact conv = [
          SELECT Id, Email
          FROM Contact
          WHERE Id = :res.getContactId()
          LIMIT 1
        ];
        if (String.isBlank(conv.Email)) {
          conv.Email = srcLead.Email;
          update conv;
        }
      }
    }

    return new Map<String, Id>{
      'contactId' => res.getContactId(),
      'accountId' => res.getAccountId(),
      'opportunityId' => res.getOpportunityId()
    };
  }

  // ── Admin approve / reject a B2B lead ────────────────────────────────────
  @AuraEnabled
  public static void approveRejectLead(String leadId, String decision) {
    try {
      Lead l = [SELECT Id FROM Lead WHERE Id = :leadId LIMIT 1];
      l.AdminDecision__c = decision;
      l.Status = (decision == 'Approved')
        ? 'Closed - Converted'
        : 'Closed - Not Converted';
      update l;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Erreur lors de la décision : ' + e.getMessage()
      );
    }
  }

  // ── Called by LeadController after insert (public, sync dispatcher) ───────
  // Delegates to @future so it runs AFTER the guest transaction commits
  public static void notifyAdminNewLead(Lead l) {
    notifyAdminNewLeadAsync(
      l.Id,
      l.FirstName != null ? l.FirstName : '',
      l.LastName != null ? l.LastName : '',
      l.Company != null ? l.Company : '',
      l.Email != null ? l.Email : '',
      l.Phone != null ? l.Phone : '',
      l.City != null ? l.City : '',
      l.PostalCode != null ? l.PostalCode : '',
      l.Country != null ? l.Country : '',
      l.Industry != null ? l.Industry : ''
    );
  }

  // ── @future: new-lead admin notification ──────────────────────────────────
  @future
  private static void notifyAdminNewLeadAsync(
    Id leadId,
    String firstName,
    String lastName,
    String company,
    String emailAddr,
    String phone,
    String city,
    String postalCode,
    String country,
    String industry
  ) {
    List<User> admins = [
      SELECT Email, FirstName
      FROM User
      WHERE Profile.Name = 'System Administrator' AND IsActive = TRUE
      LIMIT 1
    ];
    if (admins.isEmpty())
      return;

    String loc = '';
    if (String.isNotBlank(city))
      loc += city;
    if (String.isNotBlank(postalCode))
      loc += (loc.length() > 0 ? ' ' : '') + postalCode;
    if (String.isNotBlank(country))
      loc += (loc.length() > 0 ? ', ' : '') + country;

    String fullName = (firstName + ' ' + lastName).trim();
    String html = buildNewLeadHtmlFromParams(
      admins[0].FirstName,
      firstName,
      lastName,
      company,
      emailAddr,
      phone,
      loc,
      industry,
      String.valueOf(leadId)
    );

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ admins[0].Email });
    mail.setSubject(
      '🔔 Nexus Systems — Nouveau Lead : ' +
        fullName +
        (String.isNotBlank(company) ? ' (' + company + ')' : '')
    );
    mail.setHtmlBody(html);
    mail.setSaveAsActivity(false);
    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      System.debug('Admin new-lead notif: ' + e.getMessage());
    }
  }

  // ── @future: admin conversion notification ────────────────────────────────
  @future
  private static void notifyAdminConversionAsync(
    String firstName,
    String lastName,
    String company,
    String emailAddr,
    String oppId,
    String contactId
  ) {
    List<User> admins = [
      SELECT Email, FirstName
      FROM User
      WHERE Profile.Name = 'System Administrator' AND IsActive = TRUE
      LIMIT 1
    ];
    if (admins.isEmpty())
      return;

    String oppLink = String.isNotBlank(oppId)
      ? '/lightning/r/Opportunity/' + oppId + '/view'
      : '';
    String conLink = String.isNotBlank(contactId)
      ? '/lightning/r/Contact/' + contactId + '/view'
      : '';

    String html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">' +
      // ── Dark header top row ──
      '<div style="background:#0f172a;padding:28px 36px 0;">' +
      '<table style="width:100%;border-collapse:collapse;"><tr>' +
      '<td><span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.14em;">NEXUS</span>' +
      '<br><span style="color:#64748b;font-size:11px;letter-spacing:0.05em;">CRM &amp; Intelligence Platform</span></td>' +
      '<td style="text-align:right;vertical-align:middle;">' +
      '<span style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);' +
      'color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">' +
      '&#x2705; LEAD CONVERTI</span>' +
      '</td></tr></table>' +
      '<div style="margin-top:22px;height:2px;background:#10b981;"></div>' +
      '</div>' +
      // ── Dark header title ──
      '<div style="background:#0f172a;padding:18px 36px 30px;">' +
      '<div style="font-size:20px;font-weight:700;color:#f1f5f9;">Conversion r\u00e9alis\u00e9e avec succ\u00e8s</div>' +
      '<div style="color:#94a3b8;font-size:13px;margin-top:5px;">Le lead a \u00e9t\u00e9 converti en Client et Opportunit\u00e9</div>' +
      '</div>' +
      // ── White body ──
      '<div style="background:#fff;padding:36px;">' +
      '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 24px;">' +
      'Le prospect suivant vient d\'\u00eatre converti avec succ\u00e8s dans Nexus CRM :</p>' +
      // Client info card (green accent)
      '<div style="background:#f8fafc;border-left:4px solid #10b981;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 24px;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">CLIENT</td>' +
      '<td style="padding:8px 0;color:#0f172a;font-weight:700;font-size:14px;">' +
      firstName +
      ' ' +
      lastName +
      '</td></tr>' +
      '<tr><td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">ENTREPRISE</td>' +
      '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' +
      (String.isNotBlank(company) ? company : '\u2014') +
      '</td></tr>' +
      '<tr><td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">EMAIL</td>' +
      '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' +
      (String.isNotBlank(emailAddr) ? emailAddr : '\u2014') +
      '</td></tr>' +
      '</table></div>' +
      '<p style="color:#475569;font-size:14px;margin:0 0 24px;line-height:1.7;">' +
      'Un email de bienvenue personnalis\u00e9 a \u00e9t\u00e9 envoy\u00e9 automatiquement au client.</p>' +
      // CTA buttons
      '<div style="text-align:center;">' +
      (String.isNotBlank(oppLink)
        ? '<a href="' +
          oppLink +
          '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;margin-right:12px;">Voir Opportunit\u00e9 &rarr;</a>'
        : '') +
      (String.isNotBlank(conLink)
        ? '<a href="' +
          conLink +
          '" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">Voir Contact &rarr;</a>'
        : '') +
      '</div></div>' +
      // ── Dark footer ──
      '<div style="background:#1e293b;padding:18px 36px;text-align:center;">' +
      '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 Nexus Systems &bull; CRM &amp; Intelligence Platform</p>' +
      '<p style="color:#475569;font-size:11px;margin:0;">Notification CRM automatique &mdash; Ne pas r\u00e9pondre \u00e0 cet email</p>' +
      '</div>' +
      '</div></body></html>';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ admins[0].Email });
    mail.setSubject(
      '✅ Nexus Systems — Lead Converti : ' + firstName + ' ' + lastName
    );
    mail.setHtmlBody(html);
    mail.setSaveAsActivity(false);
    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      System.debug('Admin conv notif: ' + e.getMessage());
    }
  }

  // ── HTML builder (primitive params, safe for @future) ─────────────────────
  private static String buildNewLeadHtmlFromParams(
    String adminFirst,
    String firstName,
    String lastName,
    String company,
    String emailAddr,
    String phone,
    String loc,
    String industry,
    String leadId
  ) {
    String fullName = (firstName + ' ' + lastName).trim();
    String adminGreet = String.isNotBlank(adminFirst)
      ? adminFirst
      : 'Administrateur';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">' +
      // ── Dark header top row ──
      '<div style="background:#0f172a;padding:28px 36px 0;">' +
      '<table style="width:100%;border-collapse:collapse;"><tr>' +
      '<td><span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.14em;">NEXUS</span>' +
      '<br><span style="color:#64748b;font-size:11px;letter-spacing:0.05em;">CRM &amp; Intelligence Platform</span></td>' +
      '<td style="text-align:right;vertical-align:middle;">' +
      '<span style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);' +
      'color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">' +
      '&#x1F514; NOUVEAU LEAD</span>' +
      '</td></tr></table>' +
      '<div style="margin-top:22px;height:2px;background:#6366f1;"></div>' +
      '</div>' +
      // ── Dark header title ──
      '<div style="background:#0f172a;padding:18px 36px 30px;">' +
      '<div style="font-size:20px;font-weight:700;color:#f1f5f9;">Un nouveau prospect vous attend</div>' +
      '<div style="color:#94a3b8;font-size:13px;margin-top:5px;">Soumis via le portail Nexus Systems</div>' +
      '</div>' +
      // ── White body ──
      '<div style="background:#fff;padding:36px;">' +
      '<p style="font-size:15px;color:#0f172a;margin:0 0 10px;">Bonjour ' +
      adminGreet +
      ',</p>' +
      '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 24px;">' +
      'Un nouveau prospect vient de soumettre sa demande sur le portail Nexus Systems. Voici les informations :</p>' +
      // Info card
      '<div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 28px;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      rowHtml('Nom', fullName) +
      rowHtml('Entreprise', company) +
      rowHtml('Email', emailAddr) +
      rowHtml('T\u00e9l\u00e9phone', phone) +
      rowHtml('Localisation', loc) +
      rowHtml('Industrie', industry) +
      '</table></div>' +
      '<div style="border-top:1px solid #e2e8f0;margin:0 0 28px;"></div>' +
      // CTA button
      '<div style="text-align:center;">' +
      '<a href="/lightning/r/Lead/' +
      leadId +
      '/view" ' +
      'style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;' +
      'padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">' +
      'Voir &amp; Convertir ce Lead &rarr;</a>' +
      '</div></div>' +
      // ── Dark footer ──
      '<div style="background:#1e293b;padding:18px 36px;text-align:center;">' +
      '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 Nexus Systems &bull; CRM &amp; Intelligence Platform</p>' +
      '<p style="color:#475569;font-size:11px;margin:0;">Notification CRM automatique &mdash; Ne pas r\u00e9pondre \u00e0 cet email</p>' +
      '</div>' +
      '</div></body></html>';
  }

  // ── Create Experience Cloud portal user for a converted Contact ──────────
  @AuraEnabled
  public static String createPortalUserForContact(Id contactId) {
    // Load contact details
    Contact c;
    try {
      c = [
        SELECT Id, FirstName, LastName, Email, Salutation, AccountId
        FROM Contact
        WHERE Id = :contactId
        LIMIT 1
      ];
    } catch (Exception e) {
      throw new AuraHandledException('Contact introuvable : ' + e.getMessage());
    }

    if (String.isBlank(c.Email)) {
      throw new AuraHandledException(
        'Ce contact n\'a pas d\'adresse email. Veuillez en ajouter une avant de créer le compte portail.'
      );
    }

    // Return silently if an active portal user already exists for this contact
    List<User> existing = [
      SELECT Id, Username
      FROM User
      WHERE ContactId = :contactId AND IsActive = TRUE
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      return existing[0].Username;
    }

    // Find the Community profile — priority order to avoid license limits
    List<Profile> profiles = [
      SELECT Id
      FROM Profile
      WHERE Name = 'Customer Community Plus Login User'
      LIMIT 1
    ];
    if (profiles.isEmpty())
      profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community Plus User'
        LIMIT 1
      ];
    if (profiles.isEmpty())
      profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community User'
        LIMIT 1
      ];
    if (profiles.isEmpty())
      profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community Login User'
        LIMIT 1
      ];
    if (profiles.isEmpty()) {
      throw new AuraHandledException(
        'Aucun profil communauté trouvé. Veuillez vérifier la configuration Experience Cloud.'
      );
    }

    // Build alias (max 8 chars) and nickname
    String fn = c.FirstName != null ? c.FirstName : '';
    String ln = c.LastName != null ? c.LastName : 'User';
    String alias = (fn.left(1) + ln.left(7)).left(8);
    String rawNick = (fn + ln).replaceAll('[^a-zA-Z0-9]', '');
    String nick = String.isBlank(rawNick)
      ? 'user' + String.valueOf(Math.abs(contactId.hashCode())).left(6)
      : rawNick.left(40);

    User u = new User(
      ProfileId = profiles[0].Id,
      ContactId = contactId,
      // AccountId is set automatically by SF when ContactId is populated — do NOT set it explicitly
      Username = c.Email, // email = username (standard for Experience Cloud)
      Email = c.Email,
      FirstName = fn,
      LastName = ln,
      Alias = alias,
      CommunityNickname = nick,
      TimeZoneSidKey = 'Europe/London',
      LocaleSidKey = 'en_GB',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US',
      IsActive = true
    );

    // Salesforce requires the Account owner to have a Role before a portal user can be inserted.
    // Auto-assign one so the admin never has to do this manually.
    if (c.AccountId != null) {
      Account acc = [
        SELECT OwnerId
        FROM Account
        WHERE Id = :c.AccountId
        LIMIT 1
      ];
      User accountOwner = [
        SELECT Id, UserRoleId
        FROM User
        WHERE Id = :acc.OwnerId
        LIMIT 1
      ];
      if (accountOwner.UserRoleId == null) {
        List<UserRole> roles = [SELECT Id FROM UserRole LIMIT 1];
        Id roleId;
        if (roles.isEmpty()) {
          UserRole defaultRole = new UserRole(
            Name = 'Nexus Admin',
            DeveloperName = 'Nexus_Admin'
          );
          insert defaultRole;
          roleId = defaultRole.Id;
        } else {
          roleId = roles[0].Id;
        }
        accountOwner.UserRoleId = roleId;
        update accountOwner;
      }
    }

    try {
      insert u;
    } catch (DmlException e) {
      String msg = e.getMessage();
      if (msg.contains('DUPLICATE_USERNAME')) {
        // Username taken — append a suffix and retry
        u.Username =
          c.Email +
          '.nx' +
          String.valueOf(Math.abs(Crypto.getRandomInteger()));
        try {
          insert u;
        } catch (DmlException e2) {
          throw new AuraHandledException(
            'Erreur lors de la création du compte : ' + e2.getMessage()
          );
        }
      } else {
        throw new AuraHandledException(
          'Erreur lors de la création du compte : ' + msg
        );
      }
    }

    // Send branded welcome email with secure setup link in @future (after User DML)
    sendPortalUserEmailsAsync(u.Id, u.Username, c.Email, fn, ln);

    return u.Username;
  }

  // ── InvocableMethod so a Flow can call provisionPortalUser ───────────────
  @InvocableMethod(
    label='Provision Portal User'
    description='Creates portal user and sends credentials email for a converted lead'
  )
  public static void provisionPortalUserFromFlow(List<Id> leadIds) {
    for (Id leadId : leadIds) {
      try {
        provisionPortalUser(leadId);
      } catch (Exception e) {
        System.debug(
          'provisionPortalUserFromFlow error for ' +
            leadId +
            ': ' +
            e.getMessage()
        );
      }
    }
  }

  // ── Provision portal user for a CONVERTED lead + send real credentials ────
  // Called by admin after convertLeadFull. Uses System.setPassword so the
  // temp password in the welcome email is the actual login password.
  @AuraEnabled
  public static String provisionPortalUser(String leadId) {
    // 1. Load converted lead
    Lead l;
    try {
      l = [
        SELECT
          Id,
          FirstName,
          LastName,
          Email,
          Company,
          IsConverted,
          ConvertedContactId,
          ConvertedAccountId
        FROM Lead
        WHERE Id = :leadId
        LIMIT 1
      ];
    } catch (Exception ex) {
      throw new AuraHandledException('Lead introuvable.');
    }
    if (!l.IsConverted || l.ConvertedContactId == null) {
      throw new AuraHandledException(
        'Le lead doit être converti avant de créer un compte portail.'
      );
    }
    if (String.isBlank(l.Email)) {
      throw new AuraHandledException('Ce lead n\'a pas d\'adresse email.');
    }

    // 2. Idempotency — skip user creation if portal user already exists, but still send email
    List<User> existing = [
      SELECT Id, Username
      FROM User
      WHERE ContactId = :l.ConvertedContactId AND IsActive = TRUE
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      // User already provisioned — resend setup email with a fresh reset token
      Contact cx = [
        SELECT Id, FirstName, LastName, Email
        FROM Contact
        WHERE Id = :l.ConvertedContactId
        LIMIT 1
      ];
      sendPortalUserEmailsAsync(
        existing[0].Id,
        existing[0].Username,
        cx.Email,
        cx.FirstName,
        cx.LastName != null ? cx.LastName : ''
      );
      return existing[0].Username;
    }

    // 3. Load contact — fallback to email lookup if ConvertedContactId points to wrong/ghost record
    List<Contact> cList = [
      SELECT Id, FirstName, LastName, Email, AccountId
      FROM Contact
      WHERE Id = :l.ConvertedContactId
      LIMIT 1
    ];
    if (cList.isEmpty() || String.isBlank(cList[0].Email)) {
      // ConvertedContactId is stale — find the real contact by lead email
      if (String.isNotBlank(l.Email)) {
        cList = [
          SELECT Id, FirstName, LastName, Email, AccountId
          FROM Contact
          WHERE Email = :l.Email
          ORDER BY CreatedDate DESC
          LIMIT 1
        ];
      }
      if (cList.isEmpty()) {
        throw new AuraHandledException(
          'Contact introuvable pour ce lead (ID: ' + l.ConvertedContactId + ')'
        );
      }
    }
    Contact c = cList[0];

    // 4. Community profile — query in priority order to avoid license limits
    List<Profile> profiles = [
      SELECT Id
      FROM Profile
      WHERE Name = 'Customer Community Plus Login User'
      LIMIT 1
    ];
    if (profiles.isEmpty())
      profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community Plus User'
        LIMIT 1
      ];
    if (profiles.isEmpty())
      profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community User'
        LIMIT 1
      ];
    if (profiles.isEmpty())
      profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community Login User'
        LIMIT 1
      ];
    if (profiles.isEmpty()) {
      throw new AuraHandledException(
        'Aucun profil communauté trouvé. Vérifiez la configuration Experience Cloud.'
      );
    }

    // 5. Alias + nickname
    String fn = c.FirstName != null ? c.FirstName : '';
    String ln = c.LastName != null ? c.LastName : 'User';
    String alias = (fn.left(1) + ln.left(7)).left(8);
    String rawNick = (fn + ln).replaceAll('[^a-zA-Z0-9]', '');
    String nick = String.isBlank(rawNick)
      ? 'user' + String.valueOf(Math.abs(c.Id.hashCode())).left(6)
      : rawNick.left(40);

    // 6. Build User
    User u = new User(
      ProfileId = profiles[0].Id,
      ContactId = c.Id,
      Username = c.Email,
      Email = c.Email,
      FirstName = fn,
      LastName = ln,
      Alias = alias,
      CommunityNickname = nick,
      TimeZoneSidKey = 'Europe/Paris',
      LocaleSidKey = 'fr_FR',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'fr',
      IsActive = true
    );

    // 7. Ensure account owner has a role (Salesforce portal prerequisite)
    if (c.AccountId != null) {
      Account acc = [
        SELECT OwnerId
        FROM Account
        WHERE Id = :c.AccountId
        LIMIT 1
      ];
      User owner = [
        SELECT Id, UserRoleId
        FROM User
        WHERE Id = :acc.OwnerId
        LIMIT 1
      ];
      if (owner.UserRoleId == null) {
        List<UserRole> roles = [SELECT Id FROM UserRole LIMIT 1];
        Id roleId;
        if (roles.isEmpty()) {
          UserRole r = new UserRole(
            Name = 'Nexus Admin',
            DeveloperName = 'Nexus_Admin'
          );
          insert r;
          roleId = r.Id;
        } else {
          roleId = roles[0].Id;
        }
        owner.UserRoleId = roleId;
        update owner;
      }
    }

    // 8. Insert portal user
    try {
      insert u;
    } catch (DmlException e) {
      String msg = e.getMessage();
      if (msg.contains('DUPLICATE_USERNAME')) {
        u.Username =
          c.Email +
          '.nx' +
          String.valueOf(Math.abs(Crypto.getRandomInteger()));
        try {
          insert u;
        } catch (DmlException e2) {
          throw new AuraHandledException(
            'Erreur création compte : ' + e2.getMessage()
          );
        }
      } else {
        throw new AuraHandledException('Erreur création compte : ' + msg);
      }
    }

    // 9 & 10. Send welcome email in a @future context — Salesforce restricts Messaging.sendEmail
    //         and System.resetPassword immediately after User DML in the same transaction.
    sendPortalUserEmailsAsync(
      u.Id,
      u.Username,
      c.Email,
      fn,
      c.LastName != null ? c.LastName : ''
    );

    return u.Username;
  }

  // ── Post-User-insert emails — must run in a separate transaction (@future) ──
  // Uses System.setPassword (reliable in all org types) to set a random token
  // as the user's initial password. The token is embedded in the setup URL so
  // the user can set their real password from the branded email link.
  // The token is NEVER shown in the email body — it travels only in the HTTPS URL.
  @future(callout=false)
  private static void sendPortalUserEmailsAsync(
    String userId,
    String username,
    String email,
    String firstName,
    String lastName
  ) {
    String siteUrl = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';

    // ── 1. Ensure IsActive = true ─────────────────────────────────────────
    // Manual User INSERT doesn't always fire the same automations as
    // Site.createExternalUser, so a trigger/flow can deactivate the user.
    try {
      User chk = [SELECT Id, IsActive FROM User WHERE Id = :userId LIMIT 1];
      System.debug('User IsActive: ' + chk.IsActive);
      if (!chk.IsActive) {
        update new User(Id = userId, IsActive = true);
        System.debug('Reactivated user ' + userId);
      }
    } catch (Exception e) {
      System.debug('IsActive-check FAILED: ' + e.getMessage());
    }

    // NOTE: NetworkMember records cannot be inserted via Apex DML :they are
    // created automatically by the platform when a portal User is committed.
    // If Site.login still returns "access disabled", the setFirstPassword method
    // in AuthController handles it via PATH B (System.setPassword fallback).

    String token = generateSetupToken();
    String setpwdUrl =
      siteUrl +
      '?mode=setpwd&t=' +
      EncodingUtil.urlEncode(token, 'UTF-8') +
      '&e=' +
      EncodingUtil.urlEncode(email, 'UTF-8');
    try {
      System.setPassword(userId, token);
      System.debug('setPassword OK for userId=' + userId + ' token=' + token);
    } catch (Exception e) {
      System.debug('setPassword FAILED: ' + e.getMessage());
      // Fall back to site home  user can use Forgot Password
      setpwdUrl = siteUrl;
    }
    try {
      sendPortalWelcomeEmail(email, firstName, lastName, setpwdUrl);
      System.debug('Portal welcome email sent OK to ' + email);
    } catch (Exception e) {
      System.debug('sendPortalWelcomeEmail FAILED: ' + e.getMessage());
    }
  }

  // ── Generates a random alphanumeric token used as the one-time initial password ──
  // Alphanumeric-only avoids URL-encoding edge cases and Salesforce password-policy
  // issues with special characters in System.setPassword contexts.
  // System.setPassword bypasses password-complexity rules, so no specials needed.
  private static String generateSetupToken() {
    String upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    String lower = 'abcdefghjkmnpqrstuvwxyz';
    String digits = '23456789';
    String all = upper + lower + digits;
    // Guarantee at least one of each category at the front, then pad randomly
    Integer ui = Math.mod(Math.abs(Crypto.getRandomInteger()), upper.length());
    Integer li = Math.mod(Math.abs(Crypto.getRandomInteger()), lower.length());
    Integer di = Math.mod(Math.abs(Crypto.getRandomInteger()), digits.length());
    String token =
      upper.substring(ui, ui + 1) +
      lower.substring(li, li + 1) +
      digits.substring(di, di + 1);
    for (Integer i = 0; i < 13; i++) {
      Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), all.length());
      token += all.substring(idx, idx + 1);
    }
    return token; // 16-char alphanumeric token
  }

  // ── Branded welcome email sent after portal user creation ─────────────────
  // setpwdUrl contains a one-time token in the query string so the user can
  // set their password without needing to know a temporary password.
  private static void sendPortalWelcomeEmail(
    String email,
    String firstName,
    String lastName,
    String setpwdUrl
  ) {
    String fullName = (firstName + ' ' + lastName).trim();

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ email });
    mail.setSubject('Bienvenue sur Nexus \u2014 Activez votre compte');
    mail.setHtmlBody(buildPortalWelcomeHtml(fullName, setpwdUrl));
    mail.setSaveAsActivity(false);
    mail.setSenderDisplayName('Nexus Platform');

    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
  }

  // ── Welcome email HTML ────────────────────────────────────────────────────
  // setpwdUrl contains a one-time token. The user clicks the button, the home
  // page opens with the "Set password" modal pre-loaded. No password appears in
  // this email — the token travels only in the HTTPS URL, never in the body.
  private static String buildPortalWelcomeHtml(
    String fullName,
    String setpwdUrl
  ) {
    // NOTE: No flex/grid — all layout uses <table> for Outlook/Gmail compatibility.
    // Button uses a solid background colour (#059669) so it stays visible when
    // email clients strip CSS gradients.
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">' +
      '<tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">' +
      // ── Top colour bar (solid fallback) ──
      '<tr><td height="5" style="background-color:#059669;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      // ── Dark header ──
      '<tr><td align="center" style="background-color:#0f172a;padding:40px 40px 32px;">' +
      // NEXUS logo badge
      '<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;"><tr>' +
      '<td align="center" style="background-color:#1a3a2a;border:1px solid #10b981;border-radius:10px;padding:10px 28px;">' +
      '<span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:5px;font-family:Arial,Helvetica,sans-serif;">NEXUS</span>' +
      '</td></tr></table>' +
      // sub-label
      '<div style="font-size:10px;color:#6ee7b7;letter-spacing:3px;font-weight:700;margin-bottom:20px;font-family:Arial,Helvetica,sans-serif;">INTELLIGENCE PLATFORM</div>' +
      // icon circle
      '<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;"><tr>' +
      '<td align="center" width="60" height="60" style="background-color:#059669;border-radius:30px;font-size:28px;color:#ffffff;line-height:60px;">&#128274;</td>' +
      '</tr></table>' +
      '<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f9fafb;font-family:Arial,Helvetica,sans-serif;">Bienvenue sur Nexus !</h1>' +
      '<p style="margin:0;font-size:14px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">Cher(e) <strong style="color:#6ee7b7;">' +
      fullName +
      '</strong>, votre compte est pr\u00eat \u00e0 \u00eatre activ\u00e9.</p>' +
      '</td></tr>' +
      // ── White body ──
      '<tr><td style="background-color:#ffffff;padding:36px 40px;">' +
      '<p style="color:#475569;line-height:1.75;font-size:14px;margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;">' +
      'Votre demande d\'acc\u00e8s \u00e0 la plateforme <strong style="color:#0f172a;">Nexus</strong> a \u00e9t\u00e9 valid\u00e9e. ' +
      'Pour activer votre compte, cliquez sur le bouton ci-dessous pour d\u00e9finir votre mot de passe.</p>' +
      // ── 3-step table (no flex — email-safe) ──
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">' +
      '<tr>' +
      // Step 1
      '<td width="33%" align="center" valign="top" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 8px;">' +
      '<div style="font-size:24px;margin-bottom:8px;">&#128231;</div>' +
      '<div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px;font-family:Arial,Helvetica,sans-serif;">\u00c9tape 1</div>' +
      '<div style="font-size:11px;color:#64748b;font-family:Arial,Helvetica,sans-serif;">Cliquez sur le bouton ci-dessous</div>' +
      '</td>' +
      // Spacer
      '<td width="2%"></td>' +
      // Step 2
      '<td width="33%" align="center" valign="top" style="background-color:#f0fdf4;border:2px solid #10b981;border-radius:10px;padding:16px 8px;">' +
      '<div style="font-size:24px;margin-bottom:8px;">&#128274;</div>' +
      '<div style="font-size:12px;font-weight:700;color:#065f46;margin-bottom:4px;font-family:Arial,Helvetica,sans-serif;">\u00c9tape 2</div>' +
      '<div style="font-size:11px;color:#047857;font-family:Arial,Helvetica,sans-serif;">D\u00e9finissez votre mot de passe</div>' +
      '</td>' +
      // Spacer
      '<td width="2%"></td>' +
      // Step 3
      '<td width="33%" align="center" valign="top" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 8px;">' +
      '<div style="font-size:24px;margin-bottom:8px;">&#10003;</div>' +
      '<div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px;font-family:Arial,Helvetica,sans-serif;">\u00c9tape 3</div>' +
      '<div style="font-size:11px;color:#64748b;font-family:Arial,Helvetica,sans-serif;">Acc\u00e9dez \u00e0 votre espace</div>' +
      '</td>' +
      '</tr></table>' +
      // ── CTA button — solid bg so it shows in ALL email clients ──
      '<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;"><tr>' +
      '<td align="center" style="background-color:#059669;border-radius:12px;padding:0;">' +
      '<a href="' +
      setpwdUrl +
      '" style="display:inline-block;background-color:#059669;color:#ffffff;' +
      'text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:12px;' +
      'font-family:Arial,Helvetica,sans-serif;letter-spacing:0.3px;">' +
      '&#128274; D\u00e9finir mon mot de passe &rarr;' +
      '</a>' +
      '</td></tr></table>' +
      // ── Security note ──
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>' +
      '<td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">' +
      '<p style="margin:0;color:#166534;font-size:12px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">' +
      '<strong>&#128272; Lien s\u00e9curis\u00e9 \u00e0 usage unique.</strong> Ce lien est valable pour une seule utilisation. ' +
      'S\'il a expir\u00e9, utilisez la fonction <em>&laquo;&nbsp;Mot de passe oubli\u00e9&nbsp;&raquo;</em> sur la page de connexion.' +
      '</p>' +
      '</td></tr></table>' +
      '<p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;border-top:1px solid #e2e8f0;padding-top:20px;font-family:Arial,Helvetica,sans-serif;">' +
      'Des questions ? Notre \u00e9quipe support est disponible pour vous aider.</p>' +
      '</td></tr>' +
      // ── Footer ──
      '<tr><td align="center" style="background-color:#0a0d14;padding:20px 40px;border-top:1px solid #1f2937;">' +
      '<div style="font-size:14px;font-weight:900;color:#10b981;letter-spacing:4px;margin-bottom:6px;font-family:Arial,Helvetica,sans-serif;">NEXUS</div>' +
      '<div style="font-size:11px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Intelligence Platform &bull; &copy; 2026</div>' +
      '<div style="margin-top:8px;font-size:11px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">Ne pas r\u00e9pondre \u00e0 cet email automatique</div>' +
      '</td></tr>' +
      '</table></td></tr></table>' +
      '</body></html>';
  }

  private static String fmtAmount(Decimal v) {
    if (v == null || v == 0)
      return '0 €';
    if (v >= 1000000)
      return String.valueOf((v / 1000000).setScale(1)) + ' M€';
    if (v >= 1000)
      return String.valueOf((v / 1000).setScale(1)) + ' K€';
    return String.valueOf(v.setScale(0)) + ' €';
  }

  private static String rowHtml(String label, String val) {
    return '<tr>' +
      '<td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">' +
      label +
      '</td>' +
      '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' +
      (String.isNotBlank(val) ? val : '\u2014') +
      '</td>' +
      '</tr>';
  }
  private static String statusGroup(String status) {
    if (status == null)
      return 'new';
    String s = status.toLowerCase();
    if (s.contains('not contacted') || s.contains('open'))
      return 'new';
    if (s.contains('qualified'))
      return 'qualified';
    return 'progress';
  }

  private static String initials(String first, String last) {
    String a = String.isNotBlank(first)
      ? first.substring(0, 1).toUpperCase()
      : '';
    String b = String.isNotBlank(last)
      ? last.substring(0, 1).toUpperCase()
      : '';
    return (a + b).trim().left(2);
  }

  // ── Send rejection email to lead ──────────────────────────────────────────
  @AuraEnabled
  public static void sendLeadRejectionEmail(String leadId) {
    Lead l = [
      SELECT Id, FirstName, LastName, Email, Company, IsConverted
      FROM Lead
      WHERE Id = :leadId
      LIMIT 1
    ];
    if (l.Email == null)
      throw new AuraHandledException('Ce lead n\'a pas d\'adresse email.');

    String firstName = l.FirstName != null ? l.FirstName : 'Cher client';
    String company = l.Company != null ? l.Company : '';

    String html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">' +
      '<tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(15,23,42,0.08);">' +
      '<tr><td style="height:4px;background:linear-gradient(90deg,#dc2626,#f59e0b);"></td></tr>' +
      // ── Header (dark — unchanged)
      '<tr><td style="background:linear-gradient(160deg,#0f172a 0%,#1e293b 100%);padding:52px 48px 44px;text-align:center;">' +
      '<div style="display:inline-block;background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.3);border-radius:12px;padding:10px 24px;margin-bottom:24px;">' +
      '<span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:4px;">NEXUS</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#f87171;letter-spacing:3px;font-weight:500;margin-bottom:28px;">INTELLIGENCE PLATFORM</div>' +
      '<div style="width:64px;height:64px;background:linear-gradient(135deg,#7f1d1d,#dc2626);border-radius:50%;margin:0 auto 20px;font-size:28px;line-height:64px;text-align:center;color:#fff;">&#10005;</div>' +
      '<h1 style="margin:0;font-size:26px;font-weight:700;color:#f9fafb;">Demande non retenue</h1>' +
      '<p style="margin:12px 0 0;font-size:15px;color:#94a3b8;">Bonjour <strong style="color:#fca5a5;">' +
      firstName +
      '</strong>,</p>' +
      '</td></tr>' +
      // ── Body (light)
      '<tr><td style="background:#ffffff;padding:44px 48px;">' +
      '<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.75;">' +
      'Nous vous remercions de l\'int&eacute;r&ecirc;t que vous portez &agrave; la plateforme <strong style="color:#0f172a;">Nexus</strong>. ' +
      'Apr&egrave;s examen attentif de votre dossier, nous ne sommes pas en mesure de donner une suite favorable &agrave; votre demande d\'acc&egrave;s &agrave; ce stade.' +
      '</p>' +
      '<div style="background:#fff5f5;border:1px solid #fecaca;border-radius:16px;padding:24px 28px;margin-bottom:32px;">' +
      '<div style="font-size:10px;color:#dc2626;letter-spacing:3px;font-weight:700;margin-bottom:12px;">&#9888; STATUT DE VOTRE DEMANDE</div>' +
      '<div style="font-size:15px;color:#dc2626;font-weight:600;">Demande refus&eacute;e</div>' +
      '<div style="margin-top:8px;font-size:13px;color:#6b7280;">Cette d&eacute;cision a &eacute;t&eacute; prise par notre &eacute;quipe d\'analyse suite &agrave; l\'&eacute;valuation de votre profil.</div>' +
      '</div>' +
      '<p style="margin:0 0 32px;font-size:14px;color:#475569;line-height:1.75;border-left:3px solid #fca5a5;padding-left:16px;">' +
      'Si vous estimez que cette d&eacute;cision est incorrecte ou souhaitez obtenir des pr&eacute;cisions, ' +
      'n\'h&eacute;sitez pas &agrave; contacter directement notre &eacute;quipe. Nous restons disponibles pour &eacute;tudier votre situation.' +
      '</p>' +
      '</td></tr>' +
      // ── Footer (dark — unchanged)
      '<tr><td style="background:#0a0d14;padding:28px 48px;text-align:center;border-top:1px solid #1f2937;">' +
      '<div style="font-size:13px;font-weight:800;color:#f87171;letter-spacing:3px;margin-bottom:6px;">NEXUS</div>' +
      (String.isNotBlank(company)
        ? '<div style="font-size:12px;color:#4b5563;">' +
          company +
          ' &middot; Plateforme B2B Intelligence</div>'
        : '<div style="font-size:12px;color:#4b5563;">Plateforme B2B Intelligence</div>') +
      '<div style="margin-top:16px;font-size:11px;color:#374151;">Ce message est confidentiel et destin&eacute; uniquement &agrave; son destinataire.</div>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setTargetObjectId(l.Id);
    mail.setSubject('Nexus — Décision concernant votre demande d\'accès');
    mail.setHtmlBody(html);
    mail.setSaveAsActivity(!l.IsConverted);
    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      throw new AuraHandledException('Erreur envoi email : ' + e.getMessage());
    }
  }

  // ── Send approval-notification email to approved lead ────────────────────
  // Note: at this stage the portal User does not exist yet. No password or
  // credentials are included. The password-setup link is sent separately
  // by sendPortalUserEmailsAsync once the User record is created.
  @AuraEnabled
  public static void sendLeadWelcomeEmail(String leadId) {
    Lead l = [
      SELECT Id, FirstName, LastName, Email, Company, IsConverted
      FROM Lead
      WHERE Id = :leadId
      LIMIT 1
    ];
    if (l.Email == null)
      throw new AuraHandledException('Ce lead n\'a pas d\'adresse email.');

    String firstName = l.FirstName != null ? l.FirstName : 'Cher client';
    String company = l.Company != null ? l.Company : '';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setTargetObjectId(l.Id);
    mail.setSubject(
      'Nexus \u2014 Votre acc\u00e8s a \u00e9t\u00e9 approuv\u00e9'
    );
    mail.setHtmlBody(buildApprovalNotificationHtml(firstName, company));
    mail.setSaveAsActivity(!l.IsConverted);
    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      throw new AuraHandledException('Erreur envoi email : ' + e.getMessage());
    }
  }

  // ── Approval-notification email (no password — account setup comes next) ──
  private static String buildApprovalNotificationHtml(
    String firstName,
    String company
  ) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">' +
      '<tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(15,23,42,0.08);">' +
      '<tr><td style="height:4px;background:linear-gradient(90deg,#1d4ed8,#7c3aed,#0ea5e9);"></td></tr>' +
      '<tr><td style="background:linear-gradient(160deg,#0f172a 0%,#1e293b 100%);padding:52px 48px 44px;text-align:center;">' +
      '<div style="display:inline-block;background:rgba(29,78,216,0.15);border:1px solid rgba(29,78,216,0.3);border-radius:12px;padding:10px 24px;margin-bottom:24px;">' +
      '<span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:4px;">NEXUS</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#60a5fa;letter-spacing:3px;font-weight:500;margin-bottom:28px;">INTELLIGENCE PLATFORM</div>' +
      '<div style="width:64px;height:64px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:50%;margin:0 auto 20px;font-size:28px;line-height:64px;text-align:center;color:#fff;">&#10003;</div>' +
      '<h1 style="margin:0;font-size:26px;font-weight:700;color:#f9fafb;">Acc\u00e8s approuv\u00e9 !</h1>' +
      '<p style="margin:12px 0 0;font-size:15px;color:#94a3b8;">Bienvenue sur la plateforme Nexus, <strong style="color:#60a5fa;">' +
      firstName +
      '</strong></p>' +
      '</td></tr>' +
      '<tr><td style="background:#ffffff;padding:44px 48px;">' +
      '<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.75;">' +
      'Votre demande d\'acc\u00e8s \u00e0 la plateforme <strong style="color:#0f172a;">Nexus</strong> a \u00e9t\u00e9 examin\u00e9e et <strong style="color:#16a34a;">approuv\u00e9e</strong>.' +
      '</p>' +
      '<div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:32px;">' +
      '<p style="margin:0;font-size:14px;color:#1e40af;line-height:1.7;">' +
      '<strong>Prochaine \u00e9tape :</strong> Vous recevrez dans quelques instants un second email contenant un lien s\u00e9curis\u00e9 pour d\u00e9finir votre mot de passe et acc\u00e9der \u00e0 votre espace.</p>' +
      '</div>' +
      '<div style="border-top:1px solid #e2e8f0;padding-top:20px;">' +
      '<p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">Pour toute question, contactez directement votre responsable de compte.</p>' +
      '</div>' +
      '</td></tr>' +
      '<tr><td style="background:#0a0d14;padding:28px 48px;text-align:center;border-top:1px solid #1f2937;">' +
      '<div style="font-size:13px;font-weight:800;color:#3b82f6;letter-spacing:3px;margin-bottom:6px;">NEXUS</div>' +
      (String.isNotBlank(company)
        ? '<div style="font-size:12px;color:#4b5563;">' +
          company +
          ' &middot; Plateforme B2B Intelligence</div>'
        : '<div style="font-size:12px;color:#4b5563;">Plateforme B2B Intelligence</div>') +
      '<div style="margin-top:16px;font-size:11px;color:#374151;">Ce message est confidentiel et destin\u00e9 uniquement \u00e0 son destinataire.</div>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>';
  }
}
