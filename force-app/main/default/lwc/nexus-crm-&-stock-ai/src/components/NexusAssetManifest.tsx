import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  User, 
  LifeBuoy, 
  LogOut, 
  ChevronRight, 
  History, 
  Users2, 
  ShieldCheck, 
  Heart,
  Globe,
  ArrowRight,
  Bell,
  Search,
  Settings,
  Smartphone,
  Monitor,
  Cloud,
  FileCode,
  Layers,
  Check,
  Building2,
  ArrowUpRight,
  Sun,
  Moon,
  TrendingUp,
  RefreshCw,
  Clock,
  Bot,
  Sparkles,
  LogIn,
  UserCircle
} from 'lucide-react';

/**
 * NEXUS ASSET MANIFEST
 * 
 * This file documents all fonts, icons, and styling assets used in the Nexus Ecosystem.
 */

export const NexusAssetManifest: React.FC = () => {
  const fonts = [
    {
      name: 'Inter',
      usage: 'Primary UI / Body Text',
      source: 'Google Fonts',
      weights: '400, 500, 600, 700, 800, 900',
      variable: '--font-sans',
      preview: 'The quick brown fox jumps over the lazy dog.'
    },
    {
      name: 'Space Grotesk',
      usage: 'Display / Headings',
      source: 'Google Fonts',
      weights: '300, 400, 500, 600, 700',
      variable: '--font-display',
      preview: 'NEXUS SYSTEMS ARCHITECTURE'
    },
    {
      name: 'JetBrains Mono',
      usage: 'Technical Data / Code',
      source: 'Google Fonts',
      weights: '400, 500, 600, 700',
      variable: '--font-mono',
      preview: 'const nexus = () => { return "intelligence"; }'
    }
  ];

  const coreIcons = [
    { name: 'Zap', icon: Zap, description: 'Primary Brand / Energy' },
    { name: 'LayoutDashboard', icon: LayoutDashboard, description: 'Navigation / Overview' },
    { name: 'Package', icon: Package, description: 'Catalog / Logistics' },
    { name: 'ShoppingCart', icon: ShoppingCart, description: 'Commerce / Cart' },
    { name: 'FileText', icon: FileText, description: 'Documents / Quotes' },
    { name: 'User', icon: User, description: 'Profile / Individual' },
    { name: 'Building2', icon: Building2, description: 'Enterprise / B2B' },
    { name: 'ShieldCheck', icon: ShieldCheck, description: 'Security / Passport' },
    { name: 'Globe', icon: Globe, description: 'Global / Network' },
    { name: 'Bot', icon: Bot, description: 'AI / Intelligence' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <header className="border-b border-slate-200 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <Zap className="w-7 h-7 fill-indigo-400 text-indigo-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Nexus Asset Manifest</h1>
          </div>
          <p className="text-slate-500 font-medium">Complete reference for fonts, icons, and design tokens.</p>
        </header>

        {/* Fonts Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-indigo-600 rounded-full" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Typography</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {fonts.map(font => (
              <div key={font.name} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="mb-6">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{font.usage}</span>
                  <h3 className="text-2xl font-black mt-1">{font.name}</h3>
                </div>
                <div className="space-y-4 mb-8">
                  <p className="text-xs text-slate-400">Source: <span className="text-slate-900 font-bold">{font.source}</span></p>
                  <p className="text-xs text-slate-400">Weights: <span className="text-slate-900 font-bold">{font.weights}</span></p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <p className="text-sm break-words" style={{ fontFamily: `var(${font.variable})` }}>
                    {font.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Icons Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-emerald-600 rounded-full" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Iconography</h2>
          </div>
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="mb-10">
              <p className="text-slate-500 font-medium">Primary Library: <span className="text-slate-900 font-black">Lucide React</span></p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
              {coreIcons.map(item => (
                <div key={item.name} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Design Tokens */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-purple-600 rounded-full" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Design Tokens</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black mb-6 uppercase italic">Brand Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-12 w-full bg-slate-900 rounded-xl" />
                  <span className="text-[10px] font-bold text-slate-500">Nexus Slate (#0F172A)</span>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-full bg-indigo-600 rounded-xl" />
                  <span className="text-[10px] font-bold text-slate-500">Nexus Indigo (#4F46E5)</span>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-full bg-emerald-600 rounded-xl" />
                  <span className="text-[10px] font-bold text-slate-500">Nexus Emerald (#10B981)</span>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl" />
                  <span className="text-[10px] font-bold text-slate-500">Nexus Background (#F8FAFC)</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black mb-6 uppercase italic">UI Elements</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold">Border Radius</span>
                  <span className="text-xs font-black text-indigo-600">rounded-[2rem] / 32px</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold">Shadows</span>
                  <span className="text-xs font-black text-indigo-600">shadow-2xl shadow-indigo-500/10</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold">Transitions</span>
                  <span className="text-xs font-black text-indigo-600">duration-500 / ease-in-out</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-slate-200 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Nexus Systems Asset Library v1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default NexusAssetManifest;
