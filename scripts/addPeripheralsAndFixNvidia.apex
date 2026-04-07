String base = 'https://images.unsplash.com/photo-';
String p = '?w=600&h=400&fit=crop&auto=format&q=80';

// ── Fix NVIDIA flower image ────────────────────────────────────
List<Product2> nvidia = [SELECT Id FROM Product2 WHERE ProductCode = 'RTX-6000-BW' LIMIT 1];
if(!nvidia.isEmpty()) {
  nvidia[0].Image_URL__c = base + '1587620962725-abab19836100' + p;
  update nvidia;
  System.debug('Fixed NVIDIA image');
}

// ── New products ───────────────────────────────────────────────
List<Product2> newProds = new List<Product2>();

// Computers & Workstations
newProds.add(new Product2(Name='Apple MacBook Pro M4 Max 16in Fleet 10', Family='Computers & Workstations', ProductCode='PC-001', Price__c=39000, Description='10x MacBook Pro M4 Max, 48GB unified memory, 1TB SSD, Liquid Retina XDR, 24-core GPU. Business fleet pricing.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1517336450136-61571d3d3d89'+p));
newProds.add(new Product2(Name='Dell XPS Desktop 8960 Workstation', Family='Computers & Workstations', ProductCode='PC-002', Price__c=3200, Description='Intel Core i9-13900K, 64GB DDR5, NVIDIA RTX 4070, 2TB NVMe SSD, Windows 11 Pro. Professional desktop workstation.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1593642632559-0c6d3fc62b89'+p));
newProds.add(new Product2(Name='HP EliteDesk 800 G9 Mini PC Fleet 20', Family='Computers & Workstations', ProductCode='PC-003', Price__c=28000, Description='20x Core i7-13700T, 32GB RAM, 512GB NVMe, Wi-Fi 6E, vPro, HP Wolf Security. Ultra-compact business PC.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1496181133206-80ce9b88a853'+p));
newProds.add(new Product2(Name='Apple Mac Studio M4 Ultra', Family='Computers & Workstations', ProductCode='PC-004', Price__c=8500, Description='M4 Ultra chip, 192GB unified memory, 8TB SSD, 32-core GPU. Ultimate desktop for AI, video, 3D rendering.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1593642632559-0c6d3fc62b89'+p));
newProds.add(new Product2(Name='Microsoft Surface Studio 2+ All-in-One', Family='Computers & Workstations', ProductCode='PC-005', Price__c=6200, Description='Core i7, 64GB RAM, 2TB SSD, 28in PixelSense touch display 4500x3000, NVIDIA RTX 3060. Creative workstation.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1517336450136-61571d3d3d89'+p));

// Storage — HDDs / SSDs
newProds.add(new Product2(Name='Samsung 990 Pro NVMe SSD 4TB Pack x10', Family='Storage', ProductCode='STG-001', Price__c=4500, Description='10x 4TB PCIe 5.0 NVMe M.2 SSD. 7,450 MB/s read, 6,900 MB/s write. 5-year warranty. Enterprise workload optimized.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1558494949-ef010cbdcc31'+p));
newProds.add(new Product2(Name='Seagate Exos X20 20TB HDD Pack x5', Family='Storage', ProductCode='STG-002', Price__c=1800, Description='5x 20TB enterprise HDD, 7200RPM, SAS 12Gb/s, 285MB/s sustained transfer, 2.5M hours MTBF. Data center grade.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1591405351990-4726e36695c8'+p));
newProds.add(new Product2(Name='WD Gold 18TB Enterprise NAS Pack x8', Family='Storage', ProductCode='STG-003', Price__c=3200, Description='8x 18TB SATA HDD optimized for NAS/RAID. HelioSeal technology, 272MB/s, 2.5M hours MTBF, 5-year warranty.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1558494949-ef010cbdcc31'+p));
newProds.add(new Product2(Name='Kingston IronKey Encrypted USB 3.2 64GB x50', Family='Storage', ProductCode='STG-004', Price__c=2500, Description='50x hardware-encrypted USB drives. FIPS 197, XTS-AES 256-bit, password brute-force protection. GDPR compliant.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1518770660439-4636190af475'+p));

