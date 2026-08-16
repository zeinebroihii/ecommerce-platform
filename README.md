# Nexus — B2B/B2C Commerce Platform on Salesforce

Nexus is a full-lifecycle commerce platform built natively on Salesforce, extending the standard B2B/B2C Commerce and Experience Cloud stack with AI-driven sales intelligence, blockchain-secured escrow payments, live logistics tracking, and an integrated customer/partner portal.

It is designed as a single system of record spanning **lead → quote → order → payment → fulfillment → after-sales**, with a Lightning Web Component front end, 100+ Apex services, an Agentforce AI layer, and a set of off-platform microservices (Node/Express bridge, Solidity smart contracts) for capabilities Salesforce doesn't natively provide.

---

## Table of Contents

- [Architecture](#architecture)
- [Feature Areas](#feature-areas)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [CI/CD](#cicd)
- [Documentation](#documentation)
- [Live Demo](#live-demo)

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Client Layer"]
        LEX["Lightning Experience\n(Internal Users)"]
        EXP["Experience Cloud Portal\n(B2B / B2C Customers)"]
    end

    subgraph SF["Salesforce Core"]
        LWC["90+ Lightning Web Components"]
        APEX["105+ Apex Classes\n(Services, Triggers, Batch/Queueable)"]
        AGENT["Agentforce\nAI Agents & Subagents"]
        DATA["Custom Objects\n(Quotes, Orders, Escrow, Stock,\nSwap Listings, Digital Passport...)"]
    end

    subgraph External["External Integrations"]
        STRIPE["Stripe\n(Card Payments)"]
        DOCUSIGN["DocuSign\n(Contracts / e-Signature)"]
        TWILIO["Twilio\n(SMS Notifications)"]
        POWERBI["Power BI\n(Analytics)"]
    end

    subgraph Web3["Web3 Bridge"]
        BRIDGE["Node/Express Bridge\n(Vercel Serverless)"]
        CHAIN["NexusEscrow Smart Contract\n(Solidity, Polygon Amoy)"]
    end

    LEX --> LWC
    EXP --> LWC
    LWC --> APEX
    APEX --> AGENT
    APEX --> DATA
    APEX --> STRIPE
    APEX --> DOCUSIGN
    APEX --> TWILIO
    APEX --> POWERBI
    APEX -- "Named Credential (x-api-key)" --> BRIDGE
    BRIDGE --> CHAIN
```

Detailed sequence diagrams for individual flows (authentication, quote generation, order processing, combo packages, Agentforce chatbot routing, etc.) are in [`docs/`](docs/) as PlantUML files.

---

## Feature Areas

| Area | Highlights |
|---|---|
| **Sales & CRM** | Lead capture, Einstein-assisted lead scoring, opportunity → quote → contract lifecycle, account/team management for B2B buyers |
| **AI & Automation** | Agentforce chatbot with subagent delegation and human handoff, AI-driven stock/demand intelligence, AI acceptance scoring on quotes |
| **Commerce** | Product catalog with stock levels, combo package builder, discount/"Sparks" engine, cart & checkout, Stripe hosted checkout |
| **Payments** | Stripe (card) and a hybrid Web3 escrow flow — USDC held in a Solidity smart contract, released on delivery confirmation |
| **Logistics** | Live GPS shipment tracking, digital ownership passport per item, swap/resale marketplace between customers |
| **Contracts & Docs** | DocuSign-based quote/contract signing with auto PDF attachment, renewal & amendment workflows |
| **Customer Portal** | Experience Cloud site for B2B and B2C customers — order history, quotes, escrow status, support case tracking |
| **Notifications** | Twilio SMS, transactional email templates, in-app bell notifications and activity feed |
| **Analytics** | Power BI-backed reporting on sales, stock, and platform activity |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Platform | Salesforce (Lightning Platform, Experience Cloud, Agentforce) |
| Front end | Lightning Web Components (LWC), SLDS |
| Back end | Apex (services, triggers, batch/queueable/schedulable jobs) |
| AI | Agentforce agents & subagents, Einstein |
| Payments | Stripe API, Solidity smart contract (NexusEscrow), Hardhat |
| Bridge service | Node.js / Express, deployed as Vercel serverless functions |
| Integrations | DocuSign, Twilio, Power BI |
| CI/CD | GitHub Actions, Salesforce CLI |
| Tooling | ESLint, Prettier, Jest (`sfdx-lwc-jest`), Husky pre-commit hooks |

---

## Repository Structure

```
force-app/main/default/   Salesforce metadata: LWC, Apex, objects, flows, permission sets
blockchain/                Solidity smart contracts (NexusEscrow) + Hardhat project
bridge/                    Node/Express serverless bridge between Salesforce and the blockchain
docs/                      PlantUML sequence diagrams and feature documentation
manifest/, destructive/    Deployment manifests and destructive change packages
scripts/                   Reusable anonymous Apex utilities (data import, permission setup)
.github/workflows/         CI pipelines: PR validation, QA deploy, production deploy
```

---

## Getting Started

### Prerequisites
- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli)
- A Salesforce org (Developer Edition, sandbox, or scratch org)
- Node.js 18+ (for the bridge service and blockchain tooling)

### 1. Deploy the Salesforce metadata
```bash
sf org login web --alias my-org
sf project deploy start --target-org my-org --source-dir force-app
```

### 2. (Optional) Set up the blockchain escrow contract
```bash
cd blockchain
npm install
cp .env.example .env      # fill in ALCHEMY_API_KEY, DEPLOYER_PRIVATE_KEY, etc.
npm run deploy:testnet
```

### 3. (Optional) Run the bridge service
```bash
cd bridge
npm install
cp .env.example .env      # fill in PLATFORM_PRIVATE_KEY, contract addresses, BRIDGE_API_KEY
npm run dev
```
Point a Salesforce Named Credential at the deployed bridge URL, using the same key as `BRIDGE_API_KEY`.

### 4. Lint & test
```bash
npm install
npm run lint
npm run test:unit
```

Every `.env.example` file in this repo documents the exact variables its component needs — copy it to `.env` and fill in real values locally; `.env` itself is git-ignored.

---

## CI/CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `validate-pr.yml` | Pull request | Validates the metadata deploy against the target org without deploying |
| `deploy-qa.yml` | Push to `qa` | Deploys to the QA sandbox |
| `deploy-prod.yml` | Manual (`workflow_dispatch`) | Deploys to production, requires explicit confirmation input |

---

## Documentation

- [`docs/README_Sequence_Diagrams.md`](docs/README_Sequence_Diagrams.md) — index of all sequence diagrams
- [`docs/PART1_Diagramme_Classes.md`](docs/PART1_Diagramme_Classes.md) — class-level design documentation

---

## Live Demo

A customer-facing Experience Cloud instance is available for evaluation:

**[Nexus Customer Portal](https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/)**

This runs on a Salesforce Developer org, so availability isn't guaranteed long-term — please reach out if the link is stale, and see [Getting Started](#getting-started) to deploy your own instance.
