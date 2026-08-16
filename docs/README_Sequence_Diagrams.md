# Sequence Diagrams for E-Commerce Platform

This directory contains PlantUML sequence diagrams for the platform's key features.

## 📋 Available Diagrams

### 1. **Authentication_Sequence.puml**
**Feature:** B2B & B2C Customer Login
- Salesforce Community login for B2B
- External auth providers for B2C
- Session management & JWT tokens
- Permission-based feature access

### 2. **Agentforce_Chatbot_Sequence.puml**
**Feature:** Agentforce Chatbot Integration
- Customer chatbot interactions
- Integration with existing Apex controllers
- Subagent delegation for complex tasks
- Seamless handover to human agents

### 3. **Subagent_Architecture_Sequence.puml**
**Feature:** Subagent Workflow Architecture
- Intent classification and routing
- Specialized subagent capabilities
- Escalation logic and human handoff
- Performance monitoring and optimization

### 4. **AccountManagement_Sequence.puml**
**Feature:** Customer Account Management
- B2B account dashboard & team management
- B2C profile & wishlist management
- Order history for both user types
- Password & preference management

### 5. **ComboPackage_Sequence.puml**
**Feature:** Combo Package Management
- Load all packages with items
- Create new combo packages
- Delete packages
- Toggle active/inactive status

### 6. **QuoteGeneration_Sequence.puml**
**Feature:** Custom Quote Generation
- Initialize quote from opportunity
- Generate TALEXO_Quote__c + line items
- Apply AI acceptance scoring
- Calculate totals and discounts

### 7. **OrderProcessing_Sequence.puml**
**Feature:** Complete Order Fulfillment
- Customer authentication (B2B/B2C)
- Cart management with pricing
- Stock validation
- Order item processing
- Total calculations with taxes

### 8. **ProductManagement_Sequence.puml**
**Feature:** Product Catalog + Stock Intelligence
- Load products with stock levels
- Bulk import from CSV
- Stock alerts and notifications
- Inventory management

### 9. **AI_Integration_Sequence.puml**
**Feature:** Einstein AI Integration
- Product recommendations
- Quote acceptance scoring
- Combo package suggestions
- Predictive analytics

### 10. **PlantUML_Template.puml**
**Template:** Reusable template for new diagrams

## 🛠️ How to Use PlantUML

### Option 1: VS Code Extension
1. Install "PlantUML" extension
2. Open any `.puml` file
3. Click "Preview" or use `Alt+D` to render

### Option 2: Online Editor
1. Go to [plantuml.com](https://plantuml.com/sequence-diagram)
2. Copy-paste the PlantUML code
3. Click "Submit" to generate diagram

### Option 3: Command Line
```bash
# Install PlantUML
npm install -g plantuml

# Generate PNG
plantuml ComboPackage_Sequence.puml

# Generate SVG
plantuml -tsvg ComboPackage_Sequence.puml
```

## 📊 Key Flows Documented

### **Authentication:**
```
Customer → Portal → AuthService → Database/ExternalAuth
      ←       ←            ←
   Session   JWT Token    User Validation
```

### **Agentforce Chatbot:**
```
Customer → Agentforce → Subagent → Apex Controller → Database
          ←            ←          ←                ←
   Response   Delegation   Result    Data Access    Records
```

### **Subagent Architecture:**
```
Intent → Router → Subagent → Processing → Main Agent → Customer
              ↓
        Human Handoff
```

### **Combo Package Management**
```
User → LWC → ComboPackageController → Database
      ←       ←                   ←
   Display  PackageWrapper[]    Records
```

### **Quote Generation**
```
Sales Rep → LWC → QuoteGenerationService → Database + AI
           ←       ←                      ←
        Quote   Response              Scored Quote
```

### **Order Processing**
```
Customer → Portal → AuthService → Session → OrderController → Database
          ←         ←            ←         ←              ←
      Confirmation  Success     Token     Validation    Stock Update
```

### **AI Integration**
```
User → UI → Controller → AIService → Einstein → Database
      ←     ←           ←            ←          ←
   Insights  Response    Analysis    Prediction  Update
```

## 🎯 Business Value

These diagrams help:
- **New developers** understand system flows
- **Debugging** complex interactions
- **Documentation** for stakeholders
- **System design** reviews
- **Integration planning** with external systems

## 🤖 Agentforce Integration Benefits

### **Why Agentforce + Subagents:**
- **24/7 Customer Support** - Always available chat assistance
- **Intelligent Routing** - Automatic delegation to specialized subagents
- **Seamless Handoff** - Smooth transition to human agents when needed
- **Context Preservation** - Full conversation history maintained
- **Scalable Support** - Handle unlimited concurrent conversations

### **Subagent Specializations:**
- **QuoteGeneration Subagent** - Complex quote creation and negotiation
- **ComboPackage Subagent** - Package recommendations and comparisons
- **OrderSupport Subagent** - Order tracking and issue resolution
- **ProductRecommendation Subagent** - AI-powered product suggestions
- **AccountManagement Subagent** - Profile and preference updates

### **Integration Points:**
- Direct access to your Apex controllers
- Real-time data from Salesforce objects
- AI-powered insights and recommendations
- Secure authentication and authorization
- Comprehensive logging and analytics

## 📝 Notes

- All diagrams use the platform's actual class/object names
- Security-enforced queries are highlighted
- AI integration points are clearly marked
- Error handling paths included where relevant