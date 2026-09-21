import * as Phaser from 'phaser';
import { soundManager } from '../audio/SoundManager';
import { STAGES, POWER_UPS } from './stages';
import { GameStatus, PowerUpType, BrickType } from '../types';
import confetti from 'canvas-confetti';

export interface GameBridge {
  onScoreUpdate: (score: number, multiplier: number, combo: number) => void;
  onLivesUpdate: (lives: number) => void;
  onStageUpdate: (stage: number, stageName: string) => void;
  onBossUpdate: (bossName: string, health: number, maxHealth: number, active: boolean) => void;
  onPowerUpsUpdate: (powerUps: { type: PowerUpType; remaining: number }[]) => void;
  onGameStatusChange: (status: GameStatus) => void;
  onGameOver: (score: number, stage: number, bossesDefeated: number) => void;
  onVictory: (score: number, bossesDefeated: number) => void;
}

export class GameScene extends Phaser.Scene {
  private bridge!: GameBridge;

  // Game entities
  private paddle!: Phaser.Physics.Arcade.Image;
  private balls!: Phaser.Physics.Arcade.Group;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private powerUpsGroup!: Phaser.Physics.Arcade.Group;
  private lasersGroup!: Phaser.Physics.Arcade.Group;
  private bossProjectilesGroup!: Phaser.Physics.Arcade.Group;
  private floorBarrier: Phaser.GameObjects.Rectangle | null = null;

  // Boss
  private boss: Phaser.Physics.Arcade.Sprite | null = null;
  private bossHealth: number = 0;
  private bossMaxHealth: number = 0;
  private bossActive: boolean = false;
  private bossAttackTimer: Phaser.Time.TimerEvent | null = null;
  private bossMoveTween: Phaser.Tweens.Tween | null = null;

  // State
  private score: number = 0;
  private lives: number = 3;
  private currentStageIndex: number = 0;
  private bossesDefeated: number = 0;
  private comboCount: number = 0;
  private comboResetTimer: Phaser.Time.TimerEvent | null = null;
  private ballLaunched: boolean = false;
  private isPaused: boolean = false;
  private gameStatus: GameStatus = 'READY';

  // Active power-up timers
  private activeTimers: Map<PowerUpType, { remaining: number; timer?: Phaser.Time.TimerEvent }> = new Map();
  private hasFloorBarrier: boolean = false;
  private isLaserActive: boolean = false;
  private isFireballActive: boolean = false;
  private nextLaserTime: number = 0;

