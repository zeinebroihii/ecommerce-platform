List<Stock__c> stocks = [SELECT Id, Product__r.Name FROM Stock__c WHERE Product__c != null LIMIT 1];
if (!stocks.isEmpty()) {
    String result = StockIntelligenceController.generateReorderBrief(stocks[0].Id);
    System.debug('BRIEF_OK: ' + result.substring(0, Math.min(300, result.length())));
} else {
    System.debug('NO_STOCK_RECORDS');
}
