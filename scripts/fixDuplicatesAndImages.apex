// ── Step 1: Remove duplicate TN-* products (keep oldest, delete newest) ───────
Map<String, List<Product2>> byCode = new Map<String, List<Product2>>();
for (Product2 p : [SELECT Id, ProductCode, CreatedDate FROM Product2 WHERE ProductCode LIKE 'TN-%' ORDER BY ProductCode, CreatedDate ASC]) {
    if (!byCode.containsKey(p.ProductCode)) byCode.put(p.ProductCode, new List<Product2>());
    byCode.get(p.ProductCode).add(p);
}

List<Id> toDelete = new List<Id>();
for (String code : byCode.keySet()) {
    List<Product2> dupes = byCode.get(code);
    if (dupes.size() > 1) {
        // keep index 0 (oldest), delete the rest
        for (Integer i = 1; i < dupes.size(); i++) toDelete.add(dupes[i].Id);
    }
}

if (!toDelete.isEmpty()) {
    // delete PricebookEntries first
    delete [SELECT Id FROM PricebookEntry WHERE Product2Id IN :toDelete];
    delete [SELECT Id FROM Product2 WHERE Id IN :toDelete];
    System.debug('Deleted ' + toDelete.size() + ' duplicate TN products');
} else {
    System.debug('No duplicates found');
}

// ── Step 2: Fix broken/dark Unsplash image IDs ────────────────────────────────
String base = 'https://images.unsplash.com/photo-';
String p    = '?w=600&h=400&fit=crop&auto=format&q=80';

// Known good replacement IDs:
// headphone/headset  → use audio/speaker tech photo
// GPU / hardware     → circuit board photo (confirmed working)
// generic peripheral → keyboard photo (confirmed working)

Map<String, String> codeToFix = new Map<String, String>{
    // MSI headset – old ID had 10-digit timestamp, likely 404
    'MSI-P03' => base + '1505740106-c4cc73b56f6d' + p,   // headphones flat lay

    // MSI RTX 4090 – force a bright GPU image
    'MSI-C01' => base + '1518770660439-4636190af475' + p, // circuit board (confirmed)

    // Also fix microphone products from addPeripheralsAndFixNvidia (same bad ID)
    'MIC-001' => base + '1598488035-4b9c4e93f4b4' + p,   // keep original (may work)
    'MIC-002' => base + '1598488035-4b9c4e93f4b4' + p,
    'MIC-003' => base + '1598488035-4b9c4e93f4b4' + p
};

// Better: replace ALL products using the suspicious 10-digit ID
List<Product2> suspectImg = [
    SELECT Id, ProductCode, Image_URL__c FROM Product2
    WHERE Image_URL__c LIKE '%1598488035-4b9c4e93f4b4%'
    AND IsActive = true
];
for (Product2 prod : suspectImg) {
    // use a confirmed good peripheral/tech image
    prod.Image_URL__c = base + '1505740106-c4cc73b56f6d' + p;
}
if (!suspectImg.isEmpty()) {
    update suspectImg;
    System.debug('Fixed ' + suspectImg.size() + ' products with bad headset image ID');
}

// Also fix MSI-C01 RTX 4090 specifically
List<Product2> gpu = [SELECT Id, Image_URL__c FROM Product2 WHERE ProductCode = 'MSI-C01' LIMIT 1];
if (!gpu.isEmpty()) {
    gpu[0].Image_URL__c = base + '1518770660439-4636190af475' + p;
    update gpu;
    System.debug('Fixed MSI-C01 GPU image');
}

// ── Step 3: Patch any remaining products with null/empty images ───────────────
Map<String, String> familyFallback = new Map<String, String>{
    'Computers & Workstations' => base + '1496181133206-80ce9b88a853' + p,
    'Hardware & Servers'       => base + '1518770660439-4636190af475' + p,
    'Peripherals'              => base + '1587829741301-dc798b83add3' + p,
    'Storage'                  => base + '1558494949-ef010cbdcc31'    + p,
    'Networking'               => base + '1516044734145-e56d53de86ef' + p,
    'Software Licenses'        => base + '1461749280684-dccba630e2f6' + p,
    'Cloud & Infrastructure'   => base + '1451187580459-43490279c0fa' + p,
    'AI & Analytics'           => base + '1677442136019-21780ecad995' + p,
    'Developer Tools'          => base + '1498050108023-c5249f4df085' + p,
    'Collaboration'            => base + '1600880292203-757bb62b4baf' + p,
    'Cybersecurity'            => base + '1550751827-4bd374c3f58b'    + p,
    'Professional Services'    => base + '1507003211169-0a1dd7228f2d' + p
};

List<Product2> noImg = [
    SELECT Id, Family, Image_URL__c FROM Product2
    WHERE IsActive = true AND Family != null
    AND (Image_URL__c = null OR Image_URL__c = '')
];
for (Product2 prod : noImg) {
    String fallback = familyFallback.get(prod.Family);
    if (fallback != null) prod.Image_URL__c = fallback;
}
if (!noImg.isEmpty()) {
    update noImg;
    System.debug('Patched ' + noImg.size() + ' products with missing images');
}

System.debug('Total active products: ' + [SELECT COUNT() FROM Product2 WHERE IsActive = true AND Family != null]);
