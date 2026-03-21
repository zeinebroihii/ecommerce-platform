public with sharing class ProductController {

    // ── Wrapper: catalog browsing (portal / catalog LWC) ─────────────────────
    public class ProductWrapper {
        @AuraEnabled public String  productId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  productCode;
        @AuraEnabled public String  description;
        @AuraEnabled public String  family;
        @AuraEnabled public String  subcategory;
        @AuraEnabled public String  brand;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal quantityAvailable;
        @AuraEnabled public Boolean isOutOfStock;
        @AuraEnabled public String  imageUrl;
        @AuraEnabled public String  availabilityStatus;
        @AuraEnabled public Decimal rating;
        @AuraEnabled public Integer reviews;
        @AuraEnabled public Boolean isNew;
        @AuraEnabled public String  specs; // JSON string: [{key,value},...]
    }

    // ── Wrapper: stock board ──────────────────────────────────────────────────
    public class StockProductDetail {
        @AuraEnabled public String  productId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  family;
        @AuraEnabled public Decimal price;
        @AuraEnabled public String  formattedPrice;
        @AuraEnabled public Integer stock;
        @AuraEnabled public Integer capacity;
        @AuraEnabled public String  status;
        @AuraEnabled public String  imageUrl;
    }

    // ── Wrapper: admin product management ────────────────────────────────────
    public class AdminProductWrapper {
        @AuraEnabled public String  productId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  productCode;
        @AuraEnabled public String  description;
        @AuraEnabled public String  family;
        @AuraEnabled public String  subcategory;
        @AuraEnabled public String  brand;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Integer stockQuantity;
        @AuraEnabled public String  imageUrl;
        @AuraEnabled public String  availabilityStatus;
        @AuraEnabled public Decimal rating;
        @AuraEnabled public Integer reviews;
        @AuraEnabled public Boolean isNew;
        @AuraEnabled public Boolean isActive;
        @AuraEnabled public String  specs;
        @AuraEnabled public String  stockId;
        @AuraEnabled public String  pricebookEntryId;
    }

    // ── getStockProducts (stock board) ───────────────────────────────────────
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

    // ── getProductsWithStock (catalog + portal browsing) ─────────────────────
    @AuraEnabled(cacheable=true)
    public static List<ProductWrapper> getProductsWithStock(String searchTerm, String category) {

        String query =
            'SELECT Id, Name, ProductCode, Description, Family, Subcategory__c, '
            + 'Brand__c, Image_URL__c, AvailabilityStatus__c, Rating__c, Reviews__c, IsNew__c, Specs__c, '
            + '(SELECT Quantity_Available__c FROM Stocks__r LIMIT 1), '
            + '(SELECT UnitPrice FROM PricebookEntries WHERE IsActive = true LIMIT 1) '
            + 'FROM Product2 WHERE IsActive = true';

        if (String.isNotBlank(searchTerm)) {
            query += ' AND Name LIKE \'%' + String.escapeSingleQuotes(searchTerm) + '%\'';
        }
        if (String.isNotBlank(category)) {
            query += ' AND Family = \'' + String.escapeSingleQuotes(category) + '\'';
        }

        query += ' ORDER BY Name LIMIT 100';

        List<Product2> products = Database.query(query);
        List<ProductWrapper> result = new List<ProductWrapper>();

        for (Product2 p : products) {
            ProductWrapper w        = new ProductWrapper();
            w.productId             = p.Id;
            w.name                  = p.Name;
            w.productCode           = p.ProductCode;
            w.description           = p.Description;
            w.family                = p.Family;
            w.subcategory           = p.Subcategory__c;
            w.brand                 = p.Brand__c;
            w.imageUrl              = p.Image_URL__c;
            w.availabilityStatus    = p.AvailabilityStatus__c;
            w.rating                = p.Rating__c != null ? p.Rating__c : 0;
            w.reviews               = p.Reviews__c != null ? Integer.valueOf(p.Reviews__c) : 0;
            w.isNew                 = p.IsNew__c;
            w.specs                 = p.Specs__c;

            w.unitPrice = 0;
            if (!p.PricebookEntries.isEmpty()) {
                w.unitPrice = p.PricebookEntries[0].UnitPrice;
            }

            w.quantityAvailable = 0;
            if (!p.Stocks__r.isEmpty()) {
                w.quantityAvailable = p.Stocks__r[0].Quantity_Available__c;
            }

            w.isOutOfStock = (w.quantityAvailable == 0);
            result.add(w);
        }

        return result;
    }

    // ── getAllProductsForAdmin ────────────────────────────────────────────────
    @AuraEnabled(cacheable=true)
    public static List<AdminProductWrapper> getAllProductsForAdmin() {
        List<Product2> products = [
            SELECT Id, Name, ProductCode, Description, Family, Subcategory__c,
                   Brand__c, Image_URL__c, AvailabilityStatus__c, Rating__c, Reviews__c,
                   IsNew__c, IsActive, Specs__c,
                   (SELECT Id, Quantity_Available__c FROM Stocks__r LIMIT 1),
                   (SELECT Id, UnitPrice FROM PricebookEntries WHERE IsActive = true LIMIT 1)
            FROM Product2
            ORDER BY Name
            LIMIT 200
        ];

        List<AdminProductWrapper> result = new List<AdminProductWrapper>();
        for (Product2 p : products) {
            AdminProductWrapper w    = new AdminProductWrapper();
            w.productId             = p.Id;
            w.name                  = p.Name;
            w.productCode           = p.ProductCode;
            w.description           = p.Description;
            w.family                = p.Family;
            w.subcategory           = p.Subcategory__c;
            w.brand                 = p.Brand__c;
            w.imageUrl              = p.Image_URL__c;
            w.availabilityStatus    = p.AvailabilityStatus__c;
            w.rating                = p.Rating__c != null ? p.Rating__c : 0;
            w.reviews               = p.Reviews__c != null ? Integer.valueOf(p.Reviews__c) : 0;
            w.isNew                 = p.IsNew__c;
            w.isActive              = p.IsActive;
            w.specs                 = p.Specs__c;

            w.unitPrice     = 0;
            w.pricebookEntryId = null;
            if (!p.PricebookEntries.isEmpty()) {
                w.unitPrice        = p.PricebookEntries[0].UnitPrice;
                w.pricebookEntryId = p.PricebookEntries[0].Id;
            }

            w.stockQuantity = 0;
            w.stockId       = null;
            if (!p.Stocks__r.isEmpty()) {
                w.stockQuantity = p.Stocks__r[0].Quantity_Available__c != null
                                  ? Integer.valueOf(p.Stocks__r[0].Quantity_Available__c) : 0;
                w.stockId       = p.Stocks__r[0].Id;
            }
            result.add(w);
        }
        return result;
    }

    // ── upsertProduct (create or update) ─────────────────────────────────────
    @AuraEnabled
    public static String upsertProduct(
        String  productId,
        String  name,
        String  productCode,
        String  description,
        String  family,
        String  subcategory,
        String  brand,
        Decimal unitPrice,
        Integer stockQuantity,
        String  imageUrl,
        String  availabilityStatus,
        Decimal rating,
        Integer reviews,
        Boolean isNew,
        String  specs
    ) {
        // ── Product2 ──────────────────────────────────────────────────────────
        Product2 p = String.isNotBlank(productId)
            ? new Product2(Id = productId)
            : new Product2(IsActive = true);

        p.Name                  = name;
        p.ProductCode           = productCode;
        p.Description           = description;
        p.Family                = family;
        p.Subcategory__c        = subcategory;
        p.Brand__c              = brand;
        p.Image_URL__c          = imageUrl;
        p.AvailabilityStatus__c = availabilityStatus;
        p.Rating__c             = rating;
        p.Reviews__c            = reviews;
        p.IsNew__c              = (isNew == true);
        p.Specs__c              = specs;

        upsert p;

        // ── PricebookEntry (standard pricebook) ───────────────────────────────
        Id stdPricebookId = Test.isRunningTest()
            ? Test.getStandardPricebookId()
            : [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1].Id;

        List<PricebookEntry> existingEntries = [
            SELECT Id FROM PricebookEntry
            WHERE Product2Id = :p.Id AND Pricebook2Id = :stdPricebookId AND IsActive = true
            LIMIT 1
        ];

        if (existingEntries.isEmpty()) {
            PricebookEntry pbe = new PricebookEntry(
                Pricebook2Id = stdPricebookId,
                Product2Id   = p.Id,
                UnitPrice    = unitPrice != null ? unitPrice : 0,
                IsActive     = true
            );
            insert pbe;
        } else {
            PricebookEntry pbe = new PricebookEntry(
                Id        = existingEntries[0].Id,
                UnitPrice = unitPrice != null ? unitPrice : 0
            );
            update pbe;
        }

        // ── Stock__c ──────────────────────────────────────────────────────────
        List<Stock__c> existingStocks = [
            SELECT Id FROM Stock__c WHERE Product__c = :p.Id LIMIT 1
        ];

        if (existingStocks.isEmpty()) {
            Stock__c s = new Stock__c(
                Product__c           = p.Id,
                Quantity_Available__c = stockQuantity != null ? stockQuantity : 0
            );
            insert s;
        } else {
            Stock__c s = new Stock__c(
                Id                   = existingStocks[0].Id,
                Quantity_Available__c = stockQuantity != null ? stockQuantity : 0
            );
            update s;
        }

        return p.Id;
    }

    // ── deleteProduct (deactivates; preserves data) ───────────────────────────
    @AuraEnabled
    public static void deleteProduct(String productId) {
        update new Product2(Id = productId, IsActive = false);
    }

    // ── saveProductImage ──────────────────────────────────────────────────────
    @AuraEnabled
    public static void saveProductImage(Id productId, Id contentVersionId) {
        ContentDistribution cd = new ContentDistribution();
        cd.Name                          = 'ProductImage-' + productId;
        cd.ContentVersionId              = contentVersionId;
        cd.PreferencesAllowViewInBrowser = true;
        cd.PreferencesPasswordRequired   = false;
        cd.PreferencesNotifyOnVisit      = false;
        insert cd;

        cd = [SELECT DistributionPublicUrl FROM ContentDistribution WHERE Id = :cd.Id LIMIT 1];
        update new Product2(Id = productId, Image_URL__c = cd.DistributionPublicUrl);
    }

    // ── getProductDetail (single product, for detail view) ───────────────────
    @AuraEnabled(cacheable=true)
    public static Product2 getProductDetail(Id productId) {
        return [
            SELECT Id, Name, ProductCode, Description, Family, Subcategory__c,
                   Brand__c, Image_URL__c, AvailabilityStatus__c, Rating__c, Reviews__c,
                   IsNew__c, Specs__c,
                   (SELECT Quantity_Available__c, Reorder_Threshold__c, AI_Risk_Summary__c
                    FROM Stocks__r LIMIT 1),
                   (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = true LIMIT 1)
            FROM Product2
            WHERE Id = :productId
        ];
    }
}
