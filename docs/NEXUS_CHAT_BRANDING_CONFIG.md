# Nexus Web Chat Branding Configuration

## Complete Configuration for Salesforce Setup

Use these exact settings when configuring your Nexus Web Chat in Salesforce Setup:

---

## 🎨 COLORS

### Chat Button and Invitation
- **Background**: `#0F172A` (Deep Navy)
- **Text**: `#FFFFFF` (White)
- **Dismiss Button**: `#9CA3AF` (Medium Gray)

### Header
- **Background**: `#FFFFFF` (White)
- **Text and Icons**: `#0F172A` (Deep Navy)

### AI Agent and Service Rep
- **Message Background**: `#EEF2FF` (Soft Indigo)
- **Text**: `#0F172A` (Deep Navy)
- **Links**: `#4F46E5` (Indigo - PRIMARY)

### End User Messages
- **Message Background**: `#0F172A` (Deep Navy)
- **Text**: `#FFFFFF` (White)
- **Links**: `#A5B4FC` (Light Indigo)

### Conversation Body
- **Background**: `#FFFFFF` (White)
- **System Messages**: `#6B7280` (Gray-600)
- **Labels**: `#0F172A` (Deep Navy)

### Footer
- **Icons**: `#0F172A` (Deep Navy)
- **Input Border**: `#E5E7EB` (Gray-200)

### Badges & Buttons
- **Button Background**: `#4F46E5` (Indigo)
- **Button Text**: `#FFFFFF` (White)
- **Notification Badge**: `#DC2626` (Red)

### Citations
- **Background**: `#FFFFFF` (White)
- **Text**: `#111827` (Almost Black)

---

## 🖼️ IMAGES - File Paths

Copy these paths to your Web Chat Configuration:

### Service Rep Avatar
**Path**: `/resource/nexusChatAssets/service-rep-avatar.jpg`

### AI Agent Avatar
**Path**: `/resource/nexusChatAssets/ai-agent-icon.svg`

### Logo
**Path**: `/resource/nexusChatAssets/nexus-logo.svg`

### Chat Button
**Path**: `/resource/nexusChatAssets/chat-button-icon.svg`

---

## ⚙️ CHAT WINDOW DIMENSIONS

- **Width**: `320` pixels
- **Height**: `480` pixels

---

## 🔤 FONT SETTINGS

- **Font Style**: Arial
- **Font Size**: Medium

---

## 📋 SALESFORCE SETUP PATH

1. Click **Setup** (gear icon) → search **"Web Chat"**
2. Click on your chat deployment
3. Go to **"Branding"** tab
4. **Set Colors** tab: Enter all color hex codes above
5. **Set Fonts** tab: Select Arial, Medium
6. **Add Images** tab: Paste the `/resource/...` paths above
7. **Chat Window** tab: Set Width=320, Height=480
8. Click **Save**

---

## ✅ NEXT STEPS

1. **Create the images** (see NEXUS_CHAT_BRANDING_ASSETS.md)
2. **Place in folder**: `force-app/main/default/staticresources/nexusChatAssets/`
3. **Deploy**: Run `sfdx force:source:push`
4. **Configure in Salesforce**: Use paths above in Setup
5. **Test**: Preview chat widget in Salesforce

---

## 🔄 Quick Copy-Paste for Salesforce

Paste these directly in Salesforce Web Chat Branding form:

```
Service Rep Avatar: /resource/nexusChatAssets/service-rep-avatar.jpg
AI Agent Avatar: /resource/nexusChatAssets/ai-agent-icon.svg
Logo: /resource/nexusChatAssets/nexus-logo.svg
Chat Button: /resource/nexusChatAssets/chat-button-icon.svg
```

