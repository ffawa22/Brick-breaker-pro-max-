import React, { useState, useEffect } from 'react';
import { Trophy, X, Crown, Award, Medal, Loader2, Sparkles, Send } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingScore?: {
    score: number;
    stage: number;
    bossesDefeated: number;
  } | null;
  onScoreSubmitted?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  pendingScore,
  onScoreSubmitted
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Load saved player name
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('bbg_player_name');
      if (savedName) setPlayerName(savedName);
    } catch {
      // ignore
    }
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.entries)) {
          setEntries(data.entries);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingScore || submitting) return;

    const trimmed = playerName.trim() || 'ACE_PILOT';
    try {
      localStorage.setItem('bbg_player_name', trimmed);
    } catch {
      // ignore
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          score: pendingScore.score,
          stage: pendingScore.stage,
          bossesDefeated: pendingScore.bossesDefeated
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHighlightId(data.entry.id);
          setUserRank(data.rank);
          if (data.topEntries) {
            setEntries(data.topEntries);
          } else {
            fetchLeaderboard();
          }
          if (onScoreSubmitted) onScoreSubmitted();
        }
      }
    } catch (err) {
      console.error('Failed to post score:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-arcade tracking-wider text-slate-100 flex items-center gap-2">
                GLOBAL ARCADE LEADERBOARD
                <span className="text-[10px] uppercase font-sans font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Top galactic brick breaking champions and high scores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close leaderboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Submission Banner if game just concluded */}
        {pendingScore && !highlightId && (
          <div className="bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border-b border-cyan-800/50 p-4">
            <form onSubmit={handleSubmitScore} className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex items-center gap-2 text-left w-full sm:w-auto">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-cyan-300">SUBMIT YOUR SCORE:</div>
                  <div className="text-base font-bold font-arcade text-white">
                    {pendingScore.score.toLocaleString()} PTS (Stage {pendingScore.stage})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  maxLength={14}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="PILOT CALLSIGN"
                  className="w-full sm:w-44 px-3 py-2 text-sm bg-slate-950/90 border border-cyan-700/60 rounded-lg text-white font-arcade uppercase placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/25 shrink-0"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  SUBMIT
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User rank banner if already submitted */}
        {userRank && (
          <div className="bg-emerald-950/60 border-b border-emerald-800/50 p-3 px-6 text-emerald-300 text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Your score has been registered! Current Galactic Rank:
            </span>
            <span className="font-arcade text-lg font-bold text-amber-300">#{userRank}</span>
          </div>
        )}

        {/* Leaderboard Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-sm font-medium">Connecting to Galaxy Leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-base font-semibold">No high scores recorded yet.</p>
              <p className="text-xs text-slate-500">Be the first pilot to etch your name in galactic history!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-5">Pilot</div>
                <div className="col-span-2 text-center">Stage</div>
                <div className="col-span-3 text-right">Score</div>
              </div>

              {/* Entries */}
              {entries.map((item, idx) => {
                const rank = idx + 1;
                const isHighlighted = item.id === highlightId;

                let rankBadge = (
                  <span className="font-arcade font-bold text-slate-400">#{rank}</span>
                );
                if (rank === 1) {
                  rankBadge = (
                    <div className="flex items-center justify-center text-amber-400 gap-1 font-bold">
                      <Crown className="w-4 h-4 fill-amber-400/20" />
                      <span>1</span>
                    </div>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <div className="flex items-center justify-center text-slate-300 gap-1 font-bold">
                      <Award className="w-4 h-4" />
                      <span>2</span>
                    </div>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <div className="flex items-center justify-center text-amber-600 gap-1 font-bold">
                      <Medal className="w-4 h-4" />
                      <span>3</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      isHighlighted
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                        : rank === 1
                        ? 'bg-amber-950/20 border-amber-800/40 text-slate-100'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-200'
                    }`}
                  >
                    <div className="col-span-2 text-center">{rankBadge}</div>

                    <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                      <span className="font-arcade font-bold tracking-wider truncate text-cyan-200">
                        {item.name}
                      </span>
                      {item.bossesDefeated > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800/60 text-red-400 font-sans shrink-0 hidden sm:inline">
                          {item.bossesDefeated} ⚔️
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 text-center text-xs font-arcade text-slate-400">
                      ST {item.stage}
                    </div>

                    <div className="col-span-3 text-right font-arcade font-bold text-amber-300">
                      {item.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span>Updates automatically with real-time player records</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
