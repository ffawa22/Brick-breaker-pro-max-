import React, { useState } from 'react';
import { Trophy, RotateCcw, Crown, Skull, Send, Loader2, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  isVictory: boolean;
  score: number;
  stage: number;
  bossesDefeated: number;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isVictory,
  score,
  stage,
  bossesDefeated,
  onRestart,
  onOpenLeaderboard
}) => {
  const [pilotName, setPilotName] = useState(() => {
    try {
      return localStorage.getItem('bbg_player_name') || '';
    } catch {
      return '';
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submittedRank !== null) return;

    const name = pilotName.trim() || 'ACE_PILOT';
    try {
      localStorage.setItem('bbg_player_name', name);
    } catch {
      // ignore
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          score,
          stage,
          bossesDefeated
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubmittedRank(data.rank);
        }
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-center relative overflow-hidden">
        {/* Glow effect behind header */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isVictory ? 'bg-amber-400' : 'bg-red-500'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative mb-4">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
              isVictory
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-amber-500/20'
                : 'bg-red-500/20 text-red-400 border border-red-400/40 shadow-red-500/20'
            }`}
          >
            {isVictory ? <Crown className="w-9 h-9" /> : <Skull className="w-9 h-9" />}
          </div>

          <h2 className="text-2xl font-bold font-arcade tracking-wider text-white">
            {isVictory ? 'GALACTIC VICTORY!' : 'HULL BREACH - GAME OVER'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isVictory
              ? 'All sector dreadnoughts vanquished! You saved the galaxy.'
              : 'Your shields collapsed under intense enemy fire.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-5">
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">FINAL SCORE</div>
            <div className="text-lg font-bold font-arcade text-amber-300 mt-0.5">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">STAGE</div>
            <div className="text-lg font-bold font-arcade text-cyan-400 mt-0.5">
              {stage} / 4
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">BOSSES</div>
            <div className="text-lg font-bold font-arcade text-rose-400 mt-0.5">
              {bossesDefeated} ⚔️
            </div>
          </div>
        </div>

        {/* Leaderboard Submission */}
        {submittedRank === null ? (
          <form onSubmit={handleSubmitScore} className="mb-5 space-y-2 text-left">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Claim your spot on the Global Leaderboard:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={14}
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="CALLSIGN (E.G. STAR_FOX)"
                className="flex-1 px-3 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-arcade uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-arcade text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                SUBMIT
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>Score Registered on Galactic Server!</span>
            <span className="font-arcade text-sm font-bold text-amber-300">RANK #{submittedRank}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-arcade tracking-wider text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold font-arcade tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
};
