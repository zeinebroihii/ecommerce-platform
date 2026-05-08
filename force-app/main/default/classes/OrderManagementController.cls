public without sharing class OrderManagementController {
  // ── Wrappers ─────────────────────────────────────────────────────────────

  public class OrderDetail {
    @AuraEnabled
    public Id orderId;
    @AuraEnabled
    public String orderNumber;
    @AuraEnabled
    public String account;
    @AuraEnabled
    public Id accountId;
    @AuraEnabled
    public String orderDate;
    @AuraEnabled
    public Decimal totalAmount;
    @AuraEnabled
    public String formattedTotal;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Integer itemCount;
    @AuraEnabled
    public String shippingAddress;
    @AuraEnabled
    public Decimal shippingAmount;
    @AuraEnabled
    public String formattedShipping;
    @AuraEnabled
    public Decimal sparksDiscount;
    @AuraEnabled
    public String formattedSparksDiscount;
    @AuraEnabled
    public Boolean hasSparksDiscount;
    @AuraEnabled
    public String shippedDate;
    @AuraEnabled
    public String deliveredDate;
    @AuraEnabled
    public String paymentMethod;
    @AuraEnabled
    public String paymentDeadline;
    @AuraEnabled
    public List<OrderLineItem> lineItems;
  }

  public class OrderLineItem {
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public Integer quantity;
    @AuraEnabled
    public Decimal unitPrice;
    @AuraEnabled
    public Decimal totalPrice;
    @AuraEnabled
    public String formattedUnitPrice;
    @AuraEnabled
    public String formattedTotal;
    @AuraEnabled
    public String imageUrl;
  }

  // ── Recent Activity feed ──────────────────────────────────────────────────

  public class ActivityItem implements Comparable {
    @AuraEnabled
    public String itemId;
    @AuraEnabled
    public String type; // Order | Quote
    @AuraEnabled
    public String title;
    @AuraEnabled
    public String subtitle;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String icon;
    @AuraEnabled
    public Long ts; // epoch ms — used by JS for keying
    @AuraEnabled
    public String dateLabel;
    public Integer compareTo(Object o) {
      ActivityItem other = (ActivityItem) o;
      if (this.ts > other.ts)
        return -1;
      if (this.ts < other.ts)
        return 1;
      return 0;
    }
  }

  @AuraEnabled
  public static List<ActivityItem> getRecentActivity() {
    Id accountId = resolvePortalAccountId();
    if (accountId == null)
      return new List<ActivityItem>();

    List<ActivityItem> items = new List<ActivityItem>();
    Datetime now = Datetime.now();

    // Recent Orders
    for (Order o : [
      SELECT Id, OrderNumber, Status, LastModifiedDate, Account.Name
      FROM Order
      WHERE AccountId = :accountId
      ORDER BY LastModifiedDate DESC
      LIMIT 5
    ]) {
      ActivityItem a = new ActivityItem();
      a.itemId = o.Id;
      a.type = 'Order';
      a.title = 'Commande #' + o.OrderNumber;
      a.subtitle = o.Account != null ? o.Account.Name : '';
      a.status = translateOrderStatus(o.Status);
      a.icon = 'utility:package';
      a.ts = o.LastModifiedDate.getTime();
      a.dateLabel = relativeDateFr(o.LastModifiedDate, now);
      items.add(a);
    }

    // Recent Quotes
    try {
      for (TALEXO_Quote__c q : [
        SELECT Id, Name, Status__c, LastModifiedDate
        FROM TALEXO_Quote__c
        WHERE Opportunity__r.AccountId = :accountId
        ORDER BY LastModifiedDate DESC
        LIMIT 5
      ]) {
        ActivityItem a = new ActivityItem();
        a.itemId = q.Id;
        a.type = 'Quote';
        a.title = q.Name;
        a.subtitle = 'Devis';
        a.status = q.Status__c != null ? q.Status__c : 'Draft';
        a.icon = 'utility:file';
        a.ts = q.LastModifiedDate.getTime();
        a.dateLabel = relativeDateFr(q.LastModifiedDate, now);
        items.add(a);
      }
    } catch (Exception ex) {
      System.debug(
        '[OrderMgmt] Quote activity query skipped: ' + ex.getMessage()
      );
    }

    items.sort();
    List<ActivityItem> result = new List<ActivityItem>();
    Integer topN = Math.min(8, items.size());
    for (Integer i = 0; i < topN; i++)
      result.add(items[i]);
    return result;
  }

  private static Id resolvePortalAccountId() {
    try {
      User u = [
        SELECT ContactId, Contact.AccountId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      return u.Contact?.AccountId;
    } catch (Exception e) {
      return null;
    }
  }

  private static String relativeDateFr(Datetime dt, Datetime now) {
    Long diffMs = now.getTime() - dt.getTime();
    Long diffMin = diffMs / 60000;
    if (diffMin < 2)
      return 'À l\'instant';
    if (diffMin < 60)
      return 'Il y a ' + diffMin + ' min';
    Long diffH = diffMin / 60;
    if (diffH < 24)
      return 'Il y a ' + diffH + 'h';
    Long diffD = diffH / 24;
    if (diffD == 1)
      return 'Hier';
    if (diffD < 7)
      return 'Il y a ' + diffD + ' jours';
    return dt.format('dd/MM/yyyy');
  }

  private static String translateOrderStatus(String s) {
    if (s == 'Activated')
      return 'Activée';
    if (s == 'Draft')
      return 'Brouillon';
    if (s == 'Shipped')
      return 'Expédiée';
    if (s == 'Delivered')
      return 'Livrée';
    if (s == 'Cancelled')
      return 'Annulée';
    return s != null ? s : 'En cours';
  }

  // ── Portal: orders for the current logged-in user ─────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<OrderDetail> getMyOrders() {
    Id accountId = null;
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
        accountId = c.AccountId;
      }
    } catch (Exception ex) {
      /* guest or no contact */
    }

    if (accountId == null)
      return new List<OrderDetail>();

    List<OrderDetail> result = new List<OrderDetail>();
    for (Order o : [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        AccountId,
        Account.Name,
        Shipping_Street__c,
        Shipping_City__c,
        Shipping_State__c,
        Shipping_Zip__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        Shipped_Date__c,
        Delivered_Date__c,
        PaymentMethod__c,
        PaymentDeadline__c,
        (
          SELECT
            Product2.Name,
            Product2.Family,
            Product2.Image_URL__c,
            Quantity,
            UnitPrice,
            TotalPrice
          FROM OrderItems
        )
      FROM Order
      WHERE AccountId = :accountId
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      result.add(buildDetail(o));
    }
    return result;
  }

  // ── Admin order list ──────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<OrderDetail> getOrders() {
    List<OrderDetail> result = new List<OrderDetail>();
    for (Order o : [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        AccountId,
        Account.Name,
        Shipping_City__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        (
          SELECT
            Product2.Name,
            Product2.Family,
            Product2.Image_URL__c,
            Quantity,
            UnitPrice,
            TotalPrice
          FROM OrderItems
        )
      FROM Order
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      result.add(buildDetail(o));
    }
    return result;
  }

  // ── Single order detail (used by modals) ──────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static OrderDetail getOrderDetail(Id orderId) {
    Order o = [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        AccountId,
        Account.Name,
        Shipping_Street__c,
        Shipping_City__c,
        Shipping_State__c,
        Shipping_Zip__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        Shipped_Date__c,
        Delivered_Date__c,
        PaymentMethod__c,
        PaymentDeadline__c,
        (
          SELECT
            Product2.Name,
            Product2.Family,
            Product2.Image_URL__c,
            Quantity,
            UnitPrice,
            TotalPrice
          FROM OrderItems
        )
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    return buildDetail(o);
  }

  // ── Invoice: return existing file URL or queue async generation ───────────

  @AuraEnabled
  public static String generateAndDownloadInvoice(Id orderId) {
    // Check for an already-generated invoice file attached to this Order
    List<ContentDocumentLink> links = [
      SELECT ContentDocumentId
      FROM ContentDocumentLink
      WHERE LinkedEntityId = :orderId AND ContentDocument.Title LIKE 'Invoice-%'
      ORDER BY ContentDocument.CreatedDate DESC
      LIMIT 1
    ];
    if (!links.isEmpty()) {
      // File exists — return direct download URL (works in Experience Cloud)
      return '/sfc/servlet.shepherd/document/download/' +
        links[0].ContentDocumentId +
        '?operationContext=S1';
    }
    // Not yet generated — queue async (flow should have done this on status change)
    InvoiceService.generateInvoice(new List<Id>{ orderId });
    return null;
  }

  // ── Invoice generation (calls InvoiceService → @future email) ────────────

  @AuraEnabled
  public static void generateInvoice(Id orderId) {
    InvoiceService.generateInvoice(new List<Id>{ orderId });
  }

  // ── Invoice HTML (returns full standalone HTML page for browser print) ────

  @AuraEnabled(cacheable=false)
  public static String getInvoiceHtml(Id orderId) {
    Order ord = [
      SELECT
        Id,
        OrderNumber,
        TotalAmount,
        Status,
        EffectiveDate,
        Account.Name,
        Account.BillingStreet,
        Account.BillingCity,
        Account.BillingState,
        Account.BillingPostalCode,
        Account.BillingCountry,
        Shipping_Street__c,
        Shipping_City__c,
        Shipping_State__c,
        Shipping_Zip__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        (
          SELECT Product2.Name, Product2.Family, Quantity, UnitPrice, TotalPrice
          FROM OrderItems
        )
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];

    String formattedDate = ord.EffectiveDate != null
      ? ord.EffectiveDate.format()
      : Date.today().format();

    Decimal subtotal = 0;
    for (OrderItem oi : ord.OrderItems) {
      subtotal += (oi.TotalPrice != null ? oi.TotalPrice : 0);
    }
    Decimal shipping = ord.Shipping_Amount__c != null
      ? ord.Shipping_Amount__c
      : 0;
    Decimal sparks = ord.Sparks_Discount__c != null
      ? ord.Sparks_Discount__c
      : 0;
    String shippingStr = shipping > 0 ? shipping.setScale(2) + ' €' : 'Free';

    String itemRows = '';
    Integer rowIdx = 0;
    for (OrderItem oi : ord.OrderItems) {
      String bg = Math.mod(rowIdx, 2) == 1 ? 'background:#f8fafc;' : '';
      itemRows +=
        '<tr style="border-bottom:1px solid #f1f5f9;' +
        bg +
        '">' +
        '<td style="padding:11px 12px;">' +
        '<div style="font-size:11px;font-weight:700;color:#0f172a;">' +
        (oi.Product2 != null ? oi.Product2.Name : '—') +
        '</div>' +
        '<div style="font-size:8px;color:#94a3b8;margin-top:2px;">' +
        (oi.Product2 != null &&
          oi.Product2.Family != null
          ? oi.Product2.Family
          : '') +
        '</div>' +
        '</td>' +
        '<td style="padding:11px 12px;color:#94a3b8;font-size:10px;">' +
        (oi.Product2 != null &&
          oi.Product2.Family != null
          ? oi.Product2.Family
          : '—') +
        '</td>' +
        '<td style="padding:11px 12px;text-align:center;">' +
        '<span style="background:#ede9fe;color:#4f46e5;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:900;">' +
        String.valueOf(oi.Quantity.intValue()) +
        '</span>' +
        '</td>' +
        '<td style="padding:11px 12px;text-align:right;font-weight:700;color:#0f172a;">' +
        (oi.UnitPrice != null
          ? String.valueOf(oi.UnitPrice.setScale(2))
          : '0.00') +
        ' €</td>' +
        '<td style="padding:11px 12px;text-align:right;font-weight:700;color:#0f172a;">' +
        (oi.TotalPrice != null
          ? String.valueOf(oi.TotalPrice.setScale(2))
          : '0.00') +
        ' €</td>' +
        '</tr>';
      rowIdx++;
    }

    String sparksRow = sparks > 0
      ? '<tr><td colspan="2" class="lbl" style="color:#7c3aed;font-weight:700;">&#x2736; Sparks Discount</td>' +
        '<td class="amt" style="color:#10b981;font-weight:900;">-' +
        sparks.setScale(2) +
        ' €</td></tr>'
      : '';

    String shippingAddr = '';
    if (String.isNotBlank(ord.Shipping_Street__c))
      shippingAddr += ord.Shipping_Street__c + '<br/>';
    if (String.isNotBlank(ord.Shipping_City__c))
      shippingAddr += ord.Shipping_City__c;
    if (String.isNotBlank(ord.Shipping_State__c))
      shippingAddr += ', ' + ord.Shipping_State__c;
    if (String.isNotBlank(ord.Shipping_Zip__c))
      shippingAddr += ' ' + ord.Shipping_Zip__c;
    if (String.isNotBlank(ord.Shipping_Country__c))
      shippingAddr += '<br/>' + ord.Shipping_Country__c;
    if (String.isBlank(shippingAddr))
      shippingAddr = shippingAddr = '—';

    // Billing address from Account
    String billingAddr = '';
    if (ord.Account != null) {
      if (String.isNotBlank(ord.Account.BillingStreet))
        billingAddr += ord.Account.BillingStreet + '<br/>';
      if (String.isNotBlank(ord.Account.BillingCity))
        billingAddr += ord.Account.BillingCity;
      if (String.isNotBlank(ord.Account.BillingState))
        billingAddr += ', ' + ord.Account.BillingState;
      if (String.isNotBlank(ord.Account.BillingPostalCode))
        billingAddr += ' ' + ord.Account.BillingPostalCode;
      if (String.isNotBlank(ord.Account.BillingCountry))
        billingAddr += '<br/>' + ord.Account.BillingCountry;
    }
    if (String.isBlank(billingAddr))
      billingAddr = shippingAddr;

    String accountName = ord.Account != null ? ord.Account.Name : 'Customer';

    String html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"/>' +
      '<title>Invoice INV-' +
      ord.OrderNumber +
      '</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;background:#f1f5f9;margin:0;padding:20px;}' +
      '.page{max-width:720px;margin:0 auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);}' +
      '.print-bar{max-width:720px;margin:0 auto 12px;display:flex;justify-content:flex-end;gap:10px;}' +
      '.btn-print{background:#4f46e5;color:#fff;border:none;padding:10px 22px;font-size:13px;font-weight:700;border-radius:8px;cursor:pointer;letter-spacing:.02em;}' +
      '.btn-print:hover{background:#4338ca;}' +
      '.inv-header{background:#0f172a;padding:32px 40px 28px;overflow:hidden;}' +
      '.inv-brand{float:left;}' +
      '.inv-logo-wrap{overflow:hidden;margin-bottom:10px;}' +
      '.inv-logo-box{float:left;width:44px;height:44px;background:#4f46e5;border-radius:10px;text-align:center;font-size:22px;font-weight:900;color:#fff;line-height:44px;margin-right:12px;}' +
      '.inv-brand-text{float:left;padding-top:4px;}' +
      '.inv-brand-title{font-size:18px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.1;}' +
      '.inv-brand-sub{font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.15em;margin-top:2px;}' +
      '.inv-brand-addr{font-size:9px;color:#64748b;line-height:1.7;clear:both;padding-top:6px;}' +
      '.inv-meta{float:right;text-align:right;}' +
      '.inv-meta-label{font-size:28px;font-weight:900;color:#fff;letter-spacing:.1em;}' +
      '.inv-meta-number{font-size:13px;font-weight:700;color:#818cf8;margin-top:6px;}' +
      '.inv-meta-row{font-size:9px;color:#94a3b8;margin-top:4px;}' +
      '.inv-meta-row strong{color:#cbd5e1;}' +
      '.inv-bar-indigo{height:4px;background:#4f46e5;}' +
      '.inv-bar-emerald{height:2px;background:#10b981;}' +
      '.inv-body{padding:28px 40px;}' +
      '.inv-info-row{background:#f8fafc;border:1px solid #e2e8f0;padding:14px 18px;margin-bottom:24px;overflow:hidden;}' +
      '.inv-info-cell{float:left;width:25%;}' +
      '.inv-info-lbl{font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#94a3b8;margin-bottom:4px;}' +
      '.inv-info-val{font-size:11px;font-weight:700;color:#0f172a;}' +
      '.inv-info-val-indigo{font-size:11px;font-weight:700;color:#4f46e5;}' +
      '.inv-info-val-green{font-size:11px;font-weight:700;color:#10b981;}' +
      '.inv-addresses{overflow:hidden;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;}' +
      '.inv-addr-left{float:left;width:48%;}' +
      '.inv-addr-right{float:right;width:48%;}' +
      '.inv-addr-eyebrow{font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#4f46e5;margin-bottom:8px;border-bottom:2px solid #4f46e5;padding-bottom:4px;display:block;}' +
      '.inv-addr-name{font-size:13px;font-weight:900;color:#0f172a;margin-bottom:5px;}' +
      '.inv-addr-line{font-size:10px;color:#64748b;line-height:1.9;}' +
      '.inv-section-title{font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#94a3b8;margin-bottom:8px;}' +
      'table.inv-items{width:100%;border-collapse:collapse;}' +
      'table.inv-items thead tr{background:#0f172a;}' +
      'table.inv-items thead th{padding:10px 12px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;text-align:left;}' +
      'table.inv-items thead th.r{text-align:right;}' +
      'table.inv-items tbody tr{border-bottom:1px solid #f1f5f9;}' +
      'table.inv-items tbody td{padding:11px 12px;font-size:10px;color:#334155;}' +
      '.inv-totals-outer{overflow:hidden;margin-top:20px;}' +
      '.inv-totals-right{float:right;width:46%;}' +
      'table.inv-totals{width:100%;border-collapse:collapse;}' +
      'table.inv-totals td{padding:6px 2px;font-size:10px;color:#64748b;}' +
      'table.inv-totals td.lbl{text-align:left;}' +
      'table.inv-totals td.amt{text-align:right;font-weight:700;color:#334155;}' +
      'table.inv-totals td.grand-lbl{font-size:13px;font-weight:900;color:#0f172a;border-top:2px solid #0f172a;padding-top:10px;}' +
      'table.inv-totals td.grand-amt{font-size:20px;font-weight:900;color:#4f46e5;text-align:right;border-top:2px solid #0f172a;padding-top:10px;}' +
      '.inv-footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;overflow:hidden;margin-top:36px;}' +
      '.inv-footer-left{float:left;}' +
      '.inv-footer-right{float:right;text-align:right;}' +
      '.inv-thanks{font-size:12px;font-weight:900;color:#0f172a;margin-bottom:4px;}' +
      '.inv-footer-note{font-size:8px;color:#94a3b8;line-height:1.7;}' +
      '.inv-footer-brand{font-size:10px;font-weight:900;color:#4f46e5;margin-bottom:4px;}' +
      '.inv-footer-contact{font-size:8px;color:#94a3b8;line-height:1.7;}' +
      '@media print{.print-bar{display:none!important;}body{background:#fff;padding:0;}' +
      '.page{box-shadow:none;max-width:100%;}}' +
      '</style>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},600);});</script>' +
      '</head><body>' +
      '<div class="print-bar">' +
      '<button class="btn-print" onclick="window.print()">&#128438; Print / Save as PDF</button>' +
      '</div>' +
      '<div class="page">' +
      '<div class="inv-header">' +
      '<div class="inv-brand">' +
      '<div class="inv-logo-wrap">' +
      '<div class="inv-logo-box">N</div>' +
      '<div class="inv-brand-text">' +
      '<div class="inv-brand-title">NEXUS</div>' +
      '<div class="inv-brand-sub">Commerce Platform</div>' +
      '</div></div>' +
      '<div class="inv-brand-addr">12 Innovation Drive, Paris, France 75001<br/>support@nexus-commerce.com &nbsp;&middot;&nbsp; nexus-commerce.com</div>' +
      '</div>' +
      '<div class="inv-meta">' +
      '<div class="inv-meta-label">INVOICE</div>' +
      '<div class="inv-meta-number">INV-' +
      ord.OrderNumber +
      '</div>' +
      '<div class="inv-meta-row"><strong>Date:</strong> ' +
      formattedDate +
      '</div>' +
      '<div class="inv-meta-row"><strong>Order #:</strong> ' +
      ord.OrderNumber +
      '</div>' +
      '<div style="display:inline-block;margin-top:10px;padding:4px 12px;border-radius:20px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;background:#312e81;color:#a5b4fc;">' +
      ord.Status +
      '</div>' +
      '</div></div>' +
      '<div class="inv-bar-indigo"></div>' +
      '<div class="inv-bar-emerald"></div>' +
      '<div class="inv-body">' +
      '<div class="inv-info-row">' +
      '<div class="inv-info-cell"><div class="inv-info-lbl">Invoice Number</div><div class="inv-info-val-indigo">INV-' +
      ord.OrderNumber +
      '</div></div>' +
      '<div class="inv-info-cell"><div class="inv-info-lbl">Issue Date</div><div class="inv-info-val">' +
      formattedDate +
      '</div></div>' +
      '<div class="inv-info-cell"><div class="inv-info-lbl">Order Status</div><div class="inv-info-val">' +
      ord.Status +
      '</div></div>' +
      '<div class="inv-info-cell"><div class="inv-info-lbl">Payment</div><div class="inv-info-val-green">Confirmed &#x2713;</div></div>' +
      '</div>' +
      '<div class="inv-addresses">' +
      '<div class="inv-addr-left">' +
      '<span class="inv-addr-eyebrow">Billed To</span>' +
      '<div class="inv-addr-name">' +
      accountName +
      '</div>' +
      '<div class="inv-addr-line">' +
      billingAddr +
      '</div>' +
      '</div>' +
      '<div class="inv-addr-right">' +
      '<span class="inv-addr-eyebrow">Shipped To</span>' +
      '<div class="inv-addr-name">' +
      accountName +
      '</div>' +
      '<div class="inv-addr-line">' +
      shippingAddr +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="inv-section-title">Order Items</div>' +
      '<table class="inv-items">' +
      '<thead><tr>' +
      '<th style="width:38%;">Product</th>' +
      '<th style="width:18%;">Category</th>' +
      '<th class="r" style="width:10%;">Qty</th>' +
      '<th class="r" style="width:17%;">Unit Price</th>' +
      '<th class="r" style="width:17%;">Total</th>' +
      '</tr></thead>' +
      '<tbody>' +
      itemRows +
      '</tbody>' +
      '</table>' +
      '<div class="inv-totals-outer">' +
      '<div class="inv-totals-right">' +
      '<table class="inv-totals">' +
      '<tr><td class="lbl">Subtotal</td><td class="amt">' +
      subtotal.setScale(2) +
      ' €</td></tr>' +
      '<tr><td class="lbl">Shipping</td><td class="amt">' +
      shippingStr +
      '</td></tr>' +
      sparksRow +
      '<tr><td class="grand-lbl">Grand Total</td><td class="grand-amt">' +
      (ord.TotalAmount != null
        ? String.valueOf(ord.TotalAmount.setScale(2))
        : '0.00') +
      ' €</td></tr>' +
      '</table>' +
      '</div></div>' +
      '</div>' +
      '<div class="inv-footer">' +
      '<div class="inv-footer-left">' +
      '<div class="inv-thanks">Thank you for your business!</div>' +
      '<div class="inv-footer-note">This is an automatically generated invoice. Please retain it for your records.<br/>Payment confirmed — no further action required.</div>' +
      '</div>' +
      '<div class="inv-footer-right">' +
      '<div class="inv-footer-brand">NEXUS COMMERCE</div>' +
      '<div class="inv-footer-contact">support@nexus-commerce.com<br/>12 Innovation Drive, Paris 75001<br/>nexus-commerce.com</div>' +
      '</div>' +
      '</div>' +
      '</div></body></html>';

    return html;
  }

  // ── Private helper ────────────────────────────────────────────────────────

  private static OrderDetail buildDetail(Order o) {
    OrderDetail d = new OrderDetail();
    d.orderId = o.Id;
    d.orderNumber = o.OrderNumber;
    d.account = o.Account != null ? o.Account.Name : '—';
    d.accountId = o.AccountId;
    d.orderDate = o.EffectiveDate != null ? o.EffectiveDate.format() : '';
    d.totalAmount = o.TotalAmount != null ? o.TotalAmount : 0;
    d.formattedTotal =
      (d.totalAmount != null ? d.totalAmount.setScale(2) : 0) + ' €';
    d.status = o.Status;

    List<String> addr = new List<String>();
    if (String.isNotBlank(o.Shipping_City__c))
      addr.add(o.Shipping_City__c);
    if (String.isNotBlank(o.Shipping_Country__c))
      addr.add(o.Shipping_Country__c);
    d.shippingAddress = addr.isEmpty() ? '—' : String.join(addr, ', ');

    d.shippingAmount = o.Shipping_Amount__c != null ? o.Shipping_Amount__c : 0;
    d.formattedShipping = (d.shippingAmount > 0)
      ? d.shippingAmount.setScale(2) + ' €'
      : 'Free';
    d.sparksDiscount = o.Sparks_Discount__c != null ? o.Sparks_Discount__c : 0;
    d.hasSparksDiscount = d.sparksDiscount > 0;
    d.formattedSparksDiscount = d.hasSparksDiscount
      ? '-' + d.sparksDiscount.setScale(2) + ' €'
      : null;
    d.shippedDate = o.Shipped_Date__c != null
      ? o.Shipped_Date__c.format('dd/MM/yyyy HH:mm')
      : null;
    d.deliveredDate = o.Delivered_Date__c != null
      ? o.Delivered_Date__c.format('dd/MM/yyyy HH:mm')
      : null;
    d.paymentMethod = o.PaymentMethod__c;
    d.paymentDeadline = o.PaymentDeadline__c != null
      ? o.PaymentDeadline__c.format()
      : null;

    d.lineItems = new List<OrderLineItem>();
    for (OrderItem oi : o.OrderItems) {
      OrderLineItem li = new OrderLineItem();
      li.productName = oi.Product2 != null ? oi.Product2.Name : '—';
      li.productFamily = oi.Product2 != null ? oi.Product2.Family : '—';
      li.imageUrl = oi.Product2 != null ? oi.Product2.Image_URL__c : null;
      li.quantity = Integer.valueOf(oi.Quantity);
      li.unitPrice = oi.UnitPrice;
      li.totalPrice = oi.TotalPrice;
      li.formattedUnitPrice = oi.UnitPrice != null
        ? oi.UnitPrice.setScale(2) + ' €'
        : '—';
      li.formattedTotal = oi.TotalPrice != null
        ? oi.TotalPrice.setScale(2) + ' €'
        : '—';
      d.lineItems.add(li);
    }
    d.itemCount = d.lineItems.size();
    return d;
  }
}
