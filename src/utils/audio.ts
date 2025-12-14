// Audio System with Web Audio API
class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  constructor() {
    this.init();
  }

  private init() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      
      this.masterGain.connect(this.context.destination);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      
      // Default volumes
      this.masterGain.gain.value = 0.7;
      this.sfxGain.gain.value = 1.0;
      this.musicGain.gain.value = 0.5;

      // Resume AudioContext on user interaction (required by some browsers)
      document.addEventListener('click', () => {
        if (this.context?.state === 'suspended') {
          this.context.resume();
        }
      }, { once: true });
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  // Generate procedural sound effects
  playShoot() {
    if (!this.context || !this.sfxGain) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  playHit() {
    if (!this.context || !this.sfxGain) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.15);
  }

  playEnemyDeath() {
    if (!this.context || !this.sfxGain) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }

  playPowerUp() {
    if (!this.context || !this.sfxGain) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.2);
  }

  playDamage() {
    if (!this.context || !this.sfxGain) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(150, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.6, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.2);
  }

  playPurchase() {
    if (!this.context || !this.sfxGain) return;
    
    // Happy chord
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain!);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.15, this.context!.currentTime + i * 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + 0.3 + i * 0.05);
      
      oscillator.start(this.context!.currentTime + i * 0.05);
      oscillator.stop(this.context!.currentTime + 0.3 + i * 0.05);
    });
  }

  // Boss-specific sounds
  playBossSpawn() {
    if (!this.context || !this.sfxGain) return;
    
    // Deep ominous rumble with dramatic sweep
    const oscillator1 = this.context.createOscillator();
    const oscillator2 = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator1.type = 'sawtooth';
    oscillator2.type = 'sine';
    
    // Low rumble
    oscillator1.frequency.setValueAtTime(40, this.context.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(80, this.context.currentTime + 1.0);
    
    // Harmonic sweep
    oscillator2.frequency.setValueAtTime(120, this.context.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 1.0);
    
    gainNode.gain.setValueAtTime(0.6, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1.2);
    
    oscillator1.start(this.context.currentTime);
    oscillator1.stop(this.context.currentTime + 1.2);
    oscillator2.start(this.context.currentTime);
    oscillator2.stop(this.context.currentTime + 1.2);
  }

  playBossPhaseChange() {
    if (!this.context || !this.sfxGain) return;
    
    // Dramatic phase transition sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.7, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.6);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.6);
  }

  playBossDeath() {
    if (!this.context || !this.sfxGain) return;
    
    // Epic death sound with multiple layers
    [100, 150, 200].forEach((freq, i) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain!);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(freq * 2, this.context!.currentTime + i * 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, this.context!.currentTime + 2.0 + i * 0.1);
      
      gainNode.gain.setValueAtTime(0.4, this.context!.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + 2.0 + i * 0.1);
      
      oscillator.start(this.context!.currentTime + i * 0.1);
      oscillator.stop(this.context!.currentTime + 2.0 + i * 0.1);
    });
  }

  playBossLaser() {
    if (!this.context || !this.sfxGain) return;
    
    // Laser beam sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(1200, this.context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.15);
  }

  playBossShockwave() {
    if (!this.context || !this.sfxGain) return;
    
    // Shockwave pulse
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(60, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.8, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.5);
  }

  playBossSpawnMinions() {
    if (!this.context || !this.sfxGain) return;
    
    // Spawning minions effect
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(300, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }

  // Boss music system
  private bossMusic: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    playing: boolean;
  } | null = null;

  startBossMusic() {
    if (!this.context || !this.musicGain || this.bossMusic?.playing) return;
    
    this.stopBossMusic(); // Stop any existing music
    
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    // Create pulsing boss battle music with rhythm
    const bassFreq = 65.41; // C2
    const now = this.context.currentTime;
    
    // Pulsing bass with rhythm (not constant drone)
    const bass = this.context.createOscillator();
    const bassGain = this.context.createGain();
    bass.type = 'sawtooth';
    bass.frequency.value = bassFreq;
    bass.connect(bassGain);
    bassGain.connect(this.musicGain);
    
    // Create rhythmic pulsing pattern instead of constant drone
    bassGain.gain.setValueAtTime(0, now);
    for (let i = 0; i < 100; i++) {
      const beatTime = now + i * 0.5;
      bassGain.gain.setValueAtTime(0.15, beatTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.3);
    }
    
    oscillators.push(bass);
    gains.push(bassGain);
    
    // Rhythm accent on every other beat
    const rhythm = this.context.createOscillator();
    const rhythmGain = this.context.createGain();
    rhythm.type = 'square';
    rhythm.frequency.value = bassFreq * 2;
    rhythm.connect(rhythmGain);
    rhythmGain.connect(this.musicGain);
    
    rhythmGain.gain.setValueAtTime(0, now);
    for (let i = 0; i < 50; i++) {
      const beatTime = now + i * 1.0;
      rhythmGain.gain.setValueAtTime(0.06, beatTime);
      rhythmGain.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.15);
    }
    
    oscillators.push(rhythm);
    gains.push(rhythmGain);
    
    // Start all oscillators
    oscillators.forEach(osc => osc.start());
    
    this.bossMusic = { oscillators, gains, playing: true };
  }

  stopBossMusic() {
    if (!this.bossMusic?.playing) return;
    
    // Fade out
    const fadeTime = 0.5;
    this.bossMusic.gains.forEach(gain => {
      if (this.context) {
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + fadeTime);
      }
    });
    
    // Stop and cleanup after fade
    setTimeout(() => {
      if (this.bossMusic) {
        this.bossMusic.oscillators.forEach(osc => osc.stop());
        this.bossMusic.oscillators = [];
        this.bossMusic.gains = [];
        this.bossMusic.playing = false;
      }
    }, fadeTime * 1000);
  }

  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setSFXVolume(volume: number) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setMusicVolume(volume: number) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Enemy-specific death sounds
  playFastDeath() {
    if (!this.context || !this.sfxGain) return;
    
    // High-pitched zap sound for Fast enemies
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.15);
  }

  playTankDeath() {
    if (!this.context || !this.sfxGain) return;
    
    // Deep heavy thud for Tank enemies
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.7, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.4);
  }

  playSplitterDeath() {
    if (!this.context || !this.sfxGain) return;
    
    // Splitting sound - two quick pops
    for (let i = 0; i < 2; i++) {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(400 + i * 100, this.context.currentTime + i * 0.05);
      oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1 + i * 0.05);
      
      gainNode.gain.setValueAtTime(0.35, this.context.currentTime + i * 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1 + i * 0.05);
      
      oscillator.start(this.context.currentTime + i * 0.05);
      oscillator.stop(this.context.currentTime + 0.1 + i * 0.05);
    }
  }

  playShooterDeath() {
    if (!this.context || !this.sfxGain) return;
    
    // Electric discharge sound for Shooter enemies
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.25);
    
    gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.25);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.25);
  }

  playBufferDeath() {
    if (!this.context || !this.sfxGain) return;
    
    // Magical dispersion sound for Buffer
    [400, 500, 600].forEach((freq, i) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain!);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context!.currentTime + i * 0.04);
      oscillator.frequency.exponentialRampToValueAtTime(100, this.context!.currentTime + 0.3 + i * 0.04);
      
      gainNode.gain.setValueAtTime(0.3, this.context!.currentTime + i * 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + 0.3 + i * 0.04);
      
      oscillator.start(this.context!.currentTime + i * 0.04);
      oscillator.stop(this.context!.currentTime + 0.3 + i * 0.04);
    });
  }

  playExplosion() {
    if (!this.context || !this.sfxGain) return;
    
    // Bomb explosion sound - loud boom
    const oscillator1 = this.context.createOscillator();
    const oscillator2 = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator1.type = 'sawtooth';
    oscillator2.type = 'triangle';
    
    oscillator1.frequency.setValueAtTime(100, this.context.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(20, this.context.currentTime + 0.5);
    
    oscillator2.frequency.setValueAtTime(200, this.context.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.8, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
    
    oscillator1.start(this.context.currentTime);
    oscillator1.stop(this.context.currentTime + 0.5);
    oscillator2.start(this.context.currentTime);
    oscillator2.stop(this.context.currentTime + 0.5);
  }

  playIceShatter() {
    if (!this.context || !this.sfxGain) return;
    
    // Ice shattering sound - crystalline break
    for (let i = 0; i < 4; i++) {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1800 - i * 200, this.context.currentTime + i * 0.02);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.12 + i * 0.02);
      
      gainNode.gain.setValueAtTime(0.3, this.context.currentTime + i * 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.12 + i * 0.02);
      
      oscillator.start(this.context.currentTime + i * 0.02);
      oscillator.stop(this.context.currentTime + 0.12 + i * 0.02);
    }
  }

  playTeleport() {
    if (!this.context || !this.sfxGain) return;
    
    // Whoosh teleport sound for Lufti
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(300, this.context.currentTime + 0.16);
    
    gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.16);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.16);
  }
}

export const audioSystem = new AudioSystem();