// Mice
newProds.add(new Product2(Name='Logitech MX Master 3S Business Pack x20', Family='Peripherals', ProductCode='MSE-001', Price__c=2400, Description='20x MX Master 3S, 8K DPI, MagSpeed scroll, ergonomic design, Bluetooth + USB-C, 70-day battery. Business bundle.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527864234440-d1c5d7ce3822'+p));
newProds.add(new Product2(Name='Razer DeathAdder V3 Pro Gaming Mouse x10', Family='Peripherals', ProductCode='MSE-002', Price__c=1800, Description='10x wireless gaming mouse, 30K DPI optical sensor, 90-hour battery, 59g ultralight, HyperSpeed low-latency.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527864234440-d1c5d7ce3822'+p));
newProds.add(new Product2(Name='Apple Magic Mouse Pack x15', Family='Peripherals', ProductCode='MSE-003', Price__c=1800, Description='15x Magic Mouse with Multi-Touch surface, rechargeable, wireless Bluetooth, aluminium body. macOS optimized.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527864234440-d1c5d7ce3822'+p));

// Keyboards
newProds.add(new Product2(Name='Logitech MX Keys S Business Pack x20', Family='Peripherals', ProductCode='KBD-001', Price__c=2600, Description='20x MX Keys S, backlit, low-profile, Bluetooth multi-device (3 devices), USB-C charging, spill-resistant. Business bundle.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587829741301-dc798b83add3'+p));
newProds.add(new Product2(Name='Keychron Q1 Pro Mechanical Keyboard x10', Family='Peripherals', ProductCode='KBD-002', Price__c=2200, Description='10x fully assembled mechanical keyboard, hot-swappable switches, QMK/VIA, aluminum body, RGB, wireless Bluetooth 5.1.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587829741301-dc798b83add3'+p));
newProds.add(new Product2(Name='Apple Magic Keyboard with Touch ID Pack x15', Family='Peripherals', ProductCode='KBD-003', Price__c=2100, Description='15x Magic Keyboard, Touch ID fingerprint sensor, numeric keypad, rechargeable, Bluetooth. macOS/iPadOS optimized.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587829741301-dc798b83add3'+p));

// Microphones
newProds.add(new Product2(Name='Shure MV7+ USB/XLR Podcast Mic Pack x10', Family='Peripherals', ProductCode='MIC-001', Price__c=3500, Description='10x hybrid USB+XLR dynamic microphone. Built-in headphone output, DSP presets, MOTIV app, broadcast quality. Podcast/streaming.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1598488035-4b9c4e93f4b4'+p));
newProds.add(new Product2(Name='Blue Yeti X Professional USB Mic x10', Family='Peripherals', ProductCode='MIC-002', Price__c=2200, Description='10x multi-pattern condenser mic. Cardioid, bidirectional, omnidirectional, stereo. LED metering, Blue VO!CE DSP.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1598488035-4b9c4e93f4b4'+p));
newProds.add(new Product2(Name='Rode NT-USB Mini Microphone x5', Family='Peripherals', ProductCode='MIC-003', Price__c=900, Description='5x studio-quality USB condenser mic. 24-bit/48kHz, magnetic desktop stand, headphone monitoring, USB-C. Recording/podcasting.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1598488035-4b9c4e93f4b4'+p));

// Monitors
newProds.add(new Product2(Name='Dell UltraSharp U2723QE 4K Monitor x10', Family='Peripherals', ProductCode='MON-001', Price__c=8500, Description='10x 27in 4K IPS, USB-C 90W, Thunderbolt 4, 100% sRGB/Rec. 709, ComfortView Plus. Professional color accuracy.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527443224154-c4a3942d3acf'+p));
newProds.add(new Product2(Name='LG UltraWide 34in Curved Monitor x5', Family='Peripherals', ProductCode='MON-002', Price__c=4500, Description='5x 34in WQHD 3440x1440, 144Hz, 1ms, USB-C 65W, KVM switch, HDR10. Productivity and creative professionals.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527443224154-c4a3942d3acf'+p));

Database.SaveResult[] results = Database.insert(newProds, false);
Integer ok = 0; Integer fail = 0;
for(Database.SaveResult r : results) {
  if(r.isSuccess()) ok++;
  else { fail++; System.debug('FAIL: ' + r.getErrors()); }
}
System.debug('Inserted: ' + ok + ' new products | Failed: ' + fail);

// PricebookEntries
Id stdPbId = [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1].Id;
List<PricebookEntry> pbes = new List<PricebookEntry>();
for(Integer i = 0; i < results.size(); i++) {
  if(results[i].isSuccess()) {
    pbes.add(new PricebookEntry(
      Pricebook2Id = stdPbId,
      Product2Id   = results[i].getId(),
      UnitPrice    = newProds[i].Price__c != null ? newProds[i].Price__c : 1000,
      IsActive     = true
    ));
  }
}
Database.insert(pbes, false);
System.debug('Total active products now: ' + [SELECT COUNT() FROM Product2 WHERE IsActive = true AND Family != null]);
