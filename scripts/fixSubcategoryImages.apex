String tn  = 'https://www.tunisianet.com.tn/';
String b   = 'https://images.unsplash.com/photo-';
String p   = '?w=600&h=400&fit=crop&auto=format&q=80';

// One unique image per product code
Map<String, String> imgMap = new Map<String, String>{

    // ── WORKSTATIONS — real Dell workstation photos from tunisianet ──────────
    'WS-001' => tn + '440474-home/station-de-travail-tour-dell-precision-3680-i9-14900k-nvidia-rtx-2000-ada-16g-32-go-ddr5-1-to-windows-11-pro.jpg',
    'WS-002' => tn + '459507-home/station-de-travail-tour-dell-precision-3680-i9-14900-nvidia-rtx-a1000-8g-32-go-ddr5-512-go-ubunto.jpg',
    'WS-003' => tn + '461191-home/station-de-travail-dell-pro-max-tower-t2-ultra-7-265u-rtx-2000-16g-32-go-1-to-ssd.jpg',
    'WS-004' => tn + '461187-home/station-de-travail-dell-pro-max-tower-t2-ultra-7-265u-a1000-8g-16-go-512-go-ssd.jpg',
    'WS-005' => tn + '461237-home/station-de-travail-dell-pro-max-tower-t2-ultra-9-285u-a1000-8g-16-go-1-to-ssd.jpg',

    // ── EDGE NODES — mini PC photos from tunisianet ──────────────────────────
    'EN-001' => tn + '358245-home/mini-pc-de-bureau-asrock-barebone-deskmini-x300-ryzen-5-5600g-vega-7-8-go-500-go-ssd.jpg',
    'EN-002' => tn + '421665-home/mini-pc-de-bureau-gigabyte-gb-bmpd-6005-intel-celeron-n6005-wi-fi-bluetooth-noir.jpg',
    'EN-003' => tn + '342687-home/mini-pc-de-bureau-asrock-barebone-serie-deskmeet-b660-noir.jpg',
    'EN-004' => tn + '380895-home/mini-pc-de-bureau-bmax-b3-n5095-8gb-256ssd-windows-11-noir.jpg',
    'EN-005' => tn + '382140-home/mini-pc-de-bureau-bmax-b6-plus-i3-1000ng4-12-go-512-go-ssd-windows-11-vert.jpg',

    // ── QUANTUM — unique Unsplash AI/data science photos ────────────────────
    'QC-001' => b + '1677442136019-21780ecad995' + p,
    'QC-002' => b + '1551288049-bebda4e38f71'    + p,
    'QC-003' => b + '1524492412937-b28074a5d7da' + p,
    'QC-004' => b + '1504868584819-f8e8b4b6d7e3' + p,
    'QC-005' => b + '1626785774573-4b799315345d' + p,

    // ── HUBS & GATEWAYS — router photos from tunisianet ─────────────────────
    'HG-001' => tn + '272685-home/switch-tp-link-jetstream-t2600g-52ts-tl-sg3452-48-ports-avec-4-sfp.jpg',
    'HG-002' => tn + '308997-home/routeur-sans-fil-d-link-dir-806aena-750-mbps.jpg',
    'HG-003' => tn + '266055-home/routeur-wifi-tp-link-archer-c64-ac-1200-mbps-mu-mimo.jpg',
    'HG-004' => tn + '273262-home/routeur-wifi-6-ax1800-bi-bande-tp-link-archer-ax23.jpg',
    'HG-005' => tn + '453720-home/routeur-xiaomi-ax1500.jpg',

    // ── BRIDGES — switch photos from tunisianet ──────────────────────────────
    'BR-001' => tn + '59899-home/switch-gigabit-easysmart-8-ports-poe-101001000-mbps.jpg',
    'BR-002' => tn + '299248-home/switch-de-bureau-tenda-tef1118p-16-150w-16fe2ge1sfp-16-ports-10100-mbps-avec-poe-16-ports.jpg',
    'BR-003' => tn + '221144-home/switch-de-bureau-8-ports-mercusys-ms108-10100-mbps.jpg',
    'BR-004' => tn + '465700-home/switch-de-bureau-hikvision-ds-3e0116r-o-16-ports-10100-mbps.jpg',
    'BR-005' => tn + '415068-home/switch-poe-d-link-smart-dgs-1210-28pe-24-ports.jpg',

    // ── WIRELESS MODULES — access point photos from tunisianet ──────────────
    'WM-001' => tn + '329337-home/point-d-acces-wifi-mesh-ac1200-mu-mimo-gigabit-exterieur-ip65.jpg',
    'WM-002' => tn + '195353-home/point-d-acces-wi-fi-ac-dual-band-1200-mbps-poe-plafonnier.jpg',
    'WM-003' => tn + '440784-home/point-dacces-sans-fil-d-link-unifie-bibande-wi-fi-6-ax3600.jpg',
    'WM-004' => tn + '375656-home/point-d-acces-tenda-i29-wi-fi-6-ax3000-dual-band-gigabit-wireless.jpg',
    'WM-005' => tn + '441596-home/point-d-acces-exterieur-sans-fil-hikvision-wi-fi-6-3000m.jpg',

    // ── ENVIRONMENTAL SENSORS — unique Unsplash tech photos ─────────────────
    'SE-001' => b + '1601584115197-04ecc0da31d7' + p,
    'SE-002' => b + '1484557985045-edf25e08da73' + p,
    'SE-003' => b + '1542831371-29b0f74f9713'    + p,
    'SE-004' => b + '1629904853716-f0bc54eea481' + p,
    'SE-005' => b + '1544197150-b99a580bb7a8'    + p,

    // ── VISUAL MONITORING — real IP camera photos from tunisianet ───────────
    'VM-001' => tn + '152212-home/camera-externe-ip-poe-hikvision-hilook-ipc-b121h-2mp.jpg',
    'VM-002' => tn + '153842-home/camera-interne-ip-poe-hilook-ipc-d121h-2mp.jpg',
    'VM-003' => tn + '294306-home/camera-externe-ip-poe-hikvision-hilook-ipc-b150h-5mp.jpg',
    'VM-004' => tn + '464333-home/camera-hilook-ip-dome-ipc-d640h-z-4mp-objectif-a-focale-variable-ir-50m.jpg',
    'VM-005' => tn + '458675-home/camera-de-surveillance-externe-ip-poe-hikvision-hilook-ipc-b159-h-reseau-fixe-colorvu-5mp.jpg',

    // ── NEURAL SENSORS — unique Unsplash human/tech photos ──────────────────
    'NS-001' => b + '1611162617213-7d7a39e9b1d7' + p,
    'NS-002' => b + '1498050108023-c5249f4df085' + p,
    'NS-003' => b + '1522071820081-009f0129c71c' + p,
    'NS-004' => b + '1507003211169-0a1dd7228f2d' + p,
    'NS-005' => b + '1450101499163-c8848c66ca85' + p,

    // ── ENERGY MONITORING — unique Unsplash tech/data photos ────────────────
    'EM-001' => b + '1563013544-824ae1b704d3'    + p,
    'EM-002' => b + '1461749280684-dccba630e2f6' + p,
    'EM-003' => b + '1555066931-4365d14bab8c'    + p,
    'EM-004' => b + '1555255707-c07966088b7b'    + p,
    'EM-005' => b + '1550751827-4bd374c3f58b'    + p,

    // ── CARBON TRACKING — unique Unsplash sustainability/cloud photos ────────
    'CT-001' => b + '1483058712412-4245e9b90334' + p,
    'CT-002' => b + '1519389950473-47ba0277781c' + p,
    'CT-003' => b + '1451187580459-43490279c0fa' + p,
    'CT-004' => b + '1600880292203-757bb62b4baf' + p,
    'CT-005' => b + '1553877522-43269d4ea984'    + p
};

List<Product2> prods = [
    SELECT Id, ProductCode, Image_URL__c
    FROM Product2
    WHERE ProductCode IN :imgMap.keySet()
    AND IsActive = true
];

for (Product2 prod : prods) {
    prod.Image_URL__c = imgMap.get(prod.ProductCode);
}
update prods;

System.debug('Updated ' + prods.size() + ' product images (' + imgMap.size() + ' unique URLs)');