  // Controls & Touch/Swipe State
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private pointerMoveTargetX: number | null = null;
  private isPointerDragging: boolean = false;
  private activePointerId: number | null = null;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private pointerDownTime: number = 0;
  private paddleStartX: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data: { bridge: GameBridge; stageIndex?: number }) {
    this.bridge = data.bridge;
    this.currentStageIndex = data.stageIndex || 0;
  }

  public preload() {
    this.createProceduralTextures();
  }

  private createProceduralTextures() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // 1. Paddle texture (120 x 22)
    g.clear();
    g.fillStyle(0x0284c7, 1);
    g.fillRoundedRect(0, 0, 120, 22, 10);
    g.fillStyle(0x38bdf8, 1);
    g.fillRoundedRect(4, 3, 112, 8, 4);
    g.fillStyle(0xffffff, 0.7);
    g.fillRoundedRect(20, 4, 80, 3, 2);
    // Neon core
    g.fillStyle(0x06b6d4, 1);
    g.fillCircle(60, 15, 4);
    g.generateTexture('paddle', 120, 22);

    // 2. Wide Paddle texture (180 x 22)
    g.clear();
    g.fillStyle(0x059669, 1);
    g.fillRoundedRect(0, 0, 180, 22, 10);
    g.fillStyle(0x34d399, 1);
    g.fillRoundedRect(4, 3, 172, 8, 4);
    g.fillStyle(0xffffff, 0.7);
    g.fillRoundedRect(30, 4, 120, 3, 2);
    g.fillStyle(0x10b981, 1);
    g.fillCircle(90, 15, 5);
    g.generateTexture('paddle_wide', 180, 22);

    // 3. Normal Ball (16x16)
    g.clear();
    g.fillStyle(0x38bdf8, 0.4);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0x0284c7, 1);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 2.5);
    g.generateTexture('ball', 16, 16);

    // 4. Fireball (20x20)
    g.clear();
    g.fillStyle(0xf97316, 0.4);
    g.fillCircle(10, 10, 10);
    g.fillStyle(0xef4444, 1);
    g.fillCircle(10, 10, 7);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(9, 9, 4);
    g.generateTexture('fireball', 20, 20);

    // 5. Laser bolt (6x20)
    g.clear();
    g.fillStyle(0xf87171, 0.4);
    g.fillRect(0, 0, 6, 20);
    g.fillStyle(0xef4444, 1);
    g.fillRect(1, 2, 4, 16);
    g.fillStyle(0xffffff, 1);
    g.fillRect(2, 4, 2, 12);
    g.generateTexture('laser', 6, 20);

    // 6. Boss projectile (14x14)
    g.clear();
    g.fillStyle(0xef4444, 0.4);
    g.fillCircle(7, 7, 7);
    g.fillStyle(0xdc2626, 1);
    g.fillCircle(7, 7, 5);
    g.fillStyle(0xfca5a5, 1);
    g.fillCircle(6, 6, 2);
    g.generateTexture('boss_bullet', 14, 14);

    // 7. Spark particle (6x6)
    g.clear();
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('spark', 6, 6);

    // 8. Power-up capsules (36 x 20)
    const powerUpTypes: PowerUpType[] = ['laser', 'multiball', 'expand', 'fireball', 'shield', 'slow', 'life', 'bomb'];
    const pColors: Record<PowerUpType, number> = {
      laser: 0xef4444,
      multiball: 0x06b6d4,
      expand: 0x10b981,
      fireball: 0xf97316,
      shield: 0x8b5cf6,
      slow: 0x3b82f6,
      life: 0xec4899,
      bomb: 0xeab308
    };

    powerUpTypes.forEach(pType => {
      g.clear();
      const col = pColors[pType];
      g.fillStyle(col, 0.3);
      g.fillRoundedRect(0, 0, 36, 20, 8);
      g.fillStyle(col, 1);
      g.fillRoundedRect(2, 2, 32, 16, 6);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(10, 5, 16, 2);
      g.generateTexture(`powerup_${pType}`, 36, 20);
    });

    // 9. Bricks (64 x 26) in various themes
    const brickColors = [0x06b6d4, 0x10b981, 0xec4899, 0x8b5cf6, 0xf59e0b, 0xef4444];
    brickColors.forEach((color, i) => {
      g.clear();
      // base
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, 64, 26, 4);
      // highlight border
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(2, 2, 60, 4);
      g.fillRect(2, 2, 4, 22);
      // shadow border
      g.fillStyle(0x000000, 0.35);
      g.fillRect(4, 22, 58, 3);
      g.fillRect(60, 4, 3, 20);
      g.generateTexture(`brick_${i}`, 64, 26);
    });

    // Armored Brick (Metal)
    g.clear();
    g.fillStyle(0x64748b, 1);
    g.fillRoundedRect(0, 0, 64, 26, 4);
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(3, 3, 58, 4);
    g.fillStyle(0x334155, 1);
    g.fillRect(3, 20, 58, 4);
    // Rivets
    g.fillStyle(0xf1f5f9, 1);
    g.fillCircle(8, 8, 2);
    g.fillCircle(56, 8, 2);
    g.fillCircle(8, 18, 2);
    g.fillCircle(56, 18, 2);
    g.generateTexture('brick_metal', 64, 26);

    // Explosive Brick (Bomb icon)
    g.clear();
    g.fillStyle(0xb91c1c, 1);
    g.fillRoundedRect(0, 0, 64, 26, 4);
    g.fillStyle(0xf87171, 1);
    g.fillRect(3, 3, 58, 3);
    g.fillStyle(0xfacc15, 1);
    // Warning stripes
    g.fillTriangle(32, 6, 24, 20, 40, 20);
    g.fillStyle(0x000000, 1);
    g.fillCircle(32, 16, 2);
    g.fillRect(31, 10, 2, 4);
    g.generateTexture('brick_explosive', 64, 26);

    // 10. Boss Textures
    // Stage 1 Boss: GOLIATH CORE (140 x 90)
    g.clear();
    g.fillStyle(0x0e7490, 1);
    g.fillRoundedRect(10, 10, 120, 70, 12);
    g.fillStyle(0x06b6d4, 1);
    g.fillRoundedRect(20, 20, 100, 50, 8);
    // Glowing central eye
    g.fillStyle(0xffffff, 1);
    g.fillCircle(70, 45, 18);
    g.fillStyle(0xef4444, 1);
    g.fillCircle(70, 45, 12);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(68, 43, 4);
    // Side thrusters
    g.fillStyle(0x334155, 1);
    g.fillRect(0, 25, 12, 40);
    g.fillRect(128, 25, 12, 40);
    g.generateTexture('boss_1', 140, 90);

    // Stage 2 Boss: MECHA TITAN (160 x 100)
    g.clear();
    g.fillStyle(0xc2410c, 1);
    g.fillRoundedRect(15, 10, 130, 80, 14);
    g.fillStyle(0xf97316, 1);
    g.fillRoundedRect(25, 20, 110, 60, 8);
    // Dual missile bays
    g.fillStyle(0x1e293b, 1);
    g.fillRect(35, 30, 25, 35);
    g.fillRect(100, 30, 25, 35);
    g.fillStyle(0xf87171, 1);
    g.fillCircle(47, 42, 6);
    g.fillCircle(47, 56, 6);
    g.fillCircle(112, 42, 6);
    g.fillCircle(112, 56, 6);
    // Central power reactor
    g.fillStyle(0xfacc15, 1);
    g.fillCircle(80, 50, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(80, 50, 6);
    g.generateTexture('boss_2', 160, 100);

    // Stage 3 Boss: HYDRA DREADNOUGHT (180 x 110)
    g.clear();
    g.fillStyle(0x6b21a8, 1);
    g.fillRoundedRect(15, 10, 150, 90, 16);
    g.fillStyle(0xa855f7, 1);
    g.fillRoundedRect(30, 20, 120, 70, 10);
    // Triple energy cores
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(50, 55, 14);
    g.fillCircle(90, 55, 16);
    g.fillCircle(130, 55, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(50, 55, 5);
    g.fillCircle(90, 55, 7);
    g.fillCircle(130, 55, 5);
    g.generateTexture('boss_3', 180, 110);

    // Stage 4 Boss: CHRONO OVERLORD (190 x 120)
    g.clear();
    g.fillStyle(0x9d174d, 1);
    g.fillRoundedRect(15, 10, 160, 100, 20);
    g.fillStyle(0xec4899, 1);
    g.fillRoundedRect(30, 20, 130, 80, 12);
    // Time vortex ring
    g.fillStyle(0xfacc15, 0.7);
    g.fillCircle(95, 60, 32);
    g.fillStyle(0x1e1b4b, 1);
    g.fillCircle(95, 60, 22);
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(95, 60, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(95, 60, 4);
    g.generateTexture('boss_4', 190, 120);

    g.destroy();
  }

  public create() {
    this.cameras.main.setBackgroundColor('#0b0f19');

    // Groups
    this.bricks = this.physics.add.staticGroup();
    this.balls = this.physics.add.group({
      bounceX: 1,
      bounceY: 1,
      collideWorldBounds: true
    });
    this.powerUpsGroup = this.physics.add.group();
    this.lasersGroup = this.physics.add.group();
    this.bossProjectilesGroup = this.physics.add.group();

    // Setup world bounds - disable bottom bounds so balls can fall
    this.physics.world.checkCollision.down = false;

    // Create Paddle
    this.paddle = this.physics.add.image(400, 840, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.setCollideWorldBounds(true);

    // Create Initial Ball
    this.createBall(400, 815);

    // Build Current Stage Bricks
    this.buildStage(this.currentStageIndex);

    // Collisions
    this.physics.add.collider(this.balls, this.paddle, this.handleBallPaddleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.collider(this.balls, this.bricks, this.handleBallBrickCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.paddle, this.powerUpsGroup, this.handlePaddlePowerUp as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.lasersGroup, this.bricks, this.handleLaserBrickCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.paddle, this.bossProjectilesGroup, this.handlePaddleBossProjectile as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      this.keySpace.on('down', () => {
        if (!this.ballLaunched) {
          this.launchBall();
        } else if (this.isLaserActive) {
          this.fireLasers();
        }
      });
    }

    // High-responsiveness Touch and Mouse Pointer handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === null) {
        this.activePointerId = pointer.id;
        this.isPointerDragging = true;
        this.pointerDownX = pointer.x;
        this.pointerDownY = pointer.y;
        this.pointerDownTime = this.time.now;
        this.paddleStartX = this.paddle.x;
        this.pointerMoveTargetX = null;
      } else {
        // Multi-touch secondary finger tap: quick fire or launch
        if (!this.ballLaunched) {
          this.launchBall();
        } else if (this.isLaserActive) {
          this.fireLasers();
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        if (this.sys.game.device.os.desktop) {
          this.pointerMoveTargetX = pointer.x;
        }
        return;
      }

      if (pointer.id === this.activePointerId) {
        this.isPointerDragging = true;

        // Direct responsive swipe displacement with calibrated 1.25x reach multiplier
        const totalDisplacement = (pointer.x - this.pointerDownX) * 1.25;
        const minX = this.paddle.width / 2;
        const maxX = 800 - this.paddle.width / 2;
        const targetX = Phaser.Math.Clamp(this.paddleStartX + totalDisplacement, minX, maxX);

        const prevX = this.paddle.x;
        this.paddle.x = targetX;
        if (this.paddle.body) {
          this.paddle.body.velocity.x = (targetX - prevX) * 60;
        }

        if (!this.ballLaunched) {
          this.stickBallToPaddle();
        }
      }
    });

    const handlePointerRelease = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        const duration = this.time.now - this.pointerDownTime;
        const moveDistX = Math.abs(pointer.x - this.pointerDownX);
        const moveDistY = Math.abs(pointer.y - this.pointerDownY);
        const totalMoved = Math.sqrt(moveDistX * moveDistX + moveDistY * moveDistY);

        this.isPointerDragging = false;
        this.activePointerId = null;
        this.pointerMoveTargetX = null;
        if (this.paddle && this.paddle.body) {
          this.paddle.setVelocityX(0);
        }

        // Tap detection: short duration (< 250ms) and minimal movement (< 15px) acts as tap/click
        if (duration < 250 && totalMoved < 15) {
          if (!this.ballLaunched) {
            this.launchBall();
          } else if (this.isLaserActive) {
            this.fireLasers();
          }
        }
      }
    };

    this.input.on('pointerup', handlePointerRelease);
    this.input.on('pointerupoutside', handlePointerRelease);
    this.input.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.isPointerDragging = false;
        this.activePointerId = null;
        this.pointerMoveTargetX = null;
        if (this.paddle && this.paddle.body) {
          this.paddle.setVelocityX(0);
        }
      }
    });

    // Notify React of initial states
    this.bridge.onScoreUpdate(this.score, 1, 0);
    this.bridge.onLivesUpdate(this.lives);
    this.bridge.onStageUpdate(this.currentStageIndex + 1, STAGES[this.currentStageIndex].name);
    this.bridge.onGameStatusChange('READY');
  }

  private createBall(x: number, y: number, velX: number = 0, velY: number = 0): Phaser.Physics.Arcade.Image {
    const ball = this.balls.create(x, y, this.isFireballActive ? 'fireball' : 'ball') as Phaser.Physics.Arcade.Image;
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.setVelocity(velX, velY);
    ball.setData('isFireball', this.isFireballActive);
    return ball;
  }

  private launchBall() {
    if (this.ballLaunched) return;
    this.ballLaunched = true;
    this.gameStatus = this.bossActive ? 'BOSS_FIGHT' : 'PLAYING';
    this.bridge.onGameStatusChange(this.gameStatus);

    const stageSpeed = STAGES[this.currentStageIndex]?.ballSpeed || 350;
    const initialAngle = Phaser.Math.Between(-45, 45) - 90; // upward spread
    const rad = Phaser.Math.DegToRad(initialAngle);

    const firstBall = this.balls.getFirstAlive() as Phaser.Physics.Arcade.Image;
    if (firstBall) {
      firstBall.setVelocity(Math.cos(rad) * stageSpeed, Math.sin(rad) * stageSpeed);
    }
    soundManager.playPaddleHit(2);
  }

  public launchBallExternal() {
    this.launchBall();
  }

  public movePaddleExternal(direction: -1 | 1 | 0) {
    if (!this.paddle || !this.paddle.active) return;
    const speed = 18;
    this.paddle.x = Phaser.Math.Clamp(this.paddle.x + direction * speed, this.paddle.width / 2, 800 - this.paddle.width / 2);
    if (!this.ballLaunched) {
      this.stickBallToPaddle();
    }
  }

  public movePaddleByDelta(deltaX: number) {
    if (!this.paddle || !this.paddle.active) return;
    const minX = this.paddle.width / 2;
    const maxX = 800 - this.paddle.width / 2;
    const newX = Phaser.Math.Clamp(this.paddle.x + deltaX, minX, maxX);
    const speedX = (newX - this.paddle.x) * 60;
    this.paddle.x = newX;
    if (this.paddle.body) {
      this.paddle.body.velocity.x = speedX;
    }
    if (!this.ballLaunched) {
      this.stickBallToPaddle();
    }
  }

  public stopPaddle() {
    if (this.paddle && this.paddle.body) {
      this.paddle.setVelocityX(0);
    }
    this.isPointerDragging = false;
    this.activePointerId = null;
    this.pointerMoveTargetX = null;
  }

  public fireLasersExternal() {
    if (this.isLaserActive) {
      this.fireLasers();
    } else if (!this.ballLaunched) {
      this.launchBall();
    }
  }

  private buildStage(stageIdx: number) {
    this.bricks.clear(true, true);
    const rows = 4 + stageIdx;
    const cols = 9;
    const brickWidth = 64;
    const brickHeight = 26;
    const paddingX = 14;
    const paddingY = 12;
    const startX = (800 - (cols * brickWidth + (cols - 1) * paddingX)) / 2 + brickWidth / 2;
    const startY = 120;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Stage pattern variation
        if (stageIdx === 1 && (r + c) % 4 === 0) continue; // checkered gaps
        if (stageIdx === 2 && (r === 1 || r === 3) && c % 2 === 1) continue;

        const x = startX + c * (brickWidth + paddingX);
        const y = startY + r * (brickHeight + paddingY);

        let type: BrickType = 'normal';
        let texture = `brick_${(r + stageIdx) % 6}`;
        let hits = 1;

        // Armored bricks in later stages
        if (stageIdx >= 1 && (r === 0 || (r === 2 && c % 3 === 0))) {
          type = 'metal';
          texture = 'brick_metal';
          hits = 2;
        } else if ((r * cols + c) % 7 === 0) {
          type = 'explosive';
          texture = 'brick_explosive';
          hits = 1;
        }

        const brick = this.bricks.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
        brick.setData('type', type);
        brick.setData('hits', hits);
        brick.setData('maxHits', hits);
        brick.setData('points', type === 'metal' ? 250 : type === 'explosive' ? 200 : 100 * (rows - r));
        brick.refreshBody();
      }
    }
  }

  private handleBallPaddleCollision(
    ballObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    paddleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const ball = ballObj as Phaser.Physics.Arcade.Image;
    const paddle = paddleObj as Phaser.Physics.Arcade.Image;

    // Calculate angle based on where the ball hits the paddle
    const diff = ball.x - paddle.x;
    const halfWidth = paddle.width / 2;
    const normalized = Phaser.Math.Clamp(diff / halfWidth, -0.9, 0.9);

    const stageSpeed = (STAGES[this.currentStageIndex]?.ballSpeed || 350) * (this.activeTimers.has('slow') ? 0.75 : 1);
    const angle = normalized * 65 - 90; // -155 to -25 degrees
    const rad = Phaser.Math.DegToRad(angle);

    ball.setVelocity(Math.cos(rad) * stageSpeed, Math.sin(rad) * stageSpeed);

    // Pitch rises with paddle deflection
    soundManager.playPaddleHit(Math.abs(normalized) * 8);

    // Reset combo if it was idle
    this.scheduleComboReset();
  }

  private handleBallBrickCollision(
    ballObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    brickObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const ball = ballObj as Phaser.Physics.Arcade.Image;
    const brick = brickObj as Phaser.Physics.Arcade.Sprite;
    const isFireball = ball.getData('isFireball') === true;

    this.hitBrick(brick, isFireball ? 2 : 1, isFireball);

    // Prevent ball from bouncing if it's a fireball
    if (isFireball) {
      // Fireball passes straight through without velocity reversal
    }
  }

  private hitBrick(brick: Phaser.Physics.Arcade.Sprite, damage: number = 1, isFireball: boolean = false) {
    if (!brick.active) return;

    let hits = (brick.getData('hits') as number) - damage;
    const type = brick.getData('type') as BrickType;

    if (hits > 0 && !isFireball) {
      brick.setData('hits', hits);
      soundManager.playBrickHit();
      // Crack tint flash
      brick.setTint(0xffffff);
      this.time.delayedCall(80, () => {
        if (brick.active) brick.clearTint();
      });
      return;
    }

    // Destroyed!
    const points = (brick.getData('points') as number) || 100;
    this.addScore(points);

    // Explode particles
    this.createBreakParticles(brick.x, brick.y);

    if (type === 'explosive') {
      soundManager.playBrickBreak(true);
      this.cameras.main.shake(150, 0.008);
      // Explode nearby bricks in radius 90px
      const nearbyBricks = this.bricks.getChildren().filter((b) => {
        const other = b as Phaser.Physics.Arcade.Sprite;
        return other.active && Phaser.Math.Distance.Between(brick.x, brick.y, other.x, other.y) < 95;
      });
      brick.destroy();
      nearbyBricks.forEach(nb => {
        this.hitBrick(nb as Phaser.Physics.Arcade.Sprite, 2, true);
      });
    } else {
      soundManager.playBrickBreak(false);
      brick.destroy();
    }

    // Check power-up drop (28% chance)
    if (Math.random() < 0.28) {
      this.spawnPowerUp(brick.x, brick.y);
    }

    // Check if stage bricks cleared
    const remaining = this.bricks.countActive();
    if (remaining === 0 && !this.bossActive) {
      this.triggerBossEncounter();
    }
  }

  private handleLaserBrickCollision(
    laserObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    brickObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const laser = laserObj as Phaser.Physics.Arcade.Image;
    const brick = brickObj as Phaser.Physics.Arcade.Sprite;

    laser.destroy();
    this.hitBrick(brick, 1, false);
  }

  private spawnPowerUp(x: number, y: number) {
    const types: PowerUpType[] = ['laser', 'multiball', 'expand', 'fireball', 'shield', 'slow', 'life', 'bomb'];
    const chosen = types[Phaser.Math.Between(0, types.length - 1)];

    const p = this.powerUpsGroup.create(x, y, `powerup_${chosen}`) as Phaser.Physics.Arcade.Image;
    p.setVelocityY(140);
    p.setData('type', chosen);
    soundManager.playPowerupSpawn();
  }

  private handlePaddlePowerUp(
    _paddleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    powerUpObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const powerUp = powerUpObj as Phaser.Physics.Arcade.Image;
    const type = powerUp.getData('type') as PowerUpType;
    powerUp.destroy();

    this.activatePowerUp(type);
  }

  private activatePowerUp(type: PowerUpType) {
    const info = POWER_UPS[type];
    soundManager.playPowerupCollect();
    this.addScore(250);

    // Floating text prompt
    this.showFloatingNotice(`+${info.name.toUpperCase()}`, this.paddle.x, this.paddle.y - 30, info.color);

    switch (type) {
      case 'laser':
        this.isLaserActive = true;
        this.startPowerUpTimer('laser', info.duration, () => {
          this.isLaserActive = false;
        });
        break;

      case 'multiball': {
        const activeBalls = this.balls.getChildren().filter(b => b.active) as Phaser.Physics.Arcade.Image[];
        activeBalls.forEach(b => {
          const vx = b.body?.velocity.x || 100;
          const vy = b.body?.velocity.y || -300;
          this.createBall(b.x, b.y, vx * 0.8 - 120, vy * 0.9);
          this.createBall(b.x, b.y, vx * 0.8 + 120, vy * 0.9);
        });
        break;
      }

      case 'expand':
        this.paddle.setTexture('paddle_wide');
        this.paddle.setSize(180, 22);
        this.startPowerUpTimer('expand', info.duration, () => {
          this.paddle.setTexture('paddle');
          this.paddle.setSize(120, 22);
        });
        break;

      case 'fireball':
        this.isFireballActive = true;
        this.balls.getChildren().forEach(b => {
          const ball = b as Phaser.Physics.Arcade.Image;
          ball.setTexture('fireball');
          ball.setData('isFireball', true);
        });
        this.startPowerUpTimer('fireball', info.duration, () => {
          this.isFireballActive = false;
          this.balls.getChildren().forEach(b => {
            const ball = b as Phaser.Physics.Arcade.Image;
            ball.setTexture('ball');
            ball.setData('isFireball', false);
          });
        });
        break;

      case 'shield':
        this.activateFloorBarrier();
        break;

      case 'slow': {
        const currentSpeed = STAGES[this.currentStageIndex]?.ballSpeed || 350;
        this.balls.getChildren().forEach(b => {
          const ball = b as Phaser.Physics.Arcade.Image;
          if (ball.body) {
            ball.body.velocity.scale(0.75);
          }
        });
        this.startPowerUpTimer('slow', info.duration, () => {
          this.balls.getChildren().forEach(b => {
            const ball = b as Phaser.Physics.Arcade.Image;
            if (ball.body) {
              const currentV = ball.body.velocity.length();
              if (currentV > 0) {
                ball.body.velocity.scale(currentSpeed / currentV);
              }
            }
          });
        });
        break;
      }

      case 'life':
        if (this.lives < 5) {
          this.lives++;
          this.bridge.onLivesUpdate(this.lives);
        }
        break;

      case 'bomb':
        this.cameras.main.shake(250, 0.012);
        soundManager.playBrickBreak(true);
        if (this.bossActive && this.boss) {
          this.damageBoss(160);
        } else {
          // Destroy random 5 bricks
          const activeBricks = this.bricks.getChildren().filter(b => b.active) as Phaser.Physics.Arcade.Sprite[];
          for (let i = 0; i < Math.min(6, activeBricks.length); i++) {
            this.hitBrick(activeBricks[i], 2, true);
          }
        }
        break;
    }

    this.notifyActivePowerUps();
  }

  private startPowerUpTimer(type: PowerUpType, duration: number, onExpire: () => void) {
    if (this.activeTimers.has(type)) {
      const existing = this.activeTimers.get(type)!;
      if (existing.timer) existing.timer.remove();
    }

    const timer = this.time.delayedCall(duration * 1000, () => {
      this.activeTimers.delete(type);
      onExpire();
      this.notifyActivePowerUps();
    });

    this.activeTimers.set(type, { remaining: duration, timer });
    this.notifyActivePowerUps();
  }

  private notifyActivePowerUps() {
    const list: { type: PowerUpType; remaining: number }[] = [];
    this.activeTimers.forEach((data, type) => {
      list.push({ type, remaining: Math.round(data.remaining) });
    });
    this.bridge.onPowerUpsUpdate(list);
  }

  private activateFloorBarrier() {
    if (this.hasFloorBarrier) return;
    this.hasFloorBarrier = true;
    if (this.floorBarrier) this.floorBarrier.destroy();

    this.floorBarrier = this.add.rectangle(400, 890, 800, 10, 0x8b5cf6, 0.85);
    this.physics.add.existing(this.floorBarrier, true);

    this.physics.add.collider(this.balls, this.floorBarrier, (_ball, _barrier) => {
      soundManager.playShieldDeflect();
      this.showFloatingNotice('BARRIER ABSORB!', 400, 860, '#8b5cf6');
      this.cameras.main.shake(120, 0.005);
      if (this.floorBarrier) {
        this.floorBarrier.destroy();
        this.floorBarrier = null;
      }
      this.hasFloorBarrier = false;
    });
  }

  private fireLasers() {
    const now = this.time.now;
    if (now < this.nextLaserTime) return;
    this.nextLaserTime = now + 240;

    const leftX = this.paddle.x - this.paddle.width / 2 + 12;
    const rightX = this.paddle.x + this.paddle.width / 2 - 12;
    const y = this.paddle.y - 14;

    const l1 = this.lasersGroup.create(leftX, y, 'laser') as Phaser.Physics.Arcade.Image;
    const l2 = this.lasersGroup.create(rightX, y, 'laser') as Phaser.Physics.Arcade.Image;
    l1.setVelocityY(-650);
    l2.setVelocityY(-650);

    soundManager.playLaserShoot();
  }

  // BOSS FIGHT SYSTEM
  private triggerBossEncounter() {
    this.bossActive = true;
    this.gameStatus = 'BOSS_ALERT';
    this.bridge.onGameStatusChange(this.gameStatus);

    soundManager.playBossAlert();
    this.cameras.main.flash(400, 239, 68, 68);

    // Warning Banner
    const warningText = this.add.text(400, 360, '⚠️ WARNING: BOSS DETECTED ⚠️', {
      fontFamily: 'Chakra Petch',
      fontSize: '34px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: warningText,
      alpha: { from: 1, to: 0.2 },
      yoyo: true,
      repeat: 4,
      duration: 250,
      onComplete: () => {
        warningText.destroy();
        this.spawnBoss();
      }
    });
  }

  private spawnBoss() {
    const stage = STAGES[this.currentStageIndex];
    const bossConfig = stage.boss;
    this.bossHealth = bossConfig.maxHealth;
    this.bossMaxHealth = bossConfig.maxHealth;

    const bossKey = `boss_${this.currentStageIndex + 1}`;
    this.boss = this.physics.add.sprite(400, -80, bossKey);
    this.boss.setImmovable(true);

    this.bridge.onBossUpdate(bossConfig.name, this.bossHealth, this.bossMaxHealth, true);
    this.gameStatus = 'BOSS_FIGHT';
    this.bridge.onGameStatusChange(this.gameStatus);

    // Entrance Tween
    this.tweens.add({
      targets: this.boss,
      y: 180,
      duration: 1800,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startBossBehavior(bossConfig);
      }
    });

    // Boss Collisions
    this.physics.add.collider(this.balls, this.boss, this.handleBallBossCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.lasersGroup, this.boss, this.handleLaserBossCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private startBossBehavior(bossConfig: typeof STAGES[0]['boss']) {
    if (!this.boss) return;

    // Movement: Left-Right sweep
    this.bossMoveTween = this.tweens.add({
      targets: this.boss,
      x: { from: 180, to: 620 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Attack timer
    this.bossAttackTimer = this.time.addEvent({
      delay: bossConfig.attackInterval,
      callback: () => this.executeBossAttack(),
      loop: true
    });
  }

  private executeBossAttack() {
    if (!this.boss || !this.boss.active) return;
    soundManager.playBossAttack();

    const stageIdx = this.currentStageIndex;
    if (stageIdx === 0) {
      // Single spark aimed downwards
      const bullet = this.bossProjectilesGroup.create(this.boss.x, this.boss.y + 40, 'boss_bullet') as Phaser.Physics.Arcade.Image;
      bullet.setVelocityY(260);
    } else if (stageIdx === 1) {
      // Dual spread missiles
      const b1 = this.bossProjectilesGroup.create(this.boss.x - 30, this.boss.y + 40, 'boss_bullet') as Phaser.Physics.Arcade.Image;
      const b2 = this.bossProjectilesGroup.create(this.boss.x + 30, this.boss.y + 40, 'boss_bullet') as Phaser.Physics.Arcade.Image;
      b1.setVelocity(-80, 280);
      b2.setVelocity(80, 280);
    } else if (stageIdx >= 2) {
      // Triple barrage
      [-100, 0, 100].forEach(vx => {
        const b = this.bossProjectilesGroup.create(this.boss!.x, this.boss!.y + 45, 'boss_bullet') as Phaser.Physics.Arcade.Image;
        b.setVelocity(vx, 300);
      });
    }
  }

  private handleBallBossCollision(
    ballObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bossObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const ball = ballObj as Phaser.Physics.Arcade.Image;
    const isFireball = ball.getData('isFireball') === true;
    const dmg = isFireball ? 45 : 22;

    this.damageBoss(dmg);
    soundManager.playBossHit();

    // Deflect ball with angle
    const diff = ball.x - (bossObj as Phaser.GameObjects.Sprite).x;
    ball.setVelocityX(diff * 4);
  }

  private handleLaserBossCollision(
    laserObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _bossObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    laserObj.destroy();
    this.damageBoss(12);
    soundManager.playBossHit();
  }

  private handlePaddleBossProjectile(
    _paddleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    projObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    projObj.destroy();
    this.paddleHitByEnemy();
  }

  private paddleHitByEnemy() {
    this.cameras.main.shake(200, 0.012);
    soundManager.playBallLost();
    this.showFloatingNotice('HULL DAMAGED!', this.paddle.x, this.paddle.y - 40, '#ef4444');

    this.lives--;
    this.bridge.onLivesUpdate(this.lives);

    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      // Paddle invulnerability flicker
      this.tweens.add({
        targets: this.paddle,
        alpha: { from: 0.3, to: 1 },
        duration: 100,
        repeat: 6
      });
    }
  }

  private damageBoss(amount: number) {
    if (!this.boss || !this.boss.active) return;
    this.bossHealth = Math.max(0, this.bossHealth - amount);
    this.addScore(amount * 10);

    const stage = STAGES[this.currentStageIndex];
    this.bridge.onBossUpdate(stage.boss.name, this.bossHealth, this.bossMaxHealth, true);

    // Hit flash
    this.boss.setTint(0xffffff);
    this.time.delayedCall(90, () => {
      if (this.boss && this.boss.active) this.boss.clearTint();
    });

    if (this.bossHealth <= 0) {
      this.defeatBoss();
    }
  }

  private defeatBoss() {
    if (!this.boss) return;
    this.bossActive = false;
    this.bossesDefeated++;
    this.bridge.onBossUpdate('', 0, 0, false);

    if (this.bossAttackTimer) this.bossAttackTimer.remove();
    if (this.bossMoveTween) this.bossMoveTween.stop();

    soundManager.playBossDefeat();
    this.cameras.main.shake(800, 0.02);

    // Defeat Confetti burst!
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.3 }
    });

    // Score Bonus
    const bonus = 10000 * (this.currentStageIndex + 1);
    this.addScore(bonus);
    this.showFloatingNotice(`BOSS DEFEATED! +${bonus.toLocaleString()} PTS`, 400, 250, '#facc15');

    // Boss death animation
    this.tweens.add({
      targets: this.boss,
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.6,
      angle: 180,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.boss?.destroy();
        this.boss = null;
        this.handleStageCompleted();
      }
    });
  }

  private handleStageCompleted() {
    soundManager.playStageClear();
    this.gameStatus = 'STAGE_CLEAR';
    this.bridge.onGameStatusChange(this.gameStatus);

    const isLastStage = this.currentStageIndex >= STAGES.length - 1;

    this.time.delayedCall(2400, () => {
      if (isLastStage) {
        this.handleVictory();
      } else {
        this.currentStageIndex++;
        this.scene.restart({ bridge: this.bridge, stageIndex: this.currentStageIndex });
      }
    });
  }

  private handleVictory() {
    this.gameStatus = 'VICTORY';
    this.bridge.onGameStatusChange('VICTORY');
    soundManager.playStageClear();
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.4 }
    });
    this.bridge.onVictory(this.score, this.bossesDefeated);
  }

  private handleGameOver() {
    this.gameStatus = 'GAME_OVER';
    this.bridge.onGameStatusChange('GAME_OVER');
    soundManager.playGameOver();
    this.bridge.onGameOver(this.score, this.currentStageIndex + 1, this.bossesDefeated);
  }

  private addScore(pts: number) {
    this.comboCount++;
    const multiplier = Math.min(5, 1 + Math.floor(this.comboCount / 5) * 0.5);
    const added = Math.round(pts * multiplier);
    this.score += added;
    this.bridge.onScoreUpdate(this.score, multiplier, this.comboCount);
    this.scheduleComboReset();
  }

  private scheduleComboReset() {
    if (this.comboResetTimer) this.comboResetTimer.remove();
    this.comboResetTimer = this.time.delayedCall(2800, () => {
      this.comboCount = 0;
      this.bridge.onScoreUpdate(this.score, 1, 0);
    });
  }

  private createBreakParticles(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(x, y, 'spark');
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(80, 220);
      const rad = Phaser.Math.DegToRad(angle);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(rad) * speed * 0.35,
        y: y + Math.sin(rad) * speed * 0.35,
        alpha: 0,
        scale: 0.2,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }
  }

  private showFloatingNotice(text: string, x: number, y: number, color: string) {
    const notice = this.add.text(x, y, text, {
      fontFamily: 'Chakra Petch',
      fontSize: '18px',
      color,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: notice,
      y: y - 35,
      alpha: 0,
      duration: 1200,
      onComplete: () => notice.destroy()
    });
  }

  private stickBallToPaddle() {
    const ball = this.balls.getFirstAlive() as Phaser.Physics.Arcade.Image;
    if (ball && !this.ballLaunched) {
      ball.x = this.paddle.x;
      ball.y = this.paddle.y - 25;
      ball.setVelocity(0, 0);
    }
  }

  public update(_time: number, delta: number) {
    if (this.isPaused) return;

    // Paddle Movement via Keyboard
    const paddleSpeed = 650;
    if (this.cursors.left.isDown || this.keyA.isDown) {
      this.paddle.setVelocityX(-paddleSpeed);
      this.pointerMoveTargetX = null;
      this.isPointerDragging = false;
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.paddle.setVelocityX(paddleSpeed);
      this.pointerMoveTargetX = null;
      this.isPointerDragging = false;
    } else if (!this.isPointerDragging && this.pointerMoveTargetX !== null) {
      // Smooth desktop mouse follow
      const diff = this.pointerMoveTargetX - this.paddle.x;
      if (Math.abs(diff) > 4) {
        this.paddle.setVelocityX(diff * 14);
      } else {
        this.paddle.setVelocityX(0);
      }
    } else if (!this.isPointerDragging) {
      this.paddle.setVelocityX(0);
    }

    // Keep ball on paddle before launch
    if (!this.ballLaunched) {
      this.stickBallToPaddle();
    }

    // Clean up out-of-bounds power-ups & boss bullets
    this.powerUpsGroup.getChildren().forEach(p => {
      const obj = p as Phaser.Physics.Arcade.Image;
      if (obj.y > 920) obj.destroy();
    });

    this.bossProjectilesGroup.getChildren().forEach(bp => {
      const obj = bp as Phaser.Physics.Arcade.Image;
      if (obj.y > 920) obj.destroy();
    });

    this.lasersGroup.getChildren().forEach(l => {
      const obj = l as Phaser.Physics.Arcade.Image;
      if (obj.y < -20) obj.destroy();
    });

    // Check balls falling below bottom bounds
    const activeBalls = this.balls.getChildren().filter(b => b.active) as Phaser.Physics.Arcade.Image[];
    activeBalls.forEach(ball => {
      // Prevent ball from getting trapped horizontally
      if (ball.body && Math.abs(ball.body.velocity.y) < 60) {
        ball.setVelocityY(ball.body.velocity.y > 0 ? 120 : -120);
      }

      if (ball.y > 910) {
        ball.destroy();
      }
    });

    // If all balls lost
    if (this.ballLaunched && this.balls.countActive() === 0) {
      this.handleBallLost();
    }
  }

  private handleBallLost() {
    soundManager.playBallLost();
    this.cameras.main.shake(200, 0.01);
    this.lives--;
    this.bridge.onLivesUpdate(this.lives);

    // Cancel active power-ups
    this.activeTimers.forEach(data => {
      if (data.timer) data.timer.remove();
    });
    this.activeTimers.clear();
    this.isLaserActive = false;
    this.isFireballActive = false;
    this.paddle.setTexture('paddle');
    this.paddle.setSize(120, 22);
    this.notifyActivePowerUps();

    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      this.ballLaunched = false;
      this.paddle.x = 400;
      this.createBall(400, 815);
      this.gameStatus = 'READY';
      this.bridge.onGameStatusChange('READY');
      this.showFloatingNotice('BALL LOST!', 400, 800, '#f87171');
    }
  }

  public restartGame() {
    this.score = 0;
    this.lives = 3;
    this.currentStageIndex = 0;
    this.bossesDefeated = 0;
    this.comboCount = 0;
    this.ballLaunched = false;
    this.scene.restart({ bridge: this.bridge, stageIndex: 0 });
  }

  public nextStage() {
    if (this.currentStageIndex < STAGES.length - 1) {
      this.currentStageIndex++;
      this.scene.restart({ bridge: this.bridge, stageIndex: this.currentStageIndex });
    }
  }
}
