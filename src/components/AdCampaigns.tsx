import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Coins,
  TrendingUp,
  Star,
  Users,
  ChevronRight,
  Timer,
  Gift,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
  Info,
  CalendarDays,
  Shield,
  Nfc
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import iphoneBackImg from 'figma:asset/771d461e7de4d0c40d4ef5fcc5c59768d30ec60e.png';
import { EinkCasePrompt } from './EinkCasePrompt';
import { WalletConnectPrompt } from './WalletConnectPrompt';

interface AdCampaignsProps {
  view: 'main' | 'campaign-detail' | 'cast-preview' | 'bonus-rewards' | 'active-commitment' | 'participation-history';
  setView: (view: 'main' | 'campaign-detail' | 'cast-preview' | 'bonus-rewards' | 'active-commitment' | 'participation-history') => void;
  selectedCampaignId: number | null;
  setSelectedCampaignId: (id: number | null) => void;
  activeCommitment: any;
  setActiveCommitment: (commitment: any) => void;
  einkCaseAttached: boolean;
  walletConnected: boolean;
  onGoToWallet: () => void;
}

export function AdCampaigns({
  view,
  setView,
  selectedCampaignId,
  setSelectedCampaignId,
  activeCommitment,
  setActiveCommitment,
  einkCaseAttached,
  walletConnected,
  onGoToWallet,
}: AdCampaignsProps) {
  const [bonusPoints, setBonusPoints] = useState(350);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [showEinkPrompt, setShowEinkPrompt] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const tokenBalance = 1247.50;

  // Simulate initial loading
  useEffect(() => {
    if (view === 'main') {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // Timer for active commitment
  useEffect(() => {
    if (view === 'active-commitment' && activeCommitment && !isFastForwarding) {
      const updateTimer = () => {
        const elapsed = Date.now() - activeCommitment.startTime;
        const totalDuration = activeCommitment.duration * 60 * 60 * 1000; // hours to ms
        const remaining = Math.max(0, totalDuration - elapsed);
        const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);
        
        setTimeRemaining(remaining);
        setProgress(progressPercent);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [view, activeCommitment, isFastForwarding]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success('Campaigns refreshed!');
  };

  // Helper functions for active commitment view
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleFastForward = () => {
    if (!activeCommitment) return;
    setIsFastForwarding(true);
    
    // Animate progress from current to 100%
    let currentProgress = progress;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 100) {
        // Update the activeCommitment startTime FIRST to make it appear completed
        // This prevents the timer from resetting the progress when isFastForwarding becomes false
        const totalDuration = activeCommitment.duration * 60 * 60 * 1000;
        setActiveCommitment({
          ...activeCommitment,
          startTime: Date.now() - totalDuration
        });
        
        setProgress(100);
        setTimeRemaining(0);
        clearInterval(interval);
        setIsFastForwarding(false);
      } else {
        setProgress(currentProgress);
        setTimeRemaining(prev => Math.max(0, prev - (activeCommitment.duration * 60 * 60 * 1000 * 0.05)));
      }
    }, 100);
  };

  const handleClaimTokens = () => {
    if (!activeCommitment) return;
    toast.success(`+${activeCommitment.reward} tokens claimed!`, {
      description: 'Added to your wallet',
    });
    setActiveCommitment(null);
    setView('main');
  };

  // Empty state component
  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </motion.div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="pb-6">
      <div className="px-4 pt-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="w-5 h-5 mx-auto mb-2 rounded-full" />
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <Skeleton className="w-full h-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const campaigns = [
    {
      id: 1,
      title: 'Binance - Trade BTC, ETH, SOL',
      description: 'Get $100 bonus on first deposit over $500',
      reward: 85,
      duration: 6,
      poolRemaining: 78,
      completions: 2543,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1584232992172-29cead8e5230?w=400',
      category: 'Cryptocurrency',
      startDate: '2026-03-08',
      endDate: '2026-03-15',
      tokenSymbol: 'BNB',
      tokenColor: 'from-yellow-400 to-yellow-500',
      network: 'BNB Chain',
      networkColor: '#F0B90B',
      networkIcon: '⬡',
    },
    {
      id: 2,
      title: 'Uniswap V4 - Swap Any Token',
      description: 'New liquidity pools with 0.01% fees',
      reward: 95,
      duration: 8,
      poolRemaining: 62,
      completions: 1892,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1590286162167-70fb467846ae?w=400',
      category: 'DeFi',
      startDate: '2026-03-05',
      endDate: '2026-03-18',
      tokenSymbol: 'UNI',
      tokenColor: 'from-pink-400 to-pink-500',
      network: 'Ethereum',
      networkColor: '#627EEA',
      networkIcon: '◆',
    },
    {
      id: 3,
      title: 'OpenSea - Mint & Trade NFTs',
      description: 'Zero fees for new creators this month',
      reward: 120,
      duration: 4,
      poolRemaining: 45,
      completions: 987,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1635237755468-5fba69c13f29?w=400',
      category: 'NFT',
      startDate: '2026-03-01',
      endDate: '2026-03-12',
      tokenSymbol: 'ETH',
      tokenColor: 'from-blue-400 to-indigo-500',
      network: 'Ethereum',
      networkColor: '#627EEA',
      networkIcon: '◆',
    },
    {
      id: 4,
      title: 'TradingView Crypto Charts',
      description: 'Premium features free for 30 days',
      reward: 70,
      duration: 5,
      poolRemaining: 88,
      completions: 3456,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1658225282648-b199eb2a4830?w=400',
      category: 'Web3',
      startDate: '2026-03-07',
      endDate: '2026-03-20',
      tokenSymbol: 'USDC',
      tokenColor: 'from-blue-400 to-blue-500',
      network: 'Base',
      networkColor: '#0052FF',
      networkIcon: '▣',
    }
  ];

  const bonusTasks = [
    { id: 1, title: 'Watch Video Ad', points: 50, duration: '30 sec', icon: '🎥' },
    { id: 2, title: 'Visit Website', points: 25, duration: '1 min', icon: '🌐' },
    { id: 3, title: 'Complete Survey', points: 100, duration: '3 min', icon: '📋' },
    { id: 4, title: 'Rate Previous Campaign', points: 10, duration: '10 sec', icon: '⭐' },
  ];

  const participationHistory = [
    {
      id: 1,
      campaignTitle: 'Binance - Trade BTC, ETH, SOL',
      duration: 6,
      reward: 85,
      completedAt: '2 hours ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1584232992172-29cead8e5230?w=400',
      txHash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'
    },
    {
      id: 2,
      campaignTitle: 'Uniswap V4 - Swap Any Token',
      duration: 8,
      reward: 95,
      completedAt: '2 days ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1590286162167-70fb467846ae?w=400',
      txHash: '0x8a3f92c1d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9'
    },
    {
      id: 3,
      campaignTitle: 'OpenSea - Mint & Trade NFTs',
      duration: 4,
      reward: 120,
      completedAt: '3 days ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1635237755468-5fba69c13f29?w=400',
      txHash: '0x5d2a8f3b9c4e1a6b7d8e9f0a1b2c3d4e5f6a7b8c'
    },
    {
      id: 4,
      campaignTitle: 'TradingView Crypto Charts',
      duration: 5,
      reward: 70,
      completedAt: '5 days ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1658225282648-b199eb2a4830?w=400',
      txHash: '0x9c4e1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f'
    },
    {
      id: 5,
      campaignTitle: 'Coinbase Wallet - Your Keys',
      duration: 6,
      reward: 80,
      completedAt: '1 week ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400',
      txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
    },
    {
      id: 6,
      campaignTitle: 'MetaMask - Connect Web3',
      duration: 4,
      reward: 65,
      completedAt: '1 week ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
      txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c'
    },
    {
      id: 7,
      campaignTitle: 'Phantom Wallet - Solana',
      duration: 5,
      reward: 75,
      completedAt: '2 weeks ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400',
      txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d'
    },
  ];

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Participation History View
  if (view === 'participation-history') {
    // Sort the history based on completion time
    const sortedHistory = [...participationHistory].sort((a, b) => {
      const timeValues: Record<string, number> = {
        '2 hours ago': 2,
        '2 days ago': 48,
        '3 days ago': 72,
        '5 days ago': 120,
        '1 week ago': 168,
        '2 weeks ago': 336,
      };
      
      const aTime = timeValues[a.completedAt] || 0;
      const bTime = timeValues[b.completedAt] || 0;
      
      return sortOrder === 'desc' ? aTime - bTime : bTime - aTime;
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="flex items-center gap-2 text-blue-600"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-lg">Campaign History</h2>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="px-4 py-4">
          {/* Sorting Controls */}
          <div className="flex items-center justify-between mb-3">
            <h3>Completed Campaigns</h3>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 text-sm text-blue-600"
            >
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
            </button>
          </div>

          <div className="space-y-3">
            {sortedHistory.map((participation) => (
              <Card key={participation.id}>
                <CardContent className="p-0">
                  <div className="flex gap-3 p-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={participation.image} 
                        alt={participation.campaignTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm flex-1">{participation.campaignTitle}</div>
                        <div className="text-xl text-green-600 flex-shrink-0">+{participation.reward}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {participation.duration}h
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{participation.completedAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                        <a 
                          href={`https://etherscan.io/tx/${participation.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            toast.success('Transaction link copied!');
                          }}
                        >
                          {participation.txHash.slice(0, 6)}...{participation.txHash.slice(-4)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active Commitment View
  if (view === 'active-commitment' && activeCommitment) {
    const isComplete = progress >= 100;

    return (
      <div className="min-h-screen bg-gray-50 pb-6">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="flex items-center gap-2 text-blue-600"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-lg">Campaign Status</h2>
            <div className="w-12"></div>
          </div>
        </div>

        {/* Campaign Image */}
        <div className="relative w-full aspect-[4/3] bg-gray-200">
          <img 
            src={activeCommitment.image} 
            alt={activeCommitment.title}
            className="w-full h-full object-cover"
          />
          {isComplete && (
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-900/40 to-transparent flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="text-white text-center"
              >
                <CheckCircle2 className="w-16 h-16 mx-auto mb-2" />
                <div className="text-2xl">Complete!</div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Campaign Info */}
          <div>
            <h2 className="mb-1">{activeCommitment.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge className="gradient-earn text-white border-0">
                <Timer className="w-3 h-3 mr-1" />
                Active Campaign
              </Badge>
            </div>
          </div>

          {/* Progress Card */}
          <Card className={isComplete ? "gradient-success" : "gradient-earn"}>
            <CardContent className="p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm opacity-90 mb-1">
                    {isComplete ? 'Completed!' : 'Time Remaining'}
                  </div>
                  <div className="text-2xl">
                    {isComplete ? '0h 0m 0s' : formatTime(timeRemaining)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90 mb-1">Reward</div>
                  <div className="text-2xl flex items-center gap-1">
                    <Coins className="w-6 h-6" />
                    {activeCommitment.reward}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-90">Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/20" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <div className="text-lg mb-0.5">{activeCommitment.duration}h</div>
                <div className="text-xs text-gray-500">Total Duration</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                <div className="text-lg mb-0.5">{(progress).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </CardContent>
            </Card>
          </div>

          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 space-y-1">
                  {isComplete ? (
                    <>
                      <p>✓ Campaign completed successfully!</p>
                      <p>✓ Claim your tokens to receive the reward</p>
                      <p>✓ Tokens will be added to your wallet</p>
                    </>
                  ) : (
                    <>
                      <p>• Keep your screen displaying the campaign</p>
                      <p>• You can use fast-forward to test completion</p>
                      <p>• Claim tokens after completion to receive reward</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isComplete ? (
            <Button 
              className="w-full h-12 gradient-success text-white"
              onClick={handleClaimTokens}
            >
              <Coins className="w-5 h-5 mr-2" />
              Claim {activeCommitment.reward} Tokens
            </Button>
          ) : (
            <Button 
              className="w-full h-12"
              variant="outline"
              onClick={handleFastForward}
              disabled={isFastForwarding}
            >
              {isFastForwarding ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Fast Forwarding...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Fast Forward (Demo)
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Campaign Detail View
  if (view === 'campaign-detail' && selectedCampaign) {
    const handleStartCampaign = () => {
      setView('cast-preview');
    };

    const daysLeft = Math.max(0, Math.ceil((new Date(selectedCampaign.endDate).getTime() - new Date('2026-03-10').getTime()) / (1000 * 60 * 60 * 24)));
    const claimedPercent = 100 - selectedCampaign.poolRemaining;

    return (
      <>
      <div className="min-h-screen bg-gray-50 pb-6">
        {/* Header with Back Button */}
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="flex items-center gap-2 text-blue-600"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-lg">Campaign Details</h2>
            <div className="w-12"></div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          {/* Ambient Glow Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-pink-200 rounded-full opacity-15 blur-2xl"></div>
          
          {/* Real iPhone Back Photo - Right side */}
          <motion.div 
            initial={{ opacity: 0, x: 40, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-[-80px] top-[12px] w-[360px] pointer-events-none z-[2]"
          >
            <img 
              src={iphoneBackImg} 
              alt="AdPal Device" 
              className="w-full h-auto object-contain"
              style={{ filter: 'drop-shadow(0 20px 50px rgba(139, 92, 246, 0.3)) drop-shadow(0 8px 16px rgba(59, 130, 246, 0.2))' }}
            />

            {/* E-ink Display Screen overlay - Campaign Preview */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute overflow-hidden z-10"
              style={{
                top: '222px',
                left: '99px',
                borderRadius: '7px',
              }}
            >
              <img 
                src={selectedCampaign.image} 
                alt={selectedCampaign.title}
                className="w-[168px] h-[250px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5 pointer-events-none"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-white/15 pointer-events-none rounded-[6px]"></div>
            </motion.div>
          </motion.div>

          {/* === Full-Width Immersive Glass Overlay — single layer, dark-to-clear === */}
          <div
            className="absolute inset-x-0 top-0 z-[3] pointer-events-none"
            style={{
              height: '170px',
              background: 'linear-gradient(to bottom, rgba(30,20,50,0.7) 0%, rgba(60,50,80,0.35) 40%, transparent 100%)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            }}
          />

          {/* Category + Title + Description */}
          <div className="relative z-[4] px-4 pt-6 pb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-3"
            >
              <Badge className="gradient-secondary text-white border-0 shadow-lg rounded-[10px] px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                {selectedCampaign.category}
              </Badge>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-3 text-[24px] font-bold text-white leading-tight"
            >
              {selectedCampaign.title}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-gray-600 text-sm leading-relaxed max-w-[65%] mt-1"
            >
              {selectedCampaign.description}
            </motion.p>
          </div>

          {/* Left-Half Content (right half = iPhone) */}
          <div className="relative z-[4] px-4 pb-6">
            <div className="w-[55%] space-y-3">

              {/* Token Per Cast - PRIMARY HIGHLIGHT + Total Casts merged */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="relative overflow-hidden rounded-[10px] p-4 border border-emerald-200/50"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(236,253,245,0.6) 100%)',
                  backdropFilter: 'blur(2px)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.06)' 
                }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-400 rounded-full opacity-20 blur-xl"></div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Per Cast Reward</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] font-bold text-gradient-success leading-none">{selectedCampaign.reward}</span>
                  <span className="text-sm text-emerald-600 font-medium">{selectedCampaign.tokenSymbol}</span>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600">
                      <span className="font-semibold text-emerald-700">{selectedCampaign.completions.toLocaleString()}</span> casters joined
                    </span>
                  </div>
                  <div 
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${selectedCampaign.networkColor}15`, border: `1px solid ${selectedCampaign.networkColor}30` }}
                  >
                    <span className="text-[9px]" style={{ color: selectedCampaign.networkColor }}>{selectedCampaign.networkIcon}</span>
                    <span className="text-[8px] font-semibold" style={{ color: selectedCampaign.networkColor }}>{selectedCampaign.network}</span>
                  </div>
                </div>
              </motion.div>

              {/* Pool Activity - FOMO Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="rounded-[10px] p-3.5 border border-purple-100/50"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(250,245,255,0.6) 100%)',
                  backdropFilter: 'blur(2px)',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.08)' 
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Pool Activity</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{claimedPercent}%</span>
                </div>
                
                <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner mb-2.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${claimedPercent}%` }}
                    transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20"></div>
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div>
                    <div className="text-yellow-600 font-medium">Claimed</div>
                    <div className="text-sm font-bold text-gray-900">
                      {(selectedCampaign.completions * selectedCampaign.reward * 0.65).toFixed(0)}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-right">
                    <div className="text-purple-600 font-medium">Available</div>
                    <div className="text-sm font-bold text-purple-700">
                      {(selectedCampaign.poolRemaining * selectedCampaign.reward * 10).toLocaleString()}
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* Cast Duration - Battery Block Visualization */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="rounded-[10px] px-3 py-2.5 border border-blue-100/40"
                style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Cast Duration</span>
                  <span className="text-xs font-bold text-gray-900">{selectedCampaign.duration}h</span>
                </div>
                <div className="flex items-end gap-[3px]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.3 }}
                      className={`flex-1 rounded-[2px] origin-bottom ${
                        i < selectedCampaign.duration
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                          : 'bg-gray-200'
                      }`}
                      style={{ height: `${12 + i * 1.5}px` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] text-gray-400">1h</span>
                  <span className="text-[8px] text-gray-400">8h</span>
                </div>
              </motion.div>
            </div>

            {/* Campaign Dates - Full Width Row */}
            {/* ... remove this code ... */}
          </div>
        </div>

        {/* CTA Button + Days Left Hint */}
        <div className="px-4 mt-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            <Button
              className={`w-full h-14 text-base shadow-xl transition-all ${
                einkCaseAttached && walletConnected
                  ? 'gradient-earn hover:shadow-2xl'
                  : 'bg-gray-200 text-gray-400 cursor-pointer'
              }`}
              onClick={
                !einkCaseAttached
                  ? () => setShowEinkPrompt(true)
                  : !walletConnected
                  ? () => setShowWalletPrompt(true)
                  : handleStartCampaign
              }
            >
              <Nfc className="w-6 h-6 mr-2" />
              Cast this ad and start earning
            </Button>
          </motion.div>

          {/* Days Left Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="flex items-center justify-center gap-1.5 mt-2.5"
          >
            <CalendarDays className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-400">
              {daysLeft > 0 ? (
                <>
                  Campaign ends {new Date(selectedCampaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · <span className="text-orange-500 font-semibold">{daysLeft} days left</span>
                </>
              ) : (
                <span className="text-red-500 font-semibold">Campaign ended</span>
              )}
            </span>
          </motion.div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="px-4 mt-5"
        >
          <div className="rounded-[10px] overflow-hidden border border-purple-100/50" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 50%, #fdf2f8 100%)' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b border-purple-100/40">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Info className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800">How It Works</span>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {[
                `Your e-ink display locks for ${selectedCampaign.duration} hours while showing the campaign ad.`,
                'Screen stays active so the network can verify your participation.',
                `Once complete, claim your ${selectedCampaign.tokenSymbol} within 24 hours to your wallet.`,
              ].map((text, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-[10px] text-purple-400 font-bold mt-0.5">{i + 1}</span>
                  <span className="text-xs text-gray-600 leading-relaxed">{text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      <EinkCasePrompt open={showEinkPrompt} onClose={() => setShowEinkPrompt(false)} />
      <WalletConnectPrompt
        open={showWalletPrompt}
        onClose={() => setShowWalletPrompt(false)}
        onGoToWallet={onGoToWallet}
      />
      </>
    );
  }

  // Cast Preview View
  if (view === 'cast-preview' && selectedCampaign) {
    const handleCastToScreen = async () => {
      setIsNfcWriting(true);
      await new Promise(resolve => setTimeout(resolve, 2500));
      setIsNfcWriting(false);
      setActiveCommitment({
        campaignId: selectedCampaign.id,
        title: selectedCampaign.title,
        reward: selectedCampaign.reward,
        duration: selectedCampaign.duration,
        startTime: Date.now(),
        image: selectedCampaign.image
      });
      toast.success('Ad cast! Campaign is now in progress.');
      setView('main');
    };

    return (
      <>
        <div className="min-h-screen bg-gray-50 pb-8">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setView('campaign-detail')}
                className="flex items-center gap-2 text-blue-600"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span className="text-sm">Back</span>
              </button>
              <h2 className="text-lg">Cast Preview</h2>
              <div className="w-16" />
            </div>
          </div>

          {/* Campaign Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center pt-8 px-6"
          >
            <div className="relative">
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-2xl blur-2xl opacity-40"
                style={{ background: 'linear-gradient(135deg, #00FFC2, #BC13FE)', transform: 'scale(1.08)' }}
              />
              {/* Prism border */}
              <div
                className="relative rounded-2xl p-[2px]"
                style={{ background: 'linear-gradient(135deg, #00FFC2, #BC13FE)' }}
              >
                <img
                  src={selectedCampaign.image}
                  alt={selectedCampaign.title}
                  className="w-[200px] h-[298px] object-cover rounded-2xl block"
                  style={{ filter: 'contrast(1.04) brightness(0.98)' }}
                />
                {/* E-ink grain overlay */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.035\'/%3E%3C/svg%3E")', opacity: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Campaign title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="text-center mt-8 px-6"
          >
            <h1 className="text-xl font-bold text-gray-900">{selectedCampaign.title}</h1>
          </motion.div>

          {/* Confirm details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mx-6 mt-6 grid grid-cols-2 gap-3"
          >
            <div className="rounded-xl p-4 border border-gray-100 bg-white text-center shadow-sm">
              <Clock className="w-5 h-5 mx-auto mb-1.5 text-blue-500" />
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-bold text-gray-900">{selectedCampaign.duration}<span className="text-sm text-gray-400 ml-0.5">h</span></div>
            </div>
            <div className="rounded-xl p-4 border border-gray-100 bg-white text-center shadow-sm">
              <Coins className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Reward</div>
              <div className="text-lg font-bold text-gray-900">
                {selectedCampaign.reward}
                <span className="text-sm ml-1 text-emerald-600">{selectedCampaign.tokenSymbol}</span>
              </div>
            </div>
          </motion.div>

          {/* Cast to Screen button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.4 }}
            className="mx-6 mt-8"
          >
            <button
              onClick={handleCastToScreen}
              className="w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #00FFC2, #00d9a8)', color: '#0a0a0a', boxShadow: '0 0 32px rgba(0,255,194,0.35)' }}
            >
              <Nfc className="w-5 h-5" />
              Cast to Screen
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Your e-ink display will show this ad for {selectedCampaign.duration}h
            </p>
          </motion.div>
        </div>

        {/* iOS-style NFC writing sheet */}
        {isNfcWriting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-t-3xl px-8 py-10 text-center"
              style={{ background: '#1c1c1e', borderTop: '1px solid rgba(255,255,255,0.12)' }}
            >
              {/* Animated NFC rings */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: '#00FFC2' }}
                    animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.7, 0] }}
                    transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                ))}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,255,194,0.12)', border: '2px solid rgba(0,255,194,0.4)' }}
                >
                  <Nfc className="w-10 h-10" style={{ color: '#00FFC2' }} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Write NFC</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Hold your phone close to the<br />E-ink case to cast the ad
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </>
    );
  }

  // Bonus Rewards View
  if (view === 'bonus-rewards') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="flex items-center gap-2 text-blue-600"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-lg">Bonus Rewards</h2>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Points Balance */}
          <Card className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            <CardContent className="p-6 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <div className="text-3xl mb-1">{bonusPoints}</div>
              <div className="text-sm opacity-90 mb-3">Bonus Points</div>
              <div className="text-xs opacity-75">
                = {(bonusPoints / 100).toFixed(2)} tokens (100 points = 1 token)
              </div>
            </CardContent>
          </Card>

          {/* Available Tasks */}
          <div>
            <h3 className="px-1 mb-3">Available Tasks</h3>
            <div className="space-y-3">
              {bonusTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className="text-3xl mr-4">{task.icon}</div>
                      <div className="flex-1">
                        <div className="mb-1">{task.title}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.duration}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Coins className="w-3 h-3" />
                            +{task.points} pts
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setBonusPoints(prev => prev + task.points);
                          toast.success(`+${task.points} points earned!`);
                        }}
                      >
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading skeleton
  if (isLoading && view === 'main') {
    return <LoadingSkeleton />;
  }

  // Main Ads View
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-6"
    >
      {/* Refresh Button */}
      <div className="px-4 pt-4 pb-2 flex justify-end">
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Earning Stats */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Coins, value: einkCaseAttached ? tokenBalance.toFixed(0) : '0', label: 'Total Earned', color: 'text-yellow-500', delay: 0 },
            { icon: TrendingUp, value: einkCaseAttached ? '45' : '0', label: 'Campaigns', color: 'text-green-500', delay: 0.05 },
            { icon: Clock, value: einkCaseAttached ? '127h' : '0h', label: 'Display Time', color: 'text-blue-500', delay: 0.1 }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: stat.delay }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => einkCaseAttached ? setView('participation-history') : setShowEinkPrompt(true)}
              >
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-5 h-5 ${einkCaseAttached ? stat.color : 'text-gray-300'} mx-auto mb-2`} />
                  <div className={`text-lg mb-0.5 ${einkCaseAttached ? '' : 'text-gray-400'}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Commitment Banner */}
      <AnimatePresence>
        {activeCommitment && (
          <motion.div 
            className="px-4 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="gradient-earn overflow-hidden shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Timer className="w-5 h-5 text-white animate-pulse" />
                  <div>
                    <div className="text-sm text-white">Active Campaign</div>
                    <div className="text-xs text-white/90">{activeCommitment.title}</div>
                  </div>
                </div>
                <button 
                  className="w-full h-9 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-105 active:scale-95 text-sm text-white"
                  onClick={() => setView('active-commitment')}
                >
                  View Status
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bonus Rewards CTA */}
      <motion.div 
        className="px-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button 
          className="w-full text-left gradient-secondary rounded-lg px-3 py-2 hover:shadow-lg transition-all active:scale-[0.99]"
          onClick={() => setView('bonus-rewards')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-3.5 h-3.5 text-white" />
              <span className="text-xs text-white">Bonus Rewards Available</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/80" />
          </div>
        </button>
      </motion.div>

      {/* Campaign List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3>Available Campaigns</h3>
          <Badge variant="outline">{einkCaseAttached ? campaigns.length : 2} active</Badge>
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No Campaigns Available"
            description="Check back soon! New advertising campaigns are added regularly."
          />
        ) : (
          <div className="space-y-3">
            {(einkCaseAttached ? campaigns : campaigns.slice(0, 2)).map((campaign, index) => {
            const tokensClaimedEstimate = Math.floor(campaign.completions * campaign.reward * 0.65);
            const progressPercent = campaign.poolRemaining;
            const locked = !einkCaseAttached;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`overflow-hidden transition-all border-l-4 border-l-purple-500 ${
                    locked
                      ? 'opacity-60 cursor-pointer'
                      : 'cursor-pointer hover:shadow-xl hover:scale-[1.02]'
                  }`}
                  onClick={() => {
                    if (locked) {
                      setShowEinkPrompt(true);
                    } else {
                      setSelectedCampaignId(campaign.id);
                      setView('campaign-detail');
                    }
                  }}
                >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="flex gap-3 p-3 pb-2">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={campaign.image}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 truncate">{campaign.title}</div>
                        <p className="text-sm text-gray-500 mb-2 truncate">{campaign.description}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Coins className="w-3 h-3" />
                            {campaign.reward}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            {campaign.duration}h
                          </span>
                        </div>
                      </div>
                      {locked ? (
                        <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-3 pb-2">
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {campaign.completions.toLocaleString()} casts
                    </span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <Coins className="w-3 h-3" />
                      {tokensClaimedEstimate.toLocaleString()} claimed
                    </span>
                  </div>
                </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Locked campaigns hint */}
          {!einkCaseAttached && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <button
                className="w-full rounded-xl border-2 border-dashed border-gray-200 py-4 px-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-gray-300 transition-colors"
                onClick={() => setShowEinkPrompt(true)}
              >
                <Shield className="w-4 h-4" />
                <span>+{campaigns.length - 2} more campaigns — attach E-Ink case to unlock</span>
              </button>
            </motion.div>
          )}
          </div>
        )}
      </div>

      <EinkCasePrompt open={showEinkPrompt} onClose={() => setShowEinkPrompt(false)} />
    </motion.div>
  );
}