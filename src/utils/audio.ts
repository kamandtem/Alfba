/**
 * Kid-friendly Web Audio Synthesizer & Voice player
 * 100% offline, zero external asset delays, instant tactile feedback!
 */

import { Capacitor } from '@capacitor/core';
import { TextToSpeech, QueueStrategy } from '@capacitor-community/text-to-speech';

const AUDIO_KEY = 'alefba_audio_v1';
/** سقف صدای موسیقی پس‌زمینه: عمداً خیلی پایین تا حواس کودک پرت نشود */
const MUSIC_MAX = 0.16;
const MUSIC_SRC = '/assets/audio/lullaby.mp3';

export interface AudioSettings { sfx: number; music: number; }
type Listener = (s: AudioSettings) => void;

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const readSettings = (): AudioSettings => {
  try {
    const raw = JSON.parse(localStorage.getItem(AUDIO_KEY) || 'null');
    if (raw && typeof raw === 'object') return { sfx: clamp01(raw.sfx ?? 0.8), music: clamp01(raw.music ?? 0.6) };
  } catch { /* ignore */ }
  return { sfx: 0.8, music: 0.6 };
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxBus: GainNode | null = null;
  private settings: AudioSettings = typeof window !== 'undefined' ? readSettings() : { sfx: 0.8, music: 0.6 };
  private musicEl: HTMLAudioElement | null = null;
  private musicWanted = false;
  private ducked = false;
  private listeners = new Set<Listener>();
  /** شمارندهٔ درخواست‌های گفتار؛ فقط آخرین درخواست حق دارد وضعیت موسیقی را برگرداند */
  private speechToken = 0;
  private lastSpeech = { text: '', at: 0 };

  /** خروجی مشترک همهٔ افکت‌ها؛ حجم صدای افکت‌ها از اینجا کنترل می‌شود */
  private bus(): AudioNode {
    if (!this.ctx) throw new Error('no ctx');
    if (!this.sfxBus) {
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfx;
      this.sfxBus.connect(this.ctx.destination);
    }
    return this.sfxBus;
  }

  // ---------- تنظیمات صدا ----------
  public getSettings(): AudioSettings { return { ...this.settings }; }
  public subscribe(fn: Listener): () => void { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit() {
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
    const snap = this.getSettings();
    this.listeners.forEach(l => l(snap));
  }
  public setSfxVolume(v: number) {
    this.settings.sfx = clamp01(v);
    if (this.sfxBus && this.ctx) this.sfxBus.gain.setTargetAtTime(this.settings.sfx, this.ctx.currentTime, 0.02);
    this.emit();
  }
  public setMusicVolume(v: number) {
    this.settings.music = clamp01(v);
    this.applyMusicVolume();
    if (this.settings.music > 0) this.startMusic();
    this.emit();
  }

  // ---------- موسیقی پس‌زمینه (آفلاین، داخل برنامه) ----------
  private applyMusicVolume() {
    if (!this.musicEl) return;
    const muted = this.isMuted || this.settings.music <= 0;
    this.musicEl.volume = muted ? 0 : Math.min(1, this.settings.music * MUSIC_MAX * (this.ducked ? 0.35 : 1));
  }
  /** بعد از اولین لمس کودک صدا زده می‌شود (مرورگرها پخش خودکار را قبل از لمس اجازه نمی‌دهند) */
  public startMusic() {
    if (typeof window === 'undefined') return;
    this.musicWanted = true;
    if (!this.musicEl) {
      this.musicEl = new Audio(MUSIC_SRC);
      this.musicEl.loop = true;
      this.musicEl.preload = 'auto';
    }
    this.applyMusicVolume();
    if (this.settings.music <= 0 || this.isMuted || document.hidden) return;
    if (this.musicEl.paused) this.musicEl.play().catch(() => { /* هنوز لمسی نشده */ });
  }
  public pauseMusic() { this.musicEl?.pause(); }
  public resumeMusic() { if (this.musicWanted) this.startMusic(); }
  private duck(on: boolean) { this.ducked = on; this.applyMusicVolume(); }

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
    if (this.isMuted) this.stopSpeech();
    this.applyMusicVolume();
    if (!this.isMuted) this.startMusic();
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
      gain.connect(this.bus());

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
      gain2.connect(this.bus());

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
      gain.connect(this.bus());

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
        gain.connect(this.bus());

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
      gain.connect(this.bus());

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /** آیا برنامه داخل APK اندروید اجرا می‌شود و پلاگین TTS بومی در دسترس است؟ */
  private useNativeTts(): boolean {
    try {
      return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('TextToSpeech');
    } catch {
      return false;
    }
  }

  /** قطع هر صدایی که در حال خوانده شدن است (بومی یا مرورگر) */
  public stopSpeech() {
    this.speechToken++;
    this.duck(false);
    if (this.useNativeTts()) {
      TextToSpeech.stop().catch(() => { /* ignore */ });
    }
    try { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }

  /**
   * خواندن حرف / کلمهٔ فارسی.
   * در APK اندروید: موتور Text-to-Speech بومی اندروید (fa-IR).
   * در مرورگر: Web Speech API به‌عنوان جایگزین.
   */
  public speakPersian(text: string) {
    if (this.isMuted || this.settings.sfx <= 0) return;
    const clean = (text ?? '').toString().trim();
    if (!clean) return;

    // لمس‌های پشت‌سرهم خیلی سریع روی همان کلمه: صدا را از اول قطع و وصل نکن
    const now = Date.now();
    if (clean === this.lastSpeech.text && now - this.lastSpeech.at < 350) return;
    this.lastSpeech = { text: clean, at: now };

    const token = ++this.speechToken;
    if (this.useNativeTts()) {
      void this.speakNative(clean, token, true);
    } else {
      this.speakWeb(clean, token);
    }
  }

  private async speakNative(text: string, token: number, allowRetry: boolean) {
    try {
      this.duck(true);
      // QueueStrategy.Flush: صدای قبلی فوراً قطع می‌شود و صداها روی هم پخش نمی‌شوند
      await TextToSpeech.speak({
        text,
        lang: 'fa-IR',
        rate: 0.9,   // کمی آرام‌تر برای کودکان
        pitch: 1.1,  // لحن شاد و دوستانه
        volume: this.settings.sfx,
        category: 'ambient',
        queueStrategy: QueueStrategy.Flush,
      });
    } catch {
      // موتور TTS گاهی در اولین لحظهٔ اجرای برنامه هنوز آماده نیست: یک بار دیگر امتحان کن
      if (allowRetry && token === this.speechToken) {
        await new Promise(r => setTimeout(r, 400));
        if (token === this.speechToken && !this.isMuted) return this.speakNative(text, token, false);
      }
      // در غیر این صورت بی‌صدا رد شو؛ برنامه نباید به خاطر صدا از کار بیفتد
    } finally {
      if (token === this.speechToken) this.duck(false);
    }
  }

  private speakWeb(text: string, token: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.85; // slightly slower for first graders
      utterance.pitch = 1.25; // friendly, cheerful pitch
      utterance.volume = this.settings.sfx;
      // موقع حرف زدن، موسیقی آرام‌تر می‌شود تا صدای گوینده واضح باشد
      const release = () => { if (token === this.speechToken) this.duck(false); };
      utterance.onstart = () => this.duck(true);
      utterance.onend = release;
      utterance.onerror = release;

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
      gain.connect(this.bus());

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine();

// شروع موسیقی با اولین لمس، و توقف وقتی برنامه به پس‌زمینه می‌رود
if (typeof window !== 'undefined') {
  const kick = () => {
    sound.startMusic();
    window.removeEventListener('pointerdown', kick, true);
    window.removeEventListener('keydown', kick, true);
  };
  window.addEventListener('pointerdown', kick, true);
  window.addEventListener('keydown', kick, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { sound.pauseMusic(); sound.stopSpeech(); } else sound.resumeMusic(); });
}
