import React from 'react';
import { Volume2, VolumeX, Trophy, RotateCcw, HelpCircle, Flame, Shield, Zap } from 'lucide-react';
import { PowerUpType } from '../types';
import { POWER_UPS } from '../game/stages';

interface GameHUDProps {
  score: number;
  multiplier: number;
  combo: number;
  lives: number;
  stageNumber: number;
  stageName: string;
  bossActive: boolean;
  bossName: string;
  bossHealth: number;
  bossMaxHealth: number;
  activePowerUps: { type: PowerUpType; remaining: number }[];
  sfxEnabled: boolean;
  onToggleSFX: () => void;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  multiplier,
  combo,
  lives,
  stageNumber,
  stageName,
  bossActive,
  bossName,
  bossHealth,
  bossMaxHealth,
  activePowerUps,
  sfxEnabled,
  onToggleSFX,
  onOpenLeaderboard,
  onOpenHelp,
  onRestart
}) => {
  const bossHealthPct = bossMaxHealth > 0 ? Math.max(0, Math.min(100, (bossHealth / bossMaxHealth) * 100)) : 0;

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800/80 px-4 py-3 backdrop-blur-md sticky top-0 z-30 shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        {/* Top bar: Brand, Stage, Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Logo & Stage */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wider font-arcade text-cyan-400">
                  BRICK BREAKER <span className="text-slate-100 font-sans text-xs uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50">GALAXY</span>
                </h1>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-arcade font-semibold">STAGE {stageNumber}</span>
                  <span>•</span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{stageName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score & Combo */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">SCORE</div>
              <div className="text-xl font-bold font-arcade tracking-wider text-white">
                {score.toLocaleString()}
              </div>
            </div>

            {multiplier > 1 && (
              <div className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold font-arcade text-amber-400">
                  x{multiplier.toFixed(1)} ({combo})
                </span>
              </div>
            )}
          </div>

          {/* Lives & Actions */}
          <div className="flex items-center gap-3">
            {/* Lives Hearts */}
            <div className="flex items-center gap-1 bg-slate-800/70 border border-slate-700/60 px-2.5 py-1.5 rounded-lg">
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">HULL:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${
                    i < lives
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50 scale-100'
                      : 'bg-slate-700/60 scale-75'
                  }`}
                  title={`${lives} lives remaining`}
                />
              ))}
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-toggle-sfx"
                onClick={onToggleSFX}
                aria-label={sfxEnabled ? 'Disable SFX' : 'Enable SFX'}
                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                  sfxEnabled
                    ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400 hover:bg-cyan-900/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
                title={sfxEnabled ? 'Sound Effects ON' : 'Sound Effects MUTED'}
              >
                {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                id="btn-leaderboard"
                onClick={onOpenLeaderboard}
                aria-label="Online Leaderboard"
                className="p-2 rounded-lg bg-amber-950/30 border border-amber-700/50 text-amber-400 hover:bg-amber-900/40 transition-colors"
                title="Global Online Leaderboard"
              >
                <Trophy className="w-4 h-4" />
              </button>

              <button
                id="btn-help-guide"
                onClick={onOpenHelp}
                aria-label="Power-up Guide"
                className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                title="Controls & Power-Ups"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                id="btn-restart"
                onClick={onRestart}
                aria-label="Restart Game"
                className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                title="Restart Game"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Boss Health Bar if boss is active */}
        {bossActive && (
          <div className="w-full bg-red-950/60 border border-red-800/70 rounded-lg p-2.5 shadow-lg shadow-red-950/40 flex flex-col gap-1 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-arcade font-bold text-red-400 tracking-wider">
                  ⚠️ BOSS: {bossName}
                </span>
              </div>
              <span className="font-arcade text-red-300 font-bold">
                {Math.round(bossHealth)} / {bossMaxHealth} ({Math.round(bossHealthPct)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-red-900/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 rounded-full transition-all duration-150"
                style={{ width: `${bossHealthPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Active Power-Ups Row */}
        {activePowerUps.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              ACTIVE:
            </span>
            {activePowerUps.map(p => {
              const info = POWER_UPS[p.type];
              return (
                <div
                  key={p.type}
                  className="px-2 py-0.5 rounded-full border text-xs flex items-center gap-1.5 bg-slate-800/80 shadow-sm"
                  style={{ borderColor: info.color }}
                >
                  <span>{info.symbol}</span>
                  <span className="font-medium text-slate-200">{info.name}</span>
                  {p.remaining > 0 && (
                    <span
                      className="font-arcade font-bold text-[11px] px-1 rounded"
                      style={{ color: info.color }}
                    >
                      {p.remaining}s
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
