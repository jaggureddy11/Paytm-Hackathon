import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PitchDeckLanding from './components/PitchDeckLanding';
import MobileAppView from './components/MobileAppView';
import DashboardView from './components/DashboardView';
import VoiceSaathiView from './components/VoiceSaathiView';
import InventoryView from './components/InventoryView';
import RecordsView from './components/RecordsView';
import SettingsView from './components/SettingsView';
import { translations } from './translations';

export default function App() {
  const [activeTab, setActiveTab] = useState('pitch');
  const [currentLang, setCurrentLang] = useState('en-IN');
  const [merchant, setMerchant] = useState({
    shop_name: 'Sri Krishna Kirana & General Store',
    category: 'Kirana / Grocery',
    preferred_language: 'en-IN',
    closing_time: '21:30'
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [voiceInitialPrompt, setVoiceInitialPrompt] = useState(null);

  const t = translations[currentLang] || translations['en-IN'];

  // Fetch initial data
  const fetchAllData = async () => {
    try {
      const [merchRes, dashRes, invRes] = await Promise.all([
        fetch('/api/merchant'),
        fetch('/api/dashboard'),
        fetch('/api/inventory')
      ]);

      if (merchRes.ok) {
        const mData = await merchRes.json();
        setMerchant(mData);
        if (mData.preferred_language) {
          setCurrentLang(mData.preferred_language);
        }
      }

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setDashboardData(dData);
      }

      if (invRes.ok) {
        const iData = await invRes.json();
        setProducts(iData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Trigger simulated closing reminder
  const handleTriggerClosing = () => {
    setActiveTab('voice');
    setVoiceInitialPrompt('Start daily closing reminder');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-canvas">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        t={t}
        merchant={merchant}
        onTriggerClosing={handleTriggerClosing}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentLang={currentLang}
          setLanguage={setCurrentLang}
          t={t}
          merchant={merchant}
          onTriggerClosing={handleTriggerClosing}
        />

        {/* Dynamic Screen View */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'pitch' ? 'p-0 bg-surface-canvas' : 'p-4 md:p-6'}`}>
          <div className={activeTab === 'pitch' ? 'w-full' : 'max-w-7xl mx-auto'}>
            {activeTab === 'pitch' && (
              <PitchDeckLanding
                onNavigateTab={(tab) => setActiveTab(tab)}
                onTriggerVoice={handleTriggerClosing}
              />
            )}

            {activeTab === 'mobile' && (
              <MobileAppView
                dashboardData={dashboardData}
                merchant={merchant}
                currentLang={currentLang}
                setLanguage={setCurrentLang}
                t={t}
                onDataUpdated={fetchAllData}
                onOpenDesktopDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                dashboardData={dashboardData}
                t={t}
                onTriggerClosing={handleTriggerClosing}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceSaathiView
                currentLang={currentLang}
                setLanguage={setCurrentLang}
                t={t}
                merchant={merchant}
                onDataUpdated={fetchAllData}
                initialPrompt={voiceInitialPrompt}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                t={t}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === 'records' && (
              <RecordsView
                t={t}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                merchant={merchant}
                setMerchant={setMerchant}
                currentLang={currentLang}
                setLanguage={setCurrentLang}
                t={t}
                onRefreshAll={fetchAllData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
