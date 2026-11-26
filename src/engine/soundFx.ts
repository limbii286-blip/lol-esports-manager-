// Web Audio API Broadcast Sound & Stadium Atmosphere Engine for LoL Esports Manager 26

class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private draftTimer: number | null = null;
  private draftStep: number = 0;

  constructor() {
    try {
      this.muted = localStorage.getItem('lem26_muted') === '1';
    } catch {
      this.muted = false;
    }
  }

  private ensureCtx(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.stopDraftMusic();
    try {
      localStorage.setItem('lem26_muted', this.muted ? '1' : '0');
    } catch {
      // ignore storage errors
    }
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.06,
    delay: number = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  // Synthesized Stadium Crowd Roar using band-pass filtered noise envelope
  public crowdRoar(intensity: 'low' | 'medium' | 'epic' = 'medium') {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const duration = intensity === 'epic' ? 1.85 : intensity === 'medium' ? 1.1 : 0.65;
    const peakVol = intensity === 'epic' ? 0.075 : intensity === 'medium' ? 0.045 : 0.028;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise for warm arena crowd texture
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.14) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(intensity === 'epic' ? 920 : 760, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + duration * 0.45);
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakVol, now + duration * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration + 0.05);
  }

  // Atmospheric LCK/Worlds Draft Tension Pulse Loop
  public startDraftMusic() {
    if (this.muted || this.draftTimer !== null || typeof window === 'undefined') return;
    const bassNotes = [110, 110, 130.81, 98, 110, 110, 146.83, 130.81];
    const arpNotes = [220, 261.63, 329.63, 293.66];
    this.draftStep = 0;
    this.draftTimer = window.setInterval(() => {
      if (this.muted) {
        this.stopDraftMusic();
        return;
      }
      const bass = bassNotes[this.draftStep % bassNotes.length];
      this.playTone(bass, 0.34, 'triangle', 0.022, 0, bass * 0.98);
      if (this.draftStep % 2 === 1) {
        const arp = arpNotes[(this.draftStep >> 1) % arpNotes.length];
        this.playTone(arp, 0.22, 'sine', 0.012, 0.04);
      }
      this.draftStep++;
    }, 520);
  }

  public stopDraftMusic() {
    if (this.draftTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.draftTimer);
      this.draftTimer = null;
    }
  }

  public click() {
    this.playTone(520, 0.055, 'triangle', 0.035, 0, 390);
  }

  public draftLock() {
    this.playTone(440, 0.14, 'triangle', 0.06, 0, 587);
    this.playTone(659, 0.22, 'sine', 0.05, 0.07, 880);
  }

  public draftBan() {
    this.playTone(190, 0.18, 'sawtooth', 0.045, 0, 110);
    this.playTone(135, 0.22, 'triangle', 0.045, 0.05, 88);
  }

  public killAlert() {
    this.playTone(680, 0.09, 'triangle', 0.045, 0, 520);
  }

  public firstBlood() {
    this.playTone(587.33, 0.16, 'sawtooth', 0.045, 0, 440);
    this.playTone(880, 0.28, 'triangle', 0.055, 0.08, 659.25);
    this.crowdRoar('medium');
  }

  public turretFall() {
    this.playTone(150, 0.28, 'sawtooth', 0.04, 0, 62);
    this.playTone(110, 0.22, 'triangle', 0.04, 0.06, 55);
  }

  public objectiveSecured() {
    this.playTone(330, 0.18, 'triangle', 0.055, 0);
    this.playTone(440, 0.2, 'triangle', 0.055, 0.09);
    this.playTone(554, 0.28, 'sine', 0.06, 0.18);
    this.crowdRoar('low');
  }

  public baronSteal() {
    this.playTone(98, 0.45, 'sawtooth', 0.06, 0, 65);
    this.playTone(392, 0.24, 'triangle', 0.06, 0.06);
    this.playTone(523.25, 0.34, 'triangle', 0.065, 0.16);
    this.playTone(783.99, 0.5, 'sine', 0.065, 0.28);
    this.crowdRoar('epic');
  }

  public dragonSoul() {
    this.playTone(329.63, 0.22, 'triangle', 0.055, 0);
    this.playTone(440, 0.24, 'triangle', 0.055, 0.1);
    this.playTone(659.25, 0.38, 'sine', 0.065, 0.22);
    this.crowdRoar('medium');
  }

  public shout() {
    this.playTone(480, 0.12, 'sine', 0.05, 0, 620);
  }

  public victory() {
    this.playTone(392, 0.2, 'triangle', 0.06, 0);
    this.playTone(494, 0.2, 'triangle', 0.06, 0.11);
    this.playTone(587, 0.25, 'triangle', 0.06, 0.22);
    this.playTone(784, 0.52, 'sine', 0.075, 0.34);
    this.crowdRoar('epic');
  }

  public trophyFanfare() {
    const notes = [392, 523.25, 659.25, 783.99, 659.25, 1046.5];
    const times = [0, 0.13, 0.26, 0.4, 0.56, 0.72];
    notes.forEach((n, i) => {
      this.playTone(n, i === notes.length - 1 ? 0.75 : 0.22, 'triangle', 0.065, times[i]);
    });
    this.crowdRoar('epic');
  }

  public defeat() {
    this.playTone(330, 0.22, 'triangle', 0.05, 0);
    this.playTone(293, 0.24, 'triangle', 0.05, 0.14);
    this.playTone(246, 0.4, 'sine', 0.05, 0.28);
  }
}

export const soundFx = new SoundFxEngine();
