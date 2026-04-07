// Replace broken Clearbit URLs with picsum.photos seed images
// seed = ProductCode → same product always gets same image
List<Product2> prods = [
  SELECT Id, ProductCode FROM Product2
  WHERE IsActive = true AND ProductCode != null AND Family != null
];

for(Product2 p : prods) {
  p.Image_URL__c = 'https://picsum.photos/seed/' + p.ProductCode + '/600/400';
}
update prods;
System.debug('Updated ' + prods.size() + ' product images');
