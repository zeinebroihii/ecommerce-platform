public class InvoiceService {
  @InvocableMethod(label='Generate and Email Invoice')
  public static void generateInvoice(List<Id> orderIds) {
    for (Id orderId : orderIds) {
      sendInvoiceEmailAsync(orderId);
    }
  }

  @future
  private static void sendInvoiceEmailAsync(Id orderId) {
    try {
      Order ord = [
        SELECT
          Id,
          OrderNumber,
          TotalAmount,
          Status,
          EffectiveDate,
          Account.Name,
          Shipping_City__c,
          Shipping_Country__c,
          Shipping_Amount__c,
          Sparks_Discount__c,
          (
            SELECT Product2.Name, Quantity, UnitPrice, TotalPrice
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

      // Build line items rows
      String itemRows = '';
      for (OrderItem oi : ord.OrderItems) {
        itemRows +=
          '<tr style="border-bottom:1px solid #f1f5f9;">' +
          '<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#0f172a;">' +
          (oi.Product2 != null ? oi.Product2.Name : '—') +
          '</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:center;">' +
          String.valueOf(oi.Quantity.intValue()) +
          '</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:right;">' +
          (oi.UnitPrice != null
            ? String.valueOf(oi.UnitPrice.setScale(2))
            : '0.00') +
          ' €</td>' +
          '<td style="padding:10px 12px;font-size:12px;text-align:right;font-weight:700;color:#0f172a;">' +
          (oi.TotalPrice != null
            ? String.valueOf(oi.TotalPrice.setScale(2))
            : '0.00') +
          ' €</td>' +
          '</tr>';
      }

      String sparksRow = sparks > 0
        ? '<tr><td colspan="3" style="padding:6px 12px;color:#7c3aed;font-weight:700;text-align:right;">✦ Sparks Discount</td>' +
          '<td style="padding:6px 12px;font-weight:900;color:#10b981;text-align:right;">-' +
          sparks.setScale(2) +
          ' €</td></tr>'
        : '';

      String htmlBody =
        '<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#f8fafc;padding:24px;">' +
        // Header
        '<div style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0;overflow:hidden;">' +
        '<div style="float:left;">' +
        '<span style="display:inline-block;width:40px;height:40px;background:#4f46e5;border-radius:8px;text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;vertical-align:middle;margin-right:10px;">N</span>' +
        '<span style="font-size:16px;font-weight:900;color:#fff;vertical-align:middle;">NEXUS COMMERCE</span>' +
        '</div>' +
        '<div style="float:right;text-align:right;">' +
        '<div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:0.08em;">INVOICE</div>' +
        '<div style="font-size:12px;font-weight:700;color:#818cf8;margin-top:4px;">INV-' +
        ord.OrderNumber +
        '</div>' +
        '<div style="font-size:9px;color:#94a3b8;margin-top:2px;">' +
        formattedDate +
        '</div>' +
        '</div></div>' +
        '<div style="height:4px;background:#4f46e5;"></div>' +
        '<div style="height:2px;background:#10b981;"></div>' +
        // Body
        '<div style="background:#fff;padding:28px 32px;">' +
        // Order info
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:24px;overflow:hidden;">' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Order</div>' +
        '<div style="font-size:12px;font-weight:700;color:#4f46e5;">' +
        ord.OrderNumber +
        '</div></div>' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Status</div>' +
        '<div style="font-size:12px;font-weight:700;color:#0f172a;">' +
        ord.Status +
        '</div></div>' +
        '<div style="float:left;width:33%"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;">Payment</div>' +
        '<div style="font-size:12px;font-weight:700;color:#10b981;">Confirmed ✓</div></div>' +
        '</div>' +
        // Customer
        '<p style="font-size:13px;color:#64748b;margin:0 0 20px;">Hello <strong style="color:#0f172a;">' +
        (ord.Account != null ? ord.Account.Name : 'Customer') +
        '</strong>, your invoice is ready.</p>' +
        // Items table
        '<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">' +
        '<thead><tr style="background:#0f172a;">' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:left;font-weight:700;text-transform:uppercase;">Product</th>' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:center;font-weight:700;text-transform:uppercase;">Qty</th>' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:right;font-weight:700;text-transform:uppercase;">Unit Price</th>' +
        '<th style="padding:10px 12px;font-size:9px;color:#94a3b8;text-align:right;font-weight:700;text-transform:uppercase;">Total</th>' +
        '</tr></thead><tbody>' +
        itemRows +
        '</tbody>' +
        // Totals
        '<tfoot>' +
        '<tr><td colspan="3" style="padding:8px 12px;text-align:right;color:#64748b;font-size:11px;">Subtotal</td>' +
        '<td style="padding:8px 12px;text-align:right;font-weight:700;font-size:11px;color:#334155;">' +
        subtotal.setScale(2) +
        ' €</td></tr>' +
        '<tr><td colspan="3" style="padding:4px 12px;text-align:right;color:#64748b;font-size:11px;">Shipping</td>' +
        '<td style="padding:4px 12px;text-align:right;font-weight:700;font-size:11px;color:#334155;">' +
        shippingStr +
        '</td></tr>' +
        sparksRow +
        '<tr style="border-top:2px solid #0f172a;"><td colspan="3" style="padding:10px 12px;text-align:right;font-size:14px;font-weight:900;color:#0f172a;">Grand Total</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:20px;font-weight:900;color:#4f46e5;">' +
        (ord.TotalAmount != null
          ? String.valueOf(ord.TotalAmount.setScale(2))
          : '0.00') +
        ' €</td></tr>' +
        '</tfoot></table>' +
        '<p style="color:#94a3b8;font-size:11px;margin-top:20px;">Questions? <a href="mailto:support@nexus-commerce.com" style="color:#4f46e5;">support@nexus-commerce.com</a></p>' +
        '</div>' +
        // Footer
        '<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;border-radius:0 0 12px 12px;">' +
        '<p style="font-size:9px;color:#94a3b8;margin:0;text-align:center;">Nexus Commerce · 12 Innovation Drive, Paris 75001 · nexus-commerce.com</p>' +
        '</div></div>';

      Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
      email.setToAddresses(new List<String>{ 'roihizeineb123@gmail.com' });
      email.setSubject('Your Nexus Invoice — Order #' + ord.OrderNumber);
      email.setHtmlBody(htmlBody);
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });
    } catch (Exception e) {
      System.debug(
        LoggingLevel.ERROR,
        'InvoiceService.sendInvoiceEmailAsync error: ' + e.getMessage()
      );
    }
  }
}
