import { useState, useEffect, useRef } from 'react';
import { AdCampaigns } from './components/AdCampaigns';
import { ImageCasting } from './components/ImageCasting';
import { Assets } from './components/Assets';
import { Settings } from './components/Settings';
import { 
  Coins, 
  Frame, 
  Wallet,
  Settings as SettingsIcon
} from 'lucide-react';
import { Toaster } from './components/ui/sonner';

type TabValue = 'ads' | 'cast' | 'assets' | 'settings';
type AdView = 'main' | 'campaign-detail' | 'cast-preview' | 'bonus-rewards' | 'active-commitment' | 'participation-history';
type SettingsView = 'main' | 'currency' | 'language' | 'network' | 'recovery' | 'device-info' | 'tos' | 'privacy';

const DESIGN_WIDTH = 448;

function useResponsiveScale(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = vw / DESIGN_WIDTH;
      el.style.transform = `scale(${scale})`;
      el.style.transformOrigin = 'top left';
      el.style.width = `${DESIGN_WIDTH}px`;
      el.style.height = `${vh / scale}px`;
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [containerRef]);
}

export default function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  useResponsiveScale(rootRef);

  const [activeTab, setActiveTab] = useState<TabValue>('ads');

  // Ad Campaigns state
  const [adView, setAdView] = useState<AdView>('main');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [activeCommitment, setActiveCommitment] = useState<any>(null);

  // Assets state
  const [assetsView, setAssetsView] = useState<'main' | 'all-assets' | 'all-activity'>('main');

  // Cast state
  const [currentDisplay, setCurrentDisplay] = useState<any>(null);

  // Device state
  const [einkCaseAttached, setEinkCaseAttached] = useState(false);

  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);

  // Settings state
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [network, setNetwork] = useState('ethereum');

  return (
    <div ref={rootRef} className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex flex-col overflow-hidden relative">
      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${
        (activeTab === 'ads' && adView !== 'main') || (activeTab === 'settings' && settingsView !== 'main') || (activeTab === 'assets' && assetsView !== 'main')
          ? ''
          : 'pb-20'
      }`}>
        {activeTab === 'ads' && (
          <AdCampaigns
            view={adView}
            setView={setAdView}
            selectedCampaignId={selectedCampaignId}
            setSelectedCampaignId={setSelectedCampaignId}
            activeCommitment={activeCommitment}
            setActiveCommitment={setActiveCommitment}
            einkCaseAttached={einkCaseAttached}
            walletConnected={walletConnected}
            onGoToWallet={() => setActiveTab('assets')}
          />
        )}
        {activeTab === 'cast' && (
          <ImageCasting
            activeCommitment={activeCommitment}
            currentDisplay={currentDisplay}
            setCurrentDisplay={setCurrentDisplay}
            einkCaseAttached={einkCaseAttached}
          />
        )}
        {activeTab === 'assets' && (
          <Assets
            walletConnected={walletConnected}
            setWalletConnected={setWalletConnected}
            view={assetsView}
            setView={setAssetsView}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            view={settingsView}
            setView={setSettingsView}
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            network={network}
            setNetwork={setNetwork}
            einkCaseAttached={einkCaseAttached}
            setEinkCaseAttached={setEinkCaseAttached}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 max-w-md mx-auto shadow-lg transition-transform duration-200 ${
        (activeTab === 'ads' && adView !== 'main') || (activeTab === 'settings' && settingsView !== 'main') || (activeTab === 'assets' && assetsView !== 'main')
          ? 'translate-y-full'
          : ''
      }`}>
        <div className="grid grid-cols-4 gap-1 p-2">
          <button
            onClick={() => {
              setActiveTab('ads');
              setAdView('main');
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'ads'
                ? 'gradient-earn text-white shadow-lg scale-105'
                : 'text-gray-500 hover:bg-gray-50 active:scale-95'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="tab-label mt-1">Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('cast')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'cast'
                ? 'gradient-cast text-white shadow-lg scale-105'
                : 'text-gray-500 hover:bg-gray-50 active:scale-95'
            }`}
          >
            <Frame className="w-5 h-5" />
            <span className="tab-label mt-1">Cast</span>
          </button>

          <button
            onClick={() => { setActiveTab('assets'); setAssetsView('main'); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'assets'
                ? 'gradient-wallet text-white shadow-lg scale-105'
                : 'text-gray-500 hover:bg-gray-50 active:scale-95'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="tab-label mt-1">Assets</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setSettingsView('main');
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'settings'
                ? 'gradient-settings text-gray-800 shadow-lg scale-105'
                : 'text-gray-500 hover:bg-gray-50 active:scale-95'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="tab-label mt-1">Settings</span>
          </button>
        </div>
      </nav>

      <Toaster />
    </div>
  );
}
