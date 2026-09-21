import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { GameScene, GameBridge } from './game/GameScene';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ControlsGuide } from './components/ControlsGuide';
import { GameOverModal } from './components/GameOverModal';
import { soundManager } from './audio/SoundManager';
import { GameStatus, PowerUpType } from './types';
import { Play, Zap } from 'lucide-react';

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // React states bridged from Phaser
  const [score, setScore] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [combo, setCombo] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [stageNumber, setStageNumber] = useState<number>(1);
  const [stageName, setStageName] = useState<string>('Neon Outpost');

  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossName, setBossName] = useState<string>('');
  const [bossHealth, setBossHealth] = useState<number>(0);
  const [bossMaxHealth, setBossMaxHealth] = useState<number>(0);

  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType; remaining: number }[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('READY');
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(soundManager.isEnabled());

  // Modals
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [gameOverOpen, setGameOverOpen] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [lastFinishedScore, setLastFinishedScore] = useState<{
    score: number;
    stage: number;
    bossesDefeated: number;
  } | null>(null);

  // Initialize Phaser
  useEffect(() => {
    if (!gameContainerRef.current || phaserGameRef.current) return;

    const bridge: GameBridge = {
      onScoreUpdate: (s, m, c) => {
        setScore(s);
        setMultiplier(m);
        setCombo(c);
      },
      onLivesUpdate: (l) => {
        setLives(l);
      },
      onStageUpdate: (stg, name) => {
        setStageNumber(stg);
        setStageName(name);
      },
      onBossUpdate: (name, hp, maxHp, active) => {
        setBossName(name);
        setBossHealth(hp);
        setBossMaxHealth(maxHp);
        setBossActive(active);
      },
      onPowerUpsUpdate: (powerUps) => {
        setActivePowerUps(powerUps);
      },
      onGameStatusChange: (status) => {
        setGameStatus(status);
      },
      onGameOver: (finalScore, stage, bosses) => {
        setLastFinishedScore({ score: finalScore, stage, bossesDefeated: bosses });
        setIsVictory(false);
        setGameOverOpen(true);
      },
      onVictory: (finalScore, bosses) => {
        setLastFinishedScore({ score: finalScore, stage: 4, bossesDefeated: bosses });
        setIsVictory(true);
        setGameOverOpen(true);
      }
    };

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 900,
      backgroundColor: '#0b0f19',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        activePointers: 3,
        touch: {
          capture: true
        }
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [GameScene]
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;
    game.scene.start('GameScene', { bridge });

    return () => {
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  const handleToggleSFX = useCallback(() => {
    const newState = soundManager.toggleEnabled();
    setSfxEnabled(newState);
  }, []);

  const handleRestart = useCallback(() => {
    setGameOverOpen(false);
    const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    if (scene) {
      scene.restartGame();
    }
  }, []);

  const handleMobileMovePaddle = useCallback((dir: -1 | 1 | 0) => {
    const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    if (scene) {
      scene.movePaddleExternal(dir);
    }
  }, []);

  const handleMobileSwipeDelta = useCallback((deltaX: number) => {
    const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    if (scene) {
      scene.movePaddleByDelta(deltaX);
    }
  }, []);

  const handleMobileSwipeEnd = useCallback(() => {
    const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    if (scene) {
      scene.stopPaddle();
    }
  }, []);

  const handleMobileAction = useCallback(() => {
    const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    if (scene) {
      scene.fireLasersExternal();
    }
  }, []);

  const handleStartGameClick = useCallback(() => {
    const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
    if (scene) {
      scene.launchBallExternal();
    }
  }, []);

  const isLaserActive = activePowerUps.some(p => p.type === 'laser');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center select-none overflow-x-hidden">
      {/* Top HUD */}
      <GameHUD
        score={score}
        multiplier={multiplier}
        combo={combo}
        lives={lives}
        stageNumber={stageNumber}
        stageName={stageName}
        bossActive={bossActive}
        bossName={bossName}
        bossHealth={bossHealth}
        bossMaxHealth={bossMaxHealth}
        activePowerUps={activePowerUps}
        sfxEnabled={sfxEnabled}
        onToggleSFX={handleToggleSFX}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onRestart={handleRestart}
      />

      {/* Main Game Stage Area */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center p-2 sm:p-4 relative">
        <div className="relative w-full max-w-[800px] aspect-[800/900] max-h-[75vh] sm:max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-[#0b0f19] flex items-center justify-center">
          {/* Phaser Canvas Container */}
          <div
            id="phaser-game-container"
            ref={gameContainerRef}
            className="w-full h-full touch-no-scroll"
          />

          {/* Launch ball prompt overlay if game status is READY */}
          {gameStatus === 'READY' && (
            <div
              onClick={handleStartGameClick}
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer p-4 transition-all hover:bg-slate-950/20"
            >
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-center shadow-2xl max-w-sm animate-bounce-subtle pointer-events-auto">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center">
                  <Play className="w-6 h-6 fill-cyan-400/30" />
                </div>
                <h3 className="text-xl font-bold font-arcade tracking-wider text-white">
                  CLICK OR PRESS SPACE
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Launch the quantum ball to begin Sector {stageNumber}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-cyan-300 border border-slate-700">
                  <Zap className="w-3.5 h-3.5" /> Swipe screen or use trackpad to steer paddle
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile touch controls bar (responsive on touch devices) */}
        <div className="w-full mt-2">
          <MobileControls
            onMovePaddle={handleMobileMovePaddle}
            onSwipeDelta={handleMobileSwipeDelta}
            onSwipeEnd={handleMobileSwipeEnd}
            onAction={handleMobileAction}
            isLaserActive={isLaserActive}
          />
        </div>
      </main>

      {/* Online Global Leaderboard Modal */}
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        pendingScore={lastFinishedScore}
        onScoreSubmitted={() => {
          // Keep modal open so player sees their rank!
        }}
      />

      {/* How to Play & Power-Ups Guide */}
      <ControlsGuide
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Game Over / Victory Modal */}
      <GameOverModal
        isOpen={gameOverOpen}
        isVictory={isVictory}
        score={lastFinishedScore?.score || 0}
        stage={lastFinishedScore?.stage || 1}
        bossesDefeated={lastFinishedScore?.bossesDefeated || 0}
        onRestart={handleRestart}
        onOpenLeaderboard={() => {
          setGameOverOpen(false);
          setLeaderboardOpen(true);
        }}
      />
    </div>
  );
}
