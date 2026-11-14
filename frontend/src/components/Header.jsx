import React from 'react';
import { Languages, Mic, Smartphone, LayoutDashboard, Presentation } from 'lucide-react';

export default function Header({ 
  activeTab,
  setActiveTab,
  currentLang, 
  setLanguage, 
  t, 
  merchant, 
  onTriggerClosing 
}) {
  const languages = [
    { code: 'en-IN', label: 'English', name: 'English' },
    { code: 'te-IN', label: 'Telugu', name: 'Telugu' },
    { code: 'hi-IN', label: 'Hindi', name: 'Hindi' },
  ];

  return (
    <header className="h-16 bg-white border-b border-surface-border px-6 flex items-center justify-between sticky top-0 z-10 shadow-subtle">
      {/* Title & Tagline */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-ink-primary flex items-center gap-2">
            <span>{merchant?.shop_name || 'Sri Krishna Kirana Store'}</span>
            <span className="text-xs font-medium bg-brand-muted text-brand border border-blue-200 px-2 py-0.5 rounded-md">
              {merchant?.category || 'Retail'}
            </span>
          </h2>
          <p className="text-xs text-ink-tertiary hidden sm:block">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Primary Navigation Toggle */}
      <div className="flex items-center bg-surface-subtle p-1 rounded-lg border border-surface-border shadow-subtle">
        <button
          onClick={() => setActiveTab('pitch')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'pitch'
              ? 'bg-[#002970] text-cyan-300 font-bold shadow-subtle'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <Presentation className="w-3.5 h-3.5 text-[#00BAF2]" />
          <span>Pitch Deck</span>
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'mobile'
              ? 'bg-brand text-white shadow-subtle'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Paytm Mobile App</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-brand text-white shadow-subtle'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Web Dashboard</span>
        </button>
      </div>

      {/* Actions & Language Selector */}
      <div className="flex items-center gap-3">
        {/* Trigger Closing Reminder CTA Button */}
        <button
          onClick={onTriggerClosing}
          className="hidden md:flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-subtle transition-colors"
        >
          <Mic className="w-3.5 h-3.5 text-brand-light" />
          <span>{t.dashboard.triggerClosing}</span>
        </button>

        {/* Sarvam AI Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 bg-status-positiveBg text-status-positive border border-status-positiveBorder px-2.5 py-1 rounded-md text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Sarvam AI active</span>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center bg-surface-subtle p-1 rounded-lg border border-surface-border">
          <Languages className="w-3.5 h-3.5 text-ink-tertiary ml-1.5 mr-1" />
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                currentLang === lang.code
                  ? 'bg-white text-brand font-bold shadow-subtle border border-surface-border'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
