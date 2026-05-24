public without sharing class NewsletterController {
  private static final String SITE_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';
  private static final String PORTAL_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/customportal';
  private static final String CATALOG_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/?section=catalog';
  private static final String LOGIN_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';

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
        'Welcome to Nexus Newsletter — Your exclusives are waiting'
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
      mail.setSubject('New on Nexus: ' + p.Name);
      mail.setHtmlBody(buildNewProductHtml(p, token));
      mail.setSenderDisplayName('Nexus Newsletter');
      mail.setReplyTo('no-reply@nexus-systems.com');
      mail.setSaveAsActivity(false);
      mails.add(mail);
    }
    if (!mails.isEmpty()) {
      try {
        Messaging.sendEmail(mails, false);
      } catch (Exception e) {
        System.debug(
          LoggingLevel.ERROR,
          'Newsletter blast error: ' + e.getMessage()
        );
      }
    }
  }

  // ── Token helpers ────────────────────────────────────────────────────────
  private static String emailToToken(String email) {
    return EncodingUtil.base64Encode(Blob.valueOf(email))
      .replace('+', '-')
      .replace('/', '_')
      .replace('=', '');
  }

  private static String tokenToEmail(String token) {
    String b64 = token.replace('-', '+').replace('_', '/');
    Integer pad = Math.mod(4 - Math.mod(b64.length(), 4), 4);
    for (Integer i = 0; i < pad; i++)
      b64 += '=';
    return EncodingUtil.base64Decode(b64).toString().toLowerCase().trim();
  }

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
    html += vortexHero(
      'Welcome to<br/>Nexus.',
      'You\'re on the list. Get first access to new products, exclusive offers, and Nexus innovations.',
      CATALOG_URL,
      'Browse Catalogue'
    );
    html += confirmationBand(
      'Subscription confirmed.',
      'You\'ll be the first to know about new arrivals and exclusive deals.'
    );
    if (!products.isEmpty()) {
      html += productsBlock(products);
    }
    html += whyNexusBlock();
    html += ctaBlock(CATALOG_URL, 'Start exploring');
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
    String priceStr = price > 0 ? price.setScale(0) + ' €' : 'Price on request';
    String family = String.isNotBlank(p.Family)
      ? p.Family.toUpperCase()
      : 'PRODUCT';
    String descText = '';
    if (String.isNotBlank(p.Description))
      descText = p.Description.length() > 220
        ? p.Description.substring(0, 220) + '…'
        : p.Description;
    String startUrl = EncodingUtil.urlEncode(
      '/ss/s/customportal?productId=' + p.Id,
      'UTF-8'
    );
    String productUrl = LOGIN_URL + '?startURL=' + startUrl;

    String html = htmlOpen();
    html += vortexHero(
      'New on Nexus.',
      'A brand new product just landed — exclusive preview for subscribers.',
      productUrl,
      'Discover Now'
    );
    html += productDetailBlock(p, priceStr, family, descText, productUrl);
    html += exploreBlock();
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
      '</head><body style="margin:0;padding:0;background:#ebebeb;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#ebebeb;">' +
      '<tr><td align="center" style="padding:40px 16px;">' +
      '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">';
  }

  private static String htmlClose() {
    return '</table></td></tr></table></body></html>';
  }

  // Dark hero — Vortex inspired
  private static String vortexHero(
    String headline,
    String sub,
    String ctaUrl,
    String ctaLabel
  ) {
    return '<tr><td style="background:#0d1117;padding:44px 48px 56px;">' +
      '<table cellpadding="0" cellspacing="0" style="margin-bottom:64px;"><tr>' +
      '<td style="background:#16a34a;width:30px;height:30px;border-radius:5px;text-align:center;vertical-align:middle;">' +
      '<span style="color:#fff;font-size:15px;font-weight:900;line-height:30px;display:block;">N</span></td>' +
      '<td style="padding-left:10px;vertical-align:middle;">' +
      '<span style="color:#ffffff;font-size:15px;font-weight:800;letter-spacing:0.22em;">NEXUS</span></td>' +
      '</tr></table>' +
      '<h1 style="color:#ffffff;font-size:46px;font-weight:900;margin:0 0 18px;line-height:1.05;letter-spacing:-0.025em;">' +
      headline +
      '</h1>' +
      '<p style="color:#9ca3af;font-size:15px;line-height:1.75;margin:0 0 44px;max-width:380px;">' +
      sub +
      '</p>' +
      '<a href="' +
      ctaUrl +
      '" style="display:inline-block;border:2px solid rgba(255,255,255,0.9);color:#ffffff;text-decoration:none;padding:13px 36px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:0.04em;">' +
      ctaLabel +
      ' &rarr;</a>' +
      '</td></tr>';
  }

  // Confirmation band — welcome email only
  private static String confirmationBand(String title, String body) {
    return '<tr><td style="background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:26px 48px;">' +
      '<p style="color:#0a0a0a;font-size:14px;font-weight:700;margin:0 0 5px;">' +
      title +
      '</p>' +
      '<p style="color:#6b7280;font-size:13px;margin:0;line-height:1.6;">' +
      body +
      '</p>' +
      '</td></tr>';
  }

  // Product detail card — new product blast email
  private static String productDetailBlock(
    Product2 p,
    String priceStr,
    String family,
    String descText,
    String productUrl
  ) {
    String html = '<tr><td style="padding:48px 48px 40px;">';

    html +=
      '<div style="display:inline-block;background:#0a0a0a;color:#ffffff;' +
      'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;' +
      'padding:5px 14px;border-radius:4px;margin-bottom:22px;">' +
      family +
      '</div>';

    html +=
      '<h2 style="color:#0a0a0a;font-size:30px;font-weight:900;margin:0 0 16px;' +
      'line-height:1.1;letter-spacing:-0.02em;">' +
      escHtml(p.Name) +
      '</h2>';

    if (String.isNotBlank(descText)) {
      html +=
        '<p style="color:#555555;font-size:15px;line-height:1.75;margin:0 0 32px;' +
        'border-left:3px solid #e5e7eb;padding-left:18px;">' +
        escHtml(descText) +
        '</p>';
    }

    html +=
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td valign="middle">' +
      '<div style="color:#888888;font-size:10px;font-weight:700;text-transform:uppercase;' +
      'letter-spacing:0.14em;margin-bottom:6px;">Price</div>' +
      '<div style="color:#0a0a0a;font-size:38px;font-weight:900;line-height:1;letter-spacing:-0.025em;">' +
      priceStr +
      '</div>' +
      '</td>' +
      '<td align="right" valign="middle">' +
      '<a href="' +
      productUrl +
      '" style="display:inline-block;background:#0a0a0a;color:#ffffff;' +
      'text-decoration:none;padding:14px 34px;border-radius:50px;font-size:14px;font-weight:700;' +
      'letter-spacing:0.03em;">Buy Now</a>' +
      '</td></tr></table>';

    html += '</td></tr>';
    return html;
  }

  // Products list — welcome email, Vortex card style
  private static String productsBlock(List<Product2> products) {
    String html =
      '<tr><td style="padding:48px 48px 8px;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>' +
      '<td valign="middle">' +
      '<h2 style="color:#0a0a0a;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.02em;">Latest products.</h2>' +
      '</td>' +
      '<td align="right" valign="middle">' +
      '<a href="' +
      CATALOG_URL +
      '" style="display:inline-block;border:1.5px solid #0a0a0a;' +
      'color:#0a0a0a;text-decoration:none;padding:8px 20px;border-radius:50px;' +
      'font-size:12px;font-weight:700;letter-spacing:0.02em;">See All</a>' +
      '</td></tr></table>' +
      '</td></tr>';

    for (Product2 p : products) {
      Decimal price = 0;
      if (!p.PricebookEntries.isEmpty())
        price = p.PricebookEntries[0].UnitPrice;
      String priceStr = price > 0
        ? price.setScale(0) + ' €'
        : 'Price on request';
      String family = String.isNotBlank(p.Family)
        ? p.Family.toUpperCase()
        : 'PRODUCT';
      String snippet = '';
      if (String.isNotBlank(p.Description))
        snippet = p.Description.length() > 90
          ? p.Description.substring(0, 90) + '…'
          : p.Description;
      String productUrl = SITE_URL + '?productId=' + p.Id;

      html += '<tr><td style="padding:0 48px 16px;">';
      html += '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;">';

      if (
        String.isNotBlank(p.Image_URL__c) && p.Image_URL__c.startsWith('http')
      ) {
        html +=
          '<tr><td colspan="2" style="padding:0;background:#f5f5f5;">' +
          '<img src="' +
          escHtml(p.Image_URL__c) +
          '" width="100%" ' +
          'style="display:block;width:100%;height:160px;object-fit:cover;" alt="' +
          escHtml(p.Name) +
          '" /></td></tr>';
      }

      html +=
        '<tr>' +
        '<td style="padding:22px 24px;">' +
        '<div style="color:#888888;font-size:10px;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:0.15em;margin-bottom:8px;">' +
        family +
        '</div>' +
        '<div style="color:#0a0a0a;font-size:17px;font-weight:800;margin-bottom:8px;' +
        'letter-spacing:-0.01em;">' +
        escHtml(p.Name) +
        '</div>';

      if (String.isNotBlank(snippet))
        html +=
          '<div style="color:#6b7280;font-size:13px;line-height:1.65;margin-bottom:14px;">' +
          escHtml(snippet) +
          '</div>';

      html +=
        '<div style="color:#0a0a0a;font-size:20px;font-weight:900;letter-spacing:-0.02em;">' +
        priceStr +
        '</div>' +
        '</td>' +
        '<td width="130" align="right" valign="bottom" style="padding:22px 24px;">' +
        '<a href="' +
        productUrl +
        '" style="display:inline-block;background:#0a0a0a;color:#ffffff;' +
        'text-decoration:none;padding:11px 24px;border-radius:50px;font-size:13px;font-weight:700;' +
        'white-space:nowrap;">Buy Now</a>' +
        '</td></tr>';

      html += '</table></td></tr>';
    }

    return html;
  }

  // Why Nexus — dark section, Vortex dash style
  private static String whyNexusBlock() {
    String[][] feats = new List<String[]>{
      new List<String>{
        'Integrated AI',
        'Predictive analytics and personalised recommendations built into every product.'
      },
      new List<String>{
        'Real-time Stock',
        'Smart B2B inventory management with live availability data.'
      },
      new List<String>{
        'Maximum Security',
        'End-to-end encrypted data and fully secure transactions, always.'
      }
    };

    String html =
      '<tr><td style="background:#0d1117;padding:52px 48px 44px;">' +
      '<h2 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 40px;' +
      'letter-spacing:-0.02em;line-height:1.25;">' +
      'What we love about<br/>Nexus.' +
      '</h2>';

    for (Integer i = 0; i < feats.size(); i++) {
      String[] f = feats[i];
      String mb = (i < feats.size() - 1) ? 'margin-bottom:32px;' : '';
      html +=
        '<table width="100%" cellpadding="0" cellspacing="0" style="' +
        mb +
        '"><tr>' +
        '<td width="32" valign="top">' +
        '<div style="width:20px;height:2px;background:#ffffff;margin-top:9px;"></div>' +
        '</td>' +
        '<td>' +
        '<div style="color:#ffffff;font-size:15px;font-weight:700;margin-bottom:6px;">' +
        f[0] +
        '</div>' +
        '<div style="color:#6b7280;font-size:13px;line-height:1.7;">' +
        f[1] +
        '</div>' +
        '</td></tr></table>';
    }

    html += '</td></tr>';
    return html;
  }

  // CTA block — black pill button
  private static String ctaBlock(String url, String label) {
    return '<tr><td align="center" style="padding:48px 48px 52px;">' +
      '<a href="' +
      url +
      '" style="display:inline-block;background:#0a0a0a;color:#ffffff;' +
      'text-decoration:none;padding:16px 48px;border-radius:50px;font-size:15px;font-weight:700;' +
      'letter-spacing:0.03em;">' +
      label +
      ' &rarr;</a>' +
      '</td></tr>';
  }

  // Explore block — new product email
  private static String exploreBlock() {
    return '<tr><td style="background:#f9fafb;padding:26px 48px;">' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td valign="middle">' +
      '<div style="color:#0a0a0a;font-size:14px;font-weight:700;margin-bottom:3px;">Explore all Nexus products.</div>' +
      '<div style="color:#9ca3af;font-size:12px;">Browse our full catalogue of IoT &amp; AI innovations.</div>' +
      '</td>' +
      '<td align="right" valign="middle" style="padding-left:16px;">' +
      '<a href="' +
      LOGIN_URL +
      '" style="display:inline-block;background:#0a0a0a;color:#ffffff;' +
      'text-decoration:none;padding:10px 22px;border-radius:50px;font-size:12px;font-weight:700;' +
      'white-space:nowrap;">View All</a>' +
      '</td></tr></table>' +
      '</td></tr>';
  }

  // Footer
  private static String emailFooter(String token) {
    String unsubUrl =
      SITE_URL + (String.isNotBlank(token) ? '?unsubscribe=' + token : '');
    return '<tr><td style="border-top:1px solid #e5e7eb;padding:24px 48px;text-align:center;">' +
      '<p style="color:#9ca3af;font-size:12px;margin:0 0 8px;line-height:1.6;">' +
      'You are receiving this email because you subscribed to the Nexus newsletter.</p>' +
      '<p style="margin:0;">' +
      (String.isNotBlank(token)
        ? '<a href="' +
          unsubUrl +
          '" style="color:#9ca3af;font-size:11px;text-decoration:underline;">Unsubscribe</a>' +
          '<span style="color:#d1d5db;margin:0 8px;">&bull;</span>'
        : '') +
      '<span style="color:#d1d5db;font-size:11px;">&copy; 2026 Nexus Systems. All rights reserved.</span>' +
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
