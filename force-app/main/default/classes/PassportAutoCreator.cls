public without sharing class PassportAutoCreator {
  @InvocableMethod(
    label='Create Passports from Order'
    description='Auto-creates a Digital Passport for each product line in an activated order'
  )
  public static void createPassportsFromOrder(List<Id> orderIds) {
    if (orderIds == null || orderIds.isEmpty())
      return;
    Id orderId = orderIds[0];

    List<Order> orders = [
      SELECT
        Id,
        AccountId,
        Account.PersonContactId,
        Account.IsPersonAccount,
        EffectiveDate
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    if (orders.isEmpty())
      return;
    Order ord = orders[0];

    // Strategy 1: Person Account → PersonContactId
    Id contactId = (ord.Account != null) ? ord.Account.PersonContactId : null;

    // Strategy 2: Business Account → first Contact linked to the Account
    if (contactId == null && ord.AccountId != null) {
      List<Contact> linked = [
        SELECT Id
        FROM Contact
        WHERE AccountId = :ord.AccountId
        ORDER BY CreatedDate ASC
        LIMIT 1
      ];
      if (!linked.isEmpty())
        contactId = linked[0].Id;
    }

    // Strategy 3: Running (portal) user's ContactId
    if (contactId == null) {
      List<User> ru = [
        SELECT ContactId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      if (!ru.isEmpty() && ru[0].ContactId != null)
        contactId = ru[0].ContactId;
    }

    if (contactId == null)
      return;

    createPassportsForContact(orderId, contactId);
  }

  // Called directly by StripePaymentController with an explicit contactId —
  // bypasses the order's AccountId entirely so plain-account orders still work.
  public static void createPassportsForContact(Id orderId, Id contactId) {
    if (orderId == null || contactId == null)
      return;

    List<Order> orders = [
      SELECT EffectiveDate
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    if (orders.isEmpty())
      return;
    Date purchaseDate = orders[0].EffectiveDate != null
      ? orders[0].EffectiveDate
      : Date.today();

    List<OrderItem> items = [
      SELECT Product2Id, Product2.Name
      FROM OrderItem
      WHERE OrderId = :orderId AND Product2Id != NULL
    ];
    if (items.isEmpty())
      return;

    Set<String> productNames = new Set<String>();
    for (OrderItem oi : items)
      productNames.add(oi.Product2.Name);

    Set<String> existingKeys = new Set<String>();
    for (Digital_Passport__c pp : [
      SELECT Product_Name__c
      FROM Digital_Passport__c
      WHERE Current_Owner__c = :contactId AND Product_Name__c IN :productNames
    ]) {
      existingKeys.add(pp.Product_Name__c);
    }

    List<Digital_Passport__c> toInsert = new List<Digital_Passport__c>();
    Set<String> seenThisRun = new Set<String>();
    for (OrderItem oi : items) {
      String name = oi.Product2.Name;
      if (existingKeys.contains(name) || seenThisRun.contains(name))
        continue;
      seenThisRun.add(name);
      toInsert.add(
        new Digital_Passport__c(
          Product_Name__c = name,
          Current_Owner__c = contactId,
          Original_Owner__c = contactId,
          Purchase_Date__c = purchaseDate,
          Condition__c = 'Mint',
          Status__c = 'Active',
          CO2_Saved__c = 0
        )
      );
    }
    if (toInsert.isEmpty())
      return;
    Database.insert(toInsert, false);

    try {
      String ownerName = '';
      List<Contact> cons = [
        SELECT Name
        FROM Contact
        WHERE Id = :contactId
        LIMIT 1
      ];
      if (!cons.isEmpty())
        ownerName = cons[0].Name;

      List<Ownership_Event__c> evts = new List<Ownership_Event__c>();
      for (Digital_Passport__c pp : toInsert) {
        evts.add(
          new Ownership_Event__c(
            Passport__c = pp.Id,
            To_Owner_Name__c = ownerName,
            Transfer_Type__c = 'Purchase',
            Transfer_Date__c = purchaseDate,
            Condition_At_Transfer__c = 'Mint'
          )
        );
      }
      if (!evts.isEmpty())
        Database.insert(evts, false);
    } catch (Exception e) {
    }
  }
}
