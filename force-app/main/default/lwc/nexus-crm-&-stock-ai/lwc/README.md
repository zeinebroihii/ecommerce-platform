# Nexus CRM - Lightning Web Components (LWC)

This directory contains the Salesforce-ready versions of the Nexus CRM components.

## Components Structure

### 🏢 Customer Facing
- **nexusLoginView**: The main landing page with Hero banner and Product Catalogue.
- **nexusAuthView**: Handles Login and Signup selection (B2B/B2C).
- **nexusLeadForm**: The "Demande de Devis" form for B2B registration.
- **nexusCustomerPortal**: The authenticated user dashboard with sidebar navigation.

### 🛡️ Admin & Management
- **nexusAdminDashboard**: The control center for managing leads and pipeline.

## Integration Steps

1. **Copy Folders**: Copy each folder into your Salesforce project's `force-app/main/default/lwc/` directory.
2. **Apex Controllers**: You will need to create the corresponding Apex controllers (e.g., `NexusAdminController`, `NexusProductController`) to handle data fetching from Salesforce objects (Lead, Product2, etc.).
3. **Styling**: These components use standard SLDS classes combined with custom CSS for the "Elite" Nexus look.
4. **Lightning App Builder**: Once deployed, you can drag and drop these components onto App Pages, Home Pages, or Experience Cloud sites.

## Salesforce Object Mapping
- **Leads**: Used in `nexusLeadForm` and `nexusAdminDashboard`.
- **Products**: Used in `nexusLoginView` and `nexusCustomerPortal`.
- **Cases**: Used in the "Réclamations" section of the portal.
