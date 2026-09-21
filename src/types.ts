export type GameStatus =
  | 'READY'
  | 'PLAYING'
  | 'BOSS_ALERT'
  | 'BOSS_FIGHT'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'PAUSED';

export type PowerUpType =
  | 'laser'
  | 'multiball'
  | 'expand'
  | 'fireball'
  | 'shield'
  | 'slow'
  | 'life'
  | 'bomb';

export interface PowerUpInfo {
  type: PowerUpType;
  name: string;
  color: string;
  duration: number; // in seconds (0 for instant)
  symbol: string;
  description: string;
}

export type BrickType = 'normal' | 'hard' | 'explosive' | 'glass' | 'metal';

export interface BrickConfig {
  x: number;
  y: number;
  type: BrickType;
  hits: number;
  maxHits: number;
  color: number;
  points: number;
  powerUp?: PowerUpType;
}

export interface BossConfig {
  id: string;
  name: string;
  title: string;
  maxHealth: number;
  currentHealth: number;
  color: number;
  attackInterval: number; // ms
  specialAttackInterval: number; // ms
}

export interface StageConfig {
  stageNumber: number;
  name: string;
  themeColor: string;
  ballSpeed: number;
  boss: BossConfig;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  stage: number;
  bossesDefeated: number;
  date: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  stage: number;
  totalStages: number;
  bossesDefeated: number;
  bricksDestroyed: number;
  combos: number;
  multiplier: number;
}
