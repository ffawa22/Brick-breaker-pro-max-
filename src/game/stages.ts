import { StageConfig, PowerUpInfo, PowerUpType } from '../types';

export const POWER_UPS: Record<PowerUpType, PowerUpInfo> = {
  laser: {
    type: 'laser',
    name: 'Laser Cannons',
    color: '#ef4444',
    duration: 12,
    symbol: '⚡',
    description: 'Blasts dual laser beams when tapping or holding spacebar!'
  },
  multiball: {
    type: 'multiball',
    name: 'Tri-Ball Split',
    color: '#06b6d4',
    duration: 0,
    symbol: '⚽⚽',
    description: 'Instantly splits every active ball into three!'
  },
  expand: {
    type: 'expand',
    name: 'Mega Paddle',
    color: '#10b981',
    duration: 15,
    symbol: '↔️',
    description: 'Expands paddle width by 50% for maximum coverage.'
  },
  fireball: {
    type: 'fireball',
    name: 'Plasma Fireball',
    color: '#f97316',
    duration: 10,
    symbol: '🔥',
    description: 'Vaporizes bricks and cuts through boss defenses without bouncing back!'
  },
  shield: {
    type: 'shield',
    name: 'Force Field Barrier',
    color: '#8b5cf6',
    duration: 0,
    symbol: '🛡️',
    description: 'Energy net at bottom catches lost balls once before breaking.'
  },
  slow: {
    type: 'slow',
    name: 'Chronoshift Slow',
    color: '#3b82f6',
    duration: 8,
    symbol: '⏳',
    description: 'Slows down ball velocity for supreme precision.'
  },
  life: {
    type: 'life',
    name: 'Repair Unit (+1 Life)',
    color: '#ec4899',
    duration: 0,
    symbol: '❤️',
    description: 'Restores 1 life heart immediately.'
  },
  bomb: {
    type: 'bomb',
    name: 'Smart Bomb',
    color: '#eab308',
    duration: 0,
    symbol: '💣',
    description: 'Destroys surrounding bricks or inflicts heavy blast damage on Boss!'
  }
};

export const STAGES: StageConfig[] = [
  {
    stageNumber: 1,
    name: 'Neon Outpost',
    themeColor: '#06b6d4',
    ballSpeed: 350,
    boss: {
      id: 'boss_1',
      name: 'CORE SENTINEL GOLIATH',
      title: 'Automated Defense Bastion',
      maxHealth: 320,
      currentHealth: 320,
      color: 0x06b6d4,
      attackInterval: 2800,
      specialAttackInterval: 7500
    }
  },
  {
    stageNumber: 2,
    name: 'Asteroid Foundry',
    themeColor: '#f97316',
    ballSpeed: 380,
    boss: {
      id: 'boss_2',
      name: 'MECHA TITAN MK-II',
      title: 'Heavy Artillery Dreadnought',
      maxHealth: 480,
      currentHealth: 480,
      color: 0xf97316,
      attackInterval: 2400,
      specialAttackInterval: 6500
    }
  },
  {
    stageNumber: 3,
    name: 'Cybernetic Citadel',
    themeColor: '#8b5cf6',
    ballSpeed: 410,
    boss: {
      id: 'boss_3',
      name: 'HYDRA DREADNOUGHT',
      title: 'Tri-Core Plasma Destroyer',
      maxHealth: 650,
      currentHealth: 650,
      color: 0xa855f7,
      attackInterval: 2000,
      specialAttackInterval: 5500
    }
  },
  {
    stageNumber: 4,
    name: 'Quantum Singularity',
    themeColor: '#ec4899',
    ballSpeed: 440,
    boss: {
      id: 'boss_4',
      name: 'CHRONO OVERLORD',
      title: 'Dimensional Void Entity',
      maxHealth: 850,
      currentHealth: 850,
      color: 0xec4899,
      attackInterval: 1700,
      specialAttackInterval: 4800
    }
  }
];
