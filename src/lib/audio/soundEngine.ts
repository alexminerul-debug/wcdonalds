export class SoundEngine {
  private static instance: SoundEngine | null = null;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private constructor() {
    this.initContext();
  }

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  private initContext() {
    if (!this.context || this.context.state === 'closed') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.context.destination);
      } catch (e) {
        console.error("AudioContext not supported", e);
      }
    }
  }

  public resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public playChime() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    
    // First tone
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second tone
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.2); // E5
    gain2.gain.setValueAtTime(0, now + 0.2);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.7);
  }

  public playAlarm() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const startTime = now + (i * 0.5);
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, startTime);
      osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.4);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    }
  }

  public playCashRegister() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playJumpscare() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    
    // Bass hit
    const bassOsc = this.context.createOscillator();
    const bassGain = this.context.createGain();
    bassOsc.type = 'square';
    bassOsc.frequency.setValueAtTime(100, now);
    bassOsc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(1, now + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 1.5);

    // High shriek
    const shriekOsc = this.context.createOscillator();
    const shriekGain = this.context.createGain();
    shriekOsc.type = 'sawtooth';
    shriekOsc.frequency.setValueAtTime(2000, now);
    shriekOsc.frequency.linearRampToValueAtTime(3000, now + 0.2);
    shriekGain.gain.setValueAtTime(0, now);
    shriekGain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    shriekGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    shriekOsc.connect(shriekGain);
    shriekGain.connect(this.masterGain);
    shriekOsc.start(now);
    shriekOsc.stop(now + 0.8);
  }

  public playStaticNoise() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    
    const bufferSize = this.context.sampleRate; // 1 second
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.setValueAtTime(0.2, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + 1);
    
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 1);
  }

  public playDetectionPing() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public dispose() {
    if (this.context) {
      this.context.close();
      this.context = null;
      SoundEngine.instance = null;
    }
  }
}
