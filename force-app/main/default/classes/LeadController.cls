public without sharing class LeadController {

    @AuraEnabled
    public static void createLead(
        String  salutation,
        String  firstName,
        String  lastName,
        String  email,
        String  phone,
        String  title,
        String  company,
        String  industry,
        String  employees,
        Decimal annualRevenue,
        String  country,
        String  city,
        String  state,
        String  zip,
        String  description
    ) {
        try {
            Lead l            = new Lead();
            l.Salutation      = salutation;
            l.FirstName       = firstName;
            l.LastName        = lastName;
            l.Email           = email;
            l.Phone           = phone;
            l.Title           = title;
            l.Company         = company;
            l.Industry        = industry;
            l.AnnualRevenue   = annualRevenue;
            l.Country         = country;
            l.City            = city;
            l.State           = state;
            l.PostalCode      = zip;
            l.Description     = description;
            l.LeadSource      = 'Web';
            l.Status          = 'Open - Not Contacted';

            // Map employee band string → NumberOfEmployees integer
            if (String.isNotBlank(employees)) {
                Map<String, Integer> empMap = new Map<String, Integer>{
                    '1-10'    => 5,   '11-50'   => 30,
                    '51-200'  => 100, '201-1000' => 500,
                    '1000+'   => 2000
                };
                if (empMap.containsKey(employees))
                    l.NumberOfEmployees = empMap.get(employees);
            }

            insert l;

            sendCustomerEmail(firstName, lastName, salutation, email);
            LeadManagementController.notifyAdminNewLead(l);

        } catch (Exception e) {
            throw new AuraHandledException(
                'Impossible de soumettre votre demande : ' + e.getMessage()
            );
        }
    }

    // ── Emails ────────────────────────────────────────────────────────────────

    private static void sendCustomerEmail(
        String firstName, String lastName, String salutation, String toEmail
    ) {
        try {
            String greeting = (salutation == 'Mr.') ? 'Cher' : 'Ch\u00e8re';
            String fullName = firstName + ' ' + lastName;

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new List<String>{ toEmail });
            mail.setSubject('Bienvenue chez TALCORE \u2014 Votre demande est re\u00e7ue');
            mail.setHtmlBody(buildCustomerHtml(greeting, fullName));
            mail.setSaveAsActivity(false);
            Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
        } catch (Exception e) {
            System.debug('Customer email failed: ' + e.getMessage());
        }
    }

    private static String buildCustomerHtml(String greeting, String fullName) {
        return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">'
            + '<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">'

            // Header
            + '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);padding:40px 32px;text-align:center;">'
            + '<h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:0.15em;">TALCORE</h1>'
            + '<p style="color:#a5b4fc;margin:6px 0 0;font-size:13px;">Solutions IT &amp; Entreprise</p>'
            + '</div>'

            // Body
            + '<div style="padding:40px 36px;">'
            + '<p style="color:#0f172a;font-size:17px;font-weight:700;margin:0 0 16px;">'
            + greeting + ' ' + fullName + ',</p>'
            + '<p style="color:#334155;line-height:1.75;margin:0 0 14px;">'
            + 'Merci de choisir <strong>TALCORE</strong> ! Nous sommes ravis de vous accueillir dans notre communaut\u00e9.</p>'
            + '<p style="color:#334155;line-height:1.75;margin:0 0 14px;">'
            + 'Vos informations ont \u00e9t\u00e9 re\u00e7ues et sont en cours de traitement.<br/>'
            + 'Nous vous contacterons prochainement pour finaliser le processus de vente.</p>'
            + '<p style="color:#334155;line-height:1.75;margin:0 0 32px;">'
            + 'En attendant, explorez notre site ou contactez-nous si vous avez besoin d\u2019assistance.</p>'
            + '<a href="#" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);'
            + 'color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;'
            + 'font-weight:700;font-size:14px;letter-spacing:0.02em;">Explorer nos produits</a>'
            + '</div>'

            // Footer
            + '<div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">'
            + '<p style="color:#94a3b8;font-size:12px;margin:0;">'
            + 'Merci pour votre confiance. &mdash; L\u2019\u00e9quipe TALCORE</p>'
            + '<p style="color:#cbd5e1;font-size:11px;margin:6px 0 0;">'
            + '&copy; 2025 TALCORE. Tous droits r\u00e9serv\u00e9s.</p>'
            + '</div>'
            + '</div></body></html>';
    }
}
