import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 72,
  disabled = false,
}: PullToRefreshProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);

  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const disabledRef = useRef(disabled);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Locate the nearest scrollable ancestor on mount
  useEffect(() => {
    let el: HTMLElement | null = wrapperRef.current?.parentElement ?? null;
    while (el) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY)) {
        scrollParentRef.current = el;
        return;
      }
      el = el.parentElement;
    }
    scrollParentRef.current = document.scrollingElement as HTMLElement | null;
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const setDistance = (d: number) => {
      pullDistanceRef.current = d;
      setPullDistance(d);
    };

    const atTop = () => {
      const sp = scrollParentRef.current;
      return !sp || sp.scrollTop <= 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current || isRefreshingRef.current) return;
      if (!atTop()) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;

      if (dy <= 0) {
        if (pullingRef.current) {
          pullingRef.current = false;
          setDistance(0);
        }
        return;
      }

      if (!atTop()) {
        startYRef.current = null;
        pullingRef.current = false;
        setDistance(0);
        return;
      }

      const resisted = Math.min(dy * 0.55, threshold * 1.8);
      pullingRef.current = true;
      setDistance(resisted);

      if (e.cancelable) e.preventDefault();
    };

    const finishGesture = async () => {
      if (startYRef.current === null) return;
      const wasPulling = pullingRef.current;
      const distance = pullDistanceRef.current;
      startYRef.current = null;
      pullingRef.current = false;

      if (!wasPulling) {
        setDistance(0);
        return;
      }

      if (distance >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setIsReleasing(true);
        setDistance(threshold);
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          setDistance(0);
          setTimeout(() => setIsReleasing(false), 300);
        }
      } else {
        setIsReleasing(true);
        setDistance(0);
        setTimeout(() => setIsReleasing(false), 300);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', finishGesture);
    el.addEventListener('touchcancel', finishGesture);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', finishGesture);
      el.removeEventListener('touchcancel', finishGesture);
    };
  }, [threshold]);

  const progress = Math.min(pullDistance / threshold, 1);
  const readyToRelease = progress >= 1;
  const indicatorBase = isRefreshing ? threshold : pullDistance;
  const indicatorTranslate = indicatorBase - 44;
  const useTransition = isReleasing || isRefreshing;

  return (
    <div ref={wrapperRef} className="relative">
      <div
        aria-hidden={!isRefreshing && pullDistance === 0}
        className="pointer-events-none absolute left-0 right-0 flex justify-center"
        style={{
          top: 0,
          transform: `translateY(${indicatorTranslate}px)`,
          opacity: isRefreshing ? 1 : progress,
          transition: useTransition ? 'transform 0.28s ease-out, opacity 0.2s ease' : 'none',
        }}
      >
        <div
          className="h-9 w-9 rounded-full glass-effect shadow-md flex items-center justify-center"
          style={{
            borderColor: readyToRelease || isRefreshing ? '#00FFC2' : 'rgba(255,255,255,0.3)',
            boxShadow: readyToRelease || isRefreshing ? '0 0 14px rgba(0, 255, 194, 0.4)' : undefined,
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          }}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              color: readyToRelease || isRefreshing ? '#00FFC2' : '#6B7280',
              transform: isRefreshing ? undefined : `rotate(${progress * 270}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.05s linear, color 0.18s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
          transition: useTransition ? 'transform 0.28s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
