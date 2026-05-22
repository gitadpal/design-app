import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
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
  Frame,
  ChevronLeft,
  Nfc,
  PawPrint,
  Mountain,
  Building2,
  Landmark,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { FaceIdPrompt } from './FaceIdPrompt';
import { EinkCasePrompt } from './EinkCasePrompt';
import phoneCaseImg from 'figma:asset/771d461e7de4d0c40d4ef5fcc5c59768d30ec60e.png';
import phoneCaseImgDark from '@/assets/iphone-case-black.png';

// Geometry of the welcome-step case PNG (862x1248) — the E-ink screen window as
// fractions of the full case image. Source coordinates from StepWelcome's
// PhoneCaseScene (360px-wide reference, screen at top:222 left:99 w:168 h:250).
const CASE_ASPECT = 862 / 1248;
const SCREEN = { top: 0.426, left: 0.275, width: 0.467, height: 0.48 };
// How much of the case image (as a fraction of full case height) is clipped
// from the top — the camera-bump region the user doesn't need to see. The
// visible top edge inside the crop window is softly faded via a mask so it
// dissolves into the background instead of presenting a hard cut.
const CROP_TOP_FRACTION = 0.3;
// Width of the soft-fade band at the visible top edge, in case-height fractions.
// Must stay small enough that CROP_TOP_FRACTION + TOP_FADE_BAND ≤ SCREEN.top
// (0.426) so the fade ends before reaching the E-ink screen area — otherwise
// the top of the screen content itself would fade out.
const TOP_FADE_BAND = 0.12;

// Derived pixel sizes for the Recent Casting carousel. Module-level so they
// can be referenced both from the JSX render and from useTransform callbacks
// without needing to pass values around.
const CASE_WIDTH_PX = 330;
const FULL_CASE_H_PX = CASE_WIDTH_PX / CASE_ASPECT;
// Visible vertical extent of the case after cropping the camera-bump area.
// The flow as a whole occupies this height instead of FULL_CASE_H_PX, which
// shifts the carousel up the page while keeping the E-ink screen region
// (the part that matters) at its natural, larger size.
const VISIBLE_H_PX = FULL_CASE_H_PX * (1 - CROP_TOP_FRACTION);
const CASE_TOP_OFFSET_PX = -FULL_CASE_H_PX * CROP_TOP_FRACTION;
const SCREEN_TOP_PX = FULL_CASE_H_PX * SCREEN.top + CASE_TOP_OFFSET_PX;
const SCREEN_LEFT_PX = CASE_WIDTH_PX * SCREEN.left;
const SCREEN_W_PX = CASE_WIDTH_PX * SCREEN.width;
const SCREEN_H_PX = FULL_CASE_H_PX * SCREEN.height;
const PEEK_H_PX = SCREEN_H_PX * 0.95;
const PEEK_W_PX = PEEK_H_PX * (528 / 768);
// Distance between adjacent peek slots. Slot ±1 peeks sit just outside the
// case body with a small gap — close enough to feel attached to the case as
// side covers, but with breathing room so they don't crowd it.
const PEEK_SLOT_W_PX = CASE_WIDTH_PX / 2 + 32;
// Slots within ±RENDER_WINDOW of the active index are rendered. 2 is enough to
// show one off-screen item on each side that can slide in during a transition.
const RENDER_WINDOW = 2;

function cyclicIdx(i: number, n: number) {
  return ((i % n) + n) % n;
}

