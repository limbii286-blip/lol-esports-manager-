// Web Audio API Broadcast Sound Synthesizer for LoL Esports Manager 26

class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    osc.stop(now + duration + 0.02);
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
    this.playTone(135, 0.2, 'triangle', 0.04, 0.05, 92);
  }

  public killAlert() {
    this.playTone(680, 0.09, 'triangle', 0.045, 0, 520);
  }

  public objectiveSecured() {
    this.playTone(330, 0.18, 'triangle', 0.055, 0);
    this.playTone(440, 0.2, 'triangle', 0.055, 0.09);
    this.playTone(554, 0.28, 'sine', 0.06, 0.18);
  }

  public shout() {
    this.playTone(480, 0.12, 'sine', 0.05, 0, 620);
  }

  public victory() {
    this.playTone(392, 0.2, 'triangle', 0.06, 0);
    this.playTone(494, 0.2, 'triangle', 0.06, 0.11);
    this.playTone(587, 0.25, 'triangle', 0.06, 0.22);
    this.playTone(784, 0.45, 'sine', 0.07, 0.34);
  }

  public defeat() {
    this.playTone(330, 0.22, 'triangle', 0.05, 0);
    this.playTone(293, 0.24, 'triangle', 0.05, 0.14);
    this.playTone(246, 0.4, 'sine', 0.05, 0.28);
  }
}

export const soundFx = new SoundFxEngine();
