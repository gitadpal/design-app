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
  RefreshCw,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AssetsProps {
  walletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;
  view: 'main' | 'all-assets' | 'all-activity';
  setView: (view: 'main' | 'all-assets' | 'all-activity') => void;
}

export function Assets({ walletConnected, setWalletConnected, view, setView }: AssetsProps) {
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
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2';
  const shortAddress = '0x742d...4B5C';
  
  const tokens = [
    { 
      symbol: 'PIXP', 
      name: 'PixPal Token', 
      balance: 1247.50, 
      value: 1247.50, 
      change: 5.2,
      color: 'text-blue-600',
      category: 'crypto',
      lastChanged: 1
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      balance: 0.45, 
      value: 892.30, 
      change: -2.1,
      color: 'text-purple-600',
      category: 'crypto',
      lastChanged: 3
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin', 
      balance: 150.00, 
      value: 150.00, 
      change: 0.0,
      color: 'text-green-600',
      category: 'crypto',
      lastChanged: 7
    },
    { 
      symbol: 'BAYC #4321', 
      name: 'Bored Ape Yacht Club', 
      balance: 1, 
      value: 45000.00, 
      change: 3.5,
      color: 'text-orange-600',
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
      color: 'text-red-600',
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
      color: 'text-pink-600',
      category: 'defi',
      lastChanged: 4
    },
    {
      symbol: 'ARB',
      name: 'Arbitrum',
      balance: 420.00,
      value: 1386.00,
      change: 3.1,
      color: 'text-cyan-600',
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
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
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
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1">{token.balance.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 mb-1">${token.value.toLocaleString()}</div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${token.change >= 0 ? 'text-green-600' : token.change < 0 ? 'text-red-600' : 'text-gray-500'}`}
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
              <div className="aspect-square bg-gray-200 relative">
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
                <div className="text-xs text-gray-500 mb-2">{token.name}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">${token.value.toLocaleString()}</div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${token.change >= 0 ? 'text-green-600' : token.change < 0 ? 'text-red-600' : 'text-gray-500'}`}
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
        className="min-h-screen bg-gray-50"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="flex items-center gap-2 text-blue-600"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-lg">All Assets</h2>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="px-4 py-4">
          <Card className="mb-4">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-1">Total Portfolio Value</div>
              <div className="text-3xl mb-2">${totalBalance.toFixed(2)}</div>
              <Badge variant="secondary" className="text-green-600">
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
        className="min-h-screen bg-gray-50"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setView('main')}
              className="flex items-center gap-2 text-blue-600"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back</span>
            </button>
            <h2 className="text-lg">Activity History</h2>
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
                          ? 'bg-green-100 text-green-600' 
                          : activity.type === 'send'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
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
                        <div className="text-xs text-gray-500">{activity.subtitle}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{activity.timestamp}</div>
                      </div>
                    </div>
                    <div className={`text-right ${
                      activity.type === 'earn' || activity.type === 'receive' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      <div>{activity.amount}</div>
                      <div className="text-xs text-gray-500">PIXP</div>
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 bg-gradient-to-b from-gray-50 to-white">
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
            <h2 className="text-xl font-semibold text-gray-900">No Wallet Connected</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Connect your wallet to view balances, send tokens, and receive campaign rewards.
            </p>
          </div>

          <Button
            className="w-full h-12 text-base gradient-earn text-white shadow-lg"
            onClick={() => setWalletConnected(true)}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>

          <p className="text-xs text-gray-400">
            Your embedded AdPal wallet — no seed phrase required for setup.
          </p>
        </motion.div>
      </div>
    );
  }

  // Main View
  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-6"
      >
        {/* Wallet Balance Header */}
        <div className="gradient-wallet text-white p-6 mb-4 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm opacity-90">Total Balance</div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-4xl mb-4">${totalBalance.toFixed(2)}</div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-90">Wallet Address</div>
            <button 
              onClick={handleCopyAddress}
              className="flex items-center gap-1 text-sm opacity-90 hover:opacity-100"
            >
              <span>{shortAddress}</span>
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              className="w-full h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              onClick={() => setIsReceiveOpen(true)}
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Receive
            </button>
            <button 
              className="w-full h-11 bg-white text-purple-600 hover:shadow-xl rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              onClick={() => setIsSendOpen(true)}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Send
            </button>
          </div>
        </div>

      {/* Token List */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3>Assets</h3>
          <button 
            className="flex items-center gap-1 text-sm text-blue-600"
            onClick={() => setView('all-assets')}
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
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
                <Card className="hover:shadow-lg transition-all hover:scale-[1.02] border-l-4 border-l-cyan-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {token.category === 'nft' && token.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${token.color} bg-opacity-10 flex items-center justify-center`}>
                            <span className={`${token.color}`}>{token.symbol.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <div className="mb-0.5">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-0.5">{token.category === 'nft' ? token.balance : token.balance.toFixed(2)}</div>
                        <div className={`text-sm ${token.change >= 0 ? 'text-green-600' : token.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
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
          <h3>Recent Activity</h3>
          <button 
            className="flex items-center gap-1 text-sm text-blue-600"
            onClick={() => setView('all-activity')}
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
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
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'earn' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {activity.type === 'earn' ? (
                            <Coins className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm mb-0.5">{activity.title}</div>
                          <div className="text-xs text-gray-500">{activity.subtitle}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{activity.timestamp}</div>
                        </div>
                      </div>
                      <div className={`text-right ${
                        activity.type === 'earn' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        <div>{activity.amount}</div>
                        <div className="text-xs text-gray-500">PIXP</div>
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

      {/* Receive Drawer */}
      <Drawer open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Receive PIXP</DrawerTitle>
            <DrawerDescription>Scan QR code or share your address</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <div className="text-center mb-6">
              <div className="bg-white border-4 border-gray-200 rounded-2xl p-6 inline-block mb-4">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Scan QR code to receive PIXP tokens</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Your Wallet Address</Label>
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
              <p className="text-xs text-gray-600">
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
                    className="w-full p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const token = tokens.find(t => t.symbol === selectedToken);
                        if (!token) return null;
                        
                        return (
                          <>
                            {token.category === 'nft' && token.image ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-full ${token.color} bg-opacity-10 flex items-center justify-center`}>
                                <span className={`${token.color}`}>{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <div className="text-left">
                              <div className="mb-0.5">{token.symbol}</div>
                              <div className="text-sm text-gray-500">{token.name}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Balance Card */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Available Balance</div>
                      {(() => {
                        const token = tokens.find(t => t.symbol === selectedToken);
                        if (!token) return null;
                        
                        return (
                          <>
                            <div className="text-2xl text-blue-600">
                              {token.category === 'nft' ? token.balance : token.balance.toFixed(2)} {token.symbol}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">≈ ${token.value.toFixed(2)}</div>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Fee: ~0.001 {selectedToken}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-gray-600">
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
                    className="flex items-center gap-2 text-blue-600"
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
                        className="w-full p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {token.category === 'nft' && token.image ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className={`w-12 h-12 rounded-full ${token.color} bg-opacity-10 flex items-center justify-center`}>
                                <span className={`${token.color}`}>{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <div className="text-left">
                              <div className="mb-0.5">{token.symbol}</div>
                              <div className="text-sm text-gray-500">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="mb-0.5">{token.category === 'nft' ? token.balance : token.balance.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">${token.value.toFixed(2)}</div>
                            </div>
                            {selectedToken === token.symbol && (
                              <Check className="w-5 h-5 text-blue-600" />
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
              You are about to send <span className="text-gray-900">{amount} {selectedToken}</span> to:
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all text-gray-900">
                {recipient}
              </div>
              <div className="mt-3 text-xs text-gray-600">
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
    </>
  );
}
