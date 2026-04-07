// ═══════════════════════════════════════════════════════════════
//  Nexus B2B Product Catalog — Bulk Import
//  1. Deactivates all default Salesforce sample products
//  2. Inserts 70+ real B2B tech/software products
//  3. Creates PricebookEntries in Standard Pricebook
// ═══════════════════════════════════════════════════════════════

// ── Step 1: Deactivate default Salesforce sample products ──────
List<Product2> defaults = [
  SELECT Id FROM Product2
  WHERE Family = null AND IsActive = true
];
for(Product2 p : defaults) p.IsActive = false;
if(!defaults.isEmpty()) update defaults;
System.debug('Deactivated ' + defaults.size() + ' default products');

// ── Step 2: Build new product list ────────────────────────────
List<Product2> newProds = new List<Product2>();

// Helper to build a Product2
// Fields: Name, Family (= category), ProductCode, Price__c, Description, Image_URL__c, AvailabilityStatus__c

// ── CLOUD & INFRASTRUCTURE ────────────────────────────────────
newProds.add(new Product2(Name='AWS Enterprise Compute Bundle', Family='Cloud & Infrastructure', ProductCode='CLO-001', Price__c=12000, Description='EC2 reserved instances bundle — 48 vCPUs, 192GB RAM, 12-month commitment. Includes load balancer, auto-scaling, VPC setup.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Azure DevOps Enterprise Suite', Family='Cloud & Infrastructure', ProductCode='CLO-002', Price__c=8500, Description='Full Azure DevOps pipeline with Repos, Boards, Test Plans and Artifacts. Per-org annual license for up to 500 users.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Google Cloud Storage — 100TB Pack', Family='Cloud & Infrastructure', ProductCode='CLO-003', Price__c=3200, Description='100TB of multi-region Google Cloud Storage with lifecycle management, versioning, and 99.999% SLA.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Private Cloud Hosting (Dedicated)', Family='Cloud & Infrastructure', ProductCode='CLO-004', Price__c=22000, Description='Dedicated bare-metal private cloud environment. 4 nodes, 256GB RAM each, 20Gbps network, managed by Nexus SRE team.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Hybrid Cloud Migration Package', Family='Cloud & Infrastructure', ProductCode='CLO-005', Price__c=15000, Description='End-to-end migration from on-premise to hybrid cloud: assessment, architecture, execution and 60-day hypercare.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='CDN Global Edge Network — Pro', Family='Cloud & Infrastructure', ProductCode='CLO-006', Price__c=4800, Description='300+ PoPs worldwide, unlimited bandwidth, DDoS protection layer 3/4/7, real-time analytics dashboard.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Kubernetes Managed Cluster (3-year)', Family='Cloud & Infrastructure', ProductCode='CLO-007', Price__c=18000, Description='Managed K8s with auto-upgrade, multi-zone HA, Prometheus/Grafana monitoring, GitOps delivery pipeline.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Disaster Recovery as a Service (DRaaS)', Family='Cloud & Infrastructure', ProductCode='CLO-008', Price__c=9500, Description='RTO < 15 min / RPO < 5 min. Continuous replication, automated failover testing, compliance reporting.', AvailabilityStatus__c='En stock', IsActive=true));

// ── CYBERSECURITY ─────────────────────────────────────────────
newProds.add(new Product2(Name='Nexus XDR Platform — Enterprise', Family='Cybersecurity', ProductCode='SEC-001', Price__c=28000, Description='Extended Detection & Response covering endpoint, network and cloud layers. AI-powered threat hunting + SOC integration.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Zero Trust Network Access Suite', Family='Cybersecurity', ProductCode='SEC-002', Price__c=16000, Description='ZTNA with identity-aware access proxy, device posture checks, micro-segmentation. Replaces legacy VPN for up to 1000 users.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Penetration Testing — Annual Contract', Family='Cybersecurity', ProductCode='SEC-003', Price__c=12500, Description='4 pentest engagements per year: 2 internal, 1 web app, 1 social engineering. CREST-certified team. Detailed remediation reports.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='SIEM — Security Information & Event Mgmt', Family='Cybersecurity', ProductCode='SEC-004', Price__c=21000, Description='Cloud-native SIEM with 500GB/day log ingestion, 200+ out-of-the-box detection rules, SOAR playbook automation.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Email Security Gateway — Advanced', Family='Cybersecurity', ProductCode='SEC-005', Price__c=5400, Description='Anti-phishing, BEC protection, sandboxed attachment analysis, DLP, email encryption. Up to 2000 mailboxes.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Privileged Access Management (PAM)', Family='Cybersecurity', ProductCode='SEC-006', Price__c=14000, Description='Vault for credentials, session recording, just-in-time access, approval workflows. Covers 500 privileged accounts.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='DLP — Data Loss Prevention Suite', Family='Cybersecurity', ProductCode='SEC-007', Price__c=9800, Description='Endpoint + network + cloud DLP. Policy engine with 150+ built-in templates (GDPR, PCI-DSS, HIPAA). Real-time blocking.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Compliance Automation Platform', Family='Cybersecurity', ProductCode='SEC-008', Price__c=11500, Description='Continuous control monitoring for ISO 27001, SOC 2, GDPR. Automated evidence collection, audit-ready reports.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Identity & Access Management (IAM)', Family='Cybersecurity', ProductCode='SEC-009', Price__c=13200, Description='SSO, MFA, lifecycle management, SCIM provisioning. Supports SAML 2.0, OIDC, LDAP. Up to 5000 identities.', AvailabilityStatus__c='En stock', IsActive=true));

// ── SOFTWARE LICENSES ─────────────────────────────────────────
newProds.add(new Product2(Name='SAP S/4HANA Cloud — Professional', Family='Software Licenses', ProductCode='SFT-001', Price__c=45000, Description='ERP suite: Finance, Supply Chain, Manufacturing, Sales. 50-user named license bundle, 3-year term. Includes implementation support.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Microsoft 365 Business Premium — 100 seats', Family='Software Licenses', ProductCode='SFT-002', Price__c=7200, Description='Word, Excel, PowerPoint, Teams, Exchange, SharePoint, Intune MDM, Defender for Business. Annual subscription.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Adobe Creative Cloud — Enterprise 50 seats', Family='Software Licenses', ProductCode='SFT-003', Price__c=18500, Description='Full CC suite (Photoshop, Illustrator, Premiere, After Effects…) with admin console, SSO, centralized storage. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Salesforce Sales Cloud — Enterprise', Family='Software Licenses', ProductCode='SFT-004', Price__c=32000, Description='CRM with AI-powered forecasting, pipeline management, Einstein analytics. 25-user license, 1-year term.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Jira Software + Confluence — 200 users', Family='Software Licenses', ProductCode='SFT-005', Price__c=6400, Description='Atlassian cloud suite: Jira Software, Confluence, Jira Service Management. Annual subscription for 200 users.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='AutoCAD LT — 10 seats Annual', Family='Software Licenses', ProductCode='SFT-006', Price__c=8800, Description='2D CAD drafting and documentation. Cloud-connected with AutoCAD web app, 100GB cloud storage per user.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='QuickBooks Enterprise — Accountant Pack', Family='Software Licenses', ProductCode='SFT-007', Price__c=4200, Description='Accounting, payroll, inventory and reporting for up to 30 users. Includes Priority Circle support and data migration.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Slack Business+ — 500 seats', Family='Software Licenses', ProductCode='SFT-008', Price__c=11000, Description='Unlimited message history, unlimited apps/integrations, SAML SSO, 99.99% SLA, compliance exports. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='GitLab Ultimate — 50 developers', Family='Software Licenses', ProductCode='SFT-009', Price__c=23800, Description='Full DevSecOps platform: SCM, CI/CD, DAST/SAST security scanning, dependency scanning, SBOM, AI code suggestions.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Figma Organization — Design Team', Family='Software Licenses', ProductCode='SFT-010', Price__c=5600, Description='Unlimited projects, shared libraries, branching, analytics, SSO. For design teams up to 25 editors. Annual.', AvailabilityStatus__c='En stock', IsActive=true));

// ── HARDWARE & SERVERS ────────────────────────────────────────
newProds.add(new Product2(Name='Dell PowerEdge R760 — Rack Server', Family='Hardware & Servers', ProductCode='HW-001', Price__c=18500, Description='2× Intel Xeon Gold 6430, 512GB DDR5 RAM, 4× 3.84TB NVMe SSD, dual 10GbE, iDRAC9 Enterprise, 3-year NBD warranty.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Cisco Catalyst 9300 — 48-port Switch', Family='Hardware & Servers', ProductCode='HW-002', Price__c=7800, Description='48× 1G PoE+, 4× 10G uplinks, Cisco DNA Center compatible, VLAN segmentation, 802.1X, full stacking support.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='HPE ProLiant DL380 Gen11 Server', Family='Hardware & Servers', ProductCode='HW-003', Price__c=22000, Description='2× AMD EPYC 9354, 768GB DDR5, 8× 2.5" NVMe bays, 25GbE FlexibleLOM, HPE iLO 6. Ideal for virtualization workloads.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Lenovo ThinkPad X1 Carbon Gen 12 — Fleet 20', Family='Hardware & Servers', ProductCode='HW-004', Price__c=32000, Description='20× Core Ultra 7 155H, 32GB LPDDR5, 1TB SSD, 14" 2.8K OLED, Wi-Fi 6E, LTE, Thunderbolt 4. Business fleet pricing.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='NVIDIA RTX A6000 — Workstation GPU', Family='Hardware & Servers', ProductCode='HW-005', Price__c=8900, Description='48GB GDDR6 ECC, 10,752 CUDA cores, PCIe 4.0 ×16. Professional GPU for AI inference, 3D rendering, simulation.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Synology RackStation RS4021xs+ NAS', Family='Hardware & Servers', ProductCode='HW-006', Price__c=6200, Description='12-bay enterprise NAS, Xeon D-1541, 16GB ECC RAM, 4× 10GbE, supports 96TB raw. Ideal for backup and file services.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Fortinet FortiGate 200F NGFW', Family='Hardware & Servers', ProductCode='HW-007', Price__c=9400, Description='20Gbps firewall throughput, 3Gbps IPS, SSL inspection, SD-WAN, FortiOS with unified security fabric. Rack-mount 1U.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='APC Smart-UPS 3000VA Rack Mount', Family='Hardware & Servers', ProductCode='HW-008', Price__c=3100, Description='3000VA/2700W, 2U rack, pure sinewave output, SmartConnect cloud monitoring, automatic voltage regulation, 10× C13 outlets.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='HP LaserJet Enterprise M611dn Fleet 10', Family='Hardware & Servers', ProductCode='HW-009', Price__c=8500, Description='10× monochrome laser printers, 75ppm, duplex, 1200dpi, 1GB RAM, ethernet+USB, HP JetAdvantage management.', AvailabilityStatus__c='En stock', IsActive=true));

// ── AI & ANALYTICS ────────────────────────────────────────────
newProds.add(new Product2(Name='Nexus AI Analytics Platform', Family='AI & Analytics', ProductCode='AI-001', Price__c=38000, Description='Self-service BI with NLP query engine, predictive forecasting, auto-insights. Connects to 100+ data sources. Up to 100 users.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Snowflake Data Cloud — Business Critical', Family='AI & Analytics', ProductCode='AI-002', Price__c=52000, Description='50 Snowflake credits/day, Tri-Secret Secure encryption, Private Link, HIPAA and PCI-DSS compliance. Annual commit.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Power BI Premium — Per Capacity', Family='AI & Analytics', ProductCode='AI-003', Price__c=24000, Description='P1 capacity: 8 vCores, paginated reports, AI visuals, dataflow gen2, large model storage. Unlimited viewer licenses.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='DataRobot Enterprise — AutoML Platform', Family='AI & Analytics', ProductCode='AI-004', Price__c=65000, Description='Automated machine learning pipeline, MLOps, model monitoring, explainability. 10-user data scientist license pack.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Tableau Server — 25 Creator Licenses', Family='AI & Analytics', ProductCode='AI-005', Price__c=28500, Description='On-premise or cloud Tableau Server, 25 Creator + unlimited Viewer licenses, embedded analytics, Data Management add-on.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Apache Kafka Enterprise Support — Annual', Family='AI & Analytics', ProductCode='AI-006', Price__c=15000, Description='Confluent Platform enterprise support: 24/7 SLA, managed connectors, Schema Registry, ksqlDB, audit log. Up to 10 brokers.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='OpenAI API — Enterprise Access Pack', Family='AI & Analytics', ProductCode='AI-007', Price__c=18000, Description='GPT-4o, o1 and o3 API access with dedicated capacity, higher rate limits, data privacy guarantees, SSO and usage dashboard.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Databricks — Data Intelligence Platform', Family='AI & Analytics', ProductCode='AI-008', Price__c=42000, Description='Unified lakehouse: Delta Lake, MLflow, AutoML, SQL analytics, Unity Catalog governance. 500 DBU/month annual commit.', AvailabilityStatus__c='En stock', IsActive=true));

// ── COLLABORATION & COMMUNICATION ─────────────────────────────
newProds.add(new Product2(Name='Zoom Workplace Business+ — 200 hosts', Family='Collaboration', ProductCode='COL-001', Price__c=14400, Description='Video meetings up to 300 participants, webinars, Zoom Phone (US+CA), AI Companion, cloud recording 10GB/host. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Microsoft Teams Phone System — 100 seats', Family='Collaboration', ProductCode='COL-002', Price__c=6600, Description='Cloud PBX, direct routing, call queues, auto-attendants, Teams-certified headsets included. Annual subscription.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Notion Enterprise — Unlimited Members', Family='Collaboration', ProductCode='COL-003', Price__c=9600, Description='Team wiki, project management, databases, AI writing assistant, SAML SSO, audit log, advanced analytics. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Miro Enterprise — Infinite Boards', Family='Collaboration', ProductCode='COL-004', Price__c=7200, Description='Visual collaboration: infinite canvas, 100+ templates, AI diagramming, SSO, SOC 2 Type II, GDPR. Per-org annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Webex Suite — Enterprise 500 seats', Family='Collaboration', ProductCode='COL-005', Price__c=21000, Description='Meetings, Messaging, Calling, Webinars, Events, Contact Center lite. AI-powered transcription + translation.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='DocuSign eSignature — Business Pro 50 users', Family='Collaboration', ProductCode='COL-006', Price__c=8400, Description='Unlimited envelopes, advanced fields, bulk send, PowerForms, SMS authentication, reporting. Annual subscription.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='SharePoint Online Plan 2 — 200 users', Family='Collaboration', ProductCode='COL-007', Price__c=5200, Description='Unlimited personal cloud storage, advanced compliance, eDiscovery, in-place hold, Power Apps integration. Annual.', AvailabilityStatus__c='En stock', IsActive=true));

// ── DEVELOPER TOOLS & PLATFORMS ───────────────────────────────
newProds.add(new Product2(Name='GitHub Enterprise — 100 developers', Family='Developer Tools', ProductCode='DEV-001', Price__c=19000, Description='GitHub Enterprise Cloud: SAML SSO, audit log, IP allowlist, GitHub Advanced Security (GHAS), Copilot Business included.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='JetBrains All Products Pack — 25 licenses', Family='Developer Tools', ProductCode='DEV-002', Price__c=12500, Description='IntelliJ IDEA, PyCharm, WebStorm, GoLand, DataGrip, Rider and all JetBrains IDEs. Floating annual license pack.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Postman Enterprise — API Platform', Family='Developer Tools', ProductCode='DEV-003', Price__c=8700, Description='API design, testing, mocking, documentation and monitoring. SSO, audit logs, private API network, 25 users.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='HashiCorp Vault Enterprise — Annual', Family='Developer Tools', ProductCode='DEV-004', Price__c=24000, Description='Secrets management, PKI, dynamic credentials, replication, namespaces, HSM integration. Up to 5-cluster deployment.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Datadog APM + Infrastructure — 50 hosts', Family='Developer Tools', ProductCode='DEV-005', Price__c=31200, Description='Full-stack observability: APM traces, logs, metrics, synthetics, RUM, security signals. 50-host annual commit.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='New Relic Full Platform — Pro', Family='Developer Tools', ProductCode='DEV-006', Price__c=18000, Description='Observability platform: APM, infrastructure, logs, synthetics, dashboards, alerting. 100GB/month data ingest.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Terraform Enterprise — Self-Hosted', Family='Developer Tools', ProductCode='DEV-007', Price__c=28000, Description='Infrastructure as Code at scale: team workspaces, policy enforcement (Sentinel), audit logging, SSO, run tasks. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='SonarQube Enterprise Edition — 20 repos', Family='Developer Tools', ProductCode='DEV-008', Price__c=9200, Description='Static code analysis for 30+ languages, security hotspots, quality gates, branch and PR analysis, SAML SSO.', AvailabilityStatus__c='En stock', IsActive=true));

// ── NETWORKING & TELECOM ──────────────────────────────────────
newProds.add(new Product2(Name='SD-WAN Enterprise Deployment (10 sites)', Family='Networking', ProductCode='NET-001', Price__c=35000, Description='Software-defined WAN across 10 branches: centralized management, automatic failover, QoS, application-aware routing.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Dedicated Fiber 10Gbps — Annual Lease', Family='Networking', ProductCode='NET-002', Price__c=42000, Description='Dedicated symmetrical 10Gbps fiber connection, 99.99% SLA, 4-hour repair SLA, BGP routing, /29 IPv4 block included.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Enterprise Wi-Fi 6E Access Points — 20 pack', Family='Networking', ProductCode='NET-003', Price__c=11000, Description='20× Cisco Catalyst 9136AXI, tri-band Wi-Fi 6E, 802.11ax, WPA3, PoE+, cloud-managed via Meraki dashboard.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='VoIP PBX System — 50 extensions', Family='Networking', ProductCode='NET-004', Price__c=6500, Description='IP-PBX with 50 SIP extensions, IVR, call recording, CRM integration, mobile softphone apps. Installation included.', AvailabilityStatus__c='En stock', IsActive=true));

// ── PROFESSIONAL SERVICES ─────────────────────────────────────
newProds.add(new Product2(Name='IT Architecture Consulting — 40h pack', Family='Professional Services', ProductCode='SVC-001', Price__c=12000, Description='Senior solutions architect engagement: system design, technology selection, migration roadmap, risk assessment.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='DevOps Transformation Program', Family='Professional Services', ProductCode='SVC-002', Price__c=28000, Description='12-week program: CI/CD implementation, IaC adoption, team training, KPI definition, 30-day hypercare post go-live.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Managed IT Support — Bronze 24/7', Family='Professional Services', ProductCode='SVC-003', Price__c=4800, Description='Monthly managed support: 10 incidents/month, 4h response SLA, remote resolution, monthly health report. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Managed IT Support — Gold 24/7', Family='Professional Services', ProductCode='SVC-004', Price__c=9600, Description='Monthly managed support: unlimited incidents, 1h response SLA, on-site available, dedicated account manager. Annual.', AvailabilityStatus__c='En stock', IsActive=true));
newProds.add(new Product2(Name='Cybersecurity Awareness Training — 500 users', Family='Professional Services', ProductCode='SVC-005', Price__c=7500, Description='12-month phishing simulation platform + eLearning modules: GDPR, social engineering, password hygiene. Dashboard included.', AvailabilityStatus__c='En stock', IsActive=true));

// ── Step 3: Insert all new products ───────────────────────────
insert newProds;
System.debug('Inserted ' + newProds.size() + ' new B2B products');

// ── Step 4: Create Standard Pricebook Entries ─────────────────
Id stdPbId = Test.isRunningTest()
  ? Test.getStandardPricebookId()
  : [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1].Id;

List<PricebookEntry> pbes = new List<PricebookEntry>();
for(Product2 p : newProds) {
  pbes.add(new PricebookEntry(
    Pricebook2Id = stdPbId,
    Product2Id   = p.Id,
    UnitPrice    = p.Price__c != null ? p.Price__c : 1000,
    IsActive     = true
  ));
}
insert pbes;
System.debug('Created ' + pbes.size() + ' PricebookEntries');
System.debug('=== IMPORT COMPLETE ===');
