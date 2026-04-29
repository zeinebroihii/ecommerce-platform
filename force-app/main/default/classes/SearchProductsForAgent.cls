/**
 * SearchProductsForAgent
 *
 * @InvocableMethod — called by the Nexus Support Agent (Service Agent)
 * when a customer asks about products, searches for items, or asks about
 * availability/pricing.
 * Input: keyword (free text) + optional category filter.
 * Output: plain-text list the LLM reads and relays conversationally.
 */
public without sharing class SearchProductsForAgent {

    public class ProductRequest {
        @InvocableVariable(label='Search Keyword')
        public String keyword;

        @InvocableVariable(label='Category Filter (optional)')
        public String category;
    }

    public class ProductSummary {
        @InvocableVariable(label='Products Summary')
        public String summary;
    }

    // Maps loose terms the LLM might pass → real Family values in org
    private static final Map<String, String> FAMILY_ALIASES = new Map<String, String>{
        'computing'           => 'Computing',
        'computer'            => 'Computers & Workstations',
        'workstation'         => 'Computers & Workstations',
        'laptop'              => 'Computers & Workstations',
        'pc'                  => 'Computers & Workstations',
        'server'              => 'Hardware & Servers',
        'hardware'            => 'Hardware & Servers',
        'sensor'              => 'Sensors & Monitoring',
        'monitoring'          => 'Sensors & Monitoring',
        'iot'                 => 'Sensors & Monitoring',
        'capteur'             => 'Sensors & Monitoring',
        'connectivity'        => 'Connectivity',
        'connectivite'        => 'Connectivity',
        'connectivité'        => 'Connectivity',
        'network'             => 'Networking',
        'networking'          => 'Networking',
        'reseau'              => 'Networking',
        'réseau'              => 'Networking',
        'storage'             => 'Storage',
        'stockage'            => 'Storage',
        'ssd'                 => 'Storage',
        'hdd'                 => 'Storage',
        'security'            => 'Cybersecurity',
        'cybersecurity'       => 'Cybersecurity',
        'securite'            => 'Cybersecurity',
        'sécurité'            => 'Cybersecurity',
        'cloud'               => 'Cloud & Infrastructure',
        'infrastructure'      => 'Cloud & Infrastructure',
        'sustainability'      => 'Sustainability',
        'durabilite'          => 'Sustainability',
        'durabilité'          => 'Sustainability',
        'energy'              => 'Sustainability',
        'energie'             => 'Sustainability',
        'énergie'             => 'Sustainability',
        'ai'                  => 'AI & Analytics',
        'analytics'           => 'AI & Analytics',
        'software'            => 'Software Licenses',
        'logiciel'            => 'Software Licenses',
        'collaboration'       => 'Collaboration',
        'developer'           => 'Developer Tools',
        'developpeur'         => 'Developer Tools',
        'développeur'         => 'Developer Tools',
        'peripheral'          => 'Peripherals',
        'peripherique'        => 'Peripherals',
        'périphérique'        => 'Peripherals',
        'services'            => 'Professional Services'
    };

    @InvocableMethod(
        label='Search Products'
        description='Searches the Nexus product catalog by keyword and/or category. Returns a readable list of matching products with price and availability.'
    )
    public static List<ProductSummary> searchProducts(List<ProductRequest> requests) {
        ProductSummary result = new ProductSummary();

        String keyword = '';
        String category = '';

        if (requests != null && !requests.isEmpty()) {
            keyword  = requests[0].keyword  != null ? requests[0].keyword.trim()  : '';
            category = requests[0].category != null ? requests[0].category.trim() : '';
        }

        if (String.isBlank(keyword) && String.isBlank(category)) {
            result.summary = 'Veuillez préciser le produit ou la catégorie que vous recherchez.';
            return new List<ProductSummary>{ result };
        }

        // Resolve family from category input or keyword alias
        String resolvedFamily = resolveFamily(category);
        if (String.isBlank(resolvedFamily)) {
            resolvedFamily = resolveFamily(keyword);
        }

        String likeKeyword = '%' + keyword + '%';

        List<Product2> products;

        if (String.isNotBlank(resolvedFamily) && String.isNotBlank(keyword)) {
            // Keyword + resolved family
            products = [
                SELECT Name, Family, Subcategory__c, Brand__c, Price__c,
                       AvailabilityStatus__c, Rating__c, Description, IsNew__c
                FROM Product2
                WHERE IsActive = TRUE
                  AND Family = :resolvedFamily
                ORDER BY Rating__c DESC NULLS LAST
                LIMIT 8
            ];
            // If still empty, fall back to name search only
            if (products.isEmpty()) {
                products = [
                    SELECT Name, Family, Subcategory__c, Brand__c, Price__c,
                           AvailabilityStatus__c, Rating__c, Description, IsNew__c
                    FROM Product2
                    WHERE IsActive = TRUE
                      AND (Name LIKE :likeKeyword OR Description LIKE :likeKeyword)
                    ORDER BY Rating__c DESC NULLS LAST
                    LIMIT 8
                ];
            }
        } else if (String.isNotBlank(resolvedFamily)) {
            // Category only
            products = [
                SELECT Name, Family, Subcategory__c, Brand__c, Price__c,
                       AvailabilityStatus__c, Rating__c, Description, IsNew__c
                FROM Product2
                WHERE IsActive = TRUE AND Family = :resolvedFamily
                ORDER BY Rating__c DESC NULLS LAST
                LIMIT 8
            ];
        } else if (String.isNotBlank(keyword)) {
            // Keyword only — search name and description
            products = [
                SELECT Name, Family, Subcategory__c, Brand__c, Price__c,
                       AvailabilityStatus__c, Rating__c, Description, IsNew__c
                FROM Product2
                WHERE IsActive = TRUE
                  AND (Name LIKE :likeKeyword OR Description LIKE :likeKeyword)
                ORDER BY Rating__c DESC NULLS LAST
                LIMIT 8
            ];
        } else {
            products = new List<Product2>();
        }

        if (products.isEmpty()) {
            result.summary =
                'Aucun produit trouvé pour "' + (String.isNotBlank(keyword) ? keyword : category) + '".\n' +
                'Catégories disponibles : Computers & Workstations, Hardware & Servers, Computing, ' +
                'Connectivity, Sensors & Monitoring, Storage, Networking, Cybersecurity, ' +
                'Cloud & Infrastructure, Sustainability, AI & Analytics, Software Licenses, ' +
                'Collaboration, Developer Tools, Peripherals, Professional Services.\n' +
                'Essayez un terme plus général ou consultez l\'onglet Catalogue directement.';
            return new List<ProductSummary>{ result };
        }

        List<String> lines = new List<String>();
        lines.add('Voici ' + products.size() + ' produit(s) correspondant(s) :');
        lines.add('');

        for (Product2 p : products) {
            String price        = p.Price__c != null ? p.Price__c.setScale(2) + ' €' : 'Prix sur demande';
            String availability = p.AvailabilityStatus__c != null ? p.AvailabilityStatus__c : 'Disponibilité inconnue';
            String rating       = p.Rating__c != null ? p.Rating__c.setScale(1) + '/5' : '';
            String brand        = String.isNotBlank(p.Brand__c) ? p.Brand__c : '';
            String subcategory  = String.isNotBlank(p.Subcategory__c) ? p.Subcategory__c : '';
            String newTag       = p.IsNew__c == true ? ' [NOUVEAU]' : '';

            lines.add('• ' + p.Name + newTag);
            if (String.isNotBlank(brand))      lines.add('  Marque : ' + brand);
            if (String.isNotBlank(p.Family))   lines.add('  Catégorie : ' + p.Family +
                (String.isNotBlank(subcategory) ? ' > ' + subcategory : ''));
            lines.add('  Prix : ' + price);
            lines.add('  Disponibilité : ' + availability);
            if (String.isNotBlank(rating))     lines.add('  Note : ' + rating);
            lines.add('');
        }

        result.summary = String.join(lines, '\n');
        return new List<ProductSummary>{ result };
    }

    private static String resolveFamily(String input) {
        if (String.isBlank(input)) return '';
        String lower = input.toLowerCase().trim();

        // Direct match on full family name
        List<String> knownFamilies = new List<String>{
            'Computers & Workstations', 'Hardware & Servers', 'Computing',
            'Connectivity', 'Sensors & Monitoring', 'Storage', 'Networking',
            'Cybersecurity', 'Cloud & Infrastructure', 'Sustainability',
            'AI & Analytics', 'Software Licenses', 'Collaboration',
            'Developer Tools', 'Peripherals', 'Professional Services', 'AI'
        };
        for (String f : knownFamilies) {
            if (lower == f.toLowerCase()) return f;
        }

        // Check alias map — partial match
        for (String alias : FAMILY_ALIASES.keySet()) {
            if (lower.contains(alias)) return FAMILY_ALIASES.get(alias);
        }

        return '';
    }
}
