/**
 * Web Audio API based retro-arcade sound synthesizer.
 * Operates without external audio files for zero latency and zero load failures.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.6;

  constructor() {
    // Check saved settings
    try {
      const saved = localStorage.getItem('bbg_sfx_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
      const savedVol = localStorage.getItem('bbg_sfx_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol);
      }
    } catch {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('bbg_sfx_enabled', String(val));
    } catch {
      // ignore
    }
  }

  public toggleEnabled(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playPowerupCollect();
    }
    return this.enabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('bbg_sfx_volume', String(this.volume));
    } catch {
      // ignore
    }
  }

  // Generic tone generator
  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    gainStart: number = 0.3,
    freqEnd?: number
  ) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), this.ctx.currentTime + duration);
      }

      const masterGain = gainStart * this.volume;
      gain.gain.setValueAtTime(masterGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // fallback safe
    }
  }

  // Noise generator for crunchy explosions
  private playNoise(duration: number, gainValue: number = 0.2, filterFreq: number = 800) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainValue * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // fallback
    }
  }

  public playPaddleHit(pitchOffset: number = 0) {
    const baseFreq = 380 + pitchOffset * 15;
    this.playTone(baseFreq, 'sine', 0.08, 0.25, baseFreq * 1.3);
  }

  public playBrickHit() {
    this.playTone(520, 'square', 0.05, 0.15, 300);
  }

  public playBrickBreak(isExplosive: boolean = false) {
    if (isExplosive) {
      this.playNoise(0.28, 0.35, 1200);
      this.playTone(180, 'sawtooth', 0.25, 0.3, 40);
    } else {
      this.playTone(440, 'triangle', 0.09, 0.2, 880);
      this.playNoise(0.06, 0.1, 900);
    }
  }

  public playPowerupSpawn() {
    this.playTone(800, 'sine', 0.15, 0.15, 1200);
  }

  public playPowerupCollect() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Pleasant ascending chord
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.12, 0.2);
      }, idx * 45);
    });
  }

  public playLaserShoot() {
    this.playTone(1200, 'sawtooth', 0.08, 0.2, 200);
  }

  public playBossAlert() {
    if (!this.enabled) return;
    // Dramatic klaxon alarm
    [0, 200, 400].forEach((delay) => {
      setTimeout(() => {
        this.playTone(400, 'sawtooth', 0.12, 0.35, 250);
      }, delay);
    });
  }

  public playBossHit() {
    this.playTone(140, 'sawtooth', 0.15, 0.4, 60);
    this.playNoise(0.12, 0.25, 600);
  }

  public playBossAttack() {
    this.playTone(280, 'triangle', 0.2, 0.25, 700);
  }

  public playBossDefeat() {
    if (!this.enabled) return;
    // Epic multi-explosion
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playNoise(0.3, 0.4, 900);
        this.playTone(180 - i * 30, 'sawtooth', 0.3, 0.35, 40);
      }, i * 180);
    }
  }

  public playShieldDeflect() {
    this.playTone(700, 'sine', 0.12, 0.25, 400);
    this.playNoise(0.08, 0.15, 1500);
  }

  public playBallLost() {
    this.playTone(320, 'sawtooth', 0.3, 0.3, 80);
  }

  public playStageClear() {
    if (!this.enabled) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.22, 0.25);
      }, i * 80);
    });
  }

  public playGameOver() {
    if (!this.enabled) return;
    const notes = [392, 370, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.25, freq * 0.9);
      }, i * 140);
    });
  }
}

export const soundManager = new SoundManager();
