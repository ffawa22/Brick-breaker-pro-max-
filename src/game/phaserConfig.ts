import * as Phaser from 'phaser';
import { GameScene, GameBridge } from './GameScene';

export function createPhaserGame(containerId: string, bridge: GameBridge): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
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
  game.scene.start('GameScene', { bridge });
  return game;
}
