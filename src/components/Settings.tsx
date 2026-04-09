import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import {
  Settings as SettingsIcon,
  Wallet,
  DollarSign,
  Network,
  Shield,
  FileText,
  Bell,
  Lock,
  Globe,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Eye,
  Copy,
  Smartphone,
  Frame,
  Zap,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SettingsProps {
  view: 'main' | 'currency' | 'language' | 'network' | 'recovery' | 'device-info' | 'tos' | 'privacy';
  setView: (view: 'main' | 'currency' | 'language' | 'network' | 'recovery' | 'device-info' | 'tos' | 'privacy') => void;
  currency: string;
  setCurrency: (currency: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  network: string;
  setNetwork: (network: string) => void;
  einkCaseAttached: boolean;
  setEinkCaseAttached: (attached: boolean) => void;
}

export function Settings({ view, setView, currency, setCurrency, language, setLanguage, network, setNetwork, einkCaseAttached, setEinkCaseAttached }: SettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  
  const recoveryPhrase = [
    'apple', 'brave', 'crane', 'dance', 'eagle', 'flame',
    'grace', 'house', 'ivory', 'jungle', 'kite', 'lemon'
  ];
  
  // Mock device info
  const deviceId = '8F3A9B2C-4D5E-6F7A-8B9C-0D1E2F3A4B5C';
  const publicKey = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2';

  const currencies = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CNY', label: 'CNY' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
  ];

  const networks = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'bsc', label: 'BSC' },
    { value: 'arbitrum', label: 'Arbitrum' },
    { value: 'optimism', label: 'Optimism' },
    { value: 'base', label: 'Base' },
  ];

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  // Currency Selection Page
  if (view === 'currency') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Currency</h2>
          </div>
        </div>
        <div className="bg-white mt-6">
          {currencies.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between px-4 py-4 border-b cursor-pointer active:bg-gray-50"
              onClick={() => {
                setCurrency(item.value);
                setView('main');
              }}
            >
              <span>{item.label}</span>
              {currency === item.value && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Language Selection Page
  if (view === 'language') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Language</h2>
          </div>
        </div>
        <div className="bg-white mt-6">
          {languages.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between px-4 py-4 border-b cursor-pointer active:bg-gray-50"
              onClick={() => {
                setLanguage(item.value);
                setView('main');
              }}
            >
              <span>{item.label}</span>
              {language === item.value && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Network Selection Page
  if (view === 'network') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Active Network</h2>
          </div>
        </div>
        <div className="bg-white mt-6">
          {networks.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between px-4 py-4 border-b cursor-pointer active:bg-gray-50"
              onClick={() => {
                setNetwork(item.value);
                setView('main');
              }}
            >
              <span>{item.label}</span>
              {network === item.value && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Recovery Phrase Page
  if (view === 'recovery') {
    const handleCopyPhrase = () => {
      navigator.clipboard.writeText(recoveryPhrase.join(' '));
      toast.success('Recovery phrase copied to clipboard');
    };

    const handleRevealPhrase = () => {
      setPhraseRevealed(true);
    };

    const handleConfirmBackup = () => {
      toast.success('Backup confirmed');
      setView('main');
      setPhraseRevealed(false);
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => {
                setView('main');
                setPhraseRevealed(false);
              }}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Recovery Phrase</h2>
          </div>
        </div>

        <div className="px-4 mt-6">
          {/* Security Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-900 mb-2">Security Warning</h3>
                <ul className="text-sm text-red-800 space-y-2">
                  <li>• Never share your recovery phrase with anyone</li>
                  <li>• PixPal will never ask for your recovery phrase</li>
                  <li>• Anyone with this phrase can access your wallet</li>
                  <li>• Store it in a secure, offline location</li>
                </ul>
              </div>
            </div>
          </div>

          {!phraseRevealed ? (
            /* Before Reveal */
            <div className="bg-white rounded-lg p-6 text-center">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="mb-3">View Your Recovery Phrase</h3>
              <p className="text-sm text-gray-600 mb-6">
                Make sure no one is looking at your screen. You'll need to write down these 12 words in order.
              </p>
              <Button 
                onClick={handleRevealPhrase}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Reveal Recovery Phrase
              </Button>
            </div>
          ) : (
            /* After Reveal */
            <>
              <div className="bg-white rounded-lg p-6 mb-4">
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Write down these words in order and store them safely
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {recoveryPhrase.map((word, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                      <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                      <span>{word}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCopyPhrase}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>

              <Button 
                onClick={handleConfirmBackup}
                className="w-full"
              >
                I Have Backed Up My Recovery Phrase
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Terms of Service Page
  if (view === 'tos') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Terms of Service</h2>
          </div>
        </div>

        <div className="px-4 mt-6">
          <div className="bg-white rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-6">Last updated: October 24, 2025</p>
            
            <div className="space-y-6 text-sm">
              <div>
                <p>Welcome to PixPal. By using our service, you agree to these terms.</p>
              </div>

              <div>
                <h3 className="mb-2">1. Acceptance of Terms</h3>
                <p className="text-gray-600">
                  By accessing and using PixPal, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
                </p>
              </div>

              <div>
                <h3 className="mb-2">2. Use License</h3>
                <p className="text-gray-600">
                  Permission is granted to use PixPal for personal, non-commercial purposes. You may not modify, distribute, or reproduce any part of the application without written permission.
                </p>
              </div>

              <div>
                <h3 className="mb-2">3. Cryptocurrency Risks</h3>
                <p className="text-gray-600">
                  Cryptocurrency transactions carry inherent risks. You acknowledge that digital asset prices are volatile and may result in significant losses. You are responsible for the security of your wallet and private keys.
                </p>
              </div>

              <div>
                <h3 className="mb-2">4. User Responsibilities</h3>
                <p className="text-gray-600">
                  You agree to use the service in compliance with all applicable laws and regulations. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
                </p>
              </div>

              <div>
                <h3 className="mb-2">5. E-ink Display Usage</h3>
                <p className="text-gray-600">
                  You agree to display advertisements as committed and understand that failure to fulfill commitments may result in penalties or account suspension.
                </p>
              </div>

              <div>
                <h3 className="mb-2">6. Limitation of Liability</h3>
                <p className="text-gray-600">
                  PixPal shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use or inability to use the service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Privacy Policy Page
  if (view === 'privacy') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Privacy Policy</h2>
          </div>
        </div>

        <div className="px-4 mt-6">
          <div className="bg-white rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-6">Last updated: October 24, 2025</p>
            
            <div className="space-y-6 text-sm">
              <div>
                <p>Your privacy is important to us. This policy outlines how we handle your data.</p>
              </div>

              <div>
                <h3 className="mb-2">1. Information Collection</h3>
                <p className="text-gray-600">
                  We collect information necessary to provide our services, including wallet addresses, transaction data, device information, and usage statistics. This information helps us deliver and improve the PixPal experience.
                </p>
              </div>

              <div>
                <h3 className="mb-2">2. Data Usage</h3>
                <p className="text-gray-600">
                  Your data is used solely to facilitate app functionality and improve user experience. We analyze usage patterns to optimize performance and develop new features.
                </p>
              </div>

              <div>
                <h3 className="mb-2">3. Data Security</h3>
                <p className="text-gray-600">
                  We implement industry-standard security measures to protect your information. Your private keys and recovery phrases are stored locally on your device and are never transmitted to our servers.
                </p>
              </div>

              <div>
                <h3 className="mb-2">4. Third-Party Services</h3>
                <p className="text-gray-600">
                  We may use third-party services for analytics and functionality improvements. These services have their own privacy policies and we encourage you to review them.
                </p>
              </div>

              <div>
                <h3 className="mb-2">5. Data Sharing</h3>
                <p className="text-gray-600">
                  We do not sell your personal information to third parties. We may share anonymized, aggregated data for research and analytics purposes.
                </p>
              </div>

              <div>
                <h3 className="mb-2">6. Your Rights</h3>
                <p className="text-gray-600">
                  You have the right to access, correct, or delete your personal data. Contact us at privacy@pixpal.io to exercise these rights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Device Info Page
  if (view === 'device-info') {
    const handleCopyDeviceId = () => {
      navigator.clipboard.writeText(deviceId);
      toast.success('Device ID copied to clipboard');
    };

    const handleCopyPublicKey = () => {
      navigator.clipboard.writeText(publicKey);
      toast.success('Public key copied to clipboard');
    };

    const handleActivate = () => {
      setEinkCaseAttached(true);
      toast.success('E-Ink case activated!', { description: 'Your device is now connected.' });
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setView('main')}
              className="text-blue-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2>Device Info</h2>
          </div>
        </div>

        <div className="px-4 mt-6 space-y-4">
          {/* Connection status banner */}
          {!einkCaseAttached ? (
            <>
              {/* Not connected state */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1A1A' }}>
                <div className="h-[3px] bg-gradient-to-r from-[#BC13FE] to-[#00FFC2]" />
                <div className="p-5 text-center space-y-4">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                    style={{ background: 'rgba(0,255,194,0.1)', border: '1px solid rgba(0,255,194,0.25)' }}
                  >
                    <WifiOff className="w-7 h-7" style={{ color: '#00FFC2' }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">E-Ink Case Not Detected</p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Attach your AdPal E-Ink case and tap Activate Device to get started.
                    </p>
                  </div>

                  {/* Setup steps */}
                  <div className="text-left space-y-2.5 rounded-xl p-4" style={{ background: '#2C2C2C' }}>
                    {[
                      'Attach the E-Ink case to your iPhone',
                      'Enable NFC and Bluetooth in iOS Settings',
                      'Tap Activate Device below',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"
                          style={{ background: 'rgba(0,255,194,0.15)', border: '1px solid rgba(0,255,194,0.35)', color: '#00FFC2' }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-300 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleActivate}
                    className="w-full h-12 rounded-xl text-sm font-semibold gradient-earn text-white flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Activate Device
                  </button>
                </div>
              </div>

              {/* Device ID — unavailable */}
              <div className="bg-white rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <h3 className="text-gray-400">Device ID</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-400 italic">Not available — connect E-Ink case to view</p>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Device ID
                </Button>
              </div>

              {/* Public Key — unavailable */}
              <div className="bg-white rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <h3 className="text-gray-400">Public Key</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-400 italic">Not available — connect E-Ink case to view</p>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Public Key
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Device ID */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <h3>Device ID</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm break-all">{deviceId}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyDeviceId}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Device ID
                </Button>
              </div>

              {/* Public Key */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <h3>Public Key</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm break-all">{publicKey}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyPublicKey}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Public Key
                </Button>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Your device ID uniquely identifies your e-ink screen, while your public key is used for receiving crypto transactions.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Settings Page

  return (
    <div className="pb-4">
      {/* Wallet Settings */}
      <div className="mt-6 mb-4 px-4">
        <h3 className="section-header">Wallet</h3>
      </div>
      <div className="bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Label>Show Balance</Label>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Label>Auto-lock Wallet</Label>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Label htmlFor="biometric">Biometric Auth</Label>
          <Switch 
            id="biometric"
            checked={biometric} 
            onCheckedChange={setBiometric}
          />
        </div>

        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-gray-50 border-b"
          onClick={() => setView('recovery')}
        >
          <Label className="cursor-pointer">Recovery Phrase</Label>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-gray-50"
          onClick={() => setView('device-info')}
        >
          <Label className="cursor-pointer">Device Info</Label>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Currency Settings */}
      <div className="mt-6 mb-4 px-4">
        <h3 className="section-header">Currency & Region</h3>
      </div>
      <div className="bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 border-b cursor-pointer active:bg-gray-50"
          onClick={() => setView('currency')}
        >
          <Label className="cursor-pointer">Currency</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{currency}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-gray-50"
          onClick={() => setView('language')}
        >
          <Label className="cursor-pointer">Language</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {languages.find(l => l.value === language)?.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Network Settings */}
      <div className="mt-6 mb-4 px-4">
        <h3 className="section-header">Network</h3>
      </div>
      <div className="bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 border-b cursor-pointer active:bg-gray-50"
          onClick={() => setView('network')}
        >
          <Label className="cursor-pointer">Active Network</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {networks.find(n => n.value === network)?.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <Label>Testnet Mode</Label>
          <Switch />
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-6 mb-4 px-4">
        <h3 className="section-header">Notifications</h3>
      </div>
      <div className="bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Label>Push Notifications</Label>
          <Switch 
            checked={notifications} 
            onCheckedChange={setNotifications}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Label>Transaction Alerts</Label>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <Label>Earnings Updates</Label>
          <Switch defaultChecked />
        </div>
      </div>

      {/* About & Legal */}
      <div className="mt-6 mb-4 px-4">
        <h3 className="section-header">About</h3>
      </div>
      <div className="bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-gray-50 border-b"
          onClick={() => setView('tos')}
        >
          <Label className="cursor-pointer">Terms of Service</Label>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-gray-50 border-b"
          onClick={() => setView('privacy')}
        >
          <Label className="cursor-pointer">Privacy Policy</Label>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <Label>Version</Label>
          <span className="text-sm text-gray-500">1.0.0</span>
        </div>
      </div>
    </div>
  );
}
