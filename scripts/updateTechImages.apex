// Curated Unsplash tech images per product code
// Format: https://images.unsplash.com/photo-{ID}?w=600&h=400&fit=crop&auto=format&q=80
String base = 'https://images.unsplash.com/photo-';
String params = '?w=600&h=400&fit=crop&auto=format&q=80';

Map<String, String> codeToImg = new Map<String, String>{
  // Cloud & Infrastructure — data centers, cloud, servers
  'CLO-001' => base + '1558494949-ef010cbdcc31' + params,
  'CLO-002' => base + '1451187580459-43490279c0fa' + params,
  'CLO-003' => base + '1544197150-b99a580bb7a8' + params,
  'CLO-004' => base + '1601584115197-04ecc0da31d7' + params,
  'CLO-005' => base + '1484557985045-edf25e08da73' + params,
  'CLO-006' => base + '1519389950473-47ba0277781c' + params,
  'CLO-007' => base + '1629904853716-f0bc54eea481' + params,
  'CLO-008' => base + '1558494949-ef010cbdcc31' + params,

  // Cybersecurity — locks, shields, security
  'SEC-001' => base + '1510511459019-5dda7724fd87' + params,
  'SEC-002' => base + '1563013544-824ae1b704d3' + params,
  'SEC-003' => base + '1550751827-4bd374c3f58b' + params,
  'SEC-004' => base + '1555255707-c07966088b7b' + params,
  'SEC-005' => base + '1596558450268-9c46310b076f' + params,
  'SEC-006' => base + '1614064641938-b6ce5f5e9586' + params,
  'SEC-007' => base + '1510511459019-5dda7724fd87' + params,
  'SEC-008' => base + '1563013544-824ae1b704d3' + params,
  'SEC-009' => base + '1550751827-4bd374c3f58b' + params,

  // Software Licenses — code, laptops, software UI
  'SFT-001' => base + '1461749280684-dccba630e2f6' + params,
  'SFT-002' => base + '1542831371-29b0f74f9713' + params,
  'SFT-003' => base + '1626785774573-4b799315345d' + params,
  'SFT-004' => base + '1504868584819-f8e8b4b6d7e3' + params,
  'SFT-005' => base + '1483058712412-4245e9b90334' + params,
  'SFT-006' => base + '1581291518857-4d27a822d322' + params,
  'SFT-007' => base + '1611162617213-7d7a39e9b1d7' + params,
  'SFT-008' => base + '1555066931-4365d14bab8c' + params,
  'SFT-009' => base + '1558655146-9f40138edfeb' + params,

  // Hardware & Servers — circuit boards, rack servers, workstations
  'HW-001' => base + '1591405351990-4726e36695c8' + params,
  'HW-002' => base + '1518770660439-4636190af475' + params,
  'HW-003' => base + '1601584115197-04ecc0da31d7' + params,
  'HW-004' => base + '1496181133206-80ce9b88a853' + params,
  'HW-005' => base + '1587620962725-abab19836100' + params,
  'HW-006' => base + '1558494949-ef010cbdcc31' + params,
  'HW-007' => base + '1550751827-4bd374c3f58b' + params,
  'HW-008' => base + '1518770660439-4636190af475' + params,

  // AI & Analytics — data viz, AI, dashboards
  'AI-001' => base + '1551288049-bebda4e38f71' + params,
  'AI-002' => base + '1524492412937-b28074a5d7da' + params,
  'AI-003' => base + '1504868584819-f8e8b4b6d7e3' + params,
  'AI-004' => base + '1677442136019-21780ecad995' + params,
  'AI-005' => base + '1551288049-bebda4e38f71' + params,
  'AI-006' => base + '1677442136019-21780ecad995' + params,
  'AI-007' => base + '1524492412937-b28074a5d7da' + params,

  // Collaboration — video calls, team, whiteboards
  'COL-001' => base + '1600880292203-757bb62b4baf' + params,
  'COL-002' => base + '1611162617213-7d7a39e9b1d7' + params,
  'COL-003' => base + '1553877522-43269d4ea984' + params,
  'COL-004' => base + '1522071820081-009f0129c71c' + params,
  'COL-005' => base + '1450101499163-c8848c66ca85' + params,

  // Developer Tools — code editors, dark terminals, devops
  'DEV-001' => base + '1498050108023-c5249f4df085' + params,
  'DEV-002' => base + '1555066931-4365d14bab8c' + params,
  'DEV-003' => base + '1542831371-29b0f74f9713' + params,
  'DEV-004' => base + '1461749280684-dccba630e2f6' + params,
  'DEV-005' => base + '1551288049-bebda4e38f71' + params,
  'DEV-006' => base + '1504868584819-f8e8b4b6d7e3' + params,
  'DEV-007' => base + '1483058712412-4245e9b90334' + params,
  'DEV-008' => base + '1498050108023-c5249f4df085' + params,

  // Networking — fiber optics, cables, routers
  'NET-001' => base + '1516044734145-e56d53de86ef' + params,
  'NET-002' => base + '1519389950473-47ba0277781c' + params,
  'NET-003' => base + '1516044734145-e56d53de86ef' + params,
  'NET-004' => base + '1600880292203-757bb62b4baf' + params,

  // Professional Services — consulting, business meetings
  'SVC-001' => base + '1507003211169-0a1dd7228f2d' + params,
  'SVC-002' => base + '1553877522-43269d4ea984' + params,
  'SVC-003' => base + '1522071820081-009f0129c71c' + params,
  'SVC-004' => base + '1522071820081-009f0129c71c' + params,
  'SVC-005' => base + '1507003211169-0a1dd7228f2d' + params
};

List<Product2> prods = [
  SELECT Id, ProductCode FROM Product2
  WHERE ProductCode IN :codeToImg.keySet()
];
for(Product2 p : prods) {
  p.Image_URL__c = codeToImg.get(p.ProductCode);
}
update prods;
System.debug('Updated ' + prods.size() + ' product images with tech-relevant Unsplash photos');
