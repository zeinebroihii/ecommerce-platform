trigger StockTrigger on Stock__c(after update) {
  Set<Id> productIds = new Set<Id>();

  for (Stock__c s : Trigger.new) {
    Stock__c old = Trigger.oldMap.get(s.Id);
    Decimal oldQty = old.Quantity_Available__c != null
      ? old.Quantity_Available__c
      : 0;
    Decimal newQty = s.Quantity_Available__c != null
      ? s.Quantity_Available__c
      : 0;
    // Only fire when qty goes from 0 to a positive number
    if (oldQty == 0 && newQty > 0 && s.Product__c != null) {
      productIds.add(s.Product__c);
    }
  }

  if (productIds.isEmpty())
    return;

  Map<Id, Product2> products = new Map<Id, Product2>(
    [SELECT Id, Name FROM Product2 WHERE Id IN :productIds]
  );

  for (Id pid : productIds) {
    Product2 p = products.get(pid);
    if (p != null) {
      StockNotificationController.sendBackInStockEmails(pid, p.Name);
    }
  }
}
