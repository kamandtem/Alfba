import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { sound } from '../utils/audio';
import { useBackHandler } from '../utils/backNav';
import { CloseArt, OkArt } from './shared/ArtButtons';

interface SplashProps {
  /** دکمهٔ سبز بزرگ: رفتن به نقشهٔ دهکده‌ها برای انتخاب نوع بازی */
  onStart: () => void;
  /** «ادامه»: برگشت به همان بازی‌ای که کودک آخرین بار در آن بود */
  onContinue: () => void;
  /** «پیشرفت من» */
  onProgress: () => void;
  skipNativeSplash?: boolean;
  /** اگر کودک قبلاً بازی را نیمه‌کاره گذاشته، نام آن بخش */
  resumeLabel?: string | null;
}

export const SplashScreen: React.FC<SplashProps> = ({ onStart, onContinue, onProgress, skipNativeSplash = false, resumeLabel }) => {
  const [showStart, setShowStart] = useState(skipNativeSplash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  useBackHandler(() => { setSettingsOpen(false); }, settingsOpen);
  useBackHandler(() => { setMenuOpen(false); }, menuOpen && !settingsOpen);

  useEffect(() => {
    document.title = 'دهکده الفبا';
    if (skipNativeSplash) return;
    const timer = window.setTimeout(() => setShowStart(true), 1800);
    return () => window.clearTimeout(timer);
  }, [skipNativeSplash]);

  if (!showStart) {
    return <main className="native-splash" dir="rtl" onClick={() => setShowStart(true)}>
      <img src="/assets/app-icon.png" alt="دهکده الفبا" />
      <div className="native-splash-loader" aria-label="در حال بارگذاری"><i /></div>
    </main>;
  }

  const tap = (fn: () => void) => () => { sound.playPop(); fn(); };
  const toggleSound = () => { setSoundOn(v => !v); sound.playPop(); };

  return <main className="start-screen" dir="rtl">
    <img className="start-background" src="/assets/start-children.png" alt="دختر و پسر دانش‌آموز در دهکده الفبا" />
    <img className="start-sign" src="/assets/ui/start-sign.svg" alt="دهکده الفبا" />

    {/* نوار سفید موج‌دار پایین با سه دکمه، دقیقاً مثل تصویر مرجع */}
    <section className="start-dock" aria-label="منوی شروع بازی">
      <img className="start-dock-wave" src="/assets/ui/start-wave.svg" alt="" />
      <div className="start-dock-row">
        <button className="start-btn start-btn-menu" onClick={tap(() => setMenuOpen(true))} aria-label="منو">
          <img src="/assets/ui/start-menu.svg" alt="" />
        </button>
        <button className="start-btn start-btn-play" onClick={tap(onStart)} aria-label="شروع بازی">
          <img src="/assets/ui/start-play.svg" alt="" />
        </button>
        <button className="start-btn start-btn-settings" onClick={tap(() => setSettingsOpen(true))} aria-label="تنظیمات">
          <img src="/assets/ui/start-settings.svg" alt="" />
        </button>
      </div>
    </section>

    {/* صفحهٔ منو: دفترچهٔ فنری روی پس‌زمینهٔ آفتابی */}
    {menuOpen && <div className="menu-scene" role="dialog" aria-modal="true" aria-label="منو" onClick={() => setMenuOpen(false)}>
      <div className="menu-rays" aria-hidden="true" />
      <span className="menu-cloud c1" aria-hidden="true" /><span className="menu-cloud c2" aria-hidden="true" /><span className="menu-cloud c3" aria-hidden="true" />
      <span className="menu-spark s1" aria-hidden="true">★</span><span className="menu-spark s2" aria-hidden="true">★</span><span className="menu-spark s3" aria-hidden="true">★</span>
      <div className="menu-book" onClick={e => e.stopPropagation()}>
        <img className="menu-book-art" src="/assets/ui/menu-panel.svg" alt="" draggable={false} />
        <CloseArt className="menu-book-close" onClick={tap(() => setMenuOpen(false))} label="بستن منو" />
        <button className="menu-book-btn menu-book-play" onClick={tap(onStart)} aria-label="شروع بازی و رفتن به دهکده‌ها">
          <img src="/assets/ui/menu-play.svg" alt="" draggable={false} />
        </button>
        <button className="menu-book-btn menu-book-cont" onClick={tap(onContinue)} aria-label={resumeLabel ? `ادامهٔ بازی: ${resumeLabel}` : 'ادامهٔ بازی'}>
          <img src="/assets/ui/btn-continue.svg" alt="" draggable={false} />
        </button>
        {resumeLabel && <small className="menu-book-resume">{resumeLabel}</small>}
        <button className="menu-book-btn menu-book-progress" onClick={tap(onProgress)} aria-label="پیشرفت من">
          <img src="/assets/ui/btn-progress.svg" alt="" draggable={false} />
        </button>
        <button className="menu-book-btn menu-book-settings" onClick={tap(() => setSettingsOpen(true))} aria-label="تنظیمات">
          <img src="/assets/ui/btn-settings.svg" alt="" draggable={false} />
        </button>
      </div>
    </div>}

    {settingsOpen && <div className="settings-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}>
        <CloseArt className="settings-close" onClick={() => setSettingsOpen(false)} />
        <img className="settings-icon" src="/assets/ui/start-settings.svg" alt="" />
        <h2 id="settings-title">تنظیمات</h2>
        <p>اینجا تنظیمات بازی را کنترل کن.</p>
        <button className={`settings-row ${soundOn ? 'enabled' : 'disabled'}`} onClick={toggleSound}>
          <span><b>صدای بازی</b><small>{soundOn ? 'روشن' : 'خاموش'}</small></span>
          <i>{soundOn ? <Check /> : <X />}</i>
        </button>
        <button className="settings-row" onClick={() => sound.speakPersian('به دهکده الفبا خوش آمدی')}>
          <span><b>آزمایش صدا</b><small>پخش پیام خوش‌آمدگویی</small></span>
          <i>▶</i>
        </button>
        <OkArt className="settings-ok" onClick={() => setSettingsOpen(false)} label="ذخیره و بستن" caption="ذخیره" />
      </section>
    </div>}
  </main>;
};
