public without sharing class LeadManagementController {

    // ── Lead detail returned to LWC ───────────────────────────────────────────
    public class LeadDetail {
        @AuraEnabled public Id      leadId;
        @AuraEnabled public String  salutation;
        @AuraEnabled public String  firstName;
        @AuraEnabled public String  lastName;
        @AuraEnabled public String  name;
        @AuraEnabled public String  company;
        @AuraEnabled public String  email;
        @AuraEnabled public String  phone;
        @AuraEnabled public String  status;
        @AuraEnabled public String  country;
        @AuraEnabled public String  city;
        @AuraEnabled public String  postalCode;
        @AuraEnabled public String  state;
        @AuraEnabled public String  industry;
        @AuraEnabled public String  description;
        @AuraEnabled public Integer score;
        @AuraEnabled public String  initials;
        @AuraEnabled public String  createdDateStr;
        @AuraEnabled public Long    createdTimestamp;
        @AuraEnabled public String  leadSource;
        @AuraEnabled public String  statusGroup; // 'new' | 'progress' | 'qualified'
        @AuraEnabled public Integer aiScore;
        @AuraEnabled public String  aiReason;
        @AuraEnabled public String  intent;
        @AuraEnabled public String  adminDecision;
        @AuraEnabled public String  website;
    }

    // ── Contact detail returned to LWC ──────────────────────────────────────────
    public class ContactDetail {
        @AuraEnabled public Id     contactId;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String fullName;
        @AuraEnabled public String account;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
        @AuraEnabled public String title;
        @AuraEnabled public String department;
        @AuraEnabled public String initials;
    }

    // ── Case detail returned to LWC ──────────────────────────────────────────
    public class CaseDetail {
        @AuraEnabled public Id      caseId;
        @AuraEnabled public String  caseNumber;
        @AuraEnabled public String  subject;
        @AuraEnabled public String  account;
        @AuraEnabled public String  contact;
        @AuraEnabled public String  status;
        @AuraEnabled public String  priority;
        @AuraEnabled public String  caseDate;
        @AuraEnabled public String  caseType;
        @AuraEnabled public Boolean needsMeeting;
    }

    @AuraEnabled(cacheable=true)
    public static List<CaseDetail> getCases() {
        List<CaseDetail> result = new List<CaseDetail>();
        for (Case c : [
            SELECT Id, CaseNumber, Subject, Account.Name, Contact.Name,
                   Status, Priority, CreatedDate, Type
            FROM   Case
            ORDER BY CreatedDate DESC
            LIMIT  50
        ]) {
            CaseDetail d   = new CaseDetail();
            d.caseId       = c.Id;
            d.caseNumber   = c.CaseNumber;
            d.subject      = c.Subject;
            d.account      = c.Account != null ? c.Account.Name : '';
            d.contact      = c.Contact != null ? c.Contact.Name : '';
            d.status       = c.Status;
            d.priority     = c.Priority;
            d.caseDate     = c.CreatedDate != null
                             ? String.valueOf(c.CreatedDate.date()) : '';
            d.caseType     = c.Type;
            d.needsMeeting = c.Priority == 'High';
            result.add(d);
        }
        return result;
    }

    // ── Opportunity detail returned to LWC ───────────────────────────────────
    public class OpportunityDetail {
        @AuraEnabled public Id      oppId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  account;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public String  formattedAmount;
        @AuraEnabled public String  closeDate;
        @AuraEnabled public String  stage;
    }

    @AuraEnabled(cacheable=true)
    public static List<OpportunityDetail> getOpportunities() {
        List<OpportunityDetail> result = new List<OpportunityDetail>();
        for (Opportunity o : [
            SELECT Id, Name, Account.Name, Amount, CloseDate, StageName
            FROM   Opportunity
            WHERE  StageName IN ('Prospecting','Qualification','Negotiation','Closed Won')
            ORDER BY CloseDate ASC
            LIMIT  100
        ]) {
            OpportunityDetail d = new OpportunityDetail();
            d.oppId           = o.Id;
            d.name            = o.Name;
            d.account         = o.Account != null ? o.Account.Name : '';
            d.amount          = o.Amount;
            d.formattedAmount = fmtAmount(o.Amount);
            d.closeDate       = o.CloseDate != null ? String.valueOf(o.CloseDate) : '';
            d.stage           = o.StageName;
            result.add(d);
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static List<ContactDetail> getContacts() {
        List<ContactDetail> result = new List<ContactDetail>();
        for (Contact c : [
            SELECT Id, FirstName, LastName, Account.Name,
                   Email, Phone, Title, Department
            FROM   Contact
            ORDER BY CreatedDate DESC
            LIMIT  50
        ]) {
            ContactDetail d = new ContactDetail();
            d.contactId  = c.Id;
            d.firstName  = c.FirstName;
            d.lastName   = c.LastName;
            d.fullName   = ((c.FirstName != null ? c.FirstName + ' ' : '')
                           + (c.LastName  != null ? c.LastName  : '')).trim();
            d.account    = c.Account != null ? c.Account.Name : '';
            d.email      = c.Email;
            d.phone      = c.Phone;
            d.title      = c.Title;
            d.department = c.Department;
            d.initials   = initials(c.FirstName, c.LastName);
            result.add(d);
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static List<LeadDetail> getLeadsToConvert() {
        List<LeadDetail> result = new List<LeadDetail>();
        for (Lead l : [
            SELECT Id, Salutation, FirstName, LastName, Email, Phone,
                   Company, Industry, Status, Country, City, PostalCode,
                   State, Lead_Score__c, Description, CreatedDate, LeadSource,
                   AIScore__c, AIReason__c, Intent__c, AdminDecision__c, Website
            FROM   Lead
            WHERE  IsConverted = false
            ORDER BY CreatedDate DESC
            LIMIT  50
        ]) {
            LeadDetail d    = new LeadDetail();
            d.leadId        = l.Id;
            d.salutation    = l.Salutation;
            d.firstName     = l.FirstName;
            d.lastName      = l.LastName;
            d.name          = ((l.FirstName != null ? l.FirstName + ' ' : '')
                              + (l.LastName  != null ? l.LastName  : '')).trim();
            d.company       = l.Company;
            d.email         = l.Email;
            d.phone         = l.Phone;
            d.status        = l.Status;
            d.country       = l.Country;
            d.city          = l.City;
            d.postalCode    = l.PostalCode;
            d.state         = l.State;
            d.industry      = l.Industry;
            d.description   = l.Description;
            d.score         = l.AIScore__c != null ? l.AIScore__c.intValue() : (l.Lead_Score__c != null ? Integer.valueOf(l.Lead_Score__c) : 0);
            d.aiScore       = l.AIScore__c != null ? l.AIScore__c.intValue() : null;
            d.aiReason      = l.AIReason__c;
            d.intent        = l.Intent__c;
            d.adminDecision = l.AdminDecision__c;
            d.website       = l.Website;
            d.initials      = initials(l.FirstName, l.LastName);
            d.createdDateStr   = l.CreatedDate != null ? l.CreatedDate.format() : '';
            d.createdTimestamp = l.CreatedDate != null ? l.CreatedDate.getTime() : 0;
            d.leadSource    = l.LeadSource;
            d.statusGroup   = statusGroup(l.Status);
            result.add(d);
        }
        return result;
    }

    // ── Convert lead + update opp + notify admin ──────────────────────────────
    @AuraEnabled
    public static Map<String, Id> convertLeadFull(
        Id      leadId,
        String  opportunityName,
        Decimal amount,
        String  closeDateStr,
        String  stage
    ) {
        LeadStatus convStatus;
        try {
            convStatus = [SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1];
        } catch (Exception e) {
            throw new AuraHandledException('Aucun statut "Converti" trouvé.');
        }

        Database.LeadConvert lc = new Database.LeadConvert();
        lc.setLeadId(leadId);
        lc.setConvertedStatus(convStatus.MasterLabel);
        lc.setDoNotCreateOpportunity(String.isBlank(opportunityName));
        if (String.isNotBlank(opportunityName)) lc.setOpportunityName(opportunityName);

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
                List<Contact> cx = [SELECT Id, AccountId FROM Contact WHERE Email = :ld.Email LIMIT 1];
                if (!cx.isEmpty()) {
                    lc.setContactId(cx[0].Id);
                    if (cx[0].AccountId != null) { lc.setAccountId(cx[0].AccountId); accountLinked = true; }
                }
            }
            if (!accountLinked && String.isNotBlank(ld.Company)) {
                List<Account> ax = [SELECT Id FROM Account WHERE Name = :ld.Company LIMIT 1];
                if (!ax.isEmpty()) lc.setAccountId(ax[0].Id);
            }
            try {
                res = Database.convertLead(lc);
            } catch (Exception e2) {
                throw new AuraHandledException('Conversion échouée : ' + e2.getMessage());
            }
        }
        if (!res.isSuccess()) {
            String msg = res.getErrors().isEmpty() ? 'Erreur inconnue' : res.getErrors()[0].getMessage();
            throw new AuraHandledException('Conversion échouée : ' + msg);
        }

        if (res.getOpportunityId() != null) {
            Date cd;
            try {
                cd = String.isNotBlank(closeDateStr) ? Date.valueOf(closeDateStr) : Date.today().addDays(30);
            } catch (Exception ignored) {
                cd = Date.today().addDays(30);
            }
            try {
                update new Opportunity(
                    Id        = res.getOpportunityId(),
                    Amount    = amount != null ? amount : 0,
                    StageName = String.isNotBlank(stage) ? stage : 'Qualification',
                    CloseDate = cd
                );
            } catch (DmlException de) {
                throw new AuraHandledException('Opportunité créée mais mise à jour échouée : ' + de.getMessage());
            }
        }

        return new Map<String, Id>{
            'contactId'     => res.getContactId(),
            'accountId'     => res.getAccountId(),
            'opportunityId' => res.getOpportunityId()
        };
    }

    // ── Admin approve / reject a B2B lead ────────────────────────────────────
    @AuraEnabled
    public static void approveRejectLead(String leadId, String decision) {
        try {
            Lead l = [SELECT Id FROM Lead WHERE Id = :leadId LIMIT 1];
            l.AdminDecision__c = decision;
            l.Status = (decision == 'Approved') ? 'Working' : 'Closed - Not Converted';
            update l;
        } catch (Exception e) {
            throw new AuraHandledException('Erreur lors de la décision : ' + e.getMessage());
        }
    }

    // ── Called by LeadController after insert (public, sync dispatcher) ───────
    // Delegates to @future so it runs AFTER the guest transaction commits
    public static void notifyAdminNewLead(Lead l) {
        notifyAdminNewLeadAsync(
            l.Id,
            l.FirstName   != null ? l.FirstName   : '',
            l.LastName    != null ? l.LastName    : '',
            l.Company     != null ? l.Company     : '',
            l.Email       != null ? l.Email       : '',
            l.Phone       != null ? l.Phone       : '',
            l.City        != null ? l.City        : '',
            l.PostalCode  != null ? l.PostalCode  : '',
            l.Country     != null ? l.Country     : '',
            l.Industry    != null ? l.Industry    : ''
        );
    }

    // ── @future: new-lead admin notification ──────────────────────────────────
    @future
    private static void notifyAdminNewLeadAsync(
        Id     leadId,
        String firstName,  String lastName,
        String company,    String emailAddr,
        String phone,      String city,
        String postalCode, String country, String industry
    ) {
        List<User> admins = [
            SELECT Email, FirstName FROM User
            WHERE Profile.Name = 'System Administrator' AND IsActive = true LIMIT 1
        ];
        if (admins.isEmpty()) return;

        String loc = '';
        if (String.isNotBlank(city))       loc += city;
        if (String.isNotBlank(postalCode)) loc += (loc.length() > 0 ? ' '  : '') + postalCode;
        if (String.isNotBlank(country))    loc += (loc.length() > 0 ? ', ' : '') + country;

        String fullName = (firstName + ' ' + lastName).trim();
        String html = buildNewLeadHtmlFromParams(
            admins[0].FirstName, firstName, lastName, company,
            emailAddr, phone, loc, industry, String.valueOf(leadId)
        );

        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ admins[0].Email });
        mail.setSubject('🔔 TALCORE — Nouveau Lead : ' + fullName
                        + (String.isNotBlank(company) ? ' (' + company + ')' : ''));
        mail.setHtmlBody(html);
        mail.setSaveAsActivity(false);
        try { Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail }); }
        catch (Exception e) { System.debug('Admin new-lead notif: ' + e.getMessage()); }
    }

    // ── @future: admin conversion notification ────────────────────────────────
    @future
    private static void notifyAdminConversionAsync(
        String firstName, String lastName, String company, String emailAddr,
        String oppId, String contactId
    ) {
        List<User> admins = [
            SELECT Email, FirstName FROM User
            WHERE Profile.Name = 'System Administrator' AND IsActive = true LIMIT 1
        ];
        if (admins.isEmpty()) return;

        String oppLink = String.isNotBlank(oppId)
            ? '/lightning/r/Opportunity/' + oppId + '/view' : '';
        String conLink = String.isNotBlank(contactId)
            ? '/lightning/r/Contact/' + contactId + '/view' : '';

        String html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
            + '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">'
            + '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">'

            // ── Dark header top row ──
            + '<div style="background:#0f172a;padding:28px 36px 0;">'
            + '<table style="width:100%;border-collapse:collapse;"><tr>'
            + '<td><span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.14em;">TALCORE</span>'
            + '<br><span style="color:#64748b;font-size:11px;letter-spacing:0.05em;">IT &amp; Enterprise Solutions</span></td>'
            + '<td style="text-align:right;vertical-align:middle;">'
            + '<span style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);'
            + 'color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">'
            + '&#x2705; LEAD CONVERTI</span>'
            + '</td></tr></table>'
            + '<div style="margin-top:22px;height:2px;background:#10b981;"></div>'
            + '</div>'

            // ── Dark header title ──
            + '<div style="background:#0f172a;padding:18px 36px 30px;">'
            + '<div style="font-size:20px;font-weight:700;color:#f1f5f9;">Conversion r\u00e9alis\u00e9e avec succ\u00e8s</div>'
            + '<div style="color:#94a3b8;font-size:13px;margin-top:5px;">Le lead a \u00e9t\u00e9 converti en Client et Opportunit\u00e9</div>'
            + '</div>'

            // ── White body ──
            + '<div style="background:#fff;padding:36px;">'
            + '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 24px;">'
            + 'Le prospect suivant vient d\'\u00eatre converti avec succ\u00e8s dans le CRM TALCORE :</p>'

            // Client info card (green accent)
            + '<div style="background:#f8fafc;border-left:4px solid #10b981;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 24px;">'
            + '<table style="width:100%;border-collapse:collapse;">'
            + '<tr><td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">CLIENT</td>'
            + '<td style="padding:8px 0;color:#0f172a;font-weight:700;font-size:14px;">' + firstName + ' ' + lastName + '</td></tr>'
            + '<tr><td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">ENTREPRISE</td>'
            + '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' + (String.isNotBlank(company) ? company : '\u2014') + '</td></tr>'
            + '<tr><td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">EMAIL</td>'
            + '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' + (String.isNotBlank(emailAddr) ? emailAddr : '\u2014') + '</td></tr>'
            + '</table></div>'

            + '<p style="color:#475569;font-size:14px;margin:0 0 24px;line-height:1.7;">'
            + 'Un email de bienvenue personnalis\u00e9 a \u00e9t\u00e9 envoy\u00e9 automatiquement au client.</p>'

            // CTA buttons
            + '<div style="text-align:center;">'
            + (String.isNotBlank(oppLink) ? '<a href="' + oppLink + '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;margin-right:12px;">Voir Opportunit\u00e9 &rarr;</a>' : '')
            + (String.isNotBlank(conLink) ? '<a href="' + conLink + '" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">Voir Contact &rarr;</a>' : '')
            + '</div></div>'

            // ── Dark footer ──
            + '<div style="background:#1e293b;padding:18px 36px;text-align:center;">'
            + '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 TALCORE &bull; IT &amp; Enterprise Solutions</p>'
            + '<p style="color:#475569;font-size:11px;margin:0;">Notification CRM automatique &mdash; Ne pas r\u00e9pondre \u00e0 cet email</p>'
            + '</div>'
            + '</div></body></html>';

        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ admins[0].Email });
        mail.setSubject('✅ TALCORE — Lead Converti : ' + firstName + ' ' + lastName);
        mail.setHtmlBody(html);
        mail.setSaveAsActivity(false);
        try { Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail }); }
        catch (Exception e) { System.debug('Admin conv notif: ' + e.getMessage()); }
    }

    // ── HTML builder (primitive params, safe for @future) ─────────────────────
    private static String buildNewLeadHtmlFromParams(
        String adminFirst, String firstName, String lastName,
        String company,    String emailAddr, String phone,
        String loc,        String industry,  String leadId
    ) {
        String fullName   = (firstName + ' ' + lastName).trim();
        String adminGreet = String.isNotBlank(adminFirst) ? adminFirst : 'Administrateur';
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
            + '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">'
            + '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">'

            // ── Dark header top row ──
            + '<div style="background:#0f172a;padding:28px 36px 0;">'
            + '<table style="width:100%;border-collapse:collapse;"><tr>'
            + '<td><span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.14em;">TALCORE</span>'
            + '<br><span style="color:#64748b;font-size:11px;letter-spacing:0.05em;">IT &amp; Enterprise Solutions</span></td>'
            + '<td style="text-align:right;vertical-align:middle;">'
            + '<span style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);'
            + 'color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">'
            + '&#x1F514; NOUVEAU LEAD</span>'
            + '</td></tr></table>'
            + '<div style="margin-top:22px;height:2px;background:#6366f1;"></div>'
            + '</div>'

            // ── Dark header title ──
            + '<div style="background:#0f172a;padding:18px 36px 30px;">'
            + '<div style="font-size:20px;font-weight:700;color:#f1f5f9;">Un nouveau prospect vous attend</div>'
            + '<div style="color:#94a3b8;font-size:13px;margin-top:5px;">Soumis via le portail client TALCORE</div>'
            + '</div>'

            // ── White body ──
            + '<div style="background:#fff;padding:36px;">'
            + '<p style="font-size:15px;color:#0f172a;margin:0 0 10px;">Bonjour ' + adminGreet + ',</p>'
            + '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 24px;">'
            + 'Un nouveau prospect vient de soumettre sa demande sur le portail TALCORE. Voici les informations :</p>'

            // Info card
            + '<div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 28px;">'
            + '<table style="width:100%;border-collapse:collapse;">'
            + rowHtml('Nom',           fullName)
            + rowHtml('Entreprise',    company)
            + rowHtml('Email',         emailAddr)
            + rowHtml('T\u00e9l\u00e9phone', phone)
            + rowHtml('Localisation',  loc)
            + rowHtml('Industrie',     industry)
            + '</table></div>'

            + '<div style="border-top:1px solid #e2e8f0;margin:0 0 28px;"></div>'

            // CTA button
            + '<div style="text-align:center;">'
            + '<a href="/lightning/r/Lead/' + leadId + '/view" '
            + 'style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;'
            + 'padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">'
            + 'Voir &amp; Convertir ce Lead &rarr;</a>'
            + '</div></div>'

            // ── Dark footer ──
            + '<div style="background:#1e293b;padding:18px 36px;text-align:center;">'
            + '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 TALCORE &bull; IT &amp; Enterprise Solutions</p>'
            + '<p style="color:#475569;font-size:11px;margin:0;">Notification CRM automatique &mdash; Ne pas r\u00e9pondre \u00e0 cet email</p>'
            + '</div>'
            + '</div></body></html>';
    }

    // ── Create Experience Cloud portal user for a converted Contact ──────────
    @AuraEnabled
    public static String createPortalUserForContact(Id contactId) {
        // Load contact details
        Contact c;
        try {
            c = [SELECT Id, FirstName, LastName, Email, Salutation, AccountId
                 FROM Contact WHERE Id = :contactId LIMIT 1];
        } catch (Exception e) {
            throw new AuraHandledException('Contact introuvable : ' + e.getMessage());
        }

        if (String.isBlank(c.Email)) {
            throw new AuraHandledException('Ce contact n\'a pas d\'adresse email. Veuillez en ajouter une avant de créer le compte portail.');
        }

        // Return silently if an active portal user already exists for this contact
        List<User> existing = [
            SELECT Id, Username FROM User
            WHERE ContactId = :contactId AND IsActive = true LIMIT 1
        ];
        if (!existing.isEmpty()) {
            return existing[0].Username;
        }

        // Find the Community profile (try common names)
        List<Profile> profiles = [
            SELECT Id FROM Profile
            WHERE Name IN (
                'Customer Community Plus Login User',
                'Customer Community Plus User',
                'Customer Community User',
                'Customer Community Login User'
            )
            LIMIT 1
        ];
        if (profiles.isEmpty()) {
            throw new AuraHandledException(
                'Aucun profil communauté trouvé. Veuillez vérifier la configuration Experience Cloud.'
            );
        }

        // Build alias (max 8 chars) and nickname
        String fn    = c.FirstName != null ? c.FirstName : '';
        String ln    = c.LastName  != null ? c.LastName  : 'User';
        String alias = (fn.left(1) + ln.left(7)).left(8);
        String rawNick = (fn + ln).replaceAll('[^a-zA-Z0-9]', '');
        String nick  = String.isBlank(rawNick) ? 'user' + String.valueOf(Math.abs(contactId.hashCode())).left(6) : rawNick.left(40);

        User u = new User(
            ProfileId          = profiles[0].Id,
            ContactId          = contactId,
            // AccountId is set automatically by SF when ContactId is populated — do NOT set it explicitly
            Username           = c.Email,      // email = username (standard for Experience Cloud)
            Email              = c.Email,
            FirstName          = fn,
            LastName           = ln,
            Alias              = alias,
            CommunityNickname  = nick,
            TimeZoneSidKey     = 'Europe/London',
            LocaleSidKey       = 'en_GB',
            EmailEncodingKey   = 'UTF-8',
            LanguageLocaleKey  = 'en_US',
            IsActive           = true
        );

        // Salesforce requires the Account owner to have a Role before a portal user can be inserted.
        // Auto-assign one so the admin never has to do this manually.
        if (c.AccountId != null) {
            Account acc = [SELECT OwnerId FROM Account WHERE Id = :c.AccountId LIMIT 1];
            User accountOwner = [SELECT Id, UserRoleId FROM User WHERE Id = :acc.OwnerId LIMIT 1];
            if (accountOwner.UserRoleId == null) {
                List<UserRole> roles = [SELECT Id FROM UserRole LIMIT 1];
                Id roleId;
                if (roles.isEmpty()) {
                    UserRole defaultRole = new UserRole(
                        Name          = 'TALCORE Admin',
                        DeveloperName = 'TALCORE_Admin'
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
                u.Username = c.Email + '.talcore';
                try {
                    insert u;
                } catch (DmlException e2) {
                    throw new AuraHandledException('Erreur lors de la création du compte : ' + e2.getMessage());
                }
            } else {
                throw new AuraHandledException('Erreur lors de la création du compte : ' + msg);
            }
        }

        // Send Salesforce native set-password email — contains a direct token link
        // so the customer can set their password in one click (no ForgotPassword roundabout)
        try { System.resetPassword(u.Id, true); } catch (Exception e) { System.debug('resetPassword: ' + e.getMessage()); }

        // Also send our branded welcome email (informational: confirms account + login URL)
        sendPortalWelcomeEmail(c.Email, fn, ln, c.Salutation);

        return u.Username;
    }

    // ── Branded welcome email sent after portal user creation ─────────────────
    private static void sendPortalWelcomeEmail(
        String email, String firstName, String lastName, String salutation
    ) {
        try {
            String loginUrl = 'https://orgfarm-36e06c1f3e-dev-ed.develop.my.site.com/shop/s/login';
            String pwdUrl   = loginUrl.replace('/login', '/ForgotPassword');
            String greeting = (salutation == 'Mr.') ? 'Cher' : 'Ch\u00e8re';
            String fullName = (firstName + ' ' + lastName).trim();

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new List<String>{ email });
            mail.setSubject('Bienvenue sur TALCORE \u2014 Votre espace est pr\u00eat !');
            mail.setHtmlBody(buildPortalWelcomeHtml(greeting, fullName, email, loginUrl, pwdUrl));
            mail.setSaveAsActivity(false);
            Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
        } catch (Exception e) {
            System.debug('sendPortalWelcomeEmail: ' + e.getMessage());
        }
    }

    // ── Welcome email HTML (identical styling to LeadConversionEmailAction) ───
    private static String buildPortalWelcomeHtml(
        String greeting, String fullName, String email, String loginUrl, String pwdUrl
    ) {
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
            + '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">'
            + '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">'

            // Header
            + '<div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 36px;">'
            + '<table style="width:100%;border-collapse:collapse;"><tr>'
            + '<td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.12em;">TALCORE</span>'
            + '<br><span style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.06em;">IT &amp; Enterprise Solutions</span></td>'
            + '<td style="text-align:right;vertical-align:middle;">'
            + '<span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);'
            + 'color:#fff;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">'
            + '&#x1F389; BIENVENUE</span></td></tr></table>'
            + '</div>'

            // Body
            + '<div style="background:#fff;padding:36px;">'
            + '<p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 16px;">'
            + greeting + ' ' + fullName + ',</p>'
            + '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 14px;">'
            + 'Nous vous remercions de votre confiance en <strong style="color:#6366f1;">TALCORE</strong>. '
            + 'Votre demande a \u00e9t\u00e9 valid\u00e9e et votre espace personnel est d\u00e9sormais actif.</p>'

            // Login info card
            + '<div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 12px 12px 0;padding:18px 24px;margin:0 0 18px;">'
            + '<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Identifiant de connexion</div>'
            + '<table style="border-collapse:collapse;"><tr>'
            + '<td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding-right:16px;">Email</td>'
            + '<td style="color:#0f172a;font-weight:700;font-size:14px;">' + email + '</td>'
            + '</tr></table>'
            + '</div>'

            // Password section
            + '<div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:18px 24px;margin:0 0 28px;">'
            + '<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Premi\u00e8re connexion — D\u00e9finissez votre mot de passe</div>'
            + '<p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">'
            + 'Vous recevrez dans quelques instants un second email intitul\u00e9 <strong>\u00ab\u00a0R\u00e9initialiser votre mot de passe\u00a0\u00bb</strong>. '
            + 'Cliquez sur le lien qu\'il contient pour d\u00e9finir votre mot de passe et acc\u00e9der \u00e0 votre espace TALCORE.</p>'
            + '</div>'

            // Main CTA
            + '<div style="text-align:center;margin:0 0 28px;">'
            + '<a href="' + loginUrl + '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;'
            + 'text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">'
            + 'Acc\u00e9der \u00e0 mon espace TALCORE &rarr;</a>'
            + '</div>'

            + '<div style="border-top:1px solid #e2e8f0;padding-top:20px;">'
            + '<p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">'
            + 'Des questions ? Notre \u00e9quipe support est disponible pour vous aider.</p>'
            + '</div>'
            + '</div>'

            // Footer
            + '<div style="background:#1e293b;padding:18px 36px;text-align:center;">'
            + '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 TALCORE &bull; IT &amp; Enterprise Solutions</p>'
            + '<p style="color:#475569;font-size:11px;margin:0;">Ne pas r\u00e9pondre \u00e0 cet email automatique</p>'
            + '</div>'
            + '</div></body></html>';
    }

    private static String fmtAmount(Decimal v) {
        if (v == null || v == 0) return '0 €';
        if (v >= 1000000) return String.valueOf((v / 1000000).setScale(1)) + ' M€';
        if (v >= 1000)    return String.valueOf((v / 1000).setScale(1)) + ' K€';
        return String.valueOf(v.setScale(0)) + ' €';
    }

    private static String rowHtml(String label, String val) {
        return '<tr>'
             + '<td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">' + label + '</td>'
             + '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' + (String.isNotBlank(val) ? val : '\u2014') + '</td>'
             + '</tr>';
    }
    private static String statusGroup(String status) {
        if (status == null) return 'new';
        String s = status.toLowerCase();
        if (s.contains('not contacted') || s.contains('open')) return 'new';
        if (s.contains('qualified'))                            return 'qualified';
        return 'progress';
    }

    private static String initials(String first, String last) {
        String a = String.isNotBlank(first) ? first.substring(0,1).toUpperCase() : '';
        String b = String.isNotBlank(last)  ? last.substring(0,1).toUpperCase()  : '';
        return (a + b).trim().left(2);
    }
}
