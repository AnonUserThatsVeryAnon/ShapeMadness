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
}

export const audioSystem = new AudioSystem();