function slotOf(i: number, active: number, n: number) {
  let s = i - active;
  const half = n / 2;
  if (s > half) s -= n;
  if (s < -half) s += n;
  return s;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// One peek thumbnail. Its visual properties (translateX, rotateY, scale,
// opacity) are derived from the *continuous slot* — staticSlot plus the live
// drag offset normalized by SCREEN_W. As the user drags, the slot value flows
// smoothly between adjacent integer slots, so each peek's rotation and scale
// glide into place rather than snapping at commit. The element is positioned
// absolutely; the outer drag container's `dragX` adds no extra translation
// because the position is computed entirely from the continuous slot here.
function PeekItem({
  img,
  staticSlot,
  dragX,
  dimmed,
  onTap,
}: {
  img: { id: string; url: string; title: string };
  staticSlot: number;
  dragX: ReturnType<typeof useMotionValue<number>>;
  dimmed: boolean;
  onTap: () => void;
}) {
  // The outer drag container translates by dragX. We want each peek's net
  // viewport position to depend only on its *continuous slot* (staticSlot +
  // dragX/SCREEN_W) — i.e. each peek travels exactly one PEEK_SLOT_W per
  // SCREEN_W of drag. So our local x undoes the outer translation and applies
  // the slot-based position instead. All visual properties (rotateY, scale,
  // opacity, zIndex) derive from the same continuous slot so they flow
  // smoothly from peek into screen and vice versa, with no snap at commit.
  const cSlotOf = (v: number) => staticSlot + v / SCREEN_W_PX;
  const x = useTransform(dragX, (v: number) => cSlotOf(v) * PEEK_SLOT_W_PX - v);
  const rotateY = useTransform(dragX, (v: number) =>
    clamp(-cSlotOf(v) * 16, -26, 26)
  );
  const scale = useTransform(dragX, (v: number) =>
    clamp(1 - Math.abs(cSlotOf(v)) * 0.12, 0.7, 1)
  );
  const opacity = useTransform(dragX, (v: number) => {
    const a = Math.abs(cSlotOf(v));
    if (dimmed) return Math.max(0, (0.25 * (1.8 - a)) / 0.8);
    if (a <= 1) return 0.85;
    if (a >= 1.8) return 0;
    return (0.85 * (1.8 - a)) / 0.8;
  });
  // Peek items must stack BELOW the case container (which is at zIndex 2 in
  // the outer stacking context). Without this, the slot 0 peek — which sits at
  // the container center — would render in front of the case body and create
  // a ghost copy of the current image overlaying the screen rect. Closer-to-
  // center peeks still stack above further ones so overlapping side covers
  // layer correctly.
  const zIndex = useTransform(dragX, (v: number) =>
    -Math.round(Math.abs(cSlotOf(v)) * 2)
  );

  return (
    <motion.button
      type="button"
      aria-label={`Switch to ${img.title}`}
      className="absolute focus:outline-none"
      style={{
        left: '50%',
        bottom: 24,
        marginLeft: -PEEK_W_PX / 2,
        x,
        opacity,
        zIndex,
        pointerEvents: Math.abs(staticSlot) === 1 ? 'auto' : 'none',
        willChange: 'transform, opacity',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
    >
      <motion.div
        className="overflow-hidden rounded-md ring-1 ring-white/15"
        style={{
          width: PEEK_W_PX,
          height: PEEK_H_PX,
          rotateY,
          scale,
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
          boxShadow: '0 12px 22px -8px rgba(0,0,0,0.6)',
          willChange: 'transform',
        }}
      >
        <ImageWithFallback
          src={img.url}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
        />
      </motion.div>
    </motion.button>
  );
}

interface CastProps {
  activeCommitment: any;
  currentDisplay: any;
  setCurrentDisplay: (display: any) => void;
  einkCaseAttached: boolean;
  onViewActiveStatus?: () => void;
  isDark?: boolean;
}

const galleryAsset = (filename: string) => `${import.meta.env.BASE_URL}gallery/${filename}`;

const toTitle = (slug: string) =>
  slug
    .replace(/\.png$/, '')
    .split('_')
    .slice(1)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const galleryImage = (id: string, filename: string) => ({
  id,
  url: galleryAsset(filename),
  title: toTitle(filename),
});

const recentImages = [
  galleryImage('r01', 'landscape_red_autumn_bridge.png'),
  galleryImage('r02', 'animal_orange_tabby_kitten.png'),
  galleryImage('r03', 'chinese_red_lantern_alley.png'),
  galleryImage('r04', 'animal_red_panda_leaf.png'),
  galleryImage('r05', 'landscape_amber_hot_balloons.png'),
  galleryImage('r06', 'chinese_gold_pagoda_clouds.png'),
  galleryImage('r07', 'animal_white_snowy_owl.png'),
  galleryImage('r08', 'landscape_red_maple_child.png'),
  galleryImage('r09', 'animal_red_shiba_puppy.png'),
  galleryImage('r10', 'city_orange_beijing_landmarks.png'),
];

const galleryCollections = [
  {
    id: 'featured',
    title: 'Featured',
    icon: <Sparkles className="w-4 h-4" />,
    images: [
      galleryImage('f01', 'landscape_amber_hot_balloons.png'),
      galleryImage('f02', 'chinese_gold_pagoda_clouds.png'),
      galleryImage('f03', 'animal_red_panda_leaf.png'),
      galleryImage('f04', 'landscape_red_cliff_lighthouse.png'),
      galleryImage('f05', 'animal_gold_chinese_dragon.png'),
      galleryImage('f06', 'landscape_pink_snowy_village.png'),
      galleryImage('f07', 'city_gold_shanghai_landmarks.png'),
      galleryImage('f08', 'chinese_red_lion_dance.png'),
      galleryImage('f09', 'animal_white_snowy_owl.png'),
      galleryImage('f10', 'landscape_amber_harvest_moon.png'),
      galleryImage('f11', 'city_cream_paris_landmarks.png'),
      galleryImage('f12', 'chinese_yellow_river_lanterns.png'),
    ],
  },
  {
    id: 'animals',
    title: 'Animals',
    icon: <PawPrint className="w-4 h-4" />,
    images: [
      galleryImage('a01', 'animal_orange_tabby_kitten.png'),
      galleryImage('a02', 'animal_red_shiba_puppy.png'),
      galleryImage('a03', 'animal_white_panda_cub.png'),
      galleryImage('a04', 'animal_orange_snowy_fox.png'),
      galleryImage('a05', 'animal_red_squirrel_acorn.png'),
      galleryImage('a06', 'animal_orange_onsen_capybara.png'),
      galleryImage('a07', 'animal_white_snowy_owl.png'),
      galleryImage('a08', 'animal_brown_bear_cub.png'),
      galleryImage('a09', 'animal_amber_collie_puppy.png'),
      galleryImage('a10', 'animal_amber_field_mouse.png'),
      galleryImage('a11', 'animal_black_dwarf_rabbit.png'),
      galleryImage('a12', 'animal_brown_capuchin_monkey.png'),
      galleryImage('a13', 'animal_caramel_hamster_seeds.png'),
      galleryImage('a14', 'animal_cream_lamb_meadow.png'),
      galleryImage('a15', 'animal_ginger_netherland_rabbit.png'),
      galleryImage('a16', 'animal_gold_chinese_dragon.png'),
      galleryImage('a17', 'animal_gray_donkey_foal.png'),
      galleryImage('a18', 'animal_orange_baby_orangutan.png'),
      galleryImage('a19', 'animal_orange_calico_cat.png'),
      galleryImage('a20', 'animal_orange_retriever_puppy.png'),
      galleryImage('a21', 'animal_red_baby_dragon.png'),
      galleryImage('a22', 'animal_red_dragon_hatchling.png'),
      galleryImage('a23', 'animal_red_highland_calf.png'),
      galleryImage('a24', 'animal_red_panda_leaf.png'),
      galleryImage('a25', 'animal_red_piglet_dandelion.png'),
      galleryImage('a26', 'animal_red_scarlet_ibis.png'),
      galleryImage('a27', 'animal_red_scarlet_rooster.png'),
    ],
  },
  {
    id: 'landscapes',
    title: 'Landscapes',
    icon: <Mountain className="w-4 h-4" />,
    images: [
      galleryImage('l01', 'landscape_red_autumn_bridge.png'),
      galleryImage('l02', 'landscape_amber_harvest_moon.png'),
      galleryImage('l03', 'landscape_red_maple_child.png'),
      galleryImage('l04', 'landscape_amber_desert_saguaro.png'),
      galleryImage('l05', 'landscape_blue_campfire_hikers.png'),
      galleryImage('l06', 'landscape_red_snowy_traveler.png'),
      galleryImage('l07', 'landscape_orange_ice_fisherman.png'),
      galleryImage('l08', 'landscape_gold_wheat_scarecrow.png'),
      galleryImage('l09', 'landscape_amber_hot_balloons.png'),
      galleryImage('l10', 'landscape_amber_majestic_stag.png'),
      galleryImage('l11', 'landscape_pink_snowy_village.png'),
      galleryImage('l12', 'landscape_red_autumn_river.png'),
      galleryImage('l13', 'landscape_red_cliff_lighthouse.png'),
      galleryImage('l14', 'landscape_red_desert_camels.png'),
      galleryImage('l15', 'landscape_red_rainy_umbrella.png'),
    ],
  },
  {
    id: 'cities',
    title: 'Cities',
    icon: <Building2 className="w-4 h-4" />,
    images: [
      galleryImage('c01', 'city_cream_tokyo_blocks.png'),
      galleryImage('c02', 'city_orange_beijing_landmarks.png'),
      galleryImage('c03', 'city_cream_paris_landmarks.png'),
      galleryImage('c04', 'city_cream_newyork_landmarks.png'),
      galleryImage('c05', 'city_gold_shanghai_landmarks.png'),
      galleryImage('c06', 'city_sand_istanbul_landmarks.png'),
      galleryImage('c07', 'city_cream_london_landmarks.png'),
      galleryImage('c08', 'city_cream_berlin_landmarks.png'),
      galleryImage('c09', 'city_sand_guangzhou_landmarks.png'),
      galleryImage('c10', 'city_sand_tokyo_skyline.png'),
    ],
  },
  {
    id: 'culture',
    title: 'Culture',
    icon: <Landmark className="w-4 h-4" />,
    images: [
      galleryImage('u01', 'chinese_red_lantern_alley.png'),
      galleryImage('u02', 'chinese_red_lion_dance.png'),
      galleryImage('u03', 'chinese_amber_tea_house.png'),
      galleryImage('u04', 'chinese_yellow_river_lanterns.png'),
      galleryImage('u05', 'chinese_red_fireworks_family.png'),
      galleryImage('u06', 'chinese_red_courtyard_cat.png'),
      galleryImage('u07', 'christmas_red_ribbon_cabin.png'),
      galleryImage('u08', 'christmas_red_santa_retriever.png'),
      galleryImage('u09', 'chinese_amber_mountain_temple.png'),
      galleryImage('u10', 'chinese_dusk_fishing_village.png'),
      galleryImage('u11', 'chinese_gold_pagoda_clouds.png'),
      galleryImage('u12', 'chinese_gold_rooftop_cat.png'),
      galleryImage('u13', 'chinese_red_bamboo_girl.png'),
      galleryImage('u14', 'chinese_red_firecracker_family.png'),
      galleryImage('u15', 'chinese_red_panda_envelope.png'),
      galleryImage('u16', 'chinese_red_rabbit_mandarins.png'),
      galleryImage('u17', 'chinese_red_sparkler_siblings.png'),
      galleryImage('u18', 'christmas_red_mailbox_letter.png'),
      galleryImage('u19', 'christmas_red_ornament_girl.png'),
    ],
  },
];

const GALLERY_PAGE_SIZE = 6;
// Fraction of the Recent Casting section that should remain visible when the
// sticky header pins. Combined with a negative `top` offset of -(1 - this) * H,
// it keeps the bottom slice of the carousel + dot pager onscreen with the tab
// bar pinned directly beneath it, while everything above is allowed to scroll
// out of view.
const RECENT_VISIBLE_FRACTION = 0.25;

export function ImageCasting({ activeCommitment, currentDisplay, setCurrentDisplay, einkCaseAttached, onViewActiveStatus, isDark = true }: CastProps) {
  // The Recent Casting carousel renders a black case in dark mode (matching the
  // pre-order black case art) and the default white case in light mode. Both
  // PNGs share the same 862×1248 geometry, so the screen-window overlay math is
  // unchanged.
  const caseImg = isDark ? phoneCaseImgDark : phoneCaseImg;
  const [showFaceId, setShowFaceId] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [showEinkPrompt, setShowEinkPrompt] = useState(false);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const [centerImageUrl, setCenterImageUrl] = useState<string>(
    galleryCollections[0]?.images[0]?.url ?? ''
  );
  const [activeRecent, setActiveRecent] = useState(
    Math.floor(recentImages.length / 2)
  );
  const [activeCollectionId, setActiveCollectionId] = useState<string>(
    galleryCollections[0].id
  );
  const [loadedCounts, setLoadedCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(galleryCollections.map((c) => [c.id, GALLERY_PAGE_SIZE]))
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // The Recent Casting block lives inside the sticky header. We measure it so
  // the wrapper's sticky `top` can be set to -(1 - VISIBLE_FRACTION) * height:
  // when pinned, only the bottom slice of the carousel remains in view and
  // everything above scrolls away cleanly.
  const recentCastingRef = useRef<HTMLDivElement | null>(null);
  const [recentCastingHeight, setRecentCastingHeight] = useState(0);
  // Tab-bar height is measured live too so the gallery's own scroll container
  // below can be sized as exactly viewport - (visible-when-pinned slice +
  // bottom nav). The visible-when-pinned slice = bottom 1/4 of Recent Casting
  // + the entire tab bar.
  const tabBarRef = useRef<HTMLDivElement | null>(null);
  const [tabBarHeight, setTabBarHeight] = useState(56);
  // Bounded scroll container for the gallery grid — see the JSX below.
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);
  // Horizontal drag offset that drives the entire carousel. The case itself
  // counter-translates by `-dragX` so it stays still while everything else
  // follows the finger; each peek thumbnail derives its own position from its
  // *continuous slot* (see PeekItem below) so peeks travel one peek-slot per
  // one screen-width of drag, regardless of how many items they shift by.
  const dragX = useMotionValue(0);
  const caseX = useTransform(dragX, (v: number) => -v);
  const animatingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Cover Flow's center image also drives the fluid backdrop while it's in view.
  useEffect(() => {
    const url = recentImages[activeRecent]?.url;
    if (url) setCenterImageUrl(url);
  }, [activeRecent]);

  // Keep `recentCastingHeight` in sync with the rendered carousel block so the
  // sticky-header `top` offset adapts if the layout changes (e.g. font size,
  // viewport resize, banner appearing/disappearing). useLayoutEffect so the
  // measurement lands before the first paint — otherwise the sticky wrapper
  // would briefly use top:0 (offset = -0 * .75) and snap to the viewport top
  // before the height is known.
  useLayoutEffect(() => {
    const node = recentCastingRef.current;
    if (!node) return;
    const update = () => setRecentCastingHeight(node.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const node = tabBarRef.current;
    if (!node) return;
    const update = () => setTabBarHeight(node.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Load more images for the active collection when the sentinel scrolls into
  // view. Stops once every image in that collection is on screen — no truly
  // infinite source, just lazy reveal until the set is exhausted. The
  // IntersectionObserver root is the gallery's own scroll container (not the
  // outer page) since the grid lives in its own bounded overflow-y-auto
  // region — see the gallery scroll wrapper below.
  useEffect(() => {
    const node = sentinelRef.current;
    const scrollRoot = galleryScrollRef.current;
    if (!node || !scrollRoot) return;
    const collection = galleryCollections.find((c) => c.id === activeCollectionId);
    if (!collection) return;
    const total = collection.images.length;
    if ((loadedCounts[activeCollectionId] ?? 0) >= total) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setLoadedCounts((prev) => {
              const current = prev[activeCollectionId] ?? 0;
              if (current >= total) return prev;
              return {
                ...prev,
                [activeCollectionId]: Math.min(total, current + GALLERY_PAGE_SIZE),
              };
            });
          }
        }
      },
      { root: scrollRoot, rootMargin: '0px 0px 240px 0px', threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeCollectionId, loadedCounts]);

  // Note on the fluid backdrop: the backdrop image is driven solely by the
  // Recent Casting carousel's active item now. A previous version also swapped
  // the backdrop as gallery cards crossed the viewport center on scroll, but
  // that caused the bg behind Quick Cast / Recent Casting / Featured to shift
  // every few hundred pixels of scrolling, which read as visual noise — the
  // user should only see the atmosphere change for an explicit gesture (a
  // carousel swipe), not as a side effect of moving through the page.

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

  const activeCollection =
    galleryCollections.find((c) => c.id === activeCollectionId) ??
    galleryCollections[0];
  const galleryLoaded = loadedCounts[activeCollection.id] ?? GALLERY_PAGE_SIZE;
  const galleryVisibleImages = activeCollection.images.slice(0, galleryLoaded);
  const galleryHasMore = galleryLoaded < activeCollection.images.length;
  const galleryDimmed = activeCommitment || !einkCaseAttached;
  // When pinned, the sticky header keeps only the bottom slice of the Recent
  // Casting section + the tab bar onscreen. Top offset is the negative of the
  // portion we want to hide so the wrapper "absorbs" that distance as the page
  // scrolls past it.
  const stickyTopOffset = -recentCastingHeight * (1 - RECENT_VISIBLE_FRACTION);
  // Height of the slice of the sticky header that remains onscreen once it
  // pins — the visible 1/4 of Recent Casting plus the tab bar. Used to size
  // the gallery's own inner scroll container so it fills the space between
  // the pinned header and the bottom nav. The 80px tail matches the
  // `pb-20` already on `<main>`, which is the reserved clearance for the
  // fixed bottom nav — without that piece the gallery would otherwise
  // either overlap the nav or leave a visible empty band above it.
  const visibleStickyHeightPx =
    recentCastingHeight * RECENT_VISIBLE_FRACTION + tabBarHeight;
  const galleryScrollHeight = `calc(100dvh - ${visibleStickyHeightPx + 80}px)`;

  const handleSelectCollection = (id: string) => {
    setActiveCollectionId(id);
    // Center the chosen tab inside the strip by writing to its scrollLeft
    // directly. Using element.scrollIntoView walks up the ancestor chain —
    // when the overflow-hidden wrapper can't satisfy the request it bubbles
    // to the page's <main> scroller and slides the entire page sideways.
    const btn = tabButtonRefs.current[id];
    const strip = tabsScrollRef.current;
    if (btn && strip) {
      const target =
        btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2;
      const max = strip.scrollWidth - strip.clientWidth;
      strip.scrollTo({
        left: Math.max(0, Math.min(max, target)),
        behavior: 'smooth',
      });
    }
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
    <div ref={rootRef} className="relative min-h-screen">
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

      {/* Sticky header — Recent Casting carousel + category tab bar travel
          together. When the user scrolls down, this whole block scrolls with
          the page until its `top` offset is reached; from then on, only the
          bottom RECENT_VISIBLE_FRACTION of the carousel (plus the tab bar)
          stays pinned. The gallery grid below scrolls underneath. */}
      <div
        className="sticky z-30 w-full"
        style={{ top: stickyTopOffset, willChange: 'transform' }}
      >
        {/* Vertical-gradient backdrop. Instead of applying `bg-scrim` +
            `backdrop-blur-md` to the entire sticky wrapper (which made the
            whole Recent Casting block read as its own frosted panel,
            distinct from Quick Cast above), the bg + blur live on this
            absolutely-positioned child and are masked so they fade in only
            toward the bottom of the sticky. Result:
              - Top portion (most of the carousel) is fully transparent and
                shares the same atmosphere as Quick Cast and the gallery
                grid — no visible "section box".
              - Bottom portion (dot pager → tabs, i.e. the slice that stays
                onscreen once the header pins) has full scrim + blur, so
                gallery cards scrolling underneath when stuck still get
                properly obscured. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'var(--scrim-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 50%, black 72%, black 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 50%, black 72%, black 100%)',
          }}
        />
      {/* Recent Casting - cyclic carousel; case stays still; all items move as one strip.
          `touch-action: pan-y` reserves every vertical pan inside this block
          for the page's main scroller — the visible bottom slice (carousel
          tail + dot pager) is meant to act as a "grab handle" for scrolling
          back to the top, so we don't want the carousel's horizontal drag or
          any child pointer listener to compete with that gesture. Horizontal
          pans still reach motion's drag handler because pan-y only excludes
          the browser's built-in horizontal panning, not JS pointer events. */}
      <div
        ref={recentCastingRef}
        className="relative pb-2"
        style={{ touchAction: 'pan-y' }}
      >
        <h3 className="px-4 mb-3 pt-4 text-foreground font-semibold tracking-tight">Recent Casting</h3>
        {(() => {
          const N = recentImages.length;
          const image = recentImages[activeRecent];
          const dimmed = activeCommitment || !einkCaseAttached;
          const isCast = currentDisplay?.data?.id === image?.id;

          const commitTo = (dir: -1 | 1, releaseVelocity = 0) => {
            if (animatingRef.current) return;
            animatingRef.current = true;
            // dir = -1 → prev sliding in from left → dragX continues to +SCREEN_W_PX
            // dir = +1 → next sliding in from right → dragX continues to -SCREEN_W_PX
            const target = -dir * SCREEN_W_PX;
            animate(dragX, target, {
              type: 'spring',
              stiffness: 220,
              damping: 30,
              velocity: releaseVelocity,
              restDelta: 0.5,
            }).then(() => {
              const newIdx = cyclicIdx(activeRecent + dir, N);
              flushSync(() => setActiveRecent(newIdx));
              dragX.set(0);
              animatingRef.current = false;
            });
          };

          const onDragEnd = (
            _e: unknown,
            info: { offset: { x: number }; velocity: { x: number } }
          ) => {
            const distanceThreshold = SCREEN_W_PX * 0.25;
            const velocityThreshold = 280;
            const v = info.velocity.x;
            const offset = info.offset.x;
            if (offset > distanceThreshold || v > velocityThreshold) {
              commitTo(-1, v);
            } else if (offset < -distanceThreshold || v < -velocityThreshold) {
              commitTo(1, v);
            } else {
              animate(dragX, 0, {
                type: 'spring',
                stiffness: 320,
                damping: 32,
                velocity: v,
                restDelta: 0.5,
              });
            }
          };

          // Items rendered in the carousel — only those near the active index.
          // Keyed by img.id so an item keeps the same DOM node as its slot
          // shifts across a commit (the marginLeft change and the dragX reset
          // cancel out, so the on-screen position is continuous).
          const visibleItems = recentImages
            .map((img, i) => ({ img, i, slot: slotOf(i, activeRecent, N) }))
            .filter(({ slot }) => Math.abs(slot) <= RENDER_WINDOW);

          return (
            <>
              <motion.div
                className="relative w-full flex items-end justify-center select-none"
                style={{
                  height: VISIBLE_H_PX,
                  perspective: 1200,
                  touchAction: 'pan-y',
                  x: dragX,
                  willChange: 'transform',
                }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -SCREEN_W_PX, right: SCREEN_W_PX }}
                dragElastic={0.55}
                dragMomentum={false}
                onDragEnd={onDragEnd}
              >
                {/* Peek layer (behind the case). Every visible item is rendered
                    here, including slot 0 — its peek is normally hidden behind
                    the case body but emerges from the left or right of the case
                    during a swipe, so the transition between in-screen and
                    in-peek is gap-free. Rotation/scale derive from the item's
                    *continuous* slot (staticSlot + dragX/SCREEN_W) so the
                    visual style flows smoothly into the next slot rather than
                    snapping at commit time. */}
                {visibleItems.map(({ img, slot: staticSlot, i }) => {
                  // Continuous slot for this item — updates as the user drags.
                  // Wrapped in useTransform inside a memoized child below.
                  return (
                    <PeekItem
                      key={`peek-${img.id}`}
                      img={img}
                      staticSlot={staticSlot}
                      dragX={dragX}
                      dimmed={dimmed}
                      onTap={() => {
                        if (staticSlot === -1) commitTo(-1);
                        else if (staticSlot === 1) commitTo(1);
                      }}
                    />
                  );
                })}

                {/* Center case — counter-translates by -dragX so it stays still on page */}
                <motion.div
                  className="absolute bottom-0"
                  style={{
                    left: '50%',
                    marginLeft: -CASE_WIDTH_PX / 2,
                    x: caseX,
                    width: CASE_WIDTH_PX,
                    height: VISIBLE_H_PX,
                    overflow: 'hidden',
                    filter: 'drop-shadow(0 22px 30px rgba(0,0,0,0.55))',
                    opacity: dimmed ? 0.55 : 1,
                    zIndex: 2,
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {/* The case image is positioned with a negative top so the
                      camera-bump area is cropped above the container. A mask
                      applied to the image softly fades the still-visible top
                      band (the upper bezel, just above the screen) so the
                      cropped edge dissolves into the background instead of
                      ending in a hard line. The mask is expressed in the
                      image's own coordinate fractions: opaque from the band
                      end downward, ramping to transparent over TOP_FADE_BAND
                      ending at the visible top edge (CROP_TOP_FRACTION). */}
                  <img
                    src={caseImg}
                    alt=""
                    draggable={false}
                    className="absolute pointer-events-none select-none"
                    style={{
                      top: CASE_TOP_OFFSET_PX,
                      left: 0,
                      width: CASE_WIDTH_PX,
                      height: FULL_CASE_H_PX,
                      WebkitMaskImage: `linear-gradient(to bottom, transparent ${CROP_TOP_FRACTION * 100}%, rgba(0,0,0,0.55) ${(CROP_TOP_FRACTION + TOP_FADE_BAND * 0.5) * 100}%, black ${(CROP_TOP_FRACTION + TOP_FADE_BAND) * 100}%)`,
                      maskImage: `linear-gradient(to bottom, transparent ${CROP_TOP_FRACTION * 100}%, rgba(0,0,0,0.55) ${(CROP_TOP_FRACTION + TOP_FADE_BAND * 0.5) * 100}%, black ${(CROP_TOP_FRACTION + TOP_FADE_BAND) * 100}%)`,
                    }}
                  />
                  {/* E-ink screen — strip of items at slot * SCREEN_W_PX, slides with dragX.
                      Click-to-preview is bound here so only taps inside the screen
                      rect open the preview; tapping the surrounding bezel does nothing. */}
                  <div
                    className="absolute overflow-hidden cursor-pointer"
                    style={{
                      top: SCREEN_TOP_PX,
                      left: SCREEN_LEFT_PX,
                      width: SCREEN_W_PX,
                      height: SCREEN_H_PX,
                      borderRadius: 7,
                      boxShadow:
                        'inset 0 0 0 1px rgba(0,0,0,0.18), inset 0 2px 6px rgba(0,0,0,0.28)',
                    }}
                    onClick={() => {
                      if (!animatingRef.current && image) handleCastImage(image);
                    }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        x: dragX,
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      {visibleItems.map(({ img, slot }) => (
                        <ImageWithFallback
                          key={`screen-${img.id}`}
                          src={img.url}
                          alt={slot === 0 ? img.title : ''}
                          className="absolute object-cover pointer-events-none"
                          style={{
                            left: slot * SCREEN_W_PX,
                            top: 0,
                            width: SCREEN_W_PX,
                            height: SCREEN_H_PX,
                          }}
                        />
                      ))}
                    </motion.div>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.14) 100%)',
                      }}
                    />
                    {isCast && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: 'inset 0 0 0 2px #00FFC2' }}
                      />
                    )}
                  </div>
                  {/* "Click to cast" guidance tip — pill + downward chevron
                      pointing at the E-ink screen. Lives inside the case
                      container so it counter-translates with the case and
                      stays still relative to the screen as the user drags.
                      Hidden when the case is dimmed (no E-ink case attached or
                      an active commitment is running) or when this image is
                      already cast. */}
                  {!dimmed && !isCast && (
                    <motion.div
                      className="absolute pointer-events-none flex items-center gap-1.5"
                      style={{
                        left: CASE_WIDTH_PX / 2,
                        top: SCREEN_TOP_PX - 22,
                        transform: 'translateX(-50%)',
                        zIndex: 3,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ChevronDown
                        style={{
                          width: 12,
                          height: 12,
                          color: 'rgba(255,255,255,0.55)',
                          filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.12))',
                        }}
                        strokeWidth={2}
                      />
                      <span
                        className="text-[10px] uppercase font-semibold whitespace-nowrap"
                        style={{
                          color: 'rgba(255,255,255,0.62)',
                          letterSpacing: '0.18em',
                          textShadow:
                            '0 1px 0 rgba(255,255,255,0.10), 0 -1px 0 rgba(0,0,0,0.45)',
                        }}
                      >
                        Click to cast
                      </span>
                      <ChevronDown
                        style={{
                          width: 12,
                          height: 12,
                          color: 'rgba(255,255,255,0.55)',
                          filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.12))',
                        }}
                        strokeWidth={2}
                      />
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              {/* Title + dot pager */}
              <div className="mt-3 flex flex-col items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={image?.id ?? 'none'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="text-sm text-foreground font-medium tracking-tight"
                  >
                    {image?.title}
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-1.5">
                  {recentImages.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Go to recent ${i + 1}`}
                      onClick={() => {
                        if (i === activeRecent || animatingRef.current) return;
                        // Walk the shortest cyclic direction
                        const fwd = cyclicIdx(i - activeRecent, N);
                        const dir: -1 | 1 = fwd <= N / 2 ? 1 : -1;
                        commitTo(dir);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeRecent ? 'w-5 bg-foreground' : 'w-1.5 bg-soft-2'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>

        {/* Category tab bar — sits at the bottom of the sticky header. No
            top border: the sticky wrapper already supplies one continuous
            `bg-scrim` + backdrop-blur surface across Recent Casting and the
            tab strip, so the ~20px of empty scrim between the dot pager
            (`pb-2`) and the tabs (`py-3`) reads as a soft tonal fade
            instead of a hard divider line. `overflow-hidden` keeps the
            scrollable strip clipped to the page width. */}
        <div ref={tabBarRef} className="relative w-full overflow-hidden">
          <div
            ref={tabsScrollRef}
            className="flex gap-2 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x proximity',
            }}
          >
            {galleryCollections.map((collection) => {
              const active = collection.id === activeCollection.id;
              return (
                <button
                  key={collection.id}
                  ref={(el) => {
                    tabButtonRefs.current[collection.id] = el;
                  }}
                  onClick={() => handleSelectCollection(collection.id)}
                  className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium tracking-tight transition-colors ${
                    active
                      ? 'text-foreground'
                      : 'text-soft-2 hover:text-soft-1'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  {/* Active backdrop — the Cast tab's signature accent from
                      the app's bottom nav (`#f43f5e`, see App.tsx
                      tabAccents.cast) painted as an organic radial halo
                      behind the label. No pill outline, no border: the
                      gallery page doesn't use pill chrome anywhere, so the
                      selected state is expressed purely as a soft glow
                      behind the icon + label, echoing the bottom nav's
                      colored-halo highlight idiom. */}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute pointer-events-none"
                      style={{
                        inset: -10,
                        background:
                          'radial-gradient(ellipse 70% 90% at center, rgba(244,63,94,0.70) 0%, rgba(244,63,94,0.35) 45%, rgba(244,63,94,0) 75%)',
                        filter: 'blur(8px)',
                      }}
                    />
                  )}
                  <span className="relative">{collection.icon}</span>
                  <span className="relative">{collection.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gallery grid for the active category — lives in its OWN bounded
          scroll container so the Cast page effectively has two scroll
          regions: the outer `<main>` scroll (driven by gestures on Quick
          Cast, Recent Casting, and the tab bar) and this inner one (driven
          by gestures inside the grid). That way dragging on the visible
          slice of Recent Casting above the tabs always scrolls the page
          back toward the top, while paging through cards stays contained
          here. `overscroll-behavior: contain` keeps grid edge scrolls from
          chaining out to the page scroller. Height is sized to fill the
          space between the pinned sticky header and the bottom nav. */}
      <div
        ref={galleryScrollRef}
        className="px-4 pt-4 overflow-y-auto"
        style={{
          height: galleryScrollHeight,
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {galleryVisibleImages.map((image) => (
            <Card
              key={image.id}
              data-gallery-image={image.url}
              className={`overflow-hidden cursor-pointer transition-all bg-transparent border ${
                galleryDimmed
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
                  <div className="text-sm text-foreground truncate font-medium">
                    {image.title}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {galleryHasMore ? (
          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-6 text-soft-3 text-xs uppercase tracking-wider"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
              Loading more
            </span>
          </div>
        ) : (
          <div className="text-center text-soft-3 text-xs uppercase tracking-wider py-6">
            No more images
          </div>
        )}
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
