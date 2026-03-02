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

    // ── Stock-board detail returned to LWC ───────────────────────────────────
    public class StockProductDetail {
        @AuraEnabled public String  productId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  family;
        @AuraEnabled public Decimal price;
        @AuraEnabled public String  formattedPrice;
        @AuraEnabled public Integer stock;
        @AuraEnabled public Integer capacity;
        @AuraEnabled public String  status;       // Critical | Overstock | Optimal
        @AuraEnabled public String  imageUrl;
    }

    @AuraEnabled(cacheable=true)
    public static List<StockProductDetail> getStockProducts() {
        String q = 'SELECT Id, Name, Family, Image_URL__c, '
            + '(SELECT Quantity_Available__c, Reorder_Threshold__c FROM Stocks__r LIMIT 1), '
            + '(SELECT UnitPrice FROM PricebookEntries WHERE IsActive = true LIMIT 1) '
            + 'FROM Product2 WHERE IsActive = true ORDER BY Name LIMIT 50';

        List<StockProductDetail> result = new List<StockProductDetail>();
        for (Product2 p : Database.query(q)) {
            StockProductDetail d = new StockProductDetail();
            d.productId   = p.Id;
            d.name        = p.Name;
            d.family      = p.Family;
            d.imageUrl    = p.Image_URL__c;

            d.price = 0;
            if (!p.PricebookEntries.isEmpty())
                d.price = p.PricebookEntries[0].UnitPrice;
            d.formattedPrice = (d.price != null ? d.price.setScale(0) : 0) + ' €';

            Integer threshold = 20;
            d.stock = 0;
            if (!p.Stocks__r.isEmpty()) {
                d.stock = p.Stocks__r[0].Quantity_Available__c != null
                          ? Integer.valueOf(p.Stocks__r[0].Quantity_Available__c) : 0;
                threshold = p.Stocks__r[0].Reorder_Threshold__c != null
                            ? Integer.valueOf(p.Stocks__r[0].Reorder_Threshold__c) : 20;
            }
            d.capacity = Math.max(threshold * 10, d.stock + 20);

            Decimal ratio = d.capacity > 0
                            ? Decimal.valueOf(d.stock) / d.capacity : 0;
            d.status = ratio < 0.15 ? 'Critical'
                     : ratio > 0.80 ? 'Overstock'
                     : 'Optimal';
            result.add(d);
        }
        return result;
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
        // Create a public ContentDistribution so the URL works for guest/portal users
        ContentDistribution cd = new ContentDistribution();
        cd.Name                    = 'ProductImage-' + productId;
        cd.ContentVersionId        = contentVersionId;
        cd.PreferencesAllowViewInBrowser = true;
        cd.PreferencesPasswordRequired   = false;
        cd.PreferencesNotifyOnVisit      = false;
        insert cd;

        // Re-query to get the generated public URL
        cd = [SELECT DistributionPublicUrl FROM ContentDistribution WHERE Id = :cd.Id LIMIT 1];

        Product2 p = new Product2(Id = productId);
        p.put('Image_URL__c', cd.DistributionPublicUrl);
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
