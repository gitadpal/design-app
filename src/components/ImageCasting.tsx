import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Frame,
  ChevronLeft,
  Nfc,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { FaceIdPrompt } from './FaceIdPrompt';
import { EinkCasePrompt } from './EinkCasePrompt';

interface CastProps {
  activeCommitment: any;
  currentDisplay: any;
  setCurrentDisplay: (display: any) => void;
  einkCaseAttached: boolean;
  onViewActiveStatus?: () => void;
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

export function ImageCasting({ activeCommitment, currentDisplay, setCurrentDisplay, einkCaseAttached, onViewActiveStatus }: CastProps) {
  const [showFaceId, setShowFaceId] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [showEinkPrompt, setShowEinkPrompt] = useState(false);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const [centerImageUrl, setCenterImageUrl] = useState<string>(
    galleryCollections[0]?.images[0]?.url ?? ''
  );
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Track which gallery image is centered in the viewport — drives the fluid backdrop.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const scrollRoot = (node.closest('main') as Element | null) ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const url = (entry.target as HTMLElement).dataset.galleryImage;
            if (url) setCenterImageUrl(url);
          }
        }
      },
      { root: scrollRoot, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    const targets = node.querySelectorAll<HTMLElement>('[data-gallery-image]');
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
    setPreviewImage(image);
  };

  const handleConfirmCast = () => {
    if (!previewImage) return;
    setShowFaceId(true);
  };

  const handleFaceIdConfirm = async () => {
    if (!previewImage) {
      setShowFaceId(false);
      return;
    }
    setShowFaceId(false);
    setIsNfcWriting(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsNfcWriting(false);
    setCurrentDisplay({ type: 'image', data: previewImage });
    toast.success('Image cast to display!');
    setPreviewImage(null);
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

  return (
    <div ref={rootRef} className="relative pb-28 min-h-screen">
      {/* Fluid blurred backdrop — image driven by whichever gallery card is centered in the viewport */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: "var(--backdrop-base)" }}>
        <AnimatePresence>
          <motion.div
            key={centerImageUrl}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1.25 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <ImageWithFallback
              src={centerImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(48px) saturate(1.5) brightness(var(--backdrop-brightness))' }}
            />
          </motion.div>
        </AnimatePresence>
        {/* Vertical vignette for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'var(--backdrop-vignette)',
          }}
        />
        {/* Subtle grain — brand "Matte Obsidian" texture */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 'var(--backdrop-grain-opacity)',
            mixBlendMode: 'var(--backdrop-grain-blend)' as any,
            background:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Foreground content sits above the backdrop (DOM order — no z so the fixed bottom nav can still paint on top) */}
      <div className="relative">
      {/* Active Commitment Banner */}
      {activeCommitment && (
        <div className="px-4 pt-4 mb-4">
          <div className="prism-ring">
          <Card
            className={`relative overflow-hidden bg-card text-foreground border-0 transition-all ${
              onViewActiveStatus ? 'cursor-pointer active:scale-[0.99]' : ''
            }`}
            onClick={onViewActiveStatus}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-soft-3 mb-1">Active Campaign</div>
                  <div className="text-lg">{activeCommitment.title}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Coins className="w-5 h-5" style={{ color: '#00FFC2' }} strokeWidth={1.75} />
                    <span className="text-lg tracking-tight">{activeCommitment.reward}</span>
                  </div>
                  <div className="text-xs text-soft-3">tokens</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-soft-2">Time Remaining</span>
                  <span className="tabular-nums">{formatTime(timeRemaining)}</span>
                </div>
                <div className="relative h-1.5 w-full rounded-full bg-soft-1 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #00FFC2 0%, #BC13FE 100%)',
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-soft-2">
                <AlertCircle className="w-4 h-4" strokeWidth={1.75} />
                <span>Display locked until campaign completes</span>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 mt-4 mb-6">
        <h3 className="mb-3 text-foreground font-semibold tracking-tight">Quick Cast</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`h-24 flex flex-col items-center justify-center gap-2 rounded-xl transition-all backdrop-blur-sm ${
              activeCommitment || !einkCaseAttached
                ? 'bg-glass-1 text-soft-4 border border-glass cursor-pointer opacity-60'
                : 'bg-glass-1 border border-glass text-foreground shadow-lg hover:bg-glass-2 active:scale-95'
            }`}
            onClick={handleUploadPhoto}
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm">Take Photo</span>
          </button>
          <button
            className={`h-24 flex flex-col items-center justify-center gap-2 rounded-xl transition-all backdrop-blur-sm ${
              activeCommitment || !einkCaseAttached
                ? 'bg-glass-1 text-soft-4 border border-glass cursor-pointer opacity-60'
                : 'bg-glass-1 border border-glass text-foreground shadow-lg hover:bg-glass-2 active:scale-95'
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
        <h3 className="mb-3 text-foreground font-semibold tracking-tight">Recent Casting</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {recentImages.map((image) => (
            <div
              key={image.id}
              data-gallery-image={image.url}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer border transition-all ${
                activeCommitment || !einkCaseAttached
                  ? 'opacity-50 border-soft-2'
                  : currentDisplay?.data?.id === image.id
                  ? 'border-[#00FFC2] ring-2 ring-[#00FFC2]/40'
                  : 'border-soft-1 hover:border-white/50'
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
        {galleryCollections.map((collection) => (
          <div key={collection.id}>
            <div className="flex items-center gap-2 mb-3 text-soft-2">
              {collection.icon}
              <h4 className="text-sm font-semibold tracking-wide uppercase">{collection.title}</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {collection.images.map((image) => (
                <Card
                  key={image.id}
                  data-gallery-image={image.url}
                  className={`overflow-hidden cursor-pointer transition-all bg-transparent border ${
                    activeCommitment || !einkCaseAttached
                      ? 'opacity-50 border-soft-3'
                      : 'border-soft-2 hover:border-white/40 hover:shadow-lg'
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
                      <div className="absolute inset-0 border-2 border-[#00FFC2]" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-sm text-foreground truncate font-medium">{image.title}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>

      <EinkCasePrompt open={showEinkPrompt} onClose={() => setShowEinkPrompt(false)} />

      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "var(--backdrop-base)" }}
        >
          {/* Blurred image backdrop (TikTok-style) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" data-backdrop-image-wrap>
            <ImageWithFallback
              src={previewImage.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-125"
              style={{ filter: 'blur(36px) saturate(1.4) brightness(var(--backdrop-brightness))' }}
            />
            {/* Dark vignette for legibility */}
            <div
              className="absolute inset-0"
              style={{
                background: 'var(--backdrop-vignette)',
              }}
            />
            {/* Subtle grain to match brand "Matte Obsidian" texture */}
            <div
              className="absolute inset-0"
              style={{
                  opacity: "var(--backdrop-grain-opacity)",
                  mixBlendMode: "var(--backdrop-grain-blend)" as any,
                  background: 'url("data:image/svg+xml,%3Csvg viewBox=\' 0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
              }}
            />
          </div>

          {/* Foreground content */}
          <div className="relative z-[1]">
            {/* Header — mirrors the Cast tab identity (Frame icon + gradient-cast accent) */}
            <div className="sticky top-0 z-10 backdrop-blur-sm bg-scrim border-b border-glass">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="flex items-center gap-1 text-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg gradient-cast flex items-center justify-center shadow-sm">
                    <Frame className="w-4 h-4 text-foreground" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Cast Preview</h2>
                </div>
                <div className="w-12" />
              </div>
            </div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center pt-6 px-4"
            >
              <div className="relative w-full max-w-[340px]">
                <div
                  className="absolute inset-0 rounded-2xl blur-2xl opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00FFC2, #BC13FE)', transform: 'scale(1.06)' }}
                />
                <div
                  className="relative rounded-2xl p-[2px]"
                  style={{ background: 'linear-gradient(135deg, #00FFC2, #BC13FE)' }}
                >
                  <ImageWithFallback
                    src={previewImage.url}
                    alt={previewImage.title}
                    className="w-full aspect-[11/16] object-cover rounded-2xl block"
                  />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-center mt-5 px-6"
            >
              <h1 className="text-xl font-bold text-foreground drop-shadow-sm">{previewImage.title}</h1>
              <p className="text-sm text-soft-3 mt-1.5">From your gallery</p>
            </motion.div>

            {/* Cast button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mx-6 mt-7 pb-10"
            >
              <button
                onClick={handleConfirmCast}
                disabled={isNfcWriting}
                className="w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 gradient-cast text-foreground shadow-lg disabled:opacity-60"
              >
                <Nfc className="w-5 h-5" />
                Cast to Screen
              </button>
              <p className="text-center text-xs text-soft-3 mt-3">
                Tap to send this image to your e-ink display
              </p>
            </motion.div>
          </div>

          {/* Simulated Face ID confirmation */}
          <FaceIdPrompt
            open={showFaceId}
            title="Confirm Cast"
            subtitle={previewImage ? `Sign to cast "${previewImage.title}" to your e-ink display` : 'Sign to confirm'}
            onConfirm={handleFaceIdConfirm}
            onCancel={() => setShowFaceId(false)}
          />

          {/* NFC writing sheet */}
          {isNfcWriting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-end justify-center"
              style={{ background: 'var(--modal-scrim)', backdropFilter: 'blur(6px)' }}
            >
              <motion.div
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md rounded-t-3xl px-8 py-10 text-center"
                style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
              >
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
                <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Write NFC</h3>
                <p className="text-sm text-soft-4 leading-relaxed">
                  Hold your phone close to the<br />E-ink case to cast the image
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
