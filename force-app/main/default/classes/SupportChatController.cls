/**
 * SupportChatController  — Nexus AI Support Chat
 *
 * Calls Einstein LLM via Prompt Builder (ConnectApi.EinsteinLLM) with a rich
 * system prompt + live customer context injected as the Prompt input.
 *
 * IMPORTANT: The "Nexus_Customer_Support_Chat" prompt template MUST be activated
 * in Setup → Einstein → Prompt Builder before Einstein will respond.
 * Until activated, the controller falls back to a smart rule-based engine.
 */
public without sharing class SupportChatController {
  // ── Response DTO ─────────────────────────────────────────────────────────

  public class ChatResponse {
    @AuraEnabled
    public String text;
    @AuraEnabled
    public List<ChatCard> cards;
    @AuraEnabled
    public List<String> chips;
  }

  public class ChatCard {
    @AuraEnabled
    public String title;
    @AuraEnabled
    public String subtitle;
    @AuraEnabled
    public String badge;
    @AuraEnabled
    public String badgeColor;
    @AuraEnabled
    public String imageUrl;
    @AuraEnabled
    public String price;
    @AuraEnabled
    public String meta;
  }

  // ── Entry point ──────────────────────────────────────────────────────────

  @AuraEnabled
  public static ChatResponse sendMessage(String userMessage, String accountId) {
    try {
      if (String.isBlank(userMessage)) {
        return simple(
          'Go ahead — ask me anything about Nexus!',
          defaultChips()
        );
      }
      if (accountId == null)
        accountId = '';

      // 1. Gather live customer context (all individually try/catched)
      String ctxAccount = fetchAccountContext(accountId);
      String ctxOrders = fetchOrderContext(accountId);
      String ctxQuotes = fetchQuoteContext(accountId);

      // 2. Build full prompt (system knowledge + customer context + question)
      String prompt = buildPrompt(
        userMessage,
        ctxAccount,
        ctxOrders,
        ctxQuotes
      );

      // 3a. Try Einstein via Prompt Builder (works for admin / licensed users)
      String aiReply = callEinstein(prompt);

      // 3b. If Einstein unavailable (e.g. community user license limit),
      //     try Claude API directly — works for all user types
      if (String.isBlank(aiReply)) {
        aiReply = callClaude(prompt);
      }

      if (String.isNotBlank(aiReply)) {
        return simple(aiReply.trim(), defaultChips());
      }

      // 4. Smart fallback when both AI services are unavailable
      return smartFallback(userMessage, accountId);
    } catch (Exception ex) {
      System.debug(
        '[NexusSupportChat] Fatal: ' +
          ex.getMessage() +
          '\n' +
          ex.getStackTraceString()
      );
      return smartFallback(
        userMessage != null ? userMessage : '',
        accountId != null ? accountId : ''
      );
    }
  }

  // ── Einstein call via Prompt Builder ────────────────────────────────────

  private static String callEinstein(String prompt) {
    try {
      ConnectApi.EinsteinPromptTemplateGenerationsInput tInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
      tInput.isPreview = false;
      tInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
      tInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

      Map<String, ConnectApi.WrappedValue> vals = new Map<String, ConnectApi.WrappedValue>();
      vals.put('Input:Prompt', wrapString(prompt));
      tInput.inputParams = vals;

      ConnectApi.EinsteinPromptTemplateGenerationsRepresentation resp = ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
        'Nexus_Customer_Support_Chat',
        tInput
      );

      if (
        resp != null &&
        resp.generations != null &&
        !resp.generations.isEmpty()
      ) {
        String text = resp.generations[0].text;
        System.debug('[NexusSupportChat] Einstein replied: ' + text);
        return text;
      }
    } catch (Exception ex) {
      // Typical reason: "No active template version" — activate the template in
      // Setup → Einstein → Prompt Builder → Nexus_Customer_Support_Chat → Activate
      System.debug(
        '[NexusSupportChat] Einstein unavailable (' +
          ex.getMessage() +
          '), using smart fallback'
      );
    }
    return null;
  }

  // ── Claude API call (fallback when Einstein license unavailable) ─────────

  private static String callClaude(String prompt) {
    try {
      NexusAISettings__c settings = NexusAISettings__c.getOrgDefaults();
      if (settings == null || String.isBlank(settings.ClaudeApiKey__c)) {
        System.debug('[NexusSupportChat] No Claude API key configured');
        return null;
      }

      HttpRequest req = new HttpRequest();
      req.setEndpoint('https://api.anthropic.com/v1/messages');
      req.setMethod('POST');
      req.setHeader('x-api-key', settings.ClaudeApiKey__c);
      req.setHeader('anthropic-version', '2023-06-01');
      req.setHeader('content-type', 'application/json');
      req.setTimeout(15000);

      // Build request body — send the prompt as a user message
      String body = JSON.serialize(
        new Map<String, Object>{
          'model' => 'claude-haiku-4-5-20251001',
          'max_tokens' => 500,
          'messages' => new List<Map<String, String>>{
            new Map<String, String>{ 'role' => 'user', 'content' => prompt }
          }
        }
      );
      req.setBody(body);

      HttpResponse res = new Http().send(req);

      if (res.getStatusCode() == 200) {
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(
          res.getBody()
        );
        List<Object> content = (List<Object>) parsed.get('content');
        if (content != null && !content.isEmpty()) {
          Map<String, Object> block = (Map<String, Object>) content[0];
          String text = (String) block.get('text');
          System.debug('[NexusSupportChat] Claude replied: ' + text);
          return text;
        }
      } else {
        System.debug(
          '[NexusSupportChat] Claude API error ' +
            res.getStatusCode() +
            ': ' +
            res.getBody()
        );
      }
    } catch (Exception ex) {
      System.debug('[NexusSupportChat] Claude call failed: ' + ex.getMessage());
    }
    return null;
  }

  // ── Prompt construction ──────────────────────────────────────────────────

  private static String buildPrompt(
    String question,
    String ctxAccount,
    String ctxOrders,
    String ctxQuotes
  ) {
    return SYSTEM_PROMPT +
      '\n\n--- LIVE CUSTOMER CONTEXT ---\n' +
      ctxAccount +
      '\n' +
      ctxOrders +
      '\n' +
      ctxQuotes +
      '\n' +
      '--- END CONTEXT ---\n\n' +
      'Customer message: ' +
      question +
      '\n\n' +
      'Nexus AI (respond helpfully and naturally in English, max 3 short paragraphs, use bullet points where appropriate):';
  }

  // ── Smart rule-based fallback ────────────────────────────────────────────
  // Used when Einstein is unavailable. Queries real data and gives rich answers.

  private static ChatResponse smartFallback(String msg, String accountId) {
    String lower = msg.toLowerCase();

    if (isGreeting(lower)) {
      return greetingResponse(accountId);
    }
    // Favorites / wishlist — must come before general product check
    if (
      containsAny(
        lower,
        new List<String>{
          'favorit',
          'wishlist',
          'saved product',
          'my saved',
          'my wish',
          'liked'
        }
      )
    ) {
      return favoritesResponse();
    }
    // Discount / price analysis on cart or quotes — before general quote check
    if (
      containsAny(
        lower,
        new List<String>{
          'discount',
          'will i get',
          'should i expect',
          'am i eligible',
          'qualify',
          'reduce',
          'lower price',
          'better price',
          'negotiate',
          'devis discount',
          'quote discount',
          'cart discount',
          'based on my cart',
          'volume',
          'bulk'
        }
      )
    ) {
      return discountAnalysisResponse(accountId);
    }
    // Combo / bundle recommendation
    if (
      containsAny(
        lower,
        new List<String>{
          'recommend',
          'suggest',
          'what should',
          'which product',
          'combo',
          'bundle',
          'build',
          'iot setup',
          'full setup',
          'complete solution',
          'what to buy'
        }
      )
    ) {
      return recommendationResponse(accountId);
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'order',
          'purchase',
          'commande',
          'track',
          'shipment',
          'delivery',
          'shipping',
          'transit',
          'delivered'
        }
      )
    ) {
      return ordersResponse(accountId, lower);
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'quote',
          'devis',
          'proposal',
          'formal quote',
          'quotation'
        }
      )
    ) {
      return quotesResponse(accountId, lower);
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'deal',
          'promo',
          'offer',
          'spark',
          'loyalty',
          'reward',
          'promotion',
          'new arrival'
        }
      )
    ) {
      return dealsResponse();
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'product',
          'catalog',
          'catalogue',
          'find',
          'search',
          'browse',
          'iot',
          'sensor',
          'connectivity',
          'computing',
          'sustainab',
          'hub',
          'gateway',
          'workstation',
          'camera',
          'monitor',
          'energy',
          'carbon'
        }
      )
    ) {
      return productsResponse(lower);
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'cart',
          'checkout',
          'basket',
          'payment',
          'stripe',
          'pay',
          'my cart'
        }
      )
    ) {
      return cartResponse();
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'account',
          'profile',
          'my info',
          'company',
          'password',
          'my profile',
          'my account'
        }
      )
    ) {
      return accountResponse(accountId);
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'support',
          'help',
          'contact',
          'issue',
          'problem',
          'case',
          'ticket'
        }
      )
    ) {
      return supportResponse();
    }
    if (
      containsAny(
        lower,
        new List<String>{
          'tab',
          'navigate',
          'where',
          'how',
          'portal',
          'dashboard',
          'wishlist'
        }
      )
    ) {
      return navigationResponse(lower);
    }
    return generalResponse(accountId);
  }

  // ── Fallback response builders ───────────────────────────────────────────

  private static ChatResponse favoritesResponse() {
    return simple(
      'Your **Favorites** tab shows all the products you\'ve hearted in the Catalog.\n\n' +
        'To get there: click the **Favorites** tab in the top navigation. From there you can add any saved product directly to your cart or request a quote.\n\n' +
        '_Note: favorites are saved to your current session. To keep them between visits, add products to your cart or request a formal quote._',
      new List<String>{ 'Browse catalog', 'My cart', 'Request a quote' }
    );
  }

  private static ChatResponse discountAnalysisResponse(String accountId) {
    // Pull quote total + order total to assess volume
    Decimal totalQuoteValue = 0;
    Decimal totalOrderValue = 0;
    Integer quoteCount = 0;
    Integer orderCount = 0;
    try {
      if (String.isNotBlank(accountId)) {
        for (AggregateResult ar : [
          SELECT COUNT(Id) cnt, SUM(GrandTotal__c) total
          FROM TALEXO_Quote__c
          WHERE Opportunity__r.AccountId = :accountId
        ]) {
          quoteCount = ar.get('cnt') != null
            ? Integer.valueOf(ar.get('cnt'))
            : 0;
          totalQuoteValue = ar.get('total') != null
            ? (Decimal) ar.get('total')
            : 0;
        }
        for (AggregateResult ar : [
          SELECT COUNT(Id) cnt, SUM(TotalAmount) total
          FROM Order
          WHERE AccountId = :accountId
        ]) {
          orderCount = ar.get('cnt') != null
            ? Integer.valueOf(ar.get('cnt'))
            : 0;
          totalOrderValue = ar.get('total') != null
            ? (Decimal) ar.get('total')
            : 0;
        }
      }
    } catch (Exception ex) {
    }

    String volumeVerdict;
    if (totalQuoteValue >= 50000 || totalOrderValue >= 50000) {
      volumeVerdict =
        '✅ **High-volume customer** — based on your quote and order history ($' +
        (totalQuoteValue + totalOrderValue).setScale(0).toPlainString() +
        ' total value), you are very likely eligible for **custom volume pricing**. ' +
        'Request a formal quote and our sales team will apply negotiated rates.';
    } else if (totalQuoteValue >= 10000 || totalOrderValue >= 10000) {
      volumeVerdict =
        '🟡 **Mid-volume customer** — your total history ($' +
        (totalQuoteValue + totalOrderValue).setScale(0).toPlainString() +
        ') qualifies you to request volume pricing. Add your items to cart and click **Request Formal Quote** — our team evaluates each request individually.';
    } else {
      volumeVerdict =
        'Your current history is under the typical volume threshold for automatic discounts, but you can always request a formal quote — our sales team considers every request.\n' +
        'Currently applicable discounts:\n' +
        '• **5% off** new arrivals (look for the "New" badge)\n' +
        '• **Combo Builder** — save $20 per slot on bundles\n' +
        '• **Nexus Sparks** — redeem loyalty points at checkout';
    }

    return simple(
      volumeVerdict +
        '\n\n' +
        'To maximise savings: use the **Combo Builder** for bundle discounts, redeem **Sparks** at checkout, and for large orders always **Request a Formal Quote** so our team can offer the best B2B pricing.',
      new List<String>{
        'Request a quote',
        'Build a combo',
        'My quotes',
        'Current deals'
      }
    );
  }

  private static ChatResponse recommendationResponse(String accountId) {
    // Recommend based on what they've bought before
    List<String> categories = new List<String>();
    try {
      if (String.isNotBlank(accountId)) {
        List<Order> orders = [
          SELECT Description
          FROM Order
          WHERE AccountId = :accountId
          ORDER BY EffectiveDate DESC NULLS LAST
          LIMIT 5
        ];
        for (Order o : orders) {
          String d = o.Description.toLowerCase();
          if (d.contains('sensor') || d.contains('monitor'))
            categories.add('Sensors & Monitoring');
          if (
            d.contains('comput') ||
            d.contains('edge') ||
            d.contains('workstation')
          )
            categories.add('Computing');
          if (
            d.contains('connect') ||
            d.contains('hub') ||
            d.contains('gateway')
          )
            categories.add('Connectivity');
          if (
            d.contains('energy') ||
            d.contains('carbon') ||
            d.contains('sustain')
          )
            categories.add('Sustainability');
        }
      }
    } catch (Exception ex) {
    }

    String catHint = categories.isEmpty()
      ? ''
      : '\n\nBased on your order history, you\'ve purchased from **' +
        categories[0] +
        '** — you may also want to explore complementary products in the Catalog.';

    return simple(
      'Here\'s what I\'d recommend exploring on Nexus:\n\n' +
        '• **Combo Builder** — our most popular way to save. Pick 3–5 products and save $20 per slot. Perfect if you\'re building a complete IoT setup\n' +
        '• **New Arrivals** — browse the Catalog and filter by "New" to see the latest additions with 5% off\n' +
        '• **Sensors + Edge Node bundle** — a top B2B combination for monitoring and local processing\n' +
        '• **Energy Monitoring + Carbon Tracking** — popular with sustainability-focused businesses' +
        catHint +
        '\n\nWant me to help you build a quote for any of these?',
      new List<String>{
        'Build a combo',
        'Browse catalog',
        'Request a quote',
        'Current deals'
      }
    );
  }

  private static ChatResponse greetingResponse(String accountId) {
    String name = '';
    try {
      if (String.isNotBlank(accountId)) {
        List<Account> accs = [
          SELECT Name
          FROM Account
          WHERE Id = :accountId
          LIMIT 1
        ];
        if (!accs.isEmpty())
          name = ' ' + accs[0].Name.split(' ')[0];
      }
    } catch (Exception ex) {
    }
    return simple(
      'Hi' +
        name +
        '! I\'m Nexus AI — your intelligent support assistant.\n\n' +
        'I can help you with orders, quotes, products, current deals, Sparks loyalty points, and anything about the portal. What can I do for you today?',
      new List<String>{
        'My orders',
        'My quotes',
        'Current deals',
        'Find products'
      }
    );
  }

  private static ChatResponse ordersResponse(String accountId, String lower) {
    List<ChatCard> cards = fetchOrderCards(accountId);
    if (!cards.isEmpty()) {
      ChatResponse r = new ChatResponse();
      r.text = containsAny(
          lower,
          new List<String>{ 'track', 'transit', 'ship', 'deliver', 'status' }
        )
        ? 'Here are your recent orders with their current status. Go to the **Orders** tab for full tracking details:'
        : 'Here are your most recent orders:';
      r.cards = cards;
      r.chips = new List<String>{
        'My quotes',
        'Browse products',
        'Contact support'
      };
      return r;
    }
    return simple(
      'You haven\'t placed any orders yet.\n\nHead to the **Catalog** tab to browse products. When you\'re ready, add to cart and check out via Stripe — or request a formal quote instead.',
      new List<String>{ 'Browse catalog', 'Current deals', 'My quotes' }
    );
  }

  private static ChatResponse quotesResponse(String accountId, String lower) {
    if (
      containsAny(
        lower,
        new List<String>{
          'request',
          'create',
          'new',
          'ask for',
          'submit',
          'how',
          'get a'
        }
      )
    ) {
      return simple(
        'To request a formal B2B quote:\n' +
          '• **From the cart** — add products, open the cart slider (right side), click "Request Formal Quote"\n' +
          '• **From the Quotes tab** — click "New B2B Quote Request"\n\n' +
          'Our team responds within 1–2 business days with a tailored quote.',
        new List<String>{ 'My quotes', 'Browse catalog', 'Contact support' }
      );
    }
    if (
      containsAny(
        lower,
        new List<String>{ 'accept', 'sign', 'approve', 'reject', 'decline' }
      )
    ) {
      return simple(
        'To respond to a quote, go to the **Quotes (Devis)** tab → click the quote → choose **Accept** (triggers e-signature) or **Reject** (send feedback to sales).',
        new List<String>{ 'My quotes', 'My orders', 'Contact support' }
      );
    }
    List<ChatCard> cards = fetchQuoteCards(accountId);
    if (!cards.isEmpty()) {
      ChatResponse r = new ChatResponse();
      r.text = 'Here are your latest quotes. Go to the **Quotes** tab to view details, accept, or reject:';
      r.cards = cards;
      r.chips = new List<String>{
        'My orders',
        'Request a quote',
        'Browse products'
      };
      return r;
    }
    return simple(
      'No quotes yet. To request one, add products to cart and click "Request Formal Quote" — or use the **Quotes** tab.',
      new List<String>{ 'Browse catalog', 'My orders', 'Contact support' }
    );
  }

  private static ChatResponse dealsResponse() {
    return simple(
      'Current Nexus promotions:\n' +
        '• **New Arrivals** — 5% off all products with the "New" badge in the Catalog\n' +
        '• **Combo Builder** — build an IoT bundle, save $20 per component slot filled\n' +
        '• **Nexus Sparks** — 100 Sparks = $1 off at checkout; earn on every purchase; mature in 30 days, expire after 90\n' +
        '• **Volume pricing** — request a formal quote for large-volume orders',
      new List<String>{
        'Build a combo',
        'Browse catalog',
        'My orders',
        'How do Sparks work?'
      }
    );
  }

  private static ChatResponse productsResponse(String lower) {
    String detail = '';
    if (
      containsAny(
        lower,
        new List<String>{
          'sensor',
          'neural',
          'environmental',
          'camera',
          'visual',
          'monitor'
        }
      )
    ) {
      detail = '\n\nFor **Sensors & Monitoring**: Environmental Sensors, Visual Monitoring Cameras, Neural Sensors.';
    } else if (
      containsAny(
        lower,
        new List<String>{ 'computing', 'workstation', 'edge', 'quantum' }
      )
    ) {
      detail = '\n\nFor **Computing**: Workstations, Edge Nodes, Quantum Computing units.';
    } else if (
      containsAny(
        lower,
        new List<String>{ 'hub', 'gateway', 'bridge', 'wireless', 'connect' }
      )
    ) {
      detail = '\n\nFor **Connectivity**: IoT Hubs & Gateways, Protocol Bridges, Wireless Modules.';
    } else if (
      containsAny(
        lower,
        new List<String>{ 'energy', 'carbon', 'sustainab', 'green' }
      )
    ) {
      detail = '\n\nFor **Sustainability**: Energy Monitoring Systems, Carbon Tracking Devices.';
    }
    return simple(
      'Head to the **Catalog** tab to browse all products:\n' +
        '• Computing — Workstations, Edge Nodes, Quantum units\n' +
        '• Connectivity — Hubs, Gateways, Bridges, Wireless\n' +
        '• Sensors & Monitoring — Environmental, Visual, Neural\n' +
        '• Sustainability — Energy, Carbon Tracking\n\n' +
        'Filter by category, brand, price range, and availability. New arrivals carry a 5% discount.' +
        detail,
      new List<String>{ 'Current deals', 'Build a combo', 'Request a quote' }
    );
  }

  private static ChatResponse cartResponse() {
    return simple(
      'Your cart is in the slider on the right side of the screen. From there:\n' +
        '• Adjust quantities or remove items\n' +
        '• Apply **Nexus Sparks** for a discount\n' +
        '• **Checkout** via Stripe (free standard shipping)\n' +
        '• **Request Formal Quote** for B2B procurement',
      new List<String>{ 'Browse catalog', 'My orders', 'Current deals' }
    );
  }

  private static ChatResponse accountResponse(String accountId) {
    String info = '';
    try {
      if (String.isNotBlank(accountId)) {
        List<Account> accs = [
          SELECT Name, Industry, BillingCity, BillingCountry
          FROM Account
          WHERE Id = :accountId
          LIMIT 1
        ];
        if (!accs.isEmpty()) {
          Account a = accs[0];
          info =
            '\n\nYour company: **' +
            a.Name +
            '**' +
            (String.isNotBlank(a.Industry) ? ' | ' + a.Industry : '') +
            (String.isNotBlank(a.BillingCity)
              ? ' | ' +
                a.BillingCity +
                (String.isNotBlank(a.BillingCountry)
                  ? ', ' + a.BillingCountry
                  : '')
              : '');
        }
      }
    } catch (Exception ex) {
    }
    return simple(
      'Manage your profile in the **Profile** tab — update personal details, change password, and view company info.' +
      info,
      new List<String>{ 'My orders', 'My quotes', 'Contact support' }
    );
  }

  private static ChatResponse supportResponse() {
    return simple(
      'For technical issues, billing, or returns, go to the **Support** tab to open a case.\n\n' +
      'Response SLA: 4 business hours (standard), 1 hour (critical). I\'m also here anytime!',
      new List<String>{ 'My orders', 'My quotes', 'Browse products' }
    );
  }

  private static ChatResponse navigationResponse(String lower) {
    return simple(
      'Nexus portal tabs:\n' +
        '• **Dashboard** — overview & AI recommendations\n' +
        '• **Catalog** — browse & add to cart\n' +
        '• **Favorites** — wishlisted products\n' +
        '• **Orders** — order history & tracking\n' +
        '• **Quotes (Devis)** — formal B2B quotes\n' +
        '• **Combo Deals** — bundle savings\n' +
        '• **Profile** — account settings\n' +
        '• **Support** — open a support case',
      defaultChips()
    );
  }

  private static ChatResponse generalResponse(String accountId) {
    Integer orderCount = 0;
    Integer quoteCount = 0;
    try {
      if (String.isNotBlank(accountId)) {
        orderCount = [SELECT COUNT() FROM Order WHERE AccountId = :accountId];
        quoteCount = [
          SELECT COUNT()
          FROM TALEXO_Quote__c
          WHERE Opportunity__r.AccountId = :accountId
        ];
      }
    } catch (Exception ex) {
    }
    String ctx = (orderCount > 0 ||
      quoteCount > 0)
      ? '\n\nI can see you have ' +
        (orderCount > 0
          ? orderCount + ' order' + (orderCount > 1 ? 's' : '')
          : '') +
        (orderCount > 0 && quoteCount > 0 ? ' and ' : '') +
        (quoteCount > 0
          ? quoteCount + ' quote' + (quoteCount > 1 ? 's' : '')
          : '') +
        ' on file. Would you like details?'
      : '';
    return simple(
      'I can help you with anything about the Nexus portal — orders, quotes, products, deals, Sparks, checkout, or navigation. What would you like to know?' +
      ctx,
      defaultChips()
    );
  }

  // ── Context fetchers ─────────────────────────────────────────────────────

  private static String fetchAccountContext(String accountId) {
    try {
      if (String.isBlank(accountId))
        return 'Account: Not identified';
      List<Account> accs = [
        SELECT Name, Industry, BillingCity, BillingCountry
        FROM Account
        WHERE Id = :accountId
        LIMIT 1
      ];
      if (accs.isEmpty())
        return 'Account: Not found';
      Account a = accs[0];
      return 'Account: ' +
        a.Name +
        (String.isNotBlank(a.Industry) ? ' | Industry: ' + a.Industry : '') +
        (String.isNotBlank(a.BillingCity)
          ? ' | Location: ' + a.BillingCity
          : '') +
        (String.isNotBlank(a.BillingCountry) ? ', ' + a.BillingCountry : '');
    } catch (Exception ex) {
      return 'Account: Unavailable';
    }
  }

  private static String fetchOrderContext(String accountId) {
    try {
      if (String.isBlank(accountId))
        return 'Orders: None';
      List<Order> orders = [
        SELECT OrderNumber, Status, TotalAmount, EffectiveDate
        FROM Order
        WHERE AccountId = :accountId
        ORDER BY EffectiveDate DESC NULLS LAST
        LIMIT 5
      ];
      if (orders.isEmpty())
        return 'Orders: No orders yet';
      List<String> lines = new List<String>();
      for (Order o : orders) {
        lines.add(
          '#' +
            o.OrderNumber +
            ' — ' +
            (o.Status != null ? o.Status : 'Unknown') +
            (o.TotalAmount != null
              ? ' — $' + o.TotalAmount.setScale(2).toPlainString()
              : '') +
            (o.EffectiveDate != null
              ? ' (' + o.EffectiveDate.format() + ')'
              : '')
        );
      }
      return 'Orders (recent first):\n' + String.join(lines, '\n');
    } catch (Exception ex) {
      return 'Orders: Unavailable';
    }
  }

  private static String fetchQuoteContext(String accountId) {
    try {
      if (String.isBlank(accountId))
        return 'Quotes: None';
      List<TALEXO_Quote__c> quotes = [
        SELECT Name, Status__c, GrandTotal__c, ExpirationDate__c
        FROM TALEXO_Quote__c
        WHERE Opportunity__r.AccountId = :accountId
        ORDER BY CreatedDate DESC NULLS LAST
        LIMIT 5
      ];
      if (quotes.isEmpty())
        return 'Quotes: No quotes yet';
      List<String> lines = new List<String>();
      for (TALEXO_Quote__c q : quotes) {
        lines.add(
          q.Name +
            ' — ' +
            (q.Status__c != null ? q.Status__c : 'Pending') +
            (q.GrandTotal__c != null
              ? ' — $' + q.GrandTotal__c.setScale(2).toPlainString()
              : '') +
            (q.ExpirationDate__c != null
              ? ' (expires ' + q.ExpirationDate__c.format() + ')'
              : '')
        );
      }
      return 'Quotes (recent first):\n' + String.join(lines, '\n');
    } catch (Exception ex) {
      return 'Quotes: Unavailable';
    }
  }

  private static List<ChatCard> fetchOrderCards(String accountId) {
    List<ChatCard> cards = new List<ChatCard>();
    try {
      if (String.isBlank(accountId))
        return cards;
      for (Order o : [
        SELECT OrderNumber, Status, TotalAmount, EffectiveDate
        FROM Order
        WHERE AccountId = :accountId
        ORDER BY EffectiveDate DESC NULLS LAST
        LIMIT 4
      ]) {
        ChatCard c = new ChatCard();
        c.title = 'Order #' + o.OrderNumber;
        c.subtitle = o.EffectiveDate != null
          ? 'Placed: ' + o.EffectiveDate.format()
          : '';
        c.price = o.TotalAmount != null
          ? '$' + o.TotalAmount.setScale(2).toPlainString()
          : '';
        c.badge = o.Status != null ? o.Status : 'Processing';
        c.badgeColor = getBadgeOrder(o.Status);
        cards.add(c);
      }
    } catch (Exception ex) {
    }
    return cards;
  }

  private static List<ChatCard> fetchQuoteCards(String accountId) {
    List<ChatCard> cards = new List<ChatCard>();
    try {
      if (String.isBlank(accountId))
        return cards;
      for (TALEXO_Quote__c q : [
        SELECT Name, Status__c, GrandTotal__c, ExpirationDate__c
        FROM TALEXO_Quote__c
        WHERE Opportunity__r.AccountId = :accountId
        ORDER BY CreatedDate DESC NULLS LAST
        LIMIT 4
      ]) {
        ChatCard c = new ChatCard();
        c.title = q.Name;
        c.price = q.GrandTotal__c != null
          ? '$' + q.GrandTotal__c.setScale(2).toPlainString()
          : '';
        c.badge = q.Status__c != null ? q.Status__c : 'Pending';
        c.badgeColor = getBadgeQuote(q.Status__c);
        c.meta = q.ExpirationDate__c != null
          ? 'Expires: ' + q.ExpirationDate__c.format()
          : '';
        cards.add(c);
      }
    } catch (Exception ex) {
    }
    return cards;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private static Boolean isGreeting(String lower) {
    return containsAny(
        lower,
        new List<String>{
          'hello',
          'hi ',
          'hey',
          'bonjour',
          'salut',
          'good morning',
          'good afternoon',
          'howdy',
          'greeting'
        }
      ) ||
      lower.equals('hi') ||
      lower.equals('hey') ||
      lower.equals('greeting') ||
      lower.length() < 5;
  }

  private static Boolean containsAny(String s, List<String> keywords) {
    for (String kw : keywords) {
      if (s.contains(kw))
        return true;
    }
    return false;
  }

  private static ChatResponse simple(String text, List<String> chips) {
    ChatResponse r = new ChatResponse();
    r.text = text;
    r.chips = chips;
    return r;
  }

  private static List<String> defaultChips() {
    return new List<String>{
      'My orders',
      'My quotes',
      'Current deals',
      'Find products'
    };
  }

  private static String getBadgeOrder(String s) {
    if (s == null)
      return 'blue';
    String l = s.toLowerCase();
    if (l.contains('deliver') || l.contains('complet'))
      return 'green';
    if (l.contains('cancel'))
      return 'red';
    if (l.contains('ship') || l.contains('transit'))
      return 'amber';
    return 'blue';
  }

  private static String getBadgeQuote(String s) {
    if (s == null)
      return 'blue';
    String l = s.toLowerCase();
    if (l.contains('accept'))
      return 'green';
    if (l.contains('reject') || l.contains('expir'))
      return 'red';
    if (l.contains('sent') || l.contains('review'))
      return 'amber';
    return 'blue';
  }

  private static ConnectApi.WrappedValue wrapString(String val) {
    ConnectApi.WrappedValue wv = new ConnectApi.WrappedValue();
    wv.value = val != null ? val : '';
    return wv;
  }

  // ── System prompt — Nexus platform knowledge ─────────────────────────────

  private static final String SYSTEM_PROMPT =
    'You are Nexus AI, the intelligent support assistant embedded in the Nexus B2B e-commerce customer portal. ' +
    'You are knowledgeable, warm, professional, and concise. Always respond in English. ' +
    'Help customers with ANYTHING — product questions, order status, quotes, promotions, portal navigation, general advice. ' +
    'Never invent order numbers, quote IDs, or prices not in the context. ' +
    'If a specific detail is missing from context, say so and direct the customer to the right portal tab.\n\n' +
    '--- PLATFORM KNOWLEDGE ---\n' +
    'ABOUT NEXUS: B2B e-commerce platform for IoT and industrial technology. Customers are businesses buying ' +
    'computing infrastructure, connectivity solutions, sensors, and sustainability monitoring devices.\n\n' +
    'PRODUCT CATEGORIES:\n' +
    '• Computing: Workstations, Edge Nodes, Quantum Computing units\n' +
    '• Connectivity: Hubs & Gateways, Bridges, Wireless Modules\n' +
    '• Sensors & Monitoring: Environmental, Visual Monitoring, Neural Sensors\n' +
    '• Sustainability: Energy Monitoring, Carbon Tracking\n\n' +
    'PORTAL TABS:\n' +
    '• Dashboard — overview, AI recommendations, recent orders\n' +
    '• Catalog — browse/filter/search all products\n' +
    '• Favorites — wishlisted products\n' +
    '• Orders — order history and shipment tracking\n' +
    '• Quotes (Devis) — view/accept/reject/request B2B quotes\n' +
    '• My Cart — review items, apply Sparks, checkout or request quote\n' +
    '• Profile — update personal/company info, change password\n' +
    '• Combo Deals — pre-configured solution bundles\n' +
    '• Support — open and track support cases\n\n' +
    'PROMOTIONS & LOYALTY:\n' +
    '• New Arrivals: 5% discount on all new products\n' +
    '• Combo Builder: save $20 per component slot filled in a bundle\n' +
    '• Nexus Sparks: 100 Sparks = $1.00 off; earn on every purchase; mature 30 days, expire 90 days\n' +
    '• Volume pricing: request a formal quote for large orders\n\n' +
    'ORDERING: Add to cart from Catalog or Combo Deals → checkout via Stripe (free shipping) or request formal quote.\n\n' +
    'QUOTES: Request from cart slider ("Request Formal Quote") or Quotes tab → sales team prepares tailored quote ' +
    '→ customer accepts (e-signature) or rejects (with feedback) in Quotes tab. Quotes have expiration dates.\n\n' +
    'SHIPPING: Free standard shipping. Statuses: Processing → Shipped → In Transit → Delivered. Track in Orders tab.\n\n' +
    'SUPPORT: Support tab for cases. 4-hour response SLA standard; 1-hour critical.\n' +
    '--- END PLATFORM KNOWLEDGE ---';
}
