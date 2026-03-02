public class LeadConversionEmailAction {

    public class Request {
        @InvocableVariable(required=true label='Lead ID')
        public Id leadId;
        @InvocableVariable(required=false label='Salutation')
        public String salutation;
        @InvocableVariable(required=true  label='First Name')
        public String firstName;
        @InvocableVariable(required=true  label='Last Name')
        public String lastName;
        @InvocableVariable(required=true  label='Email')
        public String email;
        @InvocableVariable(required=false label='Company')
        public String company;
        @InvocableVariable(required=false label='Community Login URL')
        public String loginUrl;
    }

    @InvocableMethod(label='Send Lead Conversion Admin Alert'
                     description='Sends an admin conversion alert when a Lead is converted. Customer welcome email is sent separately after portal user creation.')
    public static void sendConversionEmail(List<Request> requests) {
        // NOTE: The customer welcome email (with set-password link) is intentionally
        // NOT sent here. It is sent by LeadManagementController.createPortalUserForContact
        // AFTER the portal user has been created — so the ForgotPassword link works.
        List<Messaging.SingleEmailMessage> adminMails = new List<Messaging.SingleEmailMessage>();

        String adminEmail = UserInfo.getUserEmail();

        for (Request r : requests) {
            if (String.isBlank(r.email)) continue;

            String fullName = (r.firstName + ' ' + r.lastName).trim();

            // ── Admin conversion alert ────────────────────────────────────────
            if (String.isNotBlank(adminEmail)) {
                String contactLink = '';
                String oppLink     = '';
                Id convertedContactId = null;
                try {
                    Lead l = [SELECT ConvertedContactId, ConvertedOpportunityId
                              FROM   Lead WHERE Id = :r.leadId LIMIT 1];
                    convertedContactId = l.ConvertedContactId;
                    if (l.ConvertedContactId     != null)
                        contactLink = '/lightning/r/Contact/'     + l.ConvertedContactId     + '/view';
                    if (l.ConvertedOpportunityId != null)
                        oppLink     = '/lightning/r/Opportunity/' + l.ConvertedOpportunityId + '/view';
                } catch (Exception ignored) {}

                Messaging.SingleEmailMessage adminMail = new Messaging.SingleEmailMessage();
                adminMail.setToAddresses(new List<String>{ adminEmail });
                adminMail.setSubject('TALCORE \u2014 Lead Converti : ' + fullName);
                adminMail.setHtmlBody(buildAdminHtml(
                    r.firstName, r.lastName, r.company, r.email,
                    oppLink, contactLink, convertedContactId
                ));
                adminMail.setSaveAsActivity(false);
                adminMails.add(adminMail);
            }
        }

        if (!adminMails.isEmpty()) {
            try { Messaging.sendEmail(adminMails); }
            catch (Exception e) { System.debug('LeadConversionEmailAction.adminMail: ' + e.getMessage()); }
        }
    }

    // ─── User welcome email (kept for reference — now sent via LeadManagementController.createPortalUserForContact) ─
    @SuppressWarnings('PMD.UnusedPrivateMethod')
    private static String buildWelcomeHtml(String greeting, String fullName,
                                           String email, String url, String pwdUrl) {
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
            + '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">'
            + '<div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.14);">'

            // ── Purple gradient header ──
            + '<div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 36px;">'
            + '<table style="width:100%;border-collapse:collapse;"><tr>'
            + '<td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.12em;">TALCORE</span>'
            + '<br><span style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.06em;">IT &amp; Enterprise Solutions</span></td>'
            + '<td style="text-align:right;vertical-align:middle;">'
            + '<span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);'
            + 'color:#fff;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 13px;border-radius:100px;">'
            + '&#x1F389; BIENVENUE</span></td></tr></table>'
            + '</div>'

            // ── White body ──
            + '<div style="background:#fff;padding:36px;">'
            + '<p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 16px;">'
            + greeting + ' ' + fullName + ',</p>'
            + '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 14px;">'
            + 'Nous vous remercions de votre confiance en <strong style="color:#6366f1;">TALCORE</strong>. '
            + 'Nous sommes ravis de vous accueillir dans notre communaut\u00e9.</p>'
            + '<p style="color:#475569;line-height:1.7;font-size:14px;margin:0 0 28px;">'
            + 'Votre demande a \u00e9t\u00e9 valid\u00e9e par notre \u00e9quipe. '
            + 'Votre espace personnel est d\u00e9sormais actif et pr\u00eat \u00e0 \u00eatre utilis\u00e9.</p>'

            // ── Login info card (indigo accent) ──
            + '<div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 12px 12px 0;padding:18px 24px;margin:0 0 18px;">'
            + '<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Identifiant de connexion</div>'
            + '<table style="border-collapse:collapse;">'
            + '<tr>'
            + '<td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding-right:16px;">Email</td>'
            + '<td style="color:#0f172a;font-weight:700;font-size:14px;">' + email + '</td>'
            + '</tr></table>'
            + '</div>'

            // ── Password card (purple accent) ──
            + '<div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:18px 24px;margin:0 0 28px;">'
            + '<div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Mot de passe — Premi\u00e8re connexion</div>'
            + '<p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6;">'
            + 'Cliquez sur le bouton ci-dessous pour d\u00e9finir votre mot de passe et acc\u00e9der '
            + '\u00e0 votre espace pour la premi\u00e8re fois :</p>'
            + '<div style="text-align:center;">'
            + '<a href="' + pwdUrl + '" style="background:#7c3aed;color:#fff;text-decoration:none;'
            + 'padding:11px 28px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block;">'
            + 'D\u00e9finir mon mot de passe &rarr;</a>'
            + '</div>'
            + '</div>'

            // ── Main CTA ──
            + '<div style="text-align:center;margin:0 0 28px;">'
            + '<a href="' + url + '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;'
            + 'text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">'
            + 'Acc\u00e9der \u00e0 mon espace TALCORE &rarr;</a>'
            + '</div>'

            // ── Support line ──
            + '<div style="border-top:1px solid #e2e8f0;padding-top:20px;">'
            + '<p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">'
            + 'Des questions ? Contactez notre \u00e9quipe support &mdash; nous sommes l\u00e0 pour vous.</p>'
            + '</div>'
            + '</div>'

            // ── Dark footer ──
            + '<div style="background:#1e293b;padding:18px 36px;text-align:center;">'
            + '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 TALCORE &bull; IT &amp; Enterprise Solutions</p>'
            + '<p style="color:#475569;font-size:11px;margin:0;">Ne pas r\u00e9pondre \u00e0 cet email automatique</p>'
            + '</div>'
            + '</div></body></html>';
    }

    // ─── Admin conversion alert email ─────────────────────────────────────────
    private static String buildAdminHtml(String firstName, String lastName,
                                         String company, String email,
                                         String oppLink, String contactLink,
                                         Id convertedContactId) {
        String fullName = (firstName + ' ' + lastName).trim();
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
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
            + 'Le prospect suivant vient d\'\u00eatre converti avec succ\u00e8s dans TALCORE CRM :</p>'

            // ── Client info card (green accent) ──
            + '<div style="background:#f8fafc;border-left:4px solid #10b981;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 24px;">'
            + '<table style="width:100%;border-collapse:collapse;">'
            + '<tr>'
            + '<td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">CLIENT</td>'
            + '<td style="padding:8px 0;color:#0f172a;font-weight:700;font-size:14px;">' + fullName + '</td>'
            + '</tr><tr>'
            + '<td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">ENTREPRISE</td>'
            + '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' + (String.isNotBlank(company) ? company : '\u2014') + '</td>'
            + '</tr><tr>'
            + '<td style="padding:8px 16px 8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">EMAIL</td>'
            + '<td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:14px;">' + (String.isNotBlank(email) ? email : '\u2014') + '</td>'
            + '</tr></table></div>'

            // ── Next-step action box ──
            + '<div style="background:#fffbeb;border:1.5px solid #fbbf24;border-radius:12px;padding:20px 24px;margin:0 0 24px;">'
            + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
            + '<span style="font-size:18px;">&#9888;&#65039;</span>'
            + '<span style="font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">'
            + '\u00c9tape suivante \u2014 Activer le compte portail</span>'
            + '</div>'
            + '<p style="margin:0 0 14px;color:#78350f;font-size:14px;line-height:1.6;">'
            + 'Le compte portail client <strong>' + fullName + '</strong> n\u2019a pas encore \u00e9t\u00e9 cr\u00e9\u00e9. '
            + 'Rendez-vous dans le <strong>tableau de bord TALCORE</strong> et cliquez sur '
            + '<strong>\u201cCr\u00e9er compte portail\u201d</strong> pour activer l\u2019acc\u00e8s et envoyer les identifiants au client.</p>'
            + '<p style="margin:0;color:#92400e;font-size:13px;">'
            + 'Email du client : <strong>' + (String.isNotBlank(email) ? email : '\u2014') + '</strong></p>'
            + '</div>'

            // ── CTA buttons ──
            + '<div style="text-align:center;">'
            + (String.isNotBlank(oppLink)
                ? '<a href="' + oppLink + '" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;margin-right:12px;">Voir Opportunit\u00e9 &rarr;</a>'
                : '')
            + (String.isNotBlank(contactLink)
                ? '<a href="' + contactLink + '" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">Voir Contact &rarr;</a>'
                : '')
            + '</div></div>'

            // ── Dark footer ──
            + '<div style="background:#1e293b;padding:18px 36px;text-align:center;">'
            + '<p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; 2026 TALCORE &bull; IT &amp; Enterprise Solutions</p>'
            + '<p style="color:#475569;font-size:11px;margin:0;">Notification CRM automatique &mdash; Ne pas r\u00e9pondre \u00e0 cet email</p>'
            + '</div>'
            + '</div></body></html>';
    }
}
