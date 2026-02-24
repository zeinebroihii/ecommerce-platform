public without sharing class QuoteController {

    // ── Wrapper returned to customer portal ──────────────────────────────────
    public class QuoteWrapper {
        @AuraEnabled public Id      quoteId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  status;
        @AuraEnabled public Decimal grandTotal;
        @AuraEnabled public String  formattedTotal;
        @AuraEnabled public String  expirationDate;
        @AuraEnabled public String  opportunityName;
        @AuraEnabled public Boolean canDecide;      // true when status = 'Presented'
        @AuraEnabled public Boolean isAccepted;
        @AuraEnabled public Boolean isRejected;
        @AuraEnabled public String  description;
    }

    // ── Get all quotes for a customer's account ──────────────────────────────
    @AuraEnabled(cacheable=true)
    public static List<QuoteWrapper> getAccountQuotes(Id accountId) {
        List<QuoteWrapper> result = new List<QuoteWrapper>();
        if (accountId == null) return result;

        for (TALEXO_Quote__c q : [
            SELECT Id, Name, Status__c, GrandTotal__c, ExpirationDate__c,
                   Opportunity__r.Name, Description__c
            FROM   TALEXO_Quote__c
            WHERE  Opportunity__r.AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT 20
        ]) {
            QuoteWrapper w = new QuoteWrapper();
            w.quoteId         = q.Id;
            w.name            = q.Name;
            w.status          = q.Status__c;
            w.grandTotal      = q.GrandTotal__c;
            w.formattedTotal  = q.GrandTotal__c != null
                                ? q.GrandTotal__c.setScale(2).toPlainString() : '0.00';
            w.expirationDate  = q.ExpirationDate__c != null
                                ? q.ExpirationDate__c.format() : null;
            w.opportunityName = q.Opportunity__r != null ? q.Opportunity__r.Name : null;
            w.description     = q.Description__c;
            w.canDecide       = (q.Status__c == 'Presented');
            w.isAccepted      = (q.Status__c == 'Accepted');
            w.isRejected      = (q.Status__c == 'Rejected');
            result.add(w);
        }
        return result;
    }

    // ── Customer: accept or reject a quote ───────────────────────────────────
    @AuraEnabled
    public static void processQuoteDecision(Id quoteId, String decision, String reason) {
        TALEXO_Quote__c q = [
            SELECT Id, Name, Status__c, Opportunity__c,
                   Opportunity__r.AccountId, Opportunity__r.Account.Name,
                   Opportunity__r.OwnerId, Opportunity__r.Owner.Email
            FROM   TALEXO_Quote__c
            WHERE  Id = :quoteId
            LIMIT  1
        ];

        String newOppStage;
        String notifTitle;
        String notifMsg;
        String adminSubject;
        String adminBody;
        String accName = q.Opportunity__r.Account.Name;

        if (decision == 'Accepted') {
            q.Status__c  = 'Accepted';
            newOppStage  = 'Contract In Progress';
            notifTitle   = 'Devis accept\u00e9 \u2014 Contrat en cours';
            notifMsg     = 'Votre devis ' + q.Name
                         + ' a \u00e9t\u00e9 accept\u00e9. Notre \u00e9quipe pr\u00e9pare votre contrat.';
            adminSubject = 'TALCORE \u2014 Acceptation Devis : ' + accName;
            adminBody    = 'Bonjour,\n\n' + accName + ' a accept\u00e9 le devis ' + q.Name
                         + '.\n\nVeuillez pr\u00e9parer le contrat dans les plus brefs d\u00e9lais.\n\n'
                         + 'Cordialement,\nL\'\u00e9quipe TALCORE';
        } else {
            q.Status__c  = 'Rejected';
            newOppStage  = 'Closed Lost';
            notifTitle   = 'Devis refus\u00e9';
            notifMsg     = 'Votre devis ' + q.Name + ' a \u00e9t\u00e9 refus\u00e9.'
                         + (String.isNotBlank(reason) ? ' Raison : ' + reason : '');
            adminSubject = 'TALCORE \u2014 Refus Devis : ' + accName;
            adminBody    = 'Bonjour,\n\n' + accName + ' a refus\u00e9 le devis ' + q.Name + '.\n\n'
                         + (String.isNotBlank(reason) ? 'Raison : ' + reason + '\n\n' : '')
                         + 'L\'opportunit\u00e9 a \u00e9t\u00e9 mise \u00e0 jour en Closed Lost.\n\n'
                         + 'Cordialement,\nL\'\u00e9quipe TALCORE';
        }

        update q;
        update new Opportunity(Id = q.Opportunity__c, StageName = newOppStage);

        // Push portal notification to the customer user
        List<User> custUsers = [
            SELECT Id FROM User
            WHERE AccountId = :q.Opportunity__r.AccountId
              AND IsActive = true AND UserType = 'PowerCustomerSuccess'
            LIMIT 1
        ];
        if (!custUsers.isEmpty()) {
            NotificationController.push(
                custUsers[0].Id, notifTitle, notifMsg, 'Quote', '/shop/s/mes-offres'
            );
        }

        // Email admin / opp owner
        if (String.isNotBlank(q.Opportunity__r.Owner.Email)) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new List<String>{ q.Opportunity__r.Owner.Email });
            mail.setSubject(adminSubject);
            mail.setPlainTextBody(adminBody);
            mail.setSaveAsActivity(false);
            Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
        }
    }

    // ── Admin: send quote by email to customer ────────────────────────────────
    @AuraEnabled
    public static void sendQuoteToCustomer(Id quoteId, String recipientEmail,
                                            String emailSubject, String bodyNote,
                                            String bccEmail) {
        TALEXO_Quote__c q = [
            SELECT Id, Name, GrandTotal__c, ExpirationDate__c,
                   Opportunity__r.Account.Name
            FROM   TALEXO_Quote__c WHERE Id = :quoteId LIMIT 1
        ];

        String totalStr = q.GrandTotal__c != null
                          ? '\u00a3' + q.GrandTotal__c.setScale(2) : '\u00a30.00';
        String expStr   = q.ExpirationDate__c != null
                          ? q.ExpirationDate__c.format() : 'N/A';

        String html = '<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">'
            + '<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px;'
            + 'border-radius:12px 12px 0 0;text-align:center;">'
            + '<h1 style="color:#fff;font-size:2rem;margin:0;letter-spacing:0.08em;">TALCORE</h1>'
            + '<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Votre Devis</p>'
            + '</div>'
            + '<div style="background:#fff;padding:36px;border:1px solid #e2e8f0;border-top:none;">'
            + '<p>Cher client,</p>'
            + '<p>Nous vous remercions d\'avoir choisi <strong>TALCORE</strong>. '
            + 'Veuillez trouver ci-joint votre devis <strong>' + q.Name + '</strong>.</p>'
            + '<div style="background:#f0f4ff;border-radius:8px;padding:20px;margin:24px 0;">'
            + '<p style="margin:0 0 8px;"><strong>Montant total :</strong> ' + totalStr + '</p>'
            + '<p style="margin:0;"><strong>Date limite de r\u00e9ponse :</strong> ' + expStr + '</p>'
            + '</div>'
            + (String.isNotBlank(bodyNote) ? '<p>' + bodyNote + '</p>' : '')
            + '<p>Veuillez examiner attentivement le devis et nous faire part de votre d\u00e9cision '
            + 'depuis votre espace TALCORE.</p>'
            + '<div style="text-align:center;margin:28px 0;">'
            + '<a href="https://orgfarm-36e06c1f3e-dev-ed.develop.my.site.com/shop/s/mes-offres" '
            + 'style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;'
            + 'text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;'
            + 'display:inline-block;">Voir mon devis &amp; r\u00e9pondre &rarr;</a>'
            + '</div>'
            + '<p>Nous vous remercions de votre confiance et sommes impatients de vous servir.</p>'
            + '<p>Cordialement,<br/><strong>L\'\u00e9quipe TALCORE</strong></p>'
            + '</div></div>';

        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ recipientEmail });
        if (String.isNotBlank(bccEmail)) {
            mail.setBccAddresses(new List<String>{ bccEmail });
        }
        mail.setSubject(String.isNotBlank(emailSubject)
                        ? emailSubject : 'Votre devis TALCORE \u2014 ' + q.Name);
        mail.setHtmlBody(html);
        mail.setSaveAsActivity(false);
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });

        // Mark quote as Presented
        update new TALEXO_Quote__c(Id = quoteId, Status__c = 'Presented');
    }
}
