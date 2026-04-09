import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Progress } from './ui/progress';
import { 
  Cast, 
  Camera, 
  Upload,
  Clock,
  Coins,
  AlertCircle,
  Heart,
  Sparkles,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { EinkCasePrompt } from './EinkCasePrompt';

interface CastProps {
  activeCommitment: any;
  currentDisplay: any;
  setCurrentDisplay: (display: any) => void;
  einkCaseAttached: boolean;
}

const recentImages = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1606886749589-e438ea24bc70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    title: 'Cartoon Sunset',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1751601454754-68dce3c26795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    title: 'Red Orange Gradient',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1704123298592-6b777a7d29af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    title: 'Warm Colors',
  },
];

const galleryCollections = [
  {
    id: 'featured',
    title: 'Featured',
    icon: <Sparkles className="w-4 h-4" />,
    images: [
      { id: '101', url: 'https://images.unsplash.com/photo-1606886749589-e438ea24bc70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Cartoon Sunset' },
      { id: '102', url: 'https://images.unsplash.com/photo-1569385158543-413d79b3e7fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Red Orange Illustration' },
      { id: '103', url: 'https://images.unsplash.com/photo-1704123298592-6b777a7d29af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Warm Art' },
      { id: '104', url: 'https://images.unsplash.com/photo-1711436036606-467ebcfa28c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Sunset Abstract' },
    ]
  },
  {
    id: 'trending',
    title: 'Trending',
    icon: <TrendingUp className="w-4 h-4" />,
    images: [
      { id: '201', url: 'https://images.unsplash.com/photo-1751601454754-68dce3c26795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Orange Gradient' },
      { id: '202', url: 'https://images.unsplash.com/photo-1742823444931-ae394961571f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Fire Colors' },
      { id: '203', url: 'https://images.unsplash.com/photo-1636879306731-ff439cb590a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Autumn Vibrant' },
      { id: '204', url: 'https://images.unsplash.com/photo-1659872685440-940814008b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Red Digital Art' },
    ]
  },
  {
    id: 'nature',
    title: 'Warm Tones',
    icon: <ImageIcon className="w-4 h-4" />,
    images: [
      { id: '301', url: 'https://images.unsplash.com/photo-1502622796232-e88458466c33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Orange Modern' },
      { id: '302', url: 'https://images.unsplash.com/photo-1711062717289-c9963379124e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Red Abstract' },
      { id: '303', url: 'https://images.unsplash.com/photo-1536167038724-17be8c5e6876?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Coral Pink' },
      { id: '304', url: 'https://images.unsplash.com/photo-1606886749589-e438ea24bc70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', title: 'Sunset Vibes' },
    ]
  },
];

export function ImageCasting({ activeCommitment, currentDisplay, setCurrentDisplay, einkCaseAttached }: CastProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [showEinkPrompt, setShowEinkPrompt] = useState(false);

  useEffect(() => {
    if (activeCommitment) {
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
  }, [activeCommitment]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleCastImage = (image: any) => {
    if (!einkCaseAttached) {
      setShowEinkPrompt(true);
      return;
    }
    if (activeCommitment) {
      toast.error('Cannot switch - active campaign in progress');
      return;
    }
    setCurrentDisplay({ type: 'image', data: image });
    toast.success('Image cast to display!');
  };

  const handleUploadPhoto = () => {
    if (!einkCaseAttached) {
      setShowEinkPrompt(true);
      return;
    }
    if (activeCommitment) {
      toast.error('Cannot switch - active campaign in progress');
      return;
    }
    toast.info('Photo upload feature');
  };

  const toggleSaveImage = (imageId: string) => {
    if (savedImages.includes(imageId)) {
      setSavedImages(savedImages.filter(id => id !== imageId));
      toast.success('Removed from favorites');
    } else {
      setSavedImages([...savedImages, imageId]);
      toast.success('Added to favorites');
    }
  };

  return (
    <div className="pb-6">
      {/* Active Commitment Banner */}
      {activeCommitment && (
        <div className="px-4 pt-4 mb-4">
          <Card className="gradient-earn text-white shadow-lg border-0">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90 mb-1">Active Campaign</div>
                  <div className="text-lg">{activeCommitment.title}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Coins className="w-5 h-5" />
                    <span className="text-lg">{activeCommitment.reward}</span>
                  </div>
                  <div className="text-xs opacity-75">tokens</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="opacity-90">Time Remaining</span>
                  <span>{formatTime(timeRemaining)}</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/20" />
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <AlertCircle className="w-4 h-4" />
                <span>Display locked until campaign completes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 mt-4 mb-6">
        <h3 className="mb-3">Quick Cast</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`h-24 flex flex-col items-center justify-center gap-2 rounded-xl transition-all ${
              activeCommitment || !einkCaseAttached
                ? 'bg-gray-100 text-gray-400 cursor-pointer'
                : 'gradient-cast text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
            onClick={handleUploadPhoto}
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm">Take Photo</span>
          </button>
          <button
            className={`h-24 flex flex-col items-center justify-center gap-2 rounded-xl transition-all ${
              activeCommitment || !einkCaseAttached
                ? 'bg-gray-100 text-gray-400 cursor-pointer'
                : 'gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
            onClick={handleUploadPhoto}
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">Upload Image</span>
          </button>
        </div>
      </div>

      {/* Recent Casting - Smaller Thumbnails */}
      <div className="px-4 mb-6">
        <h3 className="mb-3">Recent Casting</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {recentImages.map((image) => (
            <div
              key={image.id}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                activeCommitment || !einkCaseAttached
                  ? 'opacity-50 border-gray-200'
                  : currentDisplay?.data?.id === image.id
                  ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              onClick={() => handleCastImage(image)}
            >
              <ImageWithFallback
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Collections */}
      <div className="px-4 space-y-6">
        {/* Collections */}
        {galleryCollections.map((collection, collectionIndex) => (
          <div key={collection.id}>
            <div className={`flex items-center gap-2 mb-3 ${
              collectionIndex === 0 ? 'text-gradient-primary' : 
              collectionIndex === 1 ? 'text-gradient-success' : 
              'text-purple-600'
            }`}>
              {collection.icon}
              <h4 className="text-sm">{collection.title}</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {collection.images.map((image) => (
                <Card
                  key={image.id}
                  className={`overflow-hidden cursor-pointer transition-all border-2 ${
                    activeCommitment || !einkCaseAttached
                      ? 'opacity-50 border-gray-200'
                      : 'hover:shadow-xl hover:scale-105 border-transparent hover:border-purple-300'
                  }`}
                  onClick={() => handleCastImage(image)}
                >
                  <div className="relative aspect-[5/7]">
                    <ImageWithFallback
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {currentDisplay?.data?.id === image.id && (
                      <div className="absolute inset-0 border-2 border-blue-600" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveImage(image.id);
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md"
                      disabled={!!activeCommitment}
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          savedImages.includes(image.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <div className="text-sm text-white truncate">{image.title}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <EinkCasePrompt open={showEinkPrompt} onClose={() => setShowEinkPrompt(false)} />
    </div>
  );
}
