// ── 1. Create Stock__c records for all active products ────────────────────
List<Product2> products = [
    SELECT Id, Name FROM Product2 WHERE IsActive = true LIMIT 200
];

List<Stock__c> existing = [SELECT Product__c FROM Stock__c];
Set<Id> alreadyLinked = new Set<Id>();
for (Stock__c s : existing) alreadyLinked.add(s.Product__c);

List<Stock__c> toInsert = new List<Stock__c>();
Integer i = 0;
for (Product2 p : products) {
    if (alreadyLinked.contains(p.Id)) continue;
    // Seed with random-looking but realistic data for testing
    Integer qty = 5 + Math.mod(i * 17, 80);
    Decimal threshold = 10;
    toInsert.add(new Stock__c(
        Name                 = 'Stock — ' + p.Name,
        Product__c           = p.Id,
        Quantity_Available__c = qty,
        Reorder_Threshold__c  = threshold,
        Last_Sync_Date__c    = DateTime.now()
    ));
    i++;
}
if (!toInsert.isEmpty()) insert toInsert;
System.debug('Inserted ' + toInsert.size() + ' Stock records.');

// ── 2. Run velocity engine immediately ───────────────────────────────────
StockVelocityEngine.run();
System.debug('Velocity engine ran successfully.');

// ── 3. Schedule daily run at 2 AM ────────────────────────────────────────
// Abort any existing schedule first
for (CronTrigger ct : [SELECT Id FROM CronTrigger WHERE CronJobDetail.Name = 'Stock Velocity Engine']) {
    System.abortJob(ct.Id);
}
System.schedule('Stock Velocity Engine', '0 0 2 * * ?', new StockVelocityEngine());
System.debug('Engine scheduled daily at 2 AM.');
