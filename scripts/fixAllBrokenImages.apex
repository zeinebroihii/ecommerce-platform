// Fix all broken Unsplash photo IDs (verified 404 via HTTP check)
// Each broken ID is replaced with a verified-200 Unsplash photo

String b = 'https://images.unsplash.com/photo-';
String p = '?w=600&h=400&fit=crop&auto=format&q=80';

// Verified-working replacements:
// laptop/workstation  : 1496181133206-80ce9b88a853  ✓
// gaming laptop       : 1593642632559-0c6d3fc62b89  ✓
// circuit board       : 1518770660439-4636190af475  ✓
// keyboard            : 1587829741301-dc798b83add3  ✓
// headphones          : 1505740420928-5e560c06d30e  ✓
// networking/cloud    : 1519389950473-47ba0277781c  ✓
// security lock       : 1510511459019-5dda7724fd87  ✓
// security shield     : 1550751827-4bd374c3f58b    ✓
// code screen         : 1461749280684-dccba630e2f6  ✓
// monitor             : 1527443224154-c4a3942d3acf  ✓
// SSD/storage         : 1558494949-ef010cbdcc31    ✓

Map<String, String> brokenToFixed = new Map<String, String>{
    // Desktop PCs / gaming towers → gaming laptop photo
    '1587620962725-abab19836100' => b + '1593642632559-0c6d3fc62b89' + p,
    // Hardware rack / HDD → circuit board
    '1591405351990-4726e36695c8' => b + '1518770660439-4636190af475' + p,
    // Mice → keyboard (peripheral)
    '1527864234440-d1c5d7ce3822' => b + '1587829741301-dc798b83add3' + p,
    // Headset/mic (my broken fix) → headphones
    '1505740106-c4cc73b56f6d'    => b + '1505740420928-5e560c06d30e' + p,
    // Networking → cloud/network cables
    '1516044734145-e56d53de86ef' => b + '1519389950473-47ba0277781c' + p,
    // Cybersecurity #1 → padlock
    '1596558450268-9c46310b076f' => b + '1510511459019-5dda7724fd87' + p,
    // Cybersecurity #2 → shield/security
    '1614064641938-b6ce5f5e9586' => b + '1550751827-4bd374c3f58b'    + p,
    // Software licenses → code screen
    '1581291518857-4d27a822d322' => b + '1461749280684-dccba630e2f6' + p,
    // Original headset ID (still on some products) → headphones
    '1598488035-4b9c4e93f4b4'    => b + '1505740420928-5e560c06d30e' + p
};

Integer totalFixed = 0;

for (String brokenId : brokenToFixed.keySet()) {
    String brokenUrl = b + brokenId + p;
    String goodUrl   = brokenToFixed.get(brokenId);

    List<Product2> affected = [
        SELECT Id, Name, ProductCode, Image_URL__c
        FROM Product2
        WHERE Image_URL__c = :brokenUrl
        AND IsActive = true
    ];

    if (!affected.isEmpty()) {
        for (Product2 prod : affected) prod.Image_URL__c = goodUrl;
        update affected;
        System.debug('Fixed ' + affected.size() + ' products with broken ID: ' + brokenId);
        totalFixed += affected.size();
    }
}

System.debug('TOTAL products fixed: ' + totalFixed);
System.debug('Active products with images: ' + [
    SELECT COUNT() FROM Product2
    WHERE IsActive = true AND Family != null AND Image_URL__c != null AND Image_URL__c != ''
]);
