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
import { toast } from 'sonner@2.0.3';
import { OnboardingFlow, ONBOARDING_STORAGE_KEY } from './components/onboarding/OnboardingFlow';

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

  // Settings state
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [network, setNetwork] = useState('ethereum');

  // Onboarding state — gated by localStorage so it only runs on first launch
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true';
  });

  const completeOnboarding = (result: { einkCaseAttached: boolean; currentDisplay: any }) => {
    setEinkCaseAttached(result.einkCaseAttached);
    if (result.currentDisplay) setCurrentDisplay(result.currentDisplay);
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setShowOnboarding(false);
    setActiveTab('ads');
    setTimeout(() => toast.success('Welcome bonus: +12.5 ADPAL'), 400);
  };

  const skipOnboarding = () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  // Per-tab ambient backdrop. Brand palette is strictly Cyber Mint (#00FFC2) + Electric Violet (#BC13FE) —
  // each tab gets a distinct *composition* of those two colors so the room is lit differently per page
  // without ever leaving the Prism Gradient palette.
  //   ads:      mint-dominant — light comes from top edges, violet anchors bottom (earn / fresh)
  //   assets:   violet-dominant — heavy at top + sides, single mint accent below (wealth / premium)
  //   settings: balanced, muted, corner-anchored — calmer, lower intensity (utility)
  //   cast:     skipped; the page paints its own image-driven backdrop.
  const MINT = '#00FFC2';
  const VIOLET = '#BC13FE';
  const tabBackdrops: Record<TabValue, string | null> = {
    ads:
      `radial-gradient(circle at 15% 12%, ${MINT} 0%, transparent 28%),` +
      `radial-gradient(circle at 88% 28%, ${MINT} 0%, transparent 22%),` +
      `radial-gradient(circle at 72% 96%, ${VIOLET} 0%, transparent 34%),` +
      `radial-gradient(circle at 28% 72%, ${MINT} 0%, transparent 18%)`,
    cast: null,
    assets:
      `radial-gradient(circle at 50% 14%, ${VIOLET} 0%, transparent 32%),` +
      `radial-gradient(circle at 8% 48%, ${VIOLET} 0%, transparent 28%),` +
      `radial-gradient(circle at 90% 62%, ${VIOLET} 0%, transparent 24%),` +
      `radial-gradient(circle at 50% 102%, ${MINT} 0%, transparent 30%)`,
    settings:
      `radial-gradient(circle at 18% 20%, ${VIOLET} 0%, transparent 22%),` +
      `radial-gradient(circle at 82% 80%, ${MINT} 0%, transparent 22%),` +
      `radial-gradient(circle at 84% 18%, ${MINT} 0%, transparent 16%),` +
      `radial-gradient(circle at 18% 82%, ${VIOLET} 0%, transparent 16%)`,
  };
  const backdrop = tabBackdrops[activeTab];

  return (
    <div ref={rootRef} className="dark bg-[#0A0A0A] text-white flex flex-col overflow-hidden relative">
      {/* Tab-aware ambient backdrop — same recipe as the Cast gallery page (blurred color field
          + vignette + grain). Each tab gets a unique pair of brand-color blobs so the room
          "lights up" differently as you switch tabs. */}
      {backdrop && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none overflow-hidden bg-[#0a0a0a]"
        >
          {/* Per-tab composition of Cyber Mint + Electric Violet blobs, heavily blurred to
              mimic the lens-out-of-focus atmosphere of the Cast page's image backdrop. */}
          <div
            className="absolute -inset-[15%]"
            style={{
              background: backdrop,
              filter: 'blur(60px) saturate(1.5) brightness(0.55)',
              transition: 'background 800ms ease',
            }}
          />
          {/* Vertical vignette for legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 30%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.85) 100%)',
            }}
          />
          {/* Subtle grain — same Matte Obsidian texture as the Cast page */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              background:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className={`relative flex-1 overflow-y-auto ${
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
            onGoToWallet={() => setActiveTab('assets')}
          />
        )}
        {activeTab === 'cast' && (
          <ImageCasting
            activeCommitment={activeCommitment}
            currentDisplay={currentDisplay}
            setCurrentDisplay={setCurrentDisplay}
            einkCaseAttached={einkCaseAttached}
            onViewActiveStatus={() => {
              setActiveTab('ads');
              setAdView('active-commitment');
            }}
          />
        )}
        {activeTab === 'assets' && (
          <Assets
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
            onReplayOnboarding={() => {
              window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
              setSettingsView('main');
              setShowOnboarding(true);
            }}
          />
        )}
      </main>

      {showOnboarding && (
        <OnboardingFlow onComplete={completeOnboarding} onSkip={skipOnboarding} />
      )}

      {/* Bottom Navigation — liquid glass with the active tab's accent spreading across it */}
      {(() => {
        // Soft fingertip-ink fade — strong at the center, feathered at the edges so the ridge field reads like a pressed print.
        const fingerprintMask =
          'radial-gradient(closest-side, black 35%, rgba(0,0,0,0.6) 70%, transparent 100%)';

        // Each tab is a different "finger pressed at a different angle":
        //   - different ellipse aspect (finger shape)
        //   - different off-center pad (where the finger pressed hardest)
        //   - different rotation (angle of impression)
        //   - slightly different ridge spacing (whose finger)
        const tabAccents: Record<TabValue, {
          color: string;
          pos: string;
          inactiveText: string;
          rotate: number;
          haloStyle: (c: string) => Record<string, string>;
        }> = {
          ads: {
            color: '#22c55e',
            pos: '12.5%',
            inactiveText: 'text-emerald-400',
            rotate: 14,
            haloStyle: (c) => ({
              background:
                `radial-gradient(ellipse 62% 78% at 48% 52%, ${c}e6 0%, ${c}66 55%, transparent 92%)`,
              maskImage: fingerprintMask,
              WebkitMaskImage: fingerprintMask,
            }),
          },
          cast: {
            color: '#f43f5e',
            pos: '37.5%',
            inactiveText: 'text-rose-400',
            rotate: -22,
            haloStyle: (c) => ({
              background:
                `radial-gradient(ellipse 72% 58% at 42% 60%, ${c}e6 0%, ${c}66 55%, transparent 92%)`,
              maskImage: fingerprintMask,
              WebkitMaskImage: fingerprintMask,
            }),
          },
          assets: {
            color: '#BC13FE',
            pos: '62.5%',
            inactiveText: 'text-fuchsia-400',
            rotate: 32,
            haloStyle: (c) => ({
              background:
                `radial-gradient(ellipse 54% 82% at 56% 46%, ${c}e6 0%, ${c}66 55%, transparent 92%)`,
              maskImage: fingerprintMask,
              WebkitMaskImage: fingerprintMask,
            }),
          },
          settings: {
            color: '#06b6d4',
            pos: '87.5%',
            inactiveText: 'text-cyan-300',
            rotate: -6,
            haloStyle: (c) => ({
              background:
                `radial-gradient(ellipse 68% 70% at 46% 54%, ${c}e6 0%, ${c}66 55%, transparent 92%)`,
              maskImage: fingerprintMask,
              WebkitMaskImage: fingerprintMask,
            }),
          },
        };
        const accent = tabAccents[activeTab];
        return (
          <nav
            className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto transition-transform duration-200 ${
              (activeTab === 'ads' && adView !== 'main') || (activeTab === 'settings' && settingsView !== 'main') || (activeTab === 'assets' && assetsView !== 'main')
                ? 'translate-y-full'
                : ''
            }`}
          >
            {/* Edge-less glass layer — fades into the page above so there's no visible top boundary */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -top-10 pointer-events-none"
              style={{
                background:
                  `radial-gradient(140% 200% at ${accent.pos} 100%, ${accent.color}1c 0%, ${accent.color}08 28%, transparent 65%), ` +
                  'linear-gradient(to bottom, transparent 0%, rgba(20,20,28,0.04) 38%, rgba(20,20,28,0.10) 100%)',
                WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
                backdropFilter: 'blur(18px) saturate(1.5)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 38%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 38%, black 100%)',
                transition: 'background 400ms ease',
              }}
            />
            <div className="relative grid grid-cols-4 p-2">
              {([
                { tab: 'ads' as TabValue,      Icon: Coins,        label: 'Earnings', onSelect: () => { setActiveTab('ads'); setAdView('main'); } },
                { tab: 'cast' as TabValue,     Icon: Frame,        label: 'Cast',     onSelect: () => setActiveTab('cast') },
                { tab: 'assets' as TabValue,   Icon: Wallet,       label: 'Assets',   onSelect: () => { setActiveTab('assets'); setAssetsView('main'); } },
                { tab: 'settings' as TabValue, Icon: SettingsIcon, label: 'Settings', onSelect: () => { setActiveTab('settings'); setSettingsView('main'); } },
              ]).map(({ tab, Icon, label, onSelect }) => {
                const isActive = activeTab === tab;
                const itemAccent = tabAccents[tab];
                return (
                  <button
                    key={tab}
                    onClick={onSelect}
                    className={`relative flex flex-col items-center justify-center py-2.5 px-2 transition-all duration-300 active:scale-[0.96] focus:outline-none ${
                      isActive ? 'text-white' : 'text-gray-400/70 hover:text-gray-200'
                    }`}
                    style={
                      isActive
                        ? { filter: `drop-shadow(0 0 10px ${itemAccent.color}cc)` }
                        : undefined
                    }
                  >
                    {/* Per-tab signature halo — each tab has its own visual treatment */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute -inset-y-1 inset-x-0 pointer-events-none"
                        style={{
                          ...itemAccent.haloStyle(itemAccent.color),
                          transform: `rotate(${itemAccent.rotate}deg)`,
                        }}
                      />
                    )}
                    <Icon
                      className="relative w-5 h-5 transition-all duration-300"
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    <span className={`relative tab-label mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100 font-medium' : 'opacity-100'}`}>
                      {label}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: itemAccent.color, boxShadow: `0 0 8px ${itemAccent.color}` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        );
      })()}

      <Toaster />
    </div>
  );
}
