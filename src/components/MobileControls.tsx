import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Zap, Target, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface MobileControlsProps {
  onMovePaddle: (dir: -1 | 1 | 0) => void;
  onSwipeDelta?: (deltaX: number) => void;
  onSwipeEnd?: () => void;
  onAction: () => void;
  isLaserActive: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMovePaddle,
  onSwipeDelta,
  onSwipeEnd,
  onAction,
  isLaserActive
}) => {
  const moveIntervalRef = useRef<number | null>(null);
  const swipeBarRef = useRef<HTMLDivElement>(null);
  const isSwipingRef = useRef<boolean>(false);
  const lastTouchXRef = useRef<number>(0);
  const [swipeActive, setSwipeActive] = useState<boolean>(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [indicatorOffset, setIndicatorOffset] = useState<number>(0);

  const startMoving = (dir: -1 | 1) => {
    onMovePaddle(dir);
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    moveIntervalRef.current = window.setInterval(() => {
      onMovePaddle(dir);
    }, 45);
  };

  const stopMoving = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
    onMovePaddle(0);
  };

  // Swipe Trackpad Event Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      isSwipingRef.current = true;
      lastTouchXRef.current = e.touches[0].clientX;
      setSwipeActive(true);
      setSwipeDirection(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current || e.touches.length === 0) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - lastTouchXRef.current;
    lastTouchXRef.current = currentX;

    if (Math.abs(delta) > 0.5) {
      setSwipeDirection(delta > 0 ? 'right' : 'left');
      setIndicatorOffset(prev => Math.max(-60, Math.min(60, prev + delta * 0.4)));
      if (onSwipeDelta) {
        // Calibrated sensitivity for touch trackpad
        onSwipeDelta(delta * 1.8);
      }
    }
  };

  const handleTouchEnd = () => {
    isSwipingRef.current = false;
    setSwipeActive(false);
    setSwipeDirection(null);
    setIndicatorOffset(0);
    if (onSwipeEnd) {
      onSwipeEnd();
    }
  };

  // Mouse fallback for swipe trackpad
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isSwipingRef.current = true;
    lastTouchXRef.current = e.clientX;
    setSwipeActive(true);
    setSwipeDirection(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current) return;
    const delta = e.clientX - lastTouchXRef.current;
    lastTouchXRef.current = e.clientX;

    if (Math.abs(delta) > 0.5) {
      setSwipeDirection(delta > 0 ? 'right' : 'left');
      setIndicatorOffset(prev => Math.max(-60, Math.min(60, prev + delta * 0.4)));
      if (onSwipeDelta) {
        onSwipeDelta(delta * 1.8);
      }
    }
  };

  const handleMouseUp = () => {
    if (isSwipingRef.current) {
      isSwipingRef.current = false;
      setSwipeActive(false);
      setSwipeDirection(null);
      setIndicatorOffset(0);
      if (onSwipeEnd) {
        onSwipeEnd();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    };
  }, []);

  return (
    <div
      id="mobile-touch-controls-container"
      className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-2 flex flex-col gap-2 touch-no-scroll select-none"
    >
      {/* Primary Row: Left Button, Interactive Touch Swipe Bar, Right Button, Action Button */}
      <div className="flex items-center justify-between gap-2">
        {/* Left D-Pad Nudge Button */}
        <button
          id="btn-touch-left"
          type="button"
          aria-label="Move paddle left"
          onMouseDown={() => startMoving(-1)}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={(e) => { e.preventDefault(); startMoving(-1); }}
          onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
          className="w-12 sm:w-14 h-13 rounded-xl bg-slate-900/90 active:bg-cyan-600/30 border border-slate-800 active:border-cyan-400 flex items-center justify-center text-slate-200 active:text-cyan-300 shadow-md transition-transform active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Dedicated Responsive Swipe Trackpad */}
        <div
          id="touch-swipe-trackpad"
          ref={swipeBarRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 h-13 rounded-xl border relative flex items-center justify-center cursor-ew-resize overflow-hidden transition-colors ${
            swipeActive
              ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
          }`}
        >
          {/* Subtle background chevron guides */}
          <div className="flex items-center justify-between w-full px-4 text-xs font-arcade tracking-wider pointer-events-none">
            <div className={`flex items-center transition-colors ${swipeDirection === 'left' ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`}>
              <ChevronsLeft className="w-4 h-4 mr-1" />
              <span className="hidden xs:inline">LEFT</span>
            </div>

            <div className="flex flex-col items-center">
              <span className={`text-[11px] font-bold tracking-widest uppercase transition-colors ${swipeActive ? 'text-cyan-300' : 'text-slate-400'}`}>
                {swipeActive ? 'SWIPING' : 'SWIPE TO STEER'}
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:inline">
                or swipe canvas directly
              </span>
            </div>

            <div className={`flex items-center transition-colors ${swipeDirection === 'right' ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`}>
              <span className="hidden xs:inline">RIGHT</span>
              <ChevronsRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Interactive touch slider thumb reticle */}
          <div
            className={`absolute top-1 bottom-1 w-9 rounded-lg transition-transform duration-75 flex items-center justify-center pointer-events-none ${
              swipeActive
                ? 'bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.7)]'
                : 'bg-slate-700/60'
            }`}
            style={{
              transform: `translateX(${indicatorOffset}px)`
            }}
          >
            <div className="w-1.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* Right D-Pad Nudge Button */}
        <button
          id="btn-touch-right"
          type="button"
          aria-label="Move paddle right"
          onMouseDown={() => startMoving(1)}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={(e) => { e.preventDefault(); startMoving(1); }}
          onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
          className="w-12 sm:w-14 h-13 rounded-xl bg-slate-900/90 active:bg-cyan-600/30 border border-slate-800 active:border-cyan-400 flex items-center justify-center text-slate-200 active:text-cyan-300 shadow-md transition-transform active:scale-95 shrink-0"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Action / Launch / Laser button */}
        <button
          id="btn-touch-action"
          type="button"
          onClick={onAction}
          onTouchStart={(e) => { e.preventDefault(); onAction(); }}
          className={`px-4 sm:px-5 h-13 rounded-xl font-bold font-arcade tracking-wider flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 border shrink-0 text-xs sm:text-sm ${
            isLaserActive
              ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400 text-white shadow-red-600/40 animate-pulse'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-cyan-600/30'
          }`}
        >
          {isLaserActive ? (
            <>
              <Zap className="w-4 h-4" />
              <span>LASER</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>LAUNCH</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
