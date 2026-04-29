# Nexus Chat Assets - Directory Structure

## 📁 Create This Folder Structure

```
force-app/main/default/staticresources/
└── nexusChatAssets/
    ├── service-rep-avatar.jpg       ← Your service rep photo (200x200px)
    ├── ai-agent-icon.svg            ← Indigo terminal icon (128x128px)
    ├── nexus-logo.svg               ← Your company logo (300x100px)
    └── chat-button-icon.svg         ← Support/chat icon (64x64px)
```

**Metadata file (already created):**
```
force-app/main/default/staticresources/
└── nexusChatAssets.resource-meta.xml
```

---

## 🛠️ HOW TO CREATE THE FOLDER

### **Option 1: Using VS Code**
1. Right-click on `force-app/main/default/staticresources/`
2. Select **"New Folder"**
3. Name it: `nexusChatAssets`
4. Inside that folder, create your 4 image files

### **Option 2: Using File Explorer (Windows)**
1. Navigate to: `c:\Users\MSI\Desktop\Salesforces\ecommerce-platform\force-app\main\default\staticresources\`
2. Create new folder: `nexusChatAssets`
3. Add your 4 image files inside

### **Option 3: Using PowerShell Terminal**
```powershell
# Create the folder
New-Item -ItemType Directory -Path "c:\Users\MSI\Desktop\Salesforces\ecommerce-platform\force-app\main\default\staticresources\nexusChatAssets" -Force

# List to verify
Get-ChildItem -Path "c:\Users\MSI\Desktop\Salesforces\ecommerce-platform\force-app\main\default\staticresources\"
```

---

## 📋 IMAGE FILES NEEDED

### 1️⃣ **service-rep-avatar.jpg**
- **Size**: 200x200 pixels
- **Format**: JPG or PNG
- **Weight**: Professional headshot of your service representative
- **File Size**: < 100KB
- **Example name alternatives**: `rep.jpg`, `agent.jpg`, `support-avatar.jpg`

### 2️⃣ **ai-agent-icon.svg**
- **Size**: 128x128 pixels
- **Format**: SVG (preferred) or PNG
- **Weight**: AI/Bot avatar (use your Nexus terminal icon)
- **Colors**: Indigo (#4F46E5) on transparent background
- **File Size**: < 50KB
- **Example name alternatives**: `bot-avatar.svg`, `ai-icon.svg`

### 3️⃣ **nexus-logo.svg**
- **Size**: 300x100 pixels (width x height)
- **Format**: SVG (preferred) or PNG
- **Weight**: Your company/brand logo
- **Colors**: Should work on white background
- **File Size**: < 100KB
- **Example name alternatives**: `logo.svg`, `brand-logo.svg`

### 4️⃣ **chat-button-icon.svg**
- **Size**: 64x64 pixels
- **Format**: SVG (preferred) or PNG
- **Weight**: Chat/Support icon
- **Colors**: White (#FFFFFF) on transparent (will go on navy background)
- **File Size**: < 30KB
- **Example name alternatives**: `support-icon.svg`, `chat-icon.svg`

---

## 🎨 QUICK ICON IDEAS

### **For AI Agent Icon** (ai-agent-icon.svg)
Reference the existing Nexus Logo terminal icon from:
```
force-app/main/default/lwc/nexusLogo/nexusLogo.html
```

Terminal symbol in Indigo:
```xml
<svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
</svg>
```

### **For Chat Button Icon** (chat-button-icon.svg)
Use a support/message icon in White:
```xml
<svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>
```

---

## ✅ DEPLOYMENT STEPS

```bash
# 1. Navigate to project
cd c:\Users\MSI\Desktop\Salesforces\ecommerce-platform

# 2. Check files are in place
ls force-app/main/default/staticresources/nexusChatAssets/

# 3. Deploy to Salesforce
sfdx force:source:push

# 4. Verify in Salesforce
# Go to Setup → Installed Packages → Static Resources
# Should see "nexusChatAssets" listed
```

---

## 🔗 AFTER DEPLOYMENT - USE THESE URLS

In your Salesforce Web Chat Branding configuration, use:

| Field | URL |
|-------|-----|
| **Service Rep Avatar** | `/resource/nexusChatAssets/service-rep-avatar.jpg` |
| **AI Agent Avatar** | `/resource/nexusChatAssets/ai-agent-icon.svg` |
| **Logo** | `/resource/nexusChatAssets/nexus-logo.svg` |
| **Chat Button** | `/resource/nexusChatAssets/chat-button-icon.svg` |

---

## ⚠️ TROUBLESHOOTING

**Images not showing after deployment?**
- Check file names match exactly (case-sensitive on some systems)
- Hard refresh browser: `Ctrl+Shift+R`
- Verify path in Salesforce ends with correct filename
- Check file size isn't too large (under limits)

**Deployment failed?**
- Make sure `nexusChatAssets.resource-meta.xml` exists
- Run: `sfdx force:source:push -f` (force flag)
- Check `.forceignore` doesn't exclude staticresources

**SVG not rendering?**
- Ensure SVG is valid XML
- Try converting to PNG if SVG has issues
- Remove any XML declarations from SVG

