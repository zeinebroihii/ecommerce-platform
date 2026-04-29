public class LeadConversionEmailAction {
  public class Request {
    @InvocableVariable(required=true label='Lead ID')
    public Id leadId;
    @InvocableVariable(required=false label='Salutation')
    public String salutation;
    @InvocableVariable(required=true label='First Name')
    public String firstName;
    @InvocableVariable(required=true label='Last Name')
    public String lastName;
    @InvocableVariable(required=true label='Email')
    public String email;
    @InvocableVariable(required=false label='Company')
    public String company;
    @InvocableVariable(required=false label='Community Login URL')
    public String loginUrl;
  }

  @InvocableMethod(
    label='Send Lead Conversion Admin Alert'
    description='Sends an admin conversion alert when a Lead is converted. Customer welcome email is sent separately after portal user creation.'
  )
  public static void sendConversionEmail(List<Request> requests) {
    // NOTE: The customer welcome email (with set-password link) is intentionally
    // NOT sent here. It is sent by LeadManagementController.createPortalUserForContact
    // AFTER the portal user has been created — so the ForgotPassword link works.
    List<Messaging.SingleEmailMessage> adminMails = new List<Messaging.SingleEmailMessage>();

    String adminEmail = UserInfo.getUserEmail();

    for (Request r : requests) {
      if (String.isBlank(r.email))
        continue;

      String fullName = (r.firstName + ' ' + r.lastName).trim();

      // ── Admin conversion alert ────────────────────────────────────────
      if (String.isNotBlank(adminEmail)) {
        String contactLink = '';
        String oppLink = '';
        Id convertedContactId = null;
        try {
          Lead l = [
            SELECT ConvertedContactId, ConvertedOpportunityId
            FROM Lead
            WHERE Id = :r.leadId
            LIMIT 1
          ];
          convertedContactId = l.ConvertedContactId;
          if (l.ConvertedContactId != null)
            contactLink =
              '/lightning/r/Contact/' +
              l.ConvertedContactId +
              '/view';
          if (l.ConvertedOpportunityId != null)
            oppLink =
              '/lightning/r/Opportunity/' +
              l.ConvertedOpportunityId +
              '/view';
        } catch (Exception ignored) {
        }

        Messaging.SingleEmailMessage adminMail = new Messaging.SingleEmailMessage();
        adminMail.setToAddresses(new List<String>{ adminEmail });
        adminMail.setSubject('Nexus CRM - Lead Converted: ' + fullName);
        adminMail.setHtmlBody(
          buildAdminHtml(
            r.firstName,
            r.lastName,
            r.company,
            r.email,
            oppLink,
            contactLink,
            convertedContactId
          )
        );
        adminMail.setSaveAsActivity(false);
        adminMails.add(adminMail);
      }
    }

    if (!adminMails.isEmpty()) {
      try {
        Messaging.sendEmail(adminMails);
      } catch (Exception e) {
        System.debug('LeadConversionEmailAction.adminMail: ' + e.getMessage());
      }
    }
  }

  // ─── User welcome email (kept for reference — now sent via LeadManagementController.createPortalUserForContact) ─
  @SuppressWarnings('PMD.UnusedPrivateMethod')
  private static String buildWelcomeHtml(
    String greeting,
    String fullName,
    String email,
    String url,
    String pwdUrl
  ) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">' +
      // ── Purple gradient header ──
      '<div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 36px;">' +
      '<table style="width:100%;border-collapse:collapse;"><tr>' +
      '<td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.12em;">NEXUS</span>' +
      '<br><span style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.06em;">IT &amp; Enterprise Solutions</span></td>' +
      '<td style="text-align:right;vertical-align:middle;">' +
      '<span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);' +
      'color:#fff;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">' +
      '&#x1F389; WELCOME</span></td></tr></table>' +
      '</div>' +
      // ── White body ──
      '<div style="background:#fff;padding:36px;">' +
      '<p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 16px;">' +
      greeting +
      ' ' +
      fullName +
      ',</p>' +
      '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 14px;">' +
      'Thank you for your trust in <strong style="color:#6366f1;">Nexus</strong>. ' +
      'We are delighted to welcome you to our community.</p>' +
      '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 28px;">' +
      'Your request has been validated by our team. ' +
      'Your personal portal is now active and ready to use.</p>' +
      // ── Login info card (indigo accent) ──
      '<div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 12px 12px 0;padding:18px 24px;margin:0 0 18px;">' +
      '<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Login Credentials</div>' +
      '<table style="border-collapse:collapse;">' +
      '<tr>' +
      '<td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding-right:16px;">Email</td>' +
      '<td style="color:#0f172a;font-weight:700;font-size:14px;">' +
      email +
      '</td>' +
      '</tr></table>' +
      '</div>' +
      // ── Password card (purple accent) ──
      '<div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:18px 24px;margin:0 0 28px;">' +
      '<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Password — First Login</div>' +
      '<p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6;">' +
      'Click the button below to set your password and access your portal for the first time:</p>' +
      '<div style="text-align:center;">' +
      '<a href="' +
      pwdUrl +
      '" style="background:#7c3aed;color:#fff;text-decoration:none;' +
      'padding:11px 28px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block;">' +
      'Set my password &rarr;</a>' +
      '</div>' +
      '</div>' +
      // ── Main CTA ──
      '<div style="text-align:center;margin:0 0 28px;">' +
      '<a href="' +
      url +
      '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;' +
      'text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">' +
      'Access my Nexus portal &rarr;</a>' +
      '</div>' +
      // ── Support line ──
      '<div style="border-top:1px solid #e2e8f0;padding-top:20px;">' +
      '<p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">' +
      'Questions? Contact our support team &mdash; we are here to help.</p>' +
      '</div>' +
      '</div>' +
      // ── Dark footer ──
      '<div style="background:#1e293b;padding:18px 36px;text-align:center;">' +
      '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 Nexus &bull; IT &amp; Enterprise Solutions</p>' +
      '<p style="color:#475569;font-size:11px;margin:0;">Do not reply to this automated email</p>' +
      '</div>' +
      '</div></body></html>';
  }

  // ─── Admin conversion alert email ─────────────────────────────────────────
  private static String buildAdminHtml(
    String firstName,
    String lastName,
    String company,
    String email,
    String oppLink,
    String contactLink,
    Id convertedContactId
  ) {
    String fullName = (firstName + ' ' + lastName).trim();
    String companyVal = String.isNotBlank(company) ? company : 'N/A';
    String emailVal = String.isNotBlank(email) ? email : 'N/A';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">' +
      '<tr><td align="center">' +
      '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 2px 16px rgba(15,23,42,0.06);">' +
      // ── Emerald top stripe ──
      '<tr><td style="height:4px;background:linear-gradient(90deg,#059669,#10b981);"></td></tr>' +
      // ── Light header ──
      '<tr><td style="background:#ffffff;padding:32px 44px 24px;border-bottom:1px solid #f1f5f9;">' +
      '<table style="width:100%;border-collapse:collapse;"><tr>' +
      '<td style="vertical-align:middle;">' +
      '<span style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:3px;">NEXUS</span>' +
      '<span style="font-size:11px;color:#94a3b8;font-weight:500;margin-left:10px;">CRM Platform</span>' +
      '</td>' +
      '<td style="text-align:right;vertical-align:middle;">' +
      '<span style="background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;letter-spacing:0.05em;padding:4px 12px;border-radius:100px;border:1px solid #a7f3d0;">' +
      'Lead Converted</span>' +
      '</td></tr></table>' +
      '</td></tr>' +
      // ── Body ──
      '<tr><td style="background:#ffffff;padding:32px 44px;">' +
      // ── Intro ──
      '<p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">Lead Successfully Converted</p>' +
      '<p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">' +
      'The following prospect has been converted to a client and opportunity in <strong style="color:#059669;">Nexus CRM</strong>.</p>' +
      // ── Client info card ──
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:0 0 20px;">' +
      '<div style="padding:12px 20px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;">' +
      '<span style="font-size:11px;font-weight:700;color:#475569;letter-spacing:0.08em;text-transform:uppercase;">Client Information</span>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;padding:4px 0;">' +
      '<tr>' +
      '<td style="padding:12px 20px;color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:100px;vertical-align:top;">Name</td>' +
      '<td style="padding:12px 20px 12px 0;color:#0f172a;font-weight:600;font-size:14px;">' +
      fullName +
      '</td>' +
      '</tr>' +
      '<tr style="border-top:1px solid #f1f5f9;">' +
      '<td style="padding:12px 20px;color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Company</td>' +
      '<td style="padding:12px 20px 12px 0;color:#0f172a;font-weight:600;font-size:14px;">' +
      companyVal +
      '</td>' +
      '</tr>' +
      '<tr style="border-top:1px solid #f1f5f9;">' +
      '<td style="padding:12px 20px;color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Email</td>' +
      '<td style="padding:12px 20px 12px 0;color:#0f172a;font-weight:600;font-size:14px;">' +
      emailVal +
      '</td>' +
      '</tr>' +
      '</table></div>' +
      // ── Portal notice ──
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:0 0 28px;">' +
      '<p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">' +
      '<strong>Portal account created.</strong> A welcome email with login credentials has been sent to <strong>' +
      emailVal +
      '</strong>.</p>' +
      '</div>' +
      // ── CTA buttons ──
      '<div style="text-align:center;">' +
      (String.isNotBlank(oppLink)
        ? '<a href="' +
          oppLink +
          '" style="background:#059669;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block;margin:4px 6px;">View Opportunity &rarr;</a>'
        : '') +
      (String.isNotBlank(contactLink)
        ? '<a href="' +
          contactLink +
          '" style="background:#ffffff;color:#059669;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block;margin:4px 6px;border:1.5px solid #059669;">View Contact &rarr;</a>'
        : '') +
      '</div>' +
      '</td></tr>' +
      // ── Light footer ──
      '<tr><td style="background:#f8fafc;padding:18px 44px;text-align:center;border-top:1px solid #e2e8f0;">' +
      '<p style="margin:0 0 3px;font-size:12px;font-weight:700;color:#0f172a;letter-spacing:2px;">NEXUS</p>' +
      '<p style="margin:0;font-size:11px;color:#94a3b8;">Automated CRM notification. Please do not reply.</p>' +
      '</td></tr>' +
      '</table></td></tr></table>' +
      '</body></html>';
  }
}
