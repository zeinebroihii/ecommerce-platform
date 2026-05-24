trigger Product2Trigger on Product2(after insert, after update) {
  // Newsletter blast — fire async for each newly inserted active product
  if (Trigger.isInsert) {
    for (Product2 p : Trigger.new) {
      if (p.IsActive) {
        NewsletterController.blastNewProduct(p.Id);
      }
    }
  }

  // Back-in-stock notifications — fire when AvailabilityStatus changes to "En stock" / "In Stock"
  if (Trigger.isUpdate) {
    for (Product2 p : Trigger.new) {
      Product2 old = Trigger.oldMap.get(p.Id);
      String newStatus = (p.AvailabilityStatus__c != null
          ? p.AvailabilityStatus__c
          : '')
        .toLowerCase();
      String oldStatus = (old.AvailabilityStatus__c != null
          ? old.AvailabilityStatus__c
          : '')
        .toLowerCase();
      Boolean nowInStock =
        newStatus.contains('stock') &&
        !newStatus.contains('out') &&
        !newStatus.contains('épuisé');
      Boolean wasInStock =
        oldStatus.contains('stock') &&
        !oldStatus.contains('out') &&
        !oldStatus.contains('épuisé');
      if (nowInStock && !wasInStock) {
        StockNotificationController.sendBackInStockEmails(p.Id, p.Name);
      }
    }
  }

  List<Product2> withPrice = new List<Product2>();
  for (Product2 p : Trigger.new) {
    if (p.Price__c != null && p.Price__c > 0)
      withPrice.add(p);
  }
  if (withPrice.isEmpty())
    return;

  Id stdPbId = Test.isRunningTest()
    ? Test.getStandardPricebookId()
    : [SELECT Id FROM Pricebook2 WHERE IsStandard = TRUE LIMIT 1].Id;

  Map<Id, PricebookEntry> existing = new Map<Id, PricebookEntry>();
  for (PricebookEntry pbe : [
    SELECT Id, Product2Id, UnitPrice
    FROM PricebookEntry
    WHERE
      Product2Id IN :withPrice
      AND Pricebook2Id = :stdPbId
      AND IsActive = TRUE
  ]) {
    existing.put(pbe.Product2Id, pbe);
  }

  List<PricebookEntry> toInsert = new List<PricebookEntry>();
  List<PricebookEntry> toUpdate = new List<PricebookEntry>();

  for (Product2 p : withPrice) {
    if (existing.containsKey(p.Id)) {
      PricebookEntry pbe = existing.get(p.Id);
      if (pbe.UnitPrice != p.Price__c) {
        pbe.UnitPrice = p.Price__c;
        toUpdate.add(pbe);
      }
    } else {
      toInsert.add(
        new PricebookEntry(
          Pricebook2Id = stdPbId,
          Product2Id = p.Id,
          UnitPrice = p.Price__c,
          IsActive = true
        )
      );
    }
  }

  if (!toInsert.isEmpty())
    insert toInsert;
  if (!toUpdate.isEmpty())
    update toUpdate;
}
