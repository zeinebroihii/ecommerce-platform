public without sharing class NewsletterController {
  private static final String SITE_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';
  private static final String CATALOG_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/?section=catalog';

  // ── Subscribe ───────────────────────────────────────────────────────────
  @AuraEnabled
  public static void subscribeToNewsletter(String email) {
    if (String.isBlank(email) || !isValidEmail(email)) {
      throw new AuraHandledException('Please enter a valid email address.');
    }
    try {
      String normalEmail = email.toLowerCase().trim();

      List<NewsletterSubscriber__c> existing = [
        SELECT Id
        FROM NewsletterSubscriber__c
        WHERE Email__c = :normalEmail
        LIMIT 1
      ];
      if (existing.isEmpty()) {
        insert new NewsletterSubscriber__c(Email__c = normalEmail);
      }

      List<Product2> featured = [
        SELECT
          Id,
          Name,
          Family,
          Image_URL__c,
          IsNew__c,
          Description,
          (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
        FROM Product2
        WHERE IsActive = TRUE
        ORDER BY IsNew__c DESC, CreatedDate DESC
        LIMIT 4
      ];

      String token = emailToToken(normalEmail);
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ normalEmail });
      mail.setSubject(
        'Welcome to Nexus Newsletter \u2014 Your exclusives are waiting'
      );
      mail.setHtmlBody(buildWelcomeHtml(featured, token));
      mail.setSenderDisplayName('Nexus Newsletter');
      mail.setReplyTo('no-reply@nexus-systems.com');
      mail.setSaveAsActivity(false);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException('Subscription error: ' + e.getMessage());
    }
  }

  // ── Unsubscribe — token is base64-encoded email ─────────────────────────
  @AuraEnabled
  public static String unsubscribeByToken(String token) {
    if (String.isBlank(token)) {
      throw new AuraHandledException('Invalid unsubscribe link.');
    }
    try {
      String email = tokenToEmail(token);
      List<NewsletterSubscriber__c> subs = [
        SELECT Id, Email__c
        FROM NewsletterSubscriber__c
        WHERE Email__c = :email
        LIMIT 1
      ];
      if (subs.isEmpty()) {
        return 'already_removed';
      }
      delete subs[0];
      return email;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException('Invalid unsubscribe link.');
    }
  }

  // ── Blast new product to all subscribers ────────────────────────────────
  @future
  public static void blastNewProduct(Id productId) {
    List<Product2> products = [
      SELECT
        Id,
        Name,
        Family,
        Image_URL__c,
        IsNew__c,
        Description,
        (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
      FROM Product2
      WHERE Id = :productId AND IsActive = TRUE
      LIMIT 1
    ];
    if (products.isEmpty())
      return;
    Product2 p = products[0];

    List<NewsletterSubscriber__c> subs = [
      SELECT Email__c
      FROM NewsletterSubscriber__c
    ];
    if (subs.isEmpty())
      return;

    List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
    for (NewsletterSubscriber__c sub : subs) {
      String token = emailToToken(sub.Email__c);
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ sub.Email__c });
      mail.setSubject('\uD83C\uDD95 New on Nexus: ' + p.Name);
      mail.setHtmlBody(buildNewProductHtml(p, token));
      mail.setSenderDisplayName('Nexus Newsletter');
      mail.setReplyTo('no-reply@nexus-systems.com');
      mail.setSaveAsActivity(false);
      mails.add(mail);
    }
    if (!mails.isEmpty())
      Messaging.sendEmail(mails);
  }

  // ── Token helpers: base64-encode / decode the email ──────────────────────
  private static String emailToToken(String email) {
    return EncodingUtil.base64Encode(Blob.valueOf(email))
      .replace('+', '-')
      .replace('/', '_')
      .replace('=', '');
  }

  private static String tokenToEmail(String token) {
    // Restore standard base64 padding
    String b64 = token.replace('-', '+').replace('_', '/');
    Integer pad = Math.mod(4 - Math.mod(b64.length(), 4), 4);
    for (Integer i = 0; i < pad; i++)
      b64 += '=';
    return EncodingUtil.base64Decode(b64).toString().toLowerCase().trim();
  }

  // ── Email validation ─────────────────────────────────────────────────────
  private static Boolean isValidEmail(String email) {
    return Pattern.compile(
        '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$'
      )
      .matcher(email)
      .matches();
  }

  // ════════════════════════════════════════════════════════════════════════
  // WELCOME EMAIL
  // ════════════════════════════════════════════════════════════════════════
  private static String buildWelcomeHtml(
    List<Product2> products,
    String token
  ) {
    String html = htmlOpen();
    html += darkHeader(
      'Your Newsletter<br/><span style="color:#34d399;">has arrived!</span>',
      'Discover our latest innovations, exclusive offers and more \u2014 reserved for subscribers.'
    );
    html += greenBand(
      '&#10003;&nbsp; Subscription confirmed',
      'Welcome to the Nexus family! You\'ll now receive our best offers first.'
    );
    html += productsBlock(products);
    html += whyNexusBlock();
    html += ctaBlock(CATALOG_URL, 'Browse all products &rarr;');
    html += emailFooter(token);
    html += htmlClose();
    return html;
  }

  // ════════════════════════════════════════════════════════════════════════
  // NEW PRODUCT BLAST EMAIL
  // ════════════════════════════════════════════════════════════════════════
  private static String buildNewProductHtml(Product2 p, String token) {
    Decimal price = 0;
    if (!p.PricebookEntries.isEmpty())
      price = p.PricebookEntries[0].UnitPrice;
    String priceStr = price > 0
      ? price.setScale(0) + ' \u20ac'
      : 'Price on request';
    String family = String.isNotBlank(p.Family)
      ? p.Family.toUpperCase()
      : 'PRODUCT';
    String descText = '';
    if (String.isNotBlank(p.Description))
      descText = p.Description.length() > 200
        ? p.Description.substring(0, 200) + '\u2026'
        : p.Description;
    String productUrl = SITE_URL + '?productId=' + p.Id;

    String html = htmlOpen();
    html += darkHeader(
      'New arrival on<br/><span style="color:#34d399;">Nexus</span>',
      'A brand new product just landed \u2014 be the first to discover it.'
    );
    html += greenBand(
      '&#127381;&nbsp; Just added to the catalogue',
      'Exclusive preview for Nexus Newsletter subscribers.'
    );

    html += '<tr><td style="padding:36px 40px 32px;">';
    html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 32px rgba(0,0,0,0.06);">';
    html += '<tr><td style="height:5px;background:linear-gradient(90deg,#059669,#34d399,#6366f1,#a855f7);"></td></tr>';
    html += '<tr><td style="padding:36px 40px;">';

    html += '<table cellpadding="0" cellspacing="0"><tr>';
    html +=
      '<td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50px;padding:5px 14px;">' +
      '<span style="color:#059669;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;">' +
      family +
      '</span>' +
      '</td>';
    if (p.IsNew__c) {
      html +=
        '<td width="8">&nbsp;</td>' +
        '<td style="background:linear-gradient(135deg,#059669,#34d399);border-radius:50px;padding:5px 14px;">' +
        '<span style="color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;">NEW</span>' +
        '</td>';
    }
    html += '</tr></table>';
    html +=
      '<div style="color:#0f172a;font-size:28px;font-weight:900;margin:18px 0 14px;line-height:1.2;">' +
      escHtml(p.Name) +
      '</div>';
    if (String.isNotBlank(descText)) {
      html +=
        '<div style="color:#475569;font-size:15px;line-height:1.8;margin-bottom:28px;border-left:3px solid #34d399;padding-left:16px;">' +
        escHtml(descText) +
        '</div>';
    }
    html +=
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td valign="middle">' +
      '<div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Price</div>' +
      '<div style="color:#059669;font-size:34px;font-weight:900;line-height:1;">' +
      priceStr +
      '</div>' +
      '</td>' +
      '<td align="right" valign="middle">' +
      '<a href="' +
      productUrl +
      '" style="display:inline-block;background:linear-gradient(135deg,#059669,#34d399);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:15px;font-weight:800;letter-spacing:0.03em;box-shadow:0 4px 16px rgba(5,150,105,0.35);">Buy now &rarr;</a>' +
      '</td></tr></table>';
    html += '</td></tr></table>';
    html += '</td></tr>';

    html += '<tr><td style="padding:0 40px 36px;">';
    html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">';
    html += '<tr><td style="padding:22px 28px;">';
    html += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
    html +=
      '<td valign="middle">' +
      '<div style="color:#0f172a;font-size:14px;font-weight:700;margin-bottom:4px;">Explore all Nexus products</div>' +
      '<div style="color:#64748b;font-size:12px;">Browse our full catalogue of IoT &amp; AI innovations</div>' +
      '</td>';
    html +=
      '<td align="right" valign="middle" style="padding-left:16px;">' +
      '<a href="' +
      CATALOG_URL +
      '" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;">View all &rarr;</a>' +
      '</td></tr></table>';
    html += '</td></tr></table>';
    html += '</td></tr>';

    html += emailFooter(token);
    html += htmlClose();
    return html;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SHARED BLOCKS
  // ════════════════════════════════════════════════════════════════════════

  private static String htmlOpen() {
    return '<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '</head><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">' +
      '<tr><td align="center" style="padding:40px 16px;">' +
      '<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">';
  }

  private static String htmlClose() {
    return '</table></td></tr></table></body></html>';
  }

  private static String darkHeader(String headline, String sub) {
    return '<tr><td>' +
      '<div style="height:4px;background:linear-gradient(90deg,#059669 0%,#34d399 25%,#6366f1 60%,#a855f7 100%);"></div>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#020617 0%,#0f172a 60%,#1e1b4b 100%);">' +
      '<tr><td align="center" style="padding:52px 40px 44px;">' +
      '<table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;"><tr>' +
      '<td style="background:linear-gradient(135deg,#059669,#34d399);width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;">' +
      '<span style="color:#ffffff;font-size:22px;font-weight:900;line-height:44px;">N</span></td>' +
      '<td style="padding-left:12px;vertical-align:middle;">' +
      '<span style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:0.18em;">NEXUS</span></td>' +
      '</tr></table>' +
      '<h1 style="color:#ffffff;font-size:36px;font-weight:900;margin:0 0 14px;line-height:1.1;letter-spacing:-0.02em;">' +
      headline +
      '</h1>' +
      '<p style="color:#94a3b8;font-size:15px;line-height:1.7;max-width:440px;margin:0 auto;">' +
      sub +
      '</p>' +
      '</td></tr></table></td></tr>';
  }

  private static String greenBand(String badgeText, String bodyText) {
    return '<tr><td style="background:linear-gradient(135deg,#022c22,#0f172a);padding:22px 40px;border-bottom:1px solid #e2e8f0;">' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
      '<table cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>' +
      '<td style="background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);border-radius:50px;padding:6px 18px;">' +
      '<span style="color:#34d399;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;">' +
      badgeText +
      '</span>' +
      '</td></tr></table>' +
      '<p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6;">' +
      bodyText +
      '</p>' +
      '</td></tr></table></td></tr>';
  }

  private static String productsBlock(List<Product2> products) {
    String html =
      '<tr><td style="padding:40px 40px 28px;">' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">' +
      '<span style="display:inline-block;background:#ede9fe;border:1px solid #c4b5fd;color:#6d28d9;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.3em;padding:6px 18px;border-radius:50px;">Featured selection</span>' +
      '<h2 style="color:#0f172a;font-size:24px;font-weight:900;margin:14px 0 6px;">Our latest products</h2>' +
      '<p style="color:#64748b;font-size:13px;margin:0;">Innovations built to accelerate your business</p>' +
      '</td></tr></table>';

    if (!products.isEmpty()) {
      String[] accents = new List<String>{
        '#059669',
        '#6366f1',
        '#f59e0b',
        '#ec4899'
      };
      String[] lightBgs = new List<String>{
        '#f0fdf4',
        '#eef2ff',
        '#fffbeb',
        '#fdf2f8'
      };
      String[] borders = new List<String>{
        '#bbf7d0',
        '#c7d2fe',
        '#fde68a',
        '#fbcfe8'
      };
      for (Integer i = 0; i < products.size(); i++) {
        Product2 p = products[i];
        Decimal price = 0;
        if (!p.PricebookEntries.isEmpty())
          price = p.PricebookEntries[0].UnitPrice;
        String priceStr = price > 0
          ? price.setScale(0) + ' \u20ac'
          : 'Price on request';
        String family = String.isNotBlank(p.Family)
          ? p.Family.toUpperCase()
          : 'PRODUCT';
        String accent = accents[Math.mod(i, 4)];
        String lightBg = lightBgs[Math.mod(i, 4)];
        String border = borders[Math.mod(i, 4)];
        String snippet = '';
        if (String.isNotBlank(p.Description))
          snippet = p.Description.length() > 90
            ? p.Description.substring(0, 90) + '\u2026'
            : p.Description;
        String productUrl = SITE_URL + '?productId=' + p.Id;

        html +=
          '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>' +
          '<td width="5" style="background:' +
          accent +
          ';border-radius:6px 0 0 6px;">&nbsp;</td>' +
          '<td style="background:#ffffff;border:1px solid #e2e8f0;border-left:none;border-radius:0 14px 14px 0;padding:18px 22px;">' +
          '<table width="100%" cellpadding="0" cellspacing="0"><tr><td valign="top">';
        if (p.IsNew__c) {
          html +=
            '<span style="display:inline-block;background:' +
            lightBg +
            ';border:1px solid ' +
            border +
            ';color:' +
            accent +
            ';font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;padding:2px 10px;border-radius:50px;margin-bottom:6px;">NEW</span><br/>';
        }
        html +=
          '<span style="color:' +
          accent +
          ';font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">' +
          family +
          '</span>' +
          '<div style="color:#0f172a;font-size:15px;font-weight:700;margin:5px 0 5px;line-height:1.3;">' +
          escHtml(p.Name) +
          '</div>';
        if (String.isNotBlank(snippet))
          html +=
            '<div style="color:#64748b;font-size:12px;line-height:1.6;margin-bottom:10px;">' +
            escHtml(snippet) +
            '</div>';
        html +=
          '<span style="color:' +
          accent +
          ';font-size:18px;font-weight:900;">' +
          priceStr +
          '</span>' +
          '</td><td width="120" align="right" valign="middle" style="padding-left:14px;">' +
          '<a href="' +
          productUrl +
          '" style="display:inline-block;background:' +
          accent +
          ';color:#ffffff;text-decoration:none;padding:9px 18px;border-radius:8px;font-size:12px;font-weight:800;white-space:nowrap;">View &rarr;</a>' +
          '</td></tr></table></td></tr></table>';
      }
    } else {
      html +=
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
        '<td align="center" style="background:#f8fafc;border-radius:14px;padding:36px;border:1px solid #e2e8f0;">' +
        '<p style="color:#94a3b8;font-size:14px;margin:0;">New products coming soon!</p>' +
        '</td></tr></table>';
    }
    html += '</td></tr>';
    return html;
  }

  private static String whyNexusBlock() {
    String[][] feats = new List<String[]>{
      new List<String>{
        '&#129302;',
        'Integrated AI',
        'Predictive analytics &amp; personalised recommendations'
      },
      new List<String>{
        '&#128230;',
        'Real-time Stock',
        'Smart B2B inventory management'
      },
      new List<String>{
        '&#128272;',
        'Max Security',
        'Protected data, secure transactions'
      }
    };
    String html =
      '<tr><td style="padding:0 40px 36px;">' +
      '<h3 style="color:#0f172a;font-size:17px;font-weight:800;margin:0 0 18px;text-align:center;">Why choose Nexus?</h3>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
    for (String[] f : feats) {
      html +=
        '<td valign="top" style="padding:0 5px;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">' +
        '<tr><td align="center" style="padding:20px 14px;">' +
        '<div style="font-size:26px;margin-bottom:10px;">' +
        f[0] +
        '</div>' +
        '<div style="color:#0f172a;font-size:12px;font-weight:700;margin-bottom:5px;">' +
        f[1] +
        '</div>' +
        '<div style="color:#64748b;font-size:11px;line-height:1.6;">' +
        f[2] +
        '</div>' +
        '</td></tr></table></td>';
    }
    html += '</tr></table></td></tr>';
    return html;
  }

  private static String ctaBlock(String url, String label) {
    return '<tr><td align="center" style="padding:0 40px 44px;">' +
      '<a href="' +
      url +
      '" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:16px 52px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:0.04em;box-shadow:0 4px 20px rgba(99,102,241,0.3);">' +
      label +
      '</a>' +
      '</td></tr>';
  }

  private static String emailFooter(String token) {
    String unsubUrl =
      SITE_URL + (String.isNotBlank(token) ? '?unsubscribe=' + token : '');
    return '<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">' +
      '<p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">You are receiving this email because you subscribed to the Nexus newsletter.</p>' +
      '<p style="margin:0;">' +
      (String.isNotBlank(token)
        ? '<a href="' +
          unsubUrl +
          '" style="color:#94a3b8;font-size:11px;text-decoration:underline;">Unsubscribe</a>' +
          '<span style="color:#e2e8f0;margin:0 8px;">&bull;</span>'
        : '') +
      '<span style="color:#cbd5e1;font-size:11px;">&copy; 2026 Nexus Systems. All rights reserved.</span>' +
      '</p>' +
      '</td></tr>';
  }

  private static String escHtml(String val) {
    if (val == null)
      return '';
    return val.replace('&', '&amp;')
      .replace('<', '&lt;')
      .replace('>', '&gt;')
      .replace('"', '&quot;');
  }
}
