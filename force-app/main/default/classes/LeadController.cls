public without sharing class LeadController {
  @AuraEnabled
  public static void createLead(
    String salutation,
    String firstName,
    String lastName,
    String email,
    String phone,
    String title,
    String company,
    String industry,
    String employees,
    Decimal annualRevenue,
    String country,
    String city,
    String state,
    String zip,
    String description,
    String website,
    String intent
  ) {
    try {
      Lead l = new Lead();
      l.Salutation = salutation;
      l.FirstName = firstName;
      l.LastName = lastName;
      l.Email = email;
      l.Phone = phone;
      l.Title = title;
      l.Company = company;
      l.Industry = industry;
      l.AnnualRevenue = annualRevenue;
      // Use CountryCode (ISO 2-letter) to avoid FIELD_INTEGRITY_EXCEPTION
      // when State/Country Picklists are enabled in the org
      if (String.isNotBlank(country))
        l.CountryCode = country;
      l.City = city;
      l.PostalCode = zip;
      // State/Province stored in Description — State field is a restricted picklist
      // when org has State/Country Picklists enabled and cannot accept free text
      String stateNote = String.isNotBlank(state)
        ? 'State/Province: ' + state + '\n'
        : '';
      l.Description =
        stateNote + (String.isNotBlank(description) ? description : '');
      l.LeadSource = 'Web';
      l.Status = 'Open - Not Contacted';
      if (String.isNotBlank(website))
        l.Website = website;
      if (String.isNotBlank(intent))
        l.Intent__c = intent;

      // Parse employee count as a direct integer (form now sends a number)
      if (String.isNotBlank(employees)) {
        try {
          l.NumberOfEmployees = Integer.valueOf(
            Decimal.valueOf(employees).intValue()
          );
        } catch (Exception ex) {
          System.debug('Could not parse employee count: ' + employees);
        }
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
    String firstName,
    String lastName,
    String salutation,
    String toEmail
  ) {
    try {
      String greeting = (salutation == 'Mr.') ? 'Cher' : 'Ch\u00e8re';
      String fullName = firstName + ' ' + lastName;

      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ toEmail });
      mail.setSubject(
        'Nexus Systems \u2014 Votre demande B2B est en cours de r\u00e9vision'
      );
      mail.setHtmlBody(buildCustomerHtml(greeting, fullName));
      mail.setSaveAsActivity(false);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      System.debug('Customer email failed: ' + e.getMessage());
    }
  }

  private static String buildCustomerHtml(String greeting, String fullName) {
    return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">' +
      '<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">' +
      // Header
      '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);padding:40px 32px;text-align:center;">' +
      '<h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:0.15em;">NEXUS SYSTEMS</h1>' +
      '<p style="color:#a5b4fc;margin:6px 0 0;font-size:13px;">Solutions B2B &amp; B2C Intelligence</p>' +
      '</div>' +
      // Body
      '<div style="padding:40px 36px;">' +
      '<p style="color:#0f172a;font-size:17px;font-weight:700;margin:0 0 16px;">' +
      greeting +
      ' ' +
      fullName +
      ',</p>' +
      '<p style="color:#334155;line-height:1.75;margin:0 0 14px;">' +
      'Merci de choisir <strong>Nexus Systems</strong> ! Nous sommes ravis de vous accueillir.</p>' +
      '<div style="background:#fef9c3;border-left:4px solid #eab308;border-radius:0 10px 10px 0;padding:14px 20px;margin:0 0 16px;">' +
      '<strong style="color:#854d0e;">Demande en cours de r\u00e9vision</strong><br/>' +
      '<span style="color:#713f12;font-size:13px;">Votre dossier est analys\u00e9 par notre \u00e9quipe. ' +
      'Vous recevrez une r\u00e9ponse sous <strong>24\u201348\u00a0h</strong>.</span>' +
      '</div>' +
      '<p style="color:#334155;line-height:1.75;margin:0 0 32px;">' +
      'En attendant, n\u2019h\u00e9sitez pas \u00e0 explorer notre catalogue ou \u00e0 nous contacter si vous avez des questions.</p>' +
      '<a href="#" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);' +
      'color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;' +
      'font-weight:700;font-size:14px;letter-spacing:0.02em;">Explorer nos produits</a>' +
      '</div>' +
      // Footer
      '<div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">' +
      '<p style="color:#94a3b8;font-size:12px;margin:0;">' +
      'Merci pour votre confiance. &mdash; L\u2019\u00e9quipe Nexus Systems</p>' +
      '<p style="color:#cbd5e1;font-size:11px;margin:6px 0 0;">' +
      '&copy; 2026 Nexus Systems. Tous droits r\u00e9serv\u00e9s.</p>' +
      '</div>' +
      '</div></body></html>';
  }
}
