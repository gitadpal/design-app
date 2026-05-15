import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Skeleton } from './ui/skeleton';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from './ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Coins,
  ChevronRight,
  QrCode,
  X,
  Wallet,
  TrendingUp,
  Check,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { usePrivy, useWallets } from '../auth';
import { PullToRefresh } from './PullToRefresh';

interface AssetsProps {
  view: 'main' | 'all-assets' | 'all-activity';
  setView: (view: 'main' | 'all-assets' | 'all-activity') => void;
}

export function Assets({ view, setView }: AssetsProps) {
  const { login, logout } = usePrivy();
  const { activeWallet } = useWallets();
  const walletConnected = !!activeWallet;
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSelectingToken, setIsSelectingToken] = useState(false);
  const [selectedToken, setSelectedToken] = useState('PIXP');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  
  const tokenBalance = 1247.50;
  const walletAddress = activeWallet?.address ?? '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2';
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';
  
  const tokens = [
    { 
      symbol: 'PIXP', 
      name: 'PixPal Token', 
      balance: 1247.50, 
      value: 1247.50, 
      change: 5.2,
      color: 'text-white/80',
      category: 'crypto',
      lastChanged: 1
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      balance: 0.45, 
      value: 892.30, 
      change: -2.1,
      color: 'text-[#BC13FE]',
      category: 'crypto',
      lastChanged: 3
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin', 
      balance: 150.00, 
      value: 150.00, 
      change: 0.0,
      color: 'text-[#00FFC2]',
      category: 'crypto',
      lastChanged: 7
    },
    { 
      symbol: 'BAYC #4321', 
      name: 'Bored Ape Yacht Club', 
      balance: 1, 
      value: 45000.00, 
      change: 3.5,
      color: 'text-white/80',
      category: 'nft',
      lastChanged: 2,
      image: 'https://images.unsplash.com/photo-1583578568005-60c0cd38f066?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3JlZCUyMGFwZSUyMG5mdCUyMGFydHxlbnwxfHx8fDE3NjE2MTk4NTl8MA&ixlib=rb-4.1.0&q=80&w=400'
    },
    { 
      symbol: 'Azuki #892', 
      name: 'Azuki Collection', 
      balance: 1, 
      value: 12500.00, 
      change: -1.2,
      color: 'text-white/55',
      category: 'nft',
      lastChanged: 5,
      image: 'https://images.unsplash.com/photo-1743310855295-8c0368a4ab22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGNoYXJhY3RlciUyMG5mdHxlbnwxfHx8fDE3NjE2MTk4NjB8MA&ixlib=rb-4.1.0&q=80&w=400'
    },
    { 
      symbol: 'AAVE', 
      name: 'Aave Protocol', 
      balance: 25.50, 
      value: 2125.00, 
      change: 4.8,
      color: 'text-[#BC13FE]',
      category: 'defi',
      lastChanged: 4
    },
    {
      symbol: 'ARB',
      name: 'Arbitrum',
      balance: 420.00,
      value: 1386.00,
      change: 3.1,
      color: 'text-[#00FFC2]',
      category: 'defi',
      lastChanged: 6
    },
  ];

  const allActivity = [
    {
      id: 1,
      type: 'earn',
      title: 'Binance Launchpool — SXT',
      subtitle: 'Campaign completed',
      amount: '+110',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      type: 'earn',
      title: 'Bonus Task Reward',
      subtitle: 'Video ad watched',
      amount: '+0.5',
      timestamp: '5 hours ago',
    },
    {
      id: 3,
      type: 'send',
      title: 'Sent to',
      subtitle: '0x8a3f...2c1d',
      amount: '-50',
      timestamp: '1 day ago',
    },
    {
      id: 4,
      type: 'earn',
      title: 'Base — Onchain Summer 2026',
      subtitle: 'Campaign completed',
      amount: '+95',
      timestamp: '2 days ago',
    },
    {
      id: 5,
      type: 'earn',
      title: 'Arbitrum — The Scaling Layer',
      subtitle: 'Campaign completed',
      amount: '+90',
      timestamp: '3 days ago',
    },
    {
      id: 6,
      type: 'receive',
      title: 'Received from',
      subtitle: '0x5d2a...8f3b',
      amount: '+25',
      timestamp: '4 days ago',
    },
    {
      id: 7,
      type: 'earn',
      title: 'Ethena — The Internet Bond',
      subtitle: 'Campaign completed',
      amount: '+100',
      timestamp: '5 days ago',
    },
    {
      id: 8,
      type: 'earn',
      title: 'Bonus Survey Completed',
      subtitle: 'Weekly survey',
      amount: '+1',
      timestamp: '6 days ago',
    },
    {
      id: 9,
      type: 'send',
      title: 'Sent to',
      subtitle: '0x9c4e...1a2b',
      amount: '-100',
      timestamp: '1 week ago',
    },
    {
      id: 10,
      type: 'earn',
      title: 'Daily Login Bonus',
      subtitle: '7-day streak',
      amount: '+5',
      timestamp: '1 week ago',
    },
  ];

  const recentActivity = allActivity.slice(0, 4);

  const totalBalance = tokens.reduce((sum, token) => sum + token.value, 0);

  // Get top 4 most recently changed tokens for main view
  const recentTokens = [...tokens].sort((a, b) => a.lastChanged - b.lastChanged).slice(0, 4);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success('Wallet address copied!');
  };

  const handleSendClick = () => {
    setShowSendConfirm(true);
  };

  const handleSendConfirm = () => {
    const token = tokens.find(t => t.symbol === selectedToken);
    toast.success(`Sent ${amount} ${selectedToken} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
    setShowSendConfirm(false);
    setIsSendOpen(false);
    setRecipient('');
    setAmount('');
    setSelectedToken('PIXP');
    setIsSelectingToken(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success('Portfolio updated!');
  };

  // Empty state component
  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/40" />
      </div>
      <h3 className="mb-2 text-white">{title}</h3>
      <p className="text-sm text-white/55 max-w-sm">{description}</p>
    </motion.div>
  );

  // Loading skeleton for main view
  const LoadingSkeleton = () => (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Card className="mb-6">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3 mx-auto" />
          <Skeleton className="h-10 w-40 mb-4 mx-auto" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );



  // All Assets View
  if (view === 'all-assets') {
    const cryptoTokens = tokens.filter(t => t.category === 'crypto');
    const nftTokens = tokens.filter(t => t.category === 'nft');
    const defiTokens = tokens.filter(t => t.category === 'defi');

    const renderCryptoDefiList = (tokenList: typeof tokens) => (
      <div className="space-y-2">
        {tokenList.map((token, index) => (
          <motion.div
            key={token.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${token.color} bg-opacity-10 flex items-center justify-center`}>
                    <span className={`text-lg ${token.color}`}>{token.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="mb-1">{token.symbol}</div>
                    <div className="text-sm text-white/55">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1">{token.balance.toFixed(2)}</div>
                  <div className="text-sm text-white/55 mb-1">${token.value.toLocaleString()}</div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${token.change >= 0 ? 'text-[#00FFC2]' : token.change < 0 ? 'text-white/55' : 'text-white/55'}`}
                  >
                    {token.change > 0 ? '+' : ''}{token.change}%
                  </Badge>
                </div>
              </div>
            </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );

    const renderNFTGrid = (tokenList: typeof tokens) => (
      <div className="grid grid-cols-2 gap-3">
        {tokenList.map((token, index) => (
          <motion.div
            key={token.symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-white/10 relative">
                {token.image && (
                  <img 
                    src={token.image} 
                    alt={token.symbol}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <div className="mb-1 text-sm">{token.symbol}</div>
                <div className="text-xs text-white/55 mb-2">{token.name}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">${token.value.toLocaleString()}</div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${token.change >= 0 ? 'text-[#00FFC2]' : token.change < 0 ? 'text-white/55' : 'text-white/55'}`}
                  >
                    {token.change > 0 ? '+' : ''}{token.change}%
                  </Badge>
                </div>
              </div>
            </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );

    return (
      <motion.div 
        className="min-h-screen"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-[#1A1A1A] border-b border-[#E0E0E0] sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setView('main')}
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#BC13FE' }}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">All Assets</h2>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="px-4 py-4">
          <Card className="mb-4 border-[#E0E0E0]">
            <CardContent className="p-6 text-center">
              <div className="section-header mb-2">Total Portfolio Value</div>
              <div className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mb-2">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <Badge
                variant="secondary"
                className="border-0"
                style={{ background: 'rgba(0,255,194,0.12)', color: '#0a8a6b' }}
              >
                +5.2% this week
              </Badge>
            </CardContent>
          </Card>

          <Tabs defaultValue="crypto" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="nft">NFTs</TabsTrigger>
              <TabsTrigger value="defi">DeFi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="crypto">
              {renderCryptoDefiList(cryptoTokens)}
            </TabsContent>
            
            <TabsContent value="nft">
              {renderNFTGrid(nftTokens)}
            </TabsContent>
            
            <TabsContent value="defi">
              {renderCryptoDefiList(defiTokens)}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    );
  }

  // All Activity View
  if (view === 'all-activity') {
    return (
      <motion.div 
        className="min-h-screen"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-[#1A1A1A] border-b border-[#E0E0E0] sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setView('main')}
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#BC13FE' }}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Activity History</h2>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="space-y-2">
            {allActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'earn' 
                          ? 'bg-green-100 text-[#00FFC2]' 
                          : activity.type === 'send'
                          ? 'bg-blue-100 text-white/80'
                          : 'bg-purple-100 text-[#BC13FE]'
                      }`}>
                        {activity.type === 'earn' ? (
                          <Coins className="w-5 h-5" />
                        ) : activity.type === 'send' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm mb-0.5">{activity.title}</div>
                        <div className="text-xs text-white/55">{activity.subtitle}</div>
                        <div className="text-xs text-white/40 mt-0.5">{activity.timestamp}</div>
                      </div>
                    </div>
                    <div className={`text-right ${
                      activity.type === 'earn' || activity.type === 'receive' ? 'text-[#00FFC2]' : 'text-white'
                    }`}>
                      <div>{activity.amount}</div>
                      <div className="text-xs text-white/55">PIXP</div>
                    </div>
                  </div>
                </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Show loading skeleton
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Wallet not connected state
  if (!walletConnected) {
    return (
      <div
        className="flex flex-col items-center justify-center px-6 bg-[#1A1A1A]"
        style={{ minHeight: 'max(100vh, 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm text-center space-y-6"
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(188,19,254,0.12) 0%, rgba(0,255,194,0.12) 100%)',
              border: '1.5px solid rgba(0,255,194,0.3)',
            }}
          >
            <Wallet className="w-10 h-10" style={{ color: '#BC13FE' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-[#1A1A1A]">No Wallet Connected</h2>
            <p className="text-sm text-white/55 leading-relaxed">
              Connect your wallet to view balances, send tokens, and receive campaign rewards.
            </p>
          </div>

          <button
            className="w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center transition-all active:scale-[0.98] shadow-md hover:shadow-lg text-white bg-[#1A1A1A] hover:bg-[#2C2C2C]"
            onClick={() => login()}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </button>

          <p className="text-xs text-white/40">
            Your embedded AdPal wallet — no seed phrase required for setup.
          </p>
        </motion.div>
      </div>
    );
  }

  // Main View
  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-6 text-white min-h-screen"
      >
        {/* Wallet Balance Header */}
        <div className="px-4 pt-5 pb-4 mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="section-header" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Balance</div>
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="p-1.5 -mr-1.5 hover:bg-white/5 rounded-full transition-colors"
              aria-label="Disconnect wallet"
            >
              <LogOut className="w-4 h-4 text-white/50" strokeWidth={1.75} />
            </button>
          </div>
          <div className="text-4xl font-semibold tracking-tight text-white mb-3 tabular-nums">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <button
            onClick={handleCopyAddress}
            className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white transition-colors mb-5"
          >
            <span className="font-mono">{shortAddress}</span>
            <Copy className="w-3 h-3" strokeWidth={1.75} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="w-full h-11 rounded-xl transition-all active:scale-95 flex items-center justify-center text-sm font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25"
              onClick={() => setIsReceiveOpen(true)}
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" strokeWidth={1.75} />
              Receive
            </button>
            <button
              className="relative w-full h-11 rounded-xl overflow-hidden transition-all active:scale-95 flex items-center justify-center text-sm font-semibold text-[#0A0A0A] hover:shadow-lg"
              style={{ background: 'linear-gradient(90deg, #00FFC2 0%, #BC13FE 100%)' }}
              onClick={() => setIsSendOpen(true)}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" strokeWidth={2} />
              Send
            </button>
          </div>
        </div>

      {/* Token List */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold tracking-tight text-white">Assets</h3>
          <button
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: '#BC13FE' }}
            onClick={() => setView('all-assets')}
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        {recentTokens.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No Assets Yet"
            description="Start earning tokens by displaying ads on your e-ink screen"
          />
        ) : (
          <div className="space-y-2">
            {recentTokens.map((token, index) => (
              <motion.div
                key={token.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-[#1A1A1A] border-white/10 hover:border-white/25 hover:bg-[#1F1F1F] transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {token.category === 'nft' && token.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                            <span>{token.symbol.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <div className="mb-0.5 text-white">{token.symbol}</div>
                          <div className="text-sm text-white/50">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-0.5 text-white tabular-nums">{token.category === 'nft' ? token.balance : token.balance.toFixed(2)}</div>
                        <div className="text-sm text-white/55 tabular-nums">
                          {token.change > 0 ? '+' : ''}{token.change}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold tracking-tight text-white">Recent Activity</h3>
          <button
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: '#BC13FE' }}
            onClick={() => setView('all-activity')}
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyState 
            icon={TrendingUp}
            title="No Activity Yet"
            description="Your transaction history will appear here once you start earning or sending tokens"
          />
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-[#1A1A1A] border-white/10 hover:border-white/25 hover:bg-[#1F1F1F] transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={
                            activity.type === 'earn'
                              ? { background: 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)', color: '#0A0A0A' }
                              : { background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }
                          }
                        >
                          {activity.type === 'earn' ? (
                            <Coins className="w-5 h-5" strokeWidth={1.75} />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" strokeWidth={1.75} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm mb-0.5 text-white">{activity.title}</div>
                          <div className="text-xs text-white/50">{activity.subtitle}</div>
                          <div className="text-xs text-white/35 mt-0.5">{activity.timestamp}</div>
                        </div>
                      </div>
                      <div className="text-right text-white">
                        <div className="tracking-tight tabular-nums">{activity.amount}</div>
                        <div className="text-xs text-white/50">PIXP</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </motion.div>
      </PullToRefresh>

      {/* Receive Drawer */}
      <Drawer open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Receive PIXP</DrawerTitle>
            <DrawerDescription>Scan QR code or share your address</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <div className="text-center mb-6">
              <div className="bg-[#1A1A1A] border-4 border-white/10 rounded-2xl p-6 inline-block mb-4">
                <QrCode className="w-32 h-32 text-white/40" />
              </div>
              <p className="text-sm text-white/70">Scan QR code to receive PIXP tokens</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-white/70 mb-1.5 block">Your Wallet Address</Label>
                <div className="flex gap-2">
                  <Input 
                    value={walletAddress}
                    readOnly
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-white/70">
                Only send PIXP tokens to this address. Sending other tokens may result in permanent loss.
              </p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Send Drawer */}
      <Drawer open={isSendOpen} onOpenChange={(open) => {
        setIsSendOpen(open);
        if (!open) {
          setIsSelectingToken(false);
          setSelectedToken('PIXP');
          setRecipient('');
          setAmount('');
        }
      }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Send Tokens</DrawerTitle>
            <DrawerDescription>Transfer tokens to another wallet</DrawerDescription>
          </DrawerHeader>
          
          {!isSelectingToken ? (
            <>
              <div className="px-4">
                {/* Token Selector */}
                <div className="mb-4">
                  <Label className="mb-1.5 block">Select Token</Label>
                  <button
                    onClick={() => setIsSelectingToken(true)}
                    className="w-full p-3 border rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const token = tokens.find(t => t.symbol === selectedToken);
                        if (!token) return null;
                        
                        return (
                          <>
                            {token.category === 'nft' && token.image ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-full ${token.color} bg-opacity-10 flex items-center justify-center`}>
                                <span className={`${token.color}`}>{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <div className="text-left">
                              <div className="mb-0.5">{token.symbol}</div>
                              <div className="text-sm text-white/55">{token.name}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                {/* Balance Card */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xs text-white/70 mb-1">Available Balance</div>
                      {(() => {
                        const token = tokens.find(t => t.symbol === selectedToken);
                        if (!token) return null;
                        
                        return (
                          <>
                            <div className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
                              {token.category === 'nft' ? token.balance : token.balance.toFixed(2)} {token.symbol}
                            </div>
                            <div className="text-xs text-white/55 mt-0.5">≈ ${token.value.toFixed(2)}</div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Recipient Address</Label>
                    <Input 
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Amount</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          const token = tokens.find(t => t.symbol === selectedToken);
                          if (token) {
                            setAmount(token.balance.toString());
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold hover:opacity-80 transition-opacity"
                        style={{ color: '#BC13FE' }}
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-xs text-white/55 mt-1">
                      Fee: ~0.001 {selectedToken}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-white/70">
                    Double-check the recipient address. Transactions cannot be reversed.
                  </p>
                </div>
              </div>
              <DrawerFooter>
                <Button 
                  className="w-full h-11"
                  disabled={!recipient || !amount || parseFloat(amount) <= 0}
                  onClick={handleSendClick}
                >
                  Send {amount || '0'} {selectedToken}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : (
            <>
              {/* Token Selection View */}
              <div className="px-4 pb-4">
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => setIsSelectingToken(false)}
                    className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#BC13FE' }}
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    <span>Back</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {tokens.map((token, index) => (
                    <motion.div
                      key={token.symbol}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => {
                          setSelectedToken(token.symbol);
                          setIsSelectingToken(false);
                          setAmount('');
                        }}
                        className="w-full p-3 border rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {token.category === 'nft' && token.image ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className={`w-12 h-12 rounded-full ${token.color} bg-opacity-10 flex items-center justify-center`}>
                                <span className={`${token.color}`}>{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <div className="text-left">
                              <div className="mb-0.5">{token.symbol}</div>
                              <div className="text-sm text-white/55">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="mb-0.5">{token.category === 'nft' ? token.balance : token.balance.toFixed(2)}</div>
                              <div className="text-sm text-white/55">${token.value.toFixed(2)}</div>
                            </div>
                            {selectedToken === token.symbol && (
                              <Check className="w-5 h-5" style={{ color: '#BC13FE' }} />
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send <span className="text-white">{amount} {selectedToken}</span> to:
              <div className="mt-2 p-2 bg-white/10 rounded text-xs break-all text-white">
                {recipient}
              </div>
              <div className="mt-3 text-xs text-white/70">
                This transaction cannot be reversed. Please verify the recipient address is correct.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendConfirm}>
              Confirm Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnect Wallet Confirmation */}
      <AlertDialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to view balances or join campaigns. Your tokens stay safe — nothing is transferred.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                setShowDisconnectConfirm(false);
                toast.success('Wallet disconnected');
              }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
