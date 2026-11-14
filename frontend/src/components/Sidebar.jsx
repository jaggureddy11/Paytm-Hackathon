import React from 'react';
import { 
  Smartphone,
  LayoutDashboard, 
  Mic, 
  Package, 
  FileText, 
  Settings, 
  Radio, 
  Store,
  Presentation
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, t, merchant, onTriggerClosing }) {
  const navItems = [
    { id: 'pitch', label: 'Executive Pitch Deck', icon: Presentation, badge: 'PITCH' },
    { id: 'mobile', label: t.nav.mobileApp || 'Paytm App (Mobile)', icon: Smartphone, highlight: true },
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'voice', label: t.nav.voiceSaathi, icon: Mic },
    { id: 'inventory', label: t.nav.inventory, icon: Package },
    { id: 'records', label: t.nav.records, icon: FileText },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#002970] text-white flex flex-col justify-between shadow-card flex-shrink-0 z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00BAF2] flex items-center justify-center text-[#002970]">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-heading">
                Paytm <span className="text-[#00BAF2]">Saathi</span>
              </h1>
              <p className="text-xs text-blue-200">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Merchant Profile Mini Card */}
          <div className="mt-4 p-3 rounded-lg bg-[#001c52] border border-blue-900 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-blue-200">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {merchant?.shop_name || 'Sri Krishna Kirana'}
              </p>
              <p className="text-xs text-blue-300 truncate">
                {merchant?.category || 'Kirana & General'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00BAF2] text-[#002970] font-bold shadow-subtle'
                    : 'text-blue-100 hover:bg-blue-900/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#002970]' : 'text-blue-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded tracking-wider ${
                    isActive ? 'bg-[#002970] text-white' : 'bg-[#00BAF2] text-[#002970]'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !item.badge && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#00BAF2]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Soundbox Status */}
      <div className="p-3.5 m-3 rounded-lg bg-[#001c52] border border-blue-900">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> Paytm Soundbox active
          </span>
        </div>
        <p className="text-xs text-blue-200 leading-normal">
          Simulated QR Soundbox connected. Voice AI ready in 3 languages.
        </p>

        <button
          onClick={onTriggerClosing}
          className="mt-3 w-full py-2 px-3 bg-[#00BAF2] hover:bg-cyan-300 text-[#002970] text-xs font-bold rounded-lg shadow-subtle transition-colors flex items-center justify-center gap-1.5"
        >
          <Mic className="w-3.5 h-3.5" /> Closing reminder
        </button>
      </div>
    </aside>
  );
}
