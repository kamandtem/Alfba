import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { sound } from '../utils/audio';

export const SplashScreen: React.FC<{onStart:()=>void;onProgress:()=>void;skipNativeSplash?:boolean}> = ({onStart,onProgress,skipNativeSplash=false}) => {
  const [showStart, setShowStart] = useState(skipNativeSplash);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

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

  const toggleSound = () => {
    setSoundOn(v => !v);
    sound.playPop();
  };

  return <main className="start-screen" dir="rtl">
    <img className="start-background" src="/assets/start-children.png" alt="دختر و پسر دانش‌آموز در دهکده الفبا" />
    <img className="start-sign" src="/assets/start-sign.svg" alt="دهکده الفبا" />
    <img className="start-wave" src="/assets/start-wave.svg" alt="" />
    <section className="start-controls" aria-label="منوی شروع بازی">
      <button className="start-side-button start-menu-button" onClick={onProgress} aria-label="ورود به صفحه انتخاب دهکده‌ها">
        <span className="start-menu-glyph" aria-hidden="true"><i /><i /><i /></span>
      </button>
      <button className="start-play-button" onClick={() => { sound.playPop(); onStart(); }} aria-label="شروع بازی">
        <img src="/assets/start-play.svg" alt="" />
      </button>
      <button className="start-side-button" onClick={() => { sound.playPop(); setSettingsOpen(true); }} aria-label="تنظیمات">
        <img src="/assets/start-settings.svg" alt="" />
      </button>
    </section>
    {settingsOpen && <div className="settings-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}>
        <button className="settings-close" onClick={() => setSettingsOpen(false)} aria-label="بستن"><X /></button>
        <img className="settings-icon" src="/assets/start-settings.svg" alt="" />
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
        <button className="settings-done" onClick={() => setSettingsOpen(false)}>ذخیره و بستن</button>
      </section>
    </div>}
  </main>;
};
