public with sharing class ComboPackageController {

    @AuraEnabled(cacheable=true)
    public static List<PackageWrapper> getActivePackages() {
        List<ComboPackage__c> packages = [
            SELECT Id, Name, Description__c, DiscountPercent__c, IsActive__c, Category__c,
                   (SELECT Id, Product__c, ProductName__c, ProductImageUrl__c,
                           ProductPrice__c, ProductFamily__c, SortOrder__c
                    FROM Combo_Package_Items__r
                    ORDER BY SortOrder__c ASC NULLS LAST)
            FROM ComboPackage__c
            WHERE IsActive__c = true
            WITH SECURITY_ENFORCED
            ORDER BY Name ASC
        ];
        List<PackageWrapper> results = new List<PackageWrapper>();
        for (ComboPackage__c pkg : packages) {
            results.add(new PackageWrapper(pkg));
        }
        return results;
    }

    @AuraEnabled(cacheable=true)
    public static List<PackageWrapper> getAllPackages() {
        List<ComboPackage__c> packages = [
            SELECT Id, Name, Description__c, DiscountPercent__c, IsActive__c, Category__c,
                   (SELECT Id, Product__c, ProductName__c, ProductImageUrl__c,
                           ProductPrice__c, ProductFamily__c, SortOrder__c
                    FROM Combo_Package_Items__r
                    ORDER BY SortOrder__c ASC NULLS LAST)
            FROM ComboPackage__c
            WITH SECURITY_ENFORCED
            ORDER BY Name ASC
        ];
        List<PackageWrapper> results = new List<PackageWrapper>();
        for (ComboPackage__c pkg : packages) {
            results.add(new PackageWrapper(pkg));
        }
        return results;
    }

    @AuraEnabled
    public static String savePackage(String packageJson) {
        Map<String, Object> pkg = (Map<String, Object>) JSON.deserializeUntyped(packageJson);

        String pkgId = (String) pkg.get('id');
        ComboPackage__c record = String.isNotBlank(pkgId)
            ? new ComboPackage__c(Id = pkgId)
            : new ComboPackage__c();

        record.Name           = (String) pkg.get('name');
        record.Description__c = (String) pkg.get('description');
        record.Category__c    = (String) pkg.get('category');
        record.IsActive__c    = pkg.get('isActive') != null ? (Boolean) pkg.get('isActive') : true;
        record.DiscountPercent__c = pkg.get('discountPercent') != null
            ? Decimal.valueOf(String.valueOf(pkg.get('discountPercent')))
            : 10;

        upsert record;

        // Replace existing items
        delete [SELECT Id FROM ComboPackageItem__c WHERE ComboPackage__c = :record.Id];

        List<Object> items = (List<Object>) pkg.get('items');
        if (items != null && !items.isEmpty()) {
            List<ComboPackageItem__c> newItems = new List<ComboPackageItem__c>();
            Integer sortOrder = 0;
            for (Object rawItem : items) {
                Map<String, Object> item = (Map<String, Object>) rawItem;
                ComboPackageItem__c itemRec = new ComboPackageItem__c();
                itemRec.ComboPackage__c    = record.Id;
                itemRec.Product__c         = (String) item.get('productId');
                itemRec.ProductName__c     = (String) item.get('productName');
                itemRec.ProductImageUrl__c = (String) item.get('productImageUrl');
                itemRec.ProductFamily__c   = (String) item.get('productFamily');
                itemRec.ProductPrice__c    = item.get('productPrice') != null
                    ? Decimal.valueOf(String.valueOf(item.get('productPrice')))
                    : 0;
                itemRec.SortOrder__c = sortOrder++;
                newItems.add(itemRec);
            }
            insert newItems;
        }

        return record.Id;
    }

    @AuraEnabled
    public static void deletePackage(String packageId) {
        delete [SELECT Id FROM ComboPackageItem__c WHERE ComboPackage__c = :packageId];
        delete new ComboPackage__c(Id = packageId);
    }

    @AuraEnabled
    public static void togglePackageActive(String packageId, Boolean isActive) {
        update new ComboPackage__c(Id = packageId, IsActive__c = isActive);
    }

    // ── Wrappers ──────────────────────────────────────────────────────────────

    public class PackageWrapper {
        @AuraEnabled public String  id;
        @AuraEnabled public String  name;
        @AuraEnabled public String  description;
        @AuraEnabled public Decimal discountPercent;
        @AuraEnabled public Boolean isActive;
        @AuraEnabled public String  category;
        @AuraEnabled public List<ItemWrapper> items;
        @AuraEnabled public Decimal originalPrice;
        @AuraEnabled public Decimal totalPrice;
        @AuraEnabled public Decimal savings;

        public PackageWrapper(ComboPackage__c pkg) {
            this.id             = pkg.Id;
            this.name           = pkg.Name;
            this.description    = pkg.Description__c;
            this.discountPercent = pkg.DiscountPercent__c != null ? pkg.DiscountPercent__c : 10;
            this.isActive       = pkg.IsActive__c;
            this.category       = pkg.Category__c;
            this.items          = new List<ItemWrapper>();

            Decimal total = 0;
            for (ComboPackageItem__c item : pkg.Combo_Package_Items__r) {
                this.items.add(new ItemWrapper(item));
                total += item.ProductPrice__c != null ? item.ProductPrice__c : 0;
            }
            this.originalPrice = total;
            this.savings       = total * (this.discountPercent / 100);
            this.totalPrice    = total - this.savings;
        }
    }

    public class ItemWrapper {
        @AuraEnabled public String  id;
        @AuraEnabled public String  productId;
        @AuraEnabled public String  productName;
        @AuraEnabled public String  productImageUrl;
        @AuraEnabled public Decimal productPrice;
        @AuraEnabled public String  productFamily;
        @AuraEnabled public Integer sortOrder;

        public ItemWrapper(ComboPackageItem__c item) {
            this.id             = item.Id;
            this.productId      = item.Product__c;
            this.productName    = item.ProductName__c;
            this.productImageUrl = item.ProductImageUrl__c;
            this.productPrice   = item.ProductPrice__c;
            this.productFamily  = item.ProductFamily__c;
            this.sortOrder      = item.SortOrder__c != null ? Integer.valueOf(item.SortOrder__c) : 0;
        }
    }
}
