public with sharing class ProductController {

    public class ProductWrapper {
        @AuraEnabled public String productId;
        @AuraEnabled public String name;
        @AuraEnabled public String description;
        @AuraEnabled public String family;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal quantityAvailable;
        @AuraEnabled public Boolean isOutOfStock;
        @AuraEnabled public String imageUrl;
    }

    @AuraEnabled(cacheable=true)
    public static List<ProductWrapper> getProductsWithStock(String searchTerm, String category) {

        String query =
            'SELECT Id, Name, Description, Family, Image_URL__c, ' +
            '(SELECT Quantity_Available__c FROM Stocks__r LIMIT 1), ' +
            '(SELECT UnitPrice FROM PricebookEntries WHERE IsActive = true LIMIT 1) ' +
            'FROM Product2 WHERE IsActive = true';

        if (String.isNotBlank(searchTerm)) {
            query += ' AND Name LIKE \'%' + String.escapeSingleQuotes(searchTerm) + '%\'';
        }
        if (String.isNotBlank(category)) {
            query += ' AND Family = \'' + String.escapeSingleQuotes(category) + '\'';
        }

        query += ' ORDER BY Name LIMIT 50';

        List<Product2> products = Database.query(query);
        List<ProductWrapper> result = new List<ProductWrapper>();

        for (Product2 p : products) {
            ProductWrapper w    = new ProductWrapper();
            w.productId         = p.Id;
            w.name              = p.Name;
            w.description       = p.Description;
            w.family            = p.Family;

            w.unitPrice = 0;
            if (!p.PricebookEntries.isEmpty()) {
                w.unitPrice = p.PricebookEntries[0].UnitPrice;
            }

            w.quantityAvailable = 0;
            if (!p.Stocks__r.isEmpty()) {
                w.quantityAvailable = p.Stocks__r[0].Quantity_Available__c;
            }

            w.isOutOfStock = (w.quantityAvailable == 0);
            w.imageUrl     = p.Image_URL__c;
            result.add(w);
        }

        return result;
    }

    @AuraEnabled
    public static void saveProductImage(Id productId, Id contentVersionId) {
        // Build a download URL from the ContentVersion
        String imageUrl = '/sfc/servlet.shepherd/version/download/' + contentVersionId;
        Product2 p = new Product2(Id = productId);
        p.put('Image_URL__c', imageUrl);
        update p;
    }

    @AuraEnabled(cacheable=true)
    public static Product2 getProductDetail(Id productId) {
        return [
            SELECT Id, Name, Description, Family,
                   (SELECT Quantity_Available__c, Reorder_Threshold__c, AI_Risk_Summary__c
                    FROM Stocks__r LIMIT 1),
                   (SELECT UnitPrice FROM PricebookEntries
                    WHERE IsActive = true LIMIT 1)
            FROM Product2
            WHERE Id = :productId
        ];
    }
}
