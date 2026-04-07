String base = 'https://images.unsplash.com/photo-';
String p = '?w=600&h=400&fit=crop&auto=format&q=80';

List<Product2> newProds = new List<Product2>();

// ── MSI PCs & Laptops ──────────────────────────────────────────
newProds.add(new Product2(Name='MSI Titan GT77 HX Gaming Laptop', Family='Computers & Workstations', ProductCode='MSI-001', Price__c=4200, Description='Intel Core i9-13980HX, NVIDIA RTX 4090 16GB, 64GB DDR5, 4TB NVMe RAID, 17.3in 4K 144Hz IPS. Ultimate gaming laptop.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1593642632559-0c6d3fc62b89'+p));
newProds.add(new Product2(Name='MSI MEG Trident X2 Gaming Desktop', Family='Computers & Workstations', ProductCode='MSI-002', Price__c=5800, Description='Core i9-13900K, RTX 4090 24GB, 128GB DDR5, 4TB SSD, Wi-Fi 6E, liquid cooling. Premium compact gaming tower.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587620962725-abab19836100'+p));
newProds.add(new Product2(Name='MSI Creator Z17 HX Studio Laptop', Family='Computers & Workstations', ProductCode='MSI-003', Price__c=3100, Description='Core i9-13980HX, RTX 4070 Ti 12GB, 32GB DDR5, 2TB NVMe, 17in QHD+ 240Hz. Built for creators and designers.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1496181133206-80ce9b88a853'+p));
newProds.add(new Product2(Name='MSI MAG Infinite S3 Gaming Desktop', Family='Computers & Workstations', ProductCode='MSI-004', Price__c=1800, Description='Core i7-13700F, RTX 4060 Ti 8GB, 32GB DDR5, 1TB NVMe, RGB, Wi-Fi 6. Entry-level professional gaming PC.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587620962725-abab19836100'+p));
newProds.add(new Product2(Name='MSI Prestige 16 AI Evo Business Laptop', Family='Computers & Workstations', ProductCode='MSI-005', Price__c=1650, Description='Intel Core Ultra 7 155H, Intel Arc GPU, 32GB LPDDR5, 1TB NVMe, 16in 2K 120Hz, 99Wh battery. AI-powered productivity.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1496181133206-80ce9b88a853'+p));
newProds.add(new Product2(Name='MSI Raider GE78 HX Gaming Laptop', Family='Computers & Workstations', ProductCode='MSI-006', Price__c=3600, Description='Core i9-14900HX, RTX 4080 12GB, 32GB DDR5, 2TB SSD, 17in QHD+ 240Hz, MUX Switch, Per-Key RGB keyboard.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1593642632559-0c6d3fc62b89'+p));
newProds.add(new Product2(Name='MSI MPG Velox 100R Gaming Tower', Family='Computers & Workstations', ProductCode='MSI-007', Price__c=2400, Description='Core i7-14700K, RTX 4070 Super 12GB, 32GB DDR5, 2TB NVMe, 360mm AIO liquid cooler, RGB tower case.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587620962725-abab19836100'+p));
newProds.add(new Product2(Name='MSI Workstation WS76 Mobile', Family='Computers & Workstations', ProductCode='MSI-008', Price__c=2900, Description='Core i7-12700H, NVIDIA RTX A2000 8GB, 64GB ECC DDR5, 2TB NVMe, 17.3in FHD 144Hz, ISV-certified.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1496181133206-80ce9b88a853'+p));

