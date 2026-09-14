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

  // Cyber terminal breach / modem glitch sound
  public playTerminalHacking() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;

    for (let i = 0; i < 8; i++) {
      const startTime = now + i * 0.08;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
      const freq = 300 + Math.random() * 1600;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.07);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.07);
    }
  }

  // Screen shattering / glass break sound effect
  public playGlassShatter() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;

    // White noise explosion burst
    const bufferSize = Math.floor(this.context.sampleRate * 0.5);
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.12));
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // High pitched crystal shards
    [2400, 3100, 4200, 5600].forEach((freq, idx) => {
      if (!this.context || !this.masterGain) return;
      const shardOsc = this.context.createOscillator();
      const shardGain = this.context.createGain();
      shardOsc.type = 'triangle';
      shardOsc.frequency.setValueAtTime(freq + Math.random() * 400, now + idx * 0.04);

      shardGain.gain.setValueAtTime(0.2, now + idx * 0.04);
      shardGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      shardOsc.connect(shardGain);
      shardGain.connect(this.masterGain);
      shardOsc.start(now + idx * 0.04);
      shardOsc.stop(now + 0.35);
    });
  }

  // Deep bass thump → rising tone that plateaus = "connection locked in"
  public playBreachEstablished() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;

    // Impact thump
    const thumpOsc = this.context.createOscillator();
    const thumpGain = this.context.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(60, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    thumpGain.gain.setValueAtTime(0, now);
    thumpGain.gain.linearRampToValueAtTime(0.8, now + 0.02);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.5);

    // Rising confirmation tone
    const riseOsc = this.context.createOscillator();
    const riseGain = this.context.createGain();
    riseOsc.type = 'triangle';
    riseOsc.frequency.setValueAtTime(200, now + 0.1);
    riseOsc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
    riseOsc.frequency.setValueAtTime(600, now + 0.5);
    riseGain.gain.setValueAtTime(0, now + 0.1);
    riseGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    riseGain.gain.setValueAtTime(0.3, now + 0.6);
    riseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    riseOsc.connect(riseGain);
    riseGain.connect(this.masterGain);
    riseOsc.start(now + 0.1);
    riseOsc.stop(now + 1.0);

    // Subtle high harmonic ping
    const pingOsc = this.context.createOscillator();
    const pingGain = this.context.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(1200, now + 0.4);
    pingGain.gain.setValueAtTime(0, now + 0.4);
    pingGain.gain.linearRampToValueAtTime(0.15, now + 0.42);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(now + 0.4);
    pingOsc.stop(now + 0.8);
  }

  // Rapid high-frequency beeping/clicking like modem data transfer
  public playDataStream() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;

    for (let i = 0; i < 16; i++) {
      const t = now + i * 0.05;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = i % 3 === 0 ? 'square' : 'sawtooth';
      const freq = 800 + Math.random() * 3000;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

  // Sharper screen crack: low-freq impact hit then glass shards
  public playScreenCrack() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;

    // Heavy impact
    const impactOsc = this.context.createOscillator();
    const impactGain = this.context.createGain();
    impactOsc.type = 'square';
    impactOsc.frequency.setValueAtTime(50, now);
    impactOsc.frequency.exponentialRampToValueAtTime(25, now + 0.15);
    impactGain.gain.setValueAtTime(0, now);
    impactGain.gain.linearRampToValueAtTime(1, now + 0.01);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    impactOsc.connect(impactGain);
    impactGain.connect(this.masterGain);
    impactOsc.start(now);
    impactOsc.stop(now + 0.2);

    // Cracking noise burst
    const bufSize = Math.floor(this.context.sampleRate * 0.6);
    const buf = this.context.createBuffer(1, bufSize, this.context.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.08));
    }
    const noiseNode = this.context.createBufferSource();
    noiseNode.buffer = buf;
    const nGain = this.context.createGain();
    nGain.gain.setValueAtTime(0.9, now + 0.02);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    noiseNode.connect(nGain);
    nGain.connect(this.masterGain);
    noiseNode.start(now + 0.02);

    // Crystal shards with more variety
    [1800, 2600, 3400, 4800, 6200].forEach((freq, idx) => {
      if (!this.context || !this.masterGain) return;
      const shard = this.context.createOscillator();
      const sGain = this.context.createGain();
      shard.type = 'triangle';
      shard.frequency.setValueAtTime(freq + Math.random() * 500, now + 0.03 + idx * 0.03);
      sGain.gain.setValueAtTime(0.15, now + 0.03 + idx * 0.03);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      shard.connect(sGain);
      sGain.connect(this.masterGain);
      shard.start(now + 0.03 + idx * 0.03);
      shard.stop(now + 0.4);
    });
  }

  public playPuzzleSuccess() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      if (!this.context || !this.masterGain) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  public playPuzzleFail() {
    if (!this.context || !this.masterGain) return;
    this.resume();
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Procedural creepy dark-ambient background drone
  private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private isBgmPlaying = false;

  public startAtmosphereMusic() {
    if (this.isBgmPlaying || !this.context) return;
    this.resume();
    try {
      this.bgmGain = this.context.createGain();
      this.bgmGain.gain.setValueAtTime(0.001, this.context.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(0.06, this.context.currentTime + 3);

      if (this.masterGain) {
        this.bgmGain.connect(this.masterGain);
      }

      // Low ominous dissonant drone notes (55Hz A1, 58Hz Bb1, 82Hz E2)
      const freqs = [55, 58.27, 82.41, 110];
      this.bgmOscs = freqs.map((freq) => {
        const osc = this.context!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.context!.currentTime);
        osc.connect(this.bgmGain!);
        osc.start();
        return osc;
      });

      this.isBgmPlaying = true;
    } catch (e) {
      console.error("Failed to start background music", e);
    }
  }

  public stopAtmosphereMusic() {
    if (!this.isBgmPlaying) return;
    try {
      if (this.bgmGain && this.context) {
        this.bgmGain.gain.linearRampToValueAtTime(0.001, this.context.currentTime + 1);
        setTimeout(() => {
          this.bgmOscs.forEach(o => {
            try { o.stop(); o.disconnect(); } catch {}
          });
          this.bgmOscs = [];
          this.isBgmPlaying = false;
        }, 1000);
      }
    } catch {}
  }

  public dispose() {
    this.stopAtmosphereMusic();
    if (this.context) {
      this.context.close();
      this.context = null;
      SoundEngine.instance = null;
    }
  }
}
