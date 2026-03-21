/**
 * StripePaymentController
 * Handles Stripe Checkout Session creation, payment verification,
 * and Salesforce Order activation for the B2C portal.
 *
 * Required setup:
 *   1. Custom Metadata: Stripe_Config__mdt record "Default" with
 *      Secret_Key__c and Publishable_Key__c populated.
 *   2. Remote Site Setting: https://api.stripe.com (active).
 */
public without sharing class StripePaymentController {
  private static final String STRIPE_API = 'https://api.stripe.com/v1';
  private static final String CURRENCY_CODE = 'eur';

  // ── Inner classes ────────────────────────────────────────────────────────

  /** Cart item sent from LWC: must include productId, name, unitPrice, quantity */
  public class CartItemInput {
    public String productId;
    public String name;
    public Decimal unitPrice;
    public Integer quantity;
    public String imageUrl;
  }

  // ── Config helpers ───────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static Map<String, Decimal> getShippingConfig() {
    List<Stripe_Config__mdt> cfg = [
      SELECT Shipping_Amount__c, Free_Shipping_Threshold__c
      FROM Stripe_Config__mdt
      WHERE DeveloperName = 'Default'
      LIMIT 1
    ];
    Map<String, Decimal> result = new Map<String, Decimal>();
    result.put(
      'shippingAmount',
      cfg.isEmpty() || cfg[0].Shipping_Amount__c == null
        ? 45
        : cfg[0].Shipping_Amount__c
    );
    result.put(
      'freeShippingThreshold',
      cfg.isEmpty() || cfg[0].Free_Shipping_Threshold__c == null
        ? 5000
        : cfg[0].Free_Shipping_Threshold__c
    );
    return result;
  }

  @AuraEnabled(cacheable=true)
  public static String getPublishableKey() {
    List<Stripe_Config__mdt> cfg = [
      SELECT Publishable_Key__c
      FROM Stripe_Config__mdt
      WHERE DeveloperName = 'Default'
      LIMIT 1
    ];
    if (cfg.isEmpty())
      return '';
    return cfg[0].Publishable_Key__c;
  }

  private static String getSecretKey() {
    List<Stripe_Config__mdt> cfg = [
      SELECT Secret_Key__c
      FROM Stripe_Config__mdt
      WHERE DeveloperName = 'Default'
      LIMIT 1
    ];
    if (cfg.isEmpty()) {
      throw new AuraHandledException(
        'Stripe configuration introuvable. Créez un enregistrement Stripe_Config__mdt "Default".'
      );
    }
    return cfg[0].Secret_Key__c;
  }

  // ── Step 1 — Create a Draft Order in Salesforce ──────────────────────────
  // Called before redirecting to Stripe so we have an orderId to track.

  @AuraEnabled
  public static String createDraftOrder(
    String accountId,
    String cartItemsJson,
    String street,
    String city,
    String state,
    String zipCode,
    String country,
    Decimal shippingAmount,
    Decimal sparksDiscount
  ) {
    try {
      List<CartItemInput> cartItems = (List<CartItemInput>) JSON.deserialize(
        cartItemsJson,
        List<CartItemInput>.class
      );

      if (cartItems == null || cartItems.isEmpty()) {
        throw new AuraHandledException('Le panier est vide.');
      }

      // Resolve accountId via multiple strategies if not passed from LWC
      accountId = resolveAccountId(accountId);

      // Resolve standard pricebook
      List<Pricebook2> pbs = [
        SELECT Id
        FROM Pricebook2
        WHERE IsStandard = TRUE AND IsActive = TRUE
        LIMIT 1
      ];
      Id pbId = pbs.isEmpty()
        ? [SELECT Id FROM Pricebook2 WHERE IsActive = TRUE LIMIT 1].Id
        : pbs[0].Id;

      // Create Draft Order
      Order o = new Order();
      o.AccountId = accountId;
      o.Status = 'Draft';
      o.EffectiveDate = Date.today();
      o.Pricebook2Id = pbId;
      o.Shipping_Street__c = street;
      o.Shipping_City__c = city;
      o.Shipping_State__c = state;
      o.Shipping_Zip__c = zipCode;
      o.Shipping_Country__c = country;
      o.Shipping_Amount__c = shippingAmount != null ? shippingAmount : 0;
      o.Sparks_Discount__c = sparksDiscount != null ? sparksDiscount : 0;
      insert o;

      // Collect product IDs
      Set<Id> productIds = new Set<Id>();
      for (CartItemInput ci : cartItems)
        productIds.add(ci.productId);

      Map<Id, PricebookEntry> pbeMap = new Map<Id, PricebookEntry>();
      for (PricebookEntry pbe : [
        SELECT Id, UnitPrice, Product2Id
        FROM PricebookEntry
        WHERE
          Product2Id IN :productIds
          AND Pricebook2Id = :pbId
          AND IsActive = TRUE
      ]) {
        pbeMap.put(pbe.Product2Id, pbe);
      }

      // Create missing PricebookEntries on the fly using the cart price
      List<PricebookEntry> newPbes = new List<PricebookEntry>();
      Map<Id, Decimal> missingPrices = new Map<Id, Decimal>();
      for (CartItemInput ci : cartItems) {
        if (!pbeMap.containsKey((Id) ci.productId)) {
          missingPrices.put(
            (Id) ci.productId,
            ci.unitPrice != null ? ci.unitPrice : 0
          );
        }
      }
      if (!missingPrices.isEmpty()) {
        for (Id pid : missingPrices.keySet()) {
          newPbes.add(
            new PricebookEntry(
              Pricebook2Id = pbId,
              Product2Id = pid,
              UnitPrice = missingPrices.get(pid),
              IsActive = true
            )
          );
        }
        insert newPbes;
        for (PricebookEntry pbe : newPbes) {
          pbeMap.put(pbe.Product2Id, pbe);
        }
      }

      // Build Order Items
      List<OrderItem> items = new List<OrderItem>();
      for (CartItemInput ci : cartItems) {
        PricebookEntry pbe = pbeMap.get((Id) ci.productId);
        if (pbe == null)
          continue;
        OrderItem oi = new OrderItem();
        oi.OrderId = o.Id;
        oi.Product2Id = ci.productId;
        oi.PricebookEntryId = pbe.Id;
        oi.Quantity = ci.quantity;
        oi.UnitPrice = pbe.UnitPrice;
        items.add(oi);
      }
      if (!items.isEmpty())
        insert items;

      return o.Id;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Erreur lors de la création de la commande: ' + e.getMessage()
      );
    }
  }

  // ── Step 2a — Create Stripe EMBEDDED Checkout Session ───────────────────
  // ui_mode=embedded keeps the payment form inside your page (best practice).
  // Returns { clientSecret, sessionId } — clientSecret is used by Stripe.js
  // to mount the embedded checkout form directly on the page.

  @AuraEnabled
  public static Map<String, String> createEmbeddedCheckoutSession(
    String orderId,
    String cartItemsJson,
    String returnUrl
  ) {
    try {
      List<CartItemInput> cartItems = (List<CartItemInput>) JSON.deserialize(
        cartItemsJson,
        List<CartItemInput>.class
      );

      List<String> parts = new List<String>();
      parts.add('ui_mode=embedded');
      parts.add('mode=payment');
      parts.add('return_url=' + EncodingUtil.urlEncode(returnUrl, 'UTF-8'));
      parts.add(
        'metadata[orderId]=' + EncodingUtil.urlEncode(orderId, 'UTF-8')
      );

      Integer idx = 0;
      for (CartItemInput item : cartItems) {
        String p = 'line_items[' + idx + ']';
        parts.add(p + '[price_data][currency]=' + CURRENCY_CODE);
        parts.add(
          p +
            '[price_data][product_data][name]=' +
            EncodingUtil.urlEncode(
              item.name != null ? item.name : 'Produit',
              'UTF-8'
            )
        );
        Long amountCents = item.unitPrice != null
          ? (item.unitPrice * 100).longValue()
          : 0L;
        parts.add(p + '[price_data][unit_amount]=' + amountCents);
        parts.add(
          p + '[quantity]=' + (item.quantity != null ? item.quantity : 1)
        );
        idx++;
      }

      HttpRequest req = new HttpRequest();
      req.setEndpoint(STRIPE_API + '/checkout/sessions');
      req.setMethod('POST');
      req.setHeader('Authorization', 'Bearer ' + getSecretKey());
      req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
      req.setBody(String.join(parts, '&'));
      req.setTimeout(20000);

      HttpResponse res = new Http().send(req);
      Map<String, Object> resp = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );

      if (res.getStatusCode() != 200) {
        Map<String, Object> err = (Map<String, Object>) resp.get('error');
        String msg = err != null
          ? (String) err.get('message')
          : 'Erreur Stripe';
        throw new AuraHandledException('Stripe: ' + msg);
      }

      Map<String, String> result = new Map<String, String>();
      result.put('clientSecret', (String) resp.get('client_secret'));
      result.put('sessionId', (String) resp.get('id'));
      return result;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException('Erreur Stripe: ' + e.getMessage());
    }
  }

  // ── Step 2b — Create Stripe HOSTED Checkout Session (fallback) ───────────

  @AuraEnabled
  public static Map<String, String> createCheckoutSession(
    String orderId,
    String cartItemsJson,
    String successUrl,
    String cancelUrl,
    Decimal sparksDiscount
  ) {
    try {
      List<CartItemInput> cartItems = (List<CartItemInput>) JSON.deserialize(
        cartItemsJson,
        List<CartItemInput>.class
      );

      String couponId = null;
      if (sparksDiscount != null && sparksDiscount > 0) {
        couponId = createStripeCoupon(sparksDiscount);
      }

      String body = buildCheckoutBody(
        cartItems,
        orderId,
        successUrl,
        cancelUrl,
        couponId
      );

      HttpRequest req = new HttpRequest();
      req.setEndpoint(STRIPE_API + '/checkout/sessions');
      req.setMethod('POST');
      req.setHeader('Authorization', 'Bearer ' + getSecretKey());
      req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
      req.setBody(body);
      req.setTimeout(20000);

      HttpResponse res = new Http().send(req);
      Map<String, Object> resp = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );

      if (res.getStatusCode() != 200) {
        Map<String, Object> err = (Map<String, Object>) resp.get('error');
        String msg = err != null
          ? (String) err.get('message')
          : 'Erreur Stripe inconnue';
        throw new AuraHandledException('Stripe: ' + msg);
      }

      Map<String, String> result = new Map<String, String>();
      result.put('sessionId', (String) resp.get('id'));
      result.put('url', (String) resp.get('url'));
      return result;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException('Erreur Stripe: ' + e.getMessage());
    }
  }

  // ── Step 3 — Verify Payment & Activate Order ─────────────────────────────

  @AuraEnabled
  public static void verifyAndActivateOrder(String sessionId, String orderId) {
    try {
      // Call Stripe to check the session status
      HttpRequest req = new HttpRequest();
      req.setEndpoint(
        STRIPE_API +
          '/checkout/sessions/' +
          EncodingUtil.urlEncode(sessionId, 'UTF-8')
      );
      req.setMethod('GET');
      req.setHeader('Authorization', 'Bearer ' + getSecretKey());
      req.setTimeout(20000);

      HttpResponse res = new Http().send(req);
      Map<String, Object> session = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );

      if (res.getStatusCode() != 200) {
        throw new AuraHandledException(
          'Impossible de vérifier le paiement Stripe.'
        );
      }

      String paymentStatus = (String) session.get('payment_status');
      if (paymentStatus != 'paid') {
        throw new AuraHandledException(
          'Le paiement n\'est pas confirmé (statut: ' + paymentStatus + ').'
        );
      }

      // Verify the orderId in metadata matches
      Map<String, Object> metadata = (Map<String, Object>) session.get(
        'metadata'
      );
      String metaOrderId = metadata != null
        ? (String) metadata.get('orderId')
        : null;
      if (metaOrderId != orderId) {
        throw new AuraHandledException(
          'Incohérence de commande — paiement refusé.'
        );
      }

      // Activate the Salesforce Order
      String paymentIntentId = (String) session.get('payment_intent');
      Order o = new Order(Id = orderId, Status = 'Activated');
      if (String.isNotBlank(paymentIntentId)) {
        try {
          // Store payment intent ID if the field exists on Order
          o.put('Stripe_Payment_Intent_Id__c', paymentIntentId);
        } catch (Exception ex) {
          /* field not deployed yet — skip silently */
        }
      }
      update o;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Erreur de vérification: ' + e.getMessage()
      );
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Resolves the Salesforce Account Id for the current portal user.
   * Tries four strategies in order so both B2C (Person Account) and
   * B2B (Contact linked to Business Account) users are handled.
   * Last resort: creates a plain Account so the order never blocks.
   */
  private static String resolveAccountId(String passedId) {
    // 0. Use the value passed from LWC if it looks like a valid SF Id
    if (String.isNotBlank(passedId) && passedId.length() >= 15)
      return passedId;

    // 1. Via User.ContactId → Contact.AccountId  (standard community user)
    try {
      User u = [
        SELECT ContactId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      if (u.ContactId != null) {
        Contact c = [
          SELECT AccountId
          FROM Contact
          WHERE Id = :u.ContactId
          LIMIT 1
        ];
        if (c.AccountId != null)
          return String.valueOf(c.AccountId);
      }
    } catch (Exception ex) {
      /* ignore */
    }

    // 2. Via PersonEmail on Account  (B2C Person Account self-registration)
    try {
      String email = UserInfo.getUserEmail();
      List<Account> accts = Database.query(
        'SELECT Id FROM Account WHERE PersonEmail = \'' +
          String.escapeSingleQuotes(email) +
          '\' LIMIT 1'
      );
      if (!accts.isEmpty())
        return String.valueOf(accts[0].Id);
    } catch (Exception ex) {
      /* PersonEmail field may not exist */
    }

    // 3. Via Contact.Email → Account  (B2B portal user created from Lead)
    try {
      String email = UserInfo.getUserEmail();
      List<Contact> contacts = [
        SELECT AccountId
        FROM Contact
        WHERE Email = :email AND AccountId != NULL
        LIMIT 1
      ];
      if (!contacts.isEmpty())
        return String.valueOf(contacts[0].AccountId);
    } catch (Exception ex) {
      /* ignore */
    }

    // 4. Last resort — create a simple Account so the order is never blocked
    try {
      Account acc = new Account(Name = UserInfo.getName() + ' (B2C)');
      insert acc;
      return String.valueOf(acc.Id);
    } catch (Exception ex) {
      /* ignore */
    }

    throw new AuraHandledException(
      'Compte client introuvable. Veuillez contacter le support.'
    );
  }

  private static String createStripeCoupon(Decimal discountAmount) {
    Long discountCents = (discountAmount * 100).longValue();
    HttpRequest req = new HttpRequest();
    req.setEndpoint(STRIPE_API + '/coupons');
    req.setMethod('POST');
    req.setHeader('Authorization', 'Bearer ' + getSecretKey());
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.setBody(
      'amount_off=' +
        discountCents +
        '&currency=' +
        CURRENCY_CODE +
        '&duration=once'
    );
    req.setTimeout(20000);
    HttpResponse res = new Http().send(req);
    Map<String, Object> resp = (Map<String, Object>) JSON.deserializeUntyped(
      res.getBody()
    );
    if (res.getStatusCode() != 200) {
      throw new AuraHandledException(
        'Stripe coupon error: ' + resp.get('error')
      );
    }
    return (String) resp.get('id');
  }

  private static String buildCheckoutBody(
    List<CartItemInput> items,
    String orderId,
    String successUrl,
    String cancelUrl,
    String couponId
  ) {
    List<String> parts = new List<String>();

    parts.add('mode=payment');
    parts.add('success_url=' + EncodingUtil.urlEncode(successUrl, 'UTF-8'));
    parts.add('cancel_url=' + EncodingUtil.urlEncode(cancelUrl, 'UTF-8'));
    parts.add('metadata[orderId]=' + EncodingUtil.urlEncode(orderId, 'UTF-8'));
    if (String.isNotBlank(couponId)) {
      parts.add(
        'discounts[0][coupon]=' + EncodingUtil.urlEncode(couponId, 'UTF-8')
      );
    }

    Integer idx = 0;
    for (CartItemInput item : items) {
      String p = 'line_items[' + idx + ']';

      parts.add(p + '[price_data][currency]=' + CURRENCY_CODE);
      parts.add(
        p +
          '[price_data][product_data][name]=' +
          EncodingUtil.urlEncode(
            item.name != null ? item.name : 'Produit',
            'UTF-8'
          )
      );
      if (
        String.isNotBlank(item.imageUrl) && item.imageUrl.startsWith('https://')
      ) {
        parts.add(
          p +
            '[price_data][product_data][images][0]=' +
            EncodingUtil.urlEncode(item.imageUrl, 'UTF-8')
        );
      }

      // Convert price to smallest currency unit (cents)
      Long amountCents = (item.unitPrice != null)
        ? (item.unitPrice * 100).longValue()
        : 0L;
      parts.add(p + '[price_data][unit_amount]=' + amountCents);
      parts.add(
        p + '[quantity]=' + (item.quantity != null ? item.quantity : 1)
      );
      idx++;
    }

    return String.join(parts, '&');
  }
}
