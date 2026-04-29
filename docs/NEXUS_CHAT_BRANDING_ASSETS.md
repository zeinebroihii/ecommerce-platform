# 🎨 Nexus Web Chat Branding - Asset Setup Guide

## 📁 File Locations

Place your image files in this directory structure:

```
force-app/main/default/staticresources/nexusChatAssets/
├── service-rep-avatar.jpg          (JPEG or PNG, 200x200px recommended)
├── ai-agent-icon.svg               (SVG format, 128x128px recommended)
├── nexus-logo.svg                  (SVG format, 300x100px recommended)
└── chat-button-icon.svg            (SVG format, 64x64px recommended)
```

## 🔗 URLs After Deployment

Once deployed to Salesforce, reference assets using these URLs:

### **Service Rep Avatar**
```
/resource/nexusChatAssets/service-rep-avatar.jpg
```

### **AI Agent Icon**
```
/resource/nexusChatAssets/ai-agent-icon.svg
```

### **Nexus Logo**
```
/resource/nexusChatAssets/nexus-logo.svg
```

### **Chat Button Icon**
```
/resource/nexusChatAssets/chat-button-icon.svg
```

---

## 📋 Image Specifications

### **Service Rep Avatar**
- **Format**: JPEG or PNG
- **Size**: 200x200px
- **Usage**: Customer service representative profile picture
- **Content**: Professional headshot/corporate photo
- **Background**: Preferably white or transparent
- **File Size**: < 100KB

### **AI Agent Icon**
- **Format**: SVG (preferred) or PNG
- **Size**: 128x128px
- **Usage**: AI agent avatar in chat
- **Content**: Your Nexus terminal icon in indigo (#4F46E5)
- **Background**: Transparent
- **File Size**: < 50KB

### **Nexus Logo**
- **Format**: SVG (preferred) or PNG
- **Size**: 300x100px (or 1:3 aspect ratio)
- **Usage**: Chat header logo/branding
- **Content**: Your company logo
- **Background**: Transparent
- **File Size**: < 100KB

### **Chat Button Icon**
- **Format**: SVG (preferred) or PNG
- **Size**: 64x64px
- **Usage**: Floating chat button icon
- **Content**: Support/terminal icon in white (#FFFFFF)
- **Background**: Transparent (will be placed on #0F172A background)
- **File Size**: < 30KB

---

## 🚀 Implementation Options

### **Option A: Salesforce Static Resources (Recommended)**
1. Create folder: `force-app/main/default/staticresources/nexusChatAssets/`
2. Add your image files there
3. Metadata file already created: `nexusChatAssets.resource-meta.xml`
4. Deploy with SFDX: `sfdx force:source:push`
5. Reference URLs above in your Nexus Web Chat configuration

### **Option B: Salesforce Files (Dynamic)**
1. Go to **Files** in Salesforce
2. Upload your images
3. Share with appropriate users/groups
4. Copy the file share link and use in chat configuration

### **Option C: External CDN**
1. Host images on your company's CDN or web server
2. Use full HTTPS URLs: `https://your-domain.com/assets/...`
3. Ensure CORS headers allow Salesforce domains

---

## ⚙️ Salesforce Configuration Steps

### **For Nexus Web Chat Branding:**

1. Go to **Setup** → Search "**Web Chat**"
2. Select your chat deployment (or create new)
3. Go to **Branding** tab
4. Fill in these URLs:

| Field | URL |
|-------|-----|
| Service Rep Avatar | `/resource/nexusChatAssets/service-rep-avatar.jpg` |
| AI Agent Avatar | `/resource/nexusChatAssets/ai-agent-icon.svg` |
| Logo | `/resource/nexusChatAssets/nexus-logo.svg` |
| Chat Button | `/resource/nexusChatAssets/chat-button-icon.svg` |

---

## 🎨 Color Reference

Your indigo branding colors:
- **Primary Indigo**: `#4F46E5`
- **Light Indigo**: `#A5B4FC`
- **Deep Navy**: `#0F172A`
- **White**: `#FFFFFF`

Use these for icon colors when creating SVGs.

---

## ✅ Deployment Checklist

- [ ] Images created with correct dimensions
- [ ] Images optimized for web (< file sizes above)
- [ ] All files in `staticresources/nexusChatAssets/` folder
- [ ] `nexusChatAssets.resource-meta.xml` created
- [ ] Run: `sfdx force:source:push` to deploy
- [ ] Update Web Chat Branding with correct URLs
- [ ] Test chat widget in preview
- [ ] Verify all images load correctly

---

## 🔄 To Update Images Later

1. Replace files in `force-app/main/default/staticresources/nexusChatAssets/`
2. Run: `sfdx force:source:push`
3. Clear browser cache or do hard refresh (Ctrl+Shift+R)
4. Images will update automatically

---

## 📞 Need Help with Asset Creation?

If you need help creating SVG icons:
- Use **Figma** (free tier available)
- Use **Adobe Express** 
- Use online tools like **Canva Pro**
- Hire designer on Upwork/Fiverr

For the Nexus Terminal Icon, refer to: `/force-app/main/default/lwc/nexusLogo/nexusLogo.html`

