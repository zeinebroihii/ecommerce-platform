public without sharing class StockNotificationController {
  @AuraEnabled
  public static void requestNotification(
    String productId,
    String productName,
    String customerEmail
  ) {
    if (String.isBlank(customerEmail) || !customerEmail.contains('@')) {
      throw new AuraHandledException('Please enter a valid email address.');
    }
    // Delegate to @future so it runs in system context — portal users
    // cannot call Messaging.sendEmail directly
    sendNotificationFuture(productId, productName, customerEmail);
  }

  @future
  private static void sendNotificationFuture(
    String productId,
    String productName,
    String customerEmail
  ) {
    List<User> admins = [
      SELECT Id, Email
      FROM User
      WHERE Profile.Name = 'System Administrator' AND IsActive = TRUE
      LIMIT 1
    ];

    // Emails first — before any DML so storage limits never block delivery
    List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

    Messaging.SingleEmailMessage toCustomer = new Messaging.SingleEmailMessage();
    toCustomer.setToAddresses(new List<String>{ customerEmail });
    toCustomer.setSaveAsActivity(false);
    toCustomer.setSubject(
      'Nexus — You\'ll be notified when ' + productName + ' is back in stock'
    );
    toCustomer.setHtmlBody(buildConfirmationBody(productName));
    emails.add(toCustomer);

    if (!admins.isEmpty()) {
      Messaging.SingleEmailMessage toAdmin = new Messaging.SingleEmailMessage();
      toAdmin.setToAddresses(new List<String>{ admins[0].Email });
      toAdmin.setSaveAsActivity(false);
      toAdmin.setSubject('Stock Notification Request — ' + productName);
      toAdmin.setPlainTextBody(
        'A customer requested a back-in-stock notification.\n\n' +
          'Customer Email : ' +
          customerEmail +
          '\n' +
          'Product        : ' +
          productName +
          '\n' +
          'Product ID     : ' +
          productId
      );
      emails.add(toAdmin);
    }

    Messaging.sendEmail(emails);

    // Save request record for back-in-stock trigger (best-effort — skip if storage full)
    try {
      List<StockNotificationRequest__c> existing = [
        SELECT Id
        FROM StockNotificationRequest__c
        WHERE
          Product__c = :productId
          AND CustomerEmail__c = :customerEmail
          AND Notified__c = FALSE
        LIMIT 1
      ];
      if (existing.isEmpty()) {
        insert new StockNotificationRequest__c(
          Product__c = productId,
          ProductName__c = productName,
          CustomerEmail__c = customerEmail,
          Notified__c = false
        );
      }
    } catch (Exception e) {
      System.debug(
        '[StockNotification] Could not save request record: ' + e.getMessage()
      );
    }

    // Task for admin tracking (best-effort)
    try {
      insert new Task(
        Subject = 'Stock Notification Request — ' + productName,
        Description = 'Customer: ' +
          customerEmail +
          '\nProduct: ' +
          productName +
          '\nProduct ID: ' +
          productId,
        Status = 'Open',
        Priority = 'Normal',
        ActivityDate = Date.today().addDays(30),
        OwnerId = admins.isEmpty() ? UserInfo.getUserId() : admins[0].Id
      );
    } catch (Exception e) {
      System.debug(
        '[StockNotification] Could not create task: ' + e.getMessage()
      );
    }
  }

  // Called by StockTrigger (qty 0→>0) and Product2Trigger (status → En stock)
  public static void sendBackInStockEmails(Id productId, String productName) {
    List<StockNotificationRequest__c> pending = [
      SELECT Id, CustomerEmail__c, ProductName__c
      FROM StockNotificationRequest__c
      WHERE Product__c = :productId AND Notified__c = FALSE
      LIMIT 200
    ];
    if (pending.isEmpty())
      return;

    String pName = String.isNotBlank(productName)
      ? productName
      : pending[0].ProductName__c;

    List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
    for (StockNotificationRequest__c req : pending) {
      Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
      msg.setToAddresses(new List<String>{ req.CustomerEmail__c });
      msg.setSaveAsActivity(false);
      msg.setSubject('Nexus — ' + pName + ' is back in stock!');
      msg.setHtmlBody(buildBackInStockBody(pName));
      emails.add(msg);
    }

    Messaging.sendEmail(emails);

    List<StockNotificationRequest__c> toUpdate = new List<StockNotificationRequest__c>();
    for (StockNotificationRequest__c req : pending) {
      toUpdate.add(
        new StockNotificationRequest__c(
          Id = req.Id,
          Notified__c = true,
          NotifiedDate__c = System.now()
        )
      );
    }
    update toUpdate;
  }

  private static String buildConfirmationBody(String productName) {
    return '<!DOCTYPE html><html><body style="margin:0;padding:40px 0;background:#f8fafc;font-family:Arial,sans-serif;">' +
      '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +
      '<div style="background:#0f172a;padding:28px 40px;">' +
      '<p style="color:#fff;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.03em;">NEXUS</p>' +
      '<p style="color:#475569;font-size:10px;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.12em;">B2B Commerce Platform</p>' +
      '</div>' +
      '<div style="padding:40px;">' +
      '<p style="font-size:28px;margin:0 0 20px;">🔔</p>' +
      '<h2 style="color:#0f172a;font-size:18px;font-weight:800;margin:0 0 12px;">You\'re on the list</h2>' +
      '<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 28px;">We\'ll send you a notification the moment <strong>' +
      productName +
      '</strong> is back in stock. One email, no spam.</p>' +
      '<div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:0 8px 8px 0;padding:14px 18px;">' +
      '<p style="color:#065f46;font-size:12px;margin:0;">Reply to this email anytime to reach our sales team.</p>' +
      '</div>' +
      '</div>' +
      '<div style="padding:16px 40px;border-top:1px solid #f1f5f9;text-align:center;">' +
      '<p style="color:#94a3b8;font-size:11px;margin:0;">&copy; 2026 Nexus B2B Platform</p>' +
      '</div>' +
      '</div></body></html>';
  }

  private static String buildBackInStockBody(String productName) {
    return '<!DOCTYPE html><html><body style="margin:0;padding:40px 0;background:#f8fafc;font-family:Arial,sans-serif;">' +
      '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +
      '<div style="background:#0f172a;padding:28px 40px;">' +
      '<p style="color:#fff;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.03em;">NEXUS</p>' +
      '<p style="color:#475569;font-size:10px;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.12em;">B2B Commerce Platform</p>' +
      '</div>' +
      '<div style="padding:40px;">' +
      '<p style="font-size:28px;margin:0 0 20px;">✅</p>' +
      '<h2 style="color:#0f172a;font-size:18px;font-weight:800;margin:0 0 12px;">It\'s back in stock!</h2>' +
      '<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 28px;"><strong>' +
      productName +
      '</strong> is now available again. Head to the Nexus catalog to order before it sells out.</p>' +
      '<div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:14px 18px;">' +
      '<p style="color:#1e40af;font-size:12px;margin:0;">Stock is limited — order soon to guarantee availability.</p>' +
      '</div>' +
      '</div>' +
      '<div style="padding:16px 40px;border-top:1px solid #f1f5f9;text-align:center;">' +
      '<p style="color:#94a3b8;font-size:11px;margin:0;">&copy; 2026 Nexus B2B Platform</p>' +
      '</div>' +
      '</div></body></html>';
  }
}
