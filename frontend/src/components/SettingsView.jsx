import React, { useState } from 'react';
import { 
  Store, 
  Languages, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Key, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';

export default function SettingsView({ 
  merchant, 
  setMerchant, 
  currentLang, 
  setLanguage, 
  t, 
  onRefreshAll 
}) {
  const [formData, setFormData] = useState({
    shop_name: merchant?.shop_name || 'Sri Krishna Kirana & General Store',
    category: merchant?.category || 'Kirana / Grocery',
    preferred_language: currentLang || 'te-IN',
    closing_time: merchant?.closing_time || '21:30'
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMerchant(formData);
        setLanguage(formData.preferred_language);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save merchant settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo transactions and restore initial hackathon state (QR: ₹1,000, 5 products)?')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        alert('Demo data successfully reset! Dashboard now shows initial demo state (QR: ₹1,000).');
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-ink-primary tracking-tight">
          {t.settings.title}
        </h1>
        <p className="text-xs text-ink-tertiary mt-0.5">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl p-6 border border-surface-border shadow-card space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Shop Name */}
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-brand" />
                <span>{t.settings.shopName}</span>
              </label>
              <input
                type="text"
                required
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs font-semibold text-ink-primary focus:bg-white focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Shop Category */}
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                {t.settings.category}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs font-medium text-ink-primary focus:bg-white focus:ring-2 focus:ring-brand"
              >
                <option value="Kirana / Grocery">Kirana / Grocery Store</option>
                <option value="Tea Stall & Cafe">Tea Stall / Snacks Center</option>
                <option value="Dairy & Milk Depot">Dairy & Milk Booth</option>
                <option value="Retail & Stationery">Retail & Stationery</option>
                <option value="Street Vendor">Street Food Vendor</option>
              </select>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-brand" />
                <span>{t.settings.preferredLang}</span>
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs font-medium text-ink-primary focus:bg-white focus:ring-2 focus:ring-brand"
              >
                <option value="en-IN">English (en-IN)</option>
                <option value="te-IN">Telugu (te-IN)</option>
                <option value="hi-IN">Hindi (hi-IN)</option>
              </select>
            </div>

            {/* Closing Time */}
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span>{t.settings.closingTime}</span>
              </label>
              <input
                type="time"
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs font-semibold text-ink-primary focus:bg-white focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-light" />
              <span>{saving ? 'Saving…' : t.settings.saveProfile}</span>
            </button>
            {savedSuccess && (
              <span className="text-xs text-status-positive font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Sarvam AI Status & Model Stack */}
      <div className="bg-white rounded-xl p-6 border border-surface-border shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-bold text-ink-primary">Sarvam AI stack configuration</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-positive bg-status-positiveBg px-2.5 py-0.5 rounded-md border border-status-positiveBorder">
            <ShieldCheck className="w-3.5 h-3.5" /> API connected (Backend secured)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
            <span className="text-xs font-medium text-ink-tertiary">Speech-to-text</span>
            <p className="text-xs font-bold text-ink-primary mt-1">Sarvam Saaras v4</p>
            <p className="text-xs text-ink-tertiary mt-0.5">te-IN, hi-IN, en-IN support</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
            <span className="text-xs font-medium text-ink-tertiary">Text-to-speech</span>
            <p className="text-xs font-bold text-ink-primary mt-1">Sarvam Bulbul v4 Flash</p>
            <p className="text-xs text-ink-tertiary mt-0.5">Low-latency Indian voices</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
            <span className="text-xs font-medium text-ink-tertiary">Conversational AI</span>
            <p className="text-xs font-bold text-ink-primary mt-1">Sarvam 105B Conversations</p>
            <p className="text-xs text-ink-tertiary mt-0.5">Multilingual business grounding</p>
          </div>
        </div>

        <div className="p-3 bg-brand-muted rounded-lg border border-blue-200 text-xs text-brand flex items-center gap-2">
          <Key className="w-4 h-4 text-brand flex-shrink-0" />
          <span>The Sarvam API key is stored strictly inside the backend <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-xs">.env</code> and is never leaked to the client browser.</span>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-status-critical" />
            <span>Reset demo data to initial state</span>
          </h3>
          <p className="text-xs text-ink-tertiary mt-0.5">
            Restores initial state: QR ₹1,000, 0 cash, 5 inventory items. Useful to re-run the 3-minute hackathon demo.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-3.5 py-1.5 bg-status-criticalBg hover:bg-red-100 text-status-critical border border-status-criticalBorder rounded-lg text-xs font-semibold transition-colors"
        >
          {resetting ? 'Resetting…' : 'Reset to initial demo'}
        </button>
      </div>
    </div>
  );
}
