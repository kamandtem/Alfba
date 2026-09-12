/**
 * Kid-friendly Web Audio Synthesizer & Voice player
 * 100% offline, zero external asset delays, instant tactile feedback!
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Delicate, satisfying magnetic snap "تق"
   */
  public playSnap() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      // Soft plastic magnetic click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      // Micro second tone for the "magnetic thud"
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(180, now + 0.01);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gain2.gain.setValueAtTime(0.2, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.01);
      osc2.stop(now + 0.05);
    } catch {
      // AudioContext might fail silently on some platforms before user gesture
    }
  }

  /**
   * Tactile tap / pickup sound
   */
  public playPop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }

  /**
   * Positive success chime (when completing a word or tracing smoothly)
   */
  public playSuccess() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Gentle, encouraging hint sound (soft harp tone, never harsh or punishing)
   */
  public playGentleHint() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(370, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /**
   * Persian letter / word speech synthesis with kid-friendly pitch
   */
  public speakPersian(text: string) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.85; // slightly slower for first graders
      utterance.pitch = 1.25; // friendly, cheerful pitch

      // Try finding a Persian or Arabic voice
      const voices = window.speechSynthesis.getVoices();
      const persianVoice = voices.find(v => v.lang.includes('fa') || v.lang.includes('FA'));
      const arabicVoice = voices.find(v => v.lang.includes('ar'));

      if (persianVoice) {
        utterance.voice = persianVoice;
      } else if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }

  /**
   * Count sound with ascending pitch
   */
  public playCount(num: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const baseFreq = 300 + Math.min(num, 10) * 35;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine();