// ── MSI Monitors ────────────────────────────────────────────────
newProds.add(new Product2(Name='MSI MAG 274QRF-QD Gaming Monitor', Family='Peripherals', ProductCode='MSI-M01', Price__c=480, Description='27in QHD 2560x1440, 165Hz, 1ms, IPS Quantum Dot, 95% DCI-P3, HDR400, G-Sync Compatible, USB hub. Gaming + creative.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527443224154-c4a3942d3acf'+p));
newProds.add(new Product2(Name='MSI MEG 381CQR Plus Curved Monitor', Family='Peripherals', ProductCode='MSI-M02', Price__c=1100, Description='38in WQHD+ 3840x1600, 144Hz, 1ms, VA curved 1800R, USB-C 65W, KVM, HDR1000, G-Sync. Ultra-wide flagship.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527443224154-c4a3942d3acf'+p));

// ── MSI Peripherals ─────────────────────────────────────────────
newProds.add(new Product2(Name='MSI Clutch GM41 Wireless Gaming Mouse', Family='Peripherals', ProductCode='MSI-P01', Price__c=95, Description='16000 DPI optical sensor, 2.4GHz wireless, 75-hour battery, 6 programmable buttons, RGB, 85g lightweight design.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1527864234440-d1c5d7ce3822'+p));
newProds.add(new Product2(Name='MSI Vigor GK71 Sonic Mechanical Keyboard', Family='Peripherals', ProductCode='MSI-P02', Price__c=130, Description='Full-size mechanical gaming keyboard, MSI Sonic Red switches, per-key RGB, N-Key rollover, USB passthrough, wrist rest.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587829741301-dc798b83add3'+p));
newProds.add(new Product2(Name='MSI Immerse GH50 Wireless Gaming Headset', Family='Peripherals', ProductCode='MSI-P03', Price__c=120, Description='2.4GHz wireless, 40mm drivers, virtual 7.1 surround, noise-cancelling mic, 20-hour battery, memory foam earcups.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1598488035-4b9c4e93f4b4'+p));

// ── MSI Components ──────────────────────────────────────────────
newProds.add(new Product2(Name='MSI GeForce RTX 4090 Suprim X 24GB', Family='Hardware & Servers', ProductCode='MSI-C01', Price__c=2200, Description='NVIDIA RTX 4090 24GB GDDR6X, 16384 CUDA cores, Tri Frozr 3 cooling, 600W TDP, PCIe 4.0. Flagship graphics card.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1587620962725-abab19836100'+p));
newProds.add(new Product2(Name='MSI MEG Z790 ACE MAX Motherboard', Family='Hardware & Servers', ProductCode='MSI-C02', Price__c=780, Description='Intel Z790, DDR5, PCIe 5.0 x16, 5x M.2, Wi-Fi 7, 10GbE LAN, Thunderbolt 4, USB 3.2 Gen2x2, ATX. Flagship board.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1518770660439-4636190af475'+p));
newProds.add(new Product2(Name='MSI MPG A1000G PCIE5 Power Supply', Family='Hardware & Servers', ProductCode='MSI-C03', Price__c=220, Description='1000W 80+ Gold, fully modular, PCIe 5.0 connector, 135mm fan, 10-year warranty. Ready for next-gen GPUs.', AvailabilityStatus__c='En stock', IsActive=true, Image_URL__c=base+'1518770660439-4636190af475'+p));

Database.SaveResult[] results = Database.insert(newProds, false);
Integer ok = 0; Integer fail = 0;
for(Database.SaveResult r : results) {
  if(r.isSuccess()) ok++;
  else { fail++; System.debug('FAIL: ' + r.getErrors()); }
}
System.debug('Inserted: ' + ok + ' MSI products | Failed: ' + fail);

Id stdPbId = [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1].Id;
List<PricebookEntry> pbes = new List<PricebookEntry>();
for(Integer i = 0; i < results.size(); i++) {
  if(results[i].isSuccess()) {
    pbes.add(new PricebookEntry(Pricebook2Id=stdPbId, Product2Id=results[i].getId(), UnitPrice=newProds[i].Price__c, IsActive=true));
  }
}
Database.insert(pbes, false);
System.debug('Total active products: ' + [SELECT COUNT() FROM Product2 WHERE IsActive = true AND Family != null]);
