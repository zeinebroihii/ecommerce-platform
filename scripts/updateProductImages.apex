// Update Product2 Image_URL__c with Clearbit vendor logos
Map<String, String> codeToUrl = new Map<String, String>{
  // Cloud & Infrastructure
  'CLO-001' => 'https://logo.clearbit.com/amazon.com',
  'CLO-002' => 'https://logo.clearbit.com/microsoft.com',
  'CLO-003' => 'https://logo.clearbit.com/google.com',
  'CLO-004' => 'https://logo.clearbit.com/vmware.com',
  'CLO-005' => 'https://logo.clearbit.com/ibm.com',
  'CLO-006' => 'https://logo.clearbit.com/cloudflare.com',
  'CLO-007' => 'https://logo.clearbit.com/kubernetes.io',
  'CLO-008' => 'https://logo.clearbit.com/zerto.com',
  // Cybersecurity
  'SEC-001' => 'https://logo.clearbit.com/crowdstrike.com',
  'SEC-002' => 'https://logo.clearbit.com/zscaler.com',
  'SEC-003' => 'https://logo.clearbit.com/synack.com',
  'SEC-004' => 'https://logo.clearbit.com/splunk.com',
  'SEC-005' => 'https://logo.clearbit.com/proofpoint.com',
  'SEC-006' => 'https://logo.clearbit.com/cyberark.com',
  'SEC-007' => 'https://logo.clearbit.com/forcepoint.com',
  'SEC-008' => 'https://logo.clearbit.com/vanta.com',
  'SEC-009' => 'https://logo.clearbit.com/okta.com',
  // Software Licenses
  'SFT-001' => 'https://logo.clearbit.com/sap.com',
  'SFT-002' => 'https://logo.clearbit.com/microsoft.com',
  'SFT-003' => 'https://logo.clearbit.com/adobe.com',
  'SFT-004' => 'https://logo.clearbit.com/salesforce.com',
  'SFT-005' => 'https://logo.clearbit.com/atlassian.com',
  'SFT-006' => 'https://logo.clearbit.com/autodesk.com',
  'SFT-007' => 'https://logo.clearbit.com/slack.com',
  'SFT-008' => 'https://logo.clearbit.com/gitlab.com',
  'SFT-009' => 'https://logo.clearbit.com/figma.com',
  // Hardware & Servers
  'HW-001' => 'https://logo.clearbit.com/dell.com',
  'HW-002' => 'https://logo.clearbit.com/cisco.com',
  'HW-003' => 'https://logo.clearbit.com/hpe.com',
  'HW-004' => 'https://logo.clearbit.com/lenovo.com',
  'HW-005' => 'https://logo.clearbit.com/nvidia.com',
  'HW-006' => 'https://logo.clearbit.com/synology.com',
  'HW-007' => 'https://logo.clearbit.com/fortinet.com',
  'HW-008' => 'https://logo.clearbit.com/apc.com',
  // AI & Analytics
  'AI-001' => 'https://logo.clearbit.com/tableau.com',
  'AI-002' => 'https://logo.clearbit.com/snowflake.com',
  'AI-003' => 'https://logo.clearbit.com/microsoft.com',
  'AI-004' => 'https://logo.clearbit.com/datarobot.com',
  'AI-005' => 'https://logo.clearbit.com/tableau.com',
  'AI-006' => 'https://logo.clearbit.com/openai.com',
  'AI-007' => 'https://logo.clearbit.com/databricks.com',
  // Collaboration
  'COL-001' => 'https://logo.clearbit.com/zoom.us',
  'COL-002' => 'https://logo.clearbit.com/microsoft.com',
  'COL-003' => 'https://logo.clearbit.com/notion.so',
  'COL-004' => 'https://logo.clearbit.com/miro.com',
  'COL-005' => 'https://logo.clearbit.com/docusign.com',
  // Developer Tools
  'DEV-001' => 'https://logo.clearbit.com/github.com',
  'DEV-002' => 'https://logo.clearbit.com/jetbrains.com',
  'DEV-003' => 'https://logo.clearbit.com/postman.com',
  'DEV-004' => 'https://logo.clearbit.com/hashicorp.com',
  'DEV-005' => 'https://logo.clearbit.com/datadoghq.com',
  'DEV-006' => 'https://logo.clearbit.com/newrelic.com',
  'DEV-007' => 'https://logo.clearbit.com/hashicorp.com',
  'DEV-008' => 'https://logo.clearbit.com/sonarsource.com',
  // Networking
  'NET-001' => 'https://logo.clearbit.com/cisco.com',
  'NET-002' => 'https://logo.clearbit.com/orange.com',
  'NET-003' => 'https://logo.clearbit.com/cisco.com',
  'NET-004' => 'https://logo.clearbit.com/3cx.com',
  // Professional Services
  'SVC-001' => 'https://logo.clearbit.com/accenture.com',
  'SVC-002' => 'https://logo.clearbit.com/atlassian.com',
  'SVC-003' => 'https://logo.clearbit.com/servicenow.com',
  'SVC-004' => 'https://logo.clearbit.com/servicenow.com',
  'SVC-005' => 'https://logo.clearbit.com/knowbe4.com'
};

List<Product2> toUpdate = [
  SELECT Id, ProductCode FROM Product2
  WHERE ProductCode IN :codeToUrl.keySet()
];

for(Product2 p : toUpdate) {
  p.Image_URL__c = codeToUrl.get(p.ProductCode);
}
update toUpdate;
System.debug('Updated images for ' + toUpdate.size() + ' products');
