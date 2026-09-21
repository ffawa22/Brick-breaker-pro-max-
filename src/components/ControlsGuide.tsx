import React from 'react';
import { X, Sparkles, Gamepad2, ShieldAlert, Swords } from 'lucide-react';
import { POWER_UPS } from '../game/stages';
import { PowerUpType } from '../types';

interface ControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const powerUpList = Object.keys(POWER_UPS) as PowerUpType[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-arcade tracking-wider text-slate-100">
                HOW TO PLAY & POWER-UPS
              </h2>
              <p className="text-xs text-slate-400">Controls, strategies, and stage boss mechanics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Pilot Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-1">Desktop / Mouse & Keyboard</div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• <span className="font-semibold text-cyan-300">Move Paddle:</span> Mouse / Cursor or <kbd className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-700">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-700">D</kbd> / Arrow keys</li>
                  <li>• <span className="font-semibold text-cyan-300">Launch Ball / Shoot:</span> <kbd className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-700">Space</kbd> or Click</li>
                  <li>• <span className="font-semibold text-cyan-300">Paddle Spin:</span> Hit ball with paddle edges to steer angles!</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-1">Mobile & Touchscreens</div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• <span className="font-semibold text-cyan-300">Swipe Screen:</span> Swipe left or right anywhere on the screen for instant, 1:1 paddle steering</li>
                  <li>• <span className="font-semibold text-cyan-300">Touch Trackpad:</span> Swipe on the bottom trackpad for comfortable thumb control</li>
                  <li>• <span className="font-semibold text-cyan-300">Nudge D-Pad:</span> Tap ◀ / ▶ buttons for fine adjustments</li>
                  <li>• <span className="font-semibold text-cyan-300">Action:</span> Tap screen or LAUNCH/LASER button</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boss Mechanics */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-900/50">
            <h3 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
              <Swords className="w-4 h-4" /> End-of-Stage Boss Battles
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clear all stage bricks to summon the sector Boss! Dodge boss projectiles, reflect balls into its weak spots, or unleash laser cannons and fireballs to shatter its hull and advance to the next sector.
            </p>
          </div>

          {/* Power-ups Catalog */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Colorful Power-Ups Catalog (28% Drop Rate)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {powerUpList.map(key => {
                const item = POWER_UPS[key];
                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg shadow-sm"
                      style={{ backgroundColor: `${item.color}25`, borderColor: item.color, borderWidth: 1 }}
                    >
                      {item.symbol}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.duration > 0 && (
                          <span className="text-[10px] text-slate-400 font-sans font-normal">
                            ({item.duration}s)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-arcade tracking-wider transition-colors shadow-md shadow-cyan-600/20"
          >
            READY TO FLY
          </button>
        </div>
      </div>
    </div>
  );
};
