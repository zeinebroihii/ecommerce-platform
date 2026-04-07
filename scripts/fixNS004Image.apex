List<Product2> prods = [SELECT Id, Name FROM Product2 WHERE ProductCode = 'NS-004' LIMIT 1];
System.debug('Found: ' + prods.size() + (prods.isEmpty() ? '' : ' — ' + prods[0].Name));
if (!prods.isEmpty()) {
    prods[0].Image_URL__c = 'https://www.gtec.at/wp-content/uploads/2019/09/g.USBamp-RESEARCH-biosignal-amplifier-1.jpg';
    update prods;
    System.debug('Image updated to real g.tec product photo');
}
