import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ActiveScreen } from '../types';
import { sound } from '../utils/audio';

export interface MapProps { onNavigate:(screen:ActiveScreen)=>void; onVillage:(v:'recognition'|'word'|'sentence')=>void; onSubject:()=>void; }
const villages = [
  { id:'recognition' as const, title:'آشنایی با حروف', subtitle:'ببین، بشنو و حروف را کشف کن', asset:'/assets/map-island-1.svg', className:'island-one', tone:'coral', text:'در این دهکده با شکل و صدای حروف فارسی آشنا می‌شوی و تمرین می‌کنی آن‌ها را درست تشخیص بدهی.' },
  { id:'word' as const, title:'کلمه‌سازی', subtitle:'حروف را کنار هم بچین', asset:'/assets/map-island-2.svg', className:'island-two', tone:'green', text:'اینجا حروف را کنار هم می‌گذاری و با آن‌ها کلمه‌های تازه می‌سازی.' },
  { id:'sentence' as const, title:'دهکده جمله‌سازی', subtitle:'با کلمه‌ها جمله بساز', asset:'/assets/map-island-3.svg', className:'island-three', tone:'blue', text:'در این دهکده کلمه‌ها را مرتب می‌کنی و جمله‌های کوتاه و درست می‌سازی.' },
];

export const VillageMap: React.FC<MapProps> = ({onNavigate,onVillage,onSubject}) => {
  const [helpOpen,setHelpOpen] = useState(false);
  const openHelp=()=>{sound.playPop();setHelpOpen(true)};
  return <main className="island-map-screen" dir="rtl">
    <div className="island-map-content">
      <img className="island-map-art" src="/assets/island-map.svg" alt="نقشه مسیر دهکده الفبا" />
      <div className="island-map-shade" aria-hidden="true" />
      <svg className="island-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M 50 18 C 35 27, 67 31, 51 44 S 37 59, 51 73" /></svg>
      <section className="island-map-places" aria-label="دهکده‌های بازی">
        {villages.map((v,index)=><button key={v.id} className={`island-place ${v.className} ${v.tone}`} onClick={()=>{sound.playPop();onVillage(v.id)}} aria-label={`ورود به ${v.title}`}>
          <span className="island-image-wrap"><img src={v.asset} alt="" /></span>
          <span className="island-place-label"><b>{v.title}</b><small>{v.subtitle}</small><em>{index + 1}</em></span>
        </button>)}
      </section>
    </div>
    <header className="island-map-header">
      <button className="map-svg-button" onClick={onSubject} aria-label="بازگشت به صفحه شروع"><img src="/assets/map-home.svg" alt="خانه" /></button>
      <div className="map-header-title"><span>ماجراجویی من</span><strong>سه دهکده برای یادگیری</strong></div>
      <button className="map-svg-button" onClick={openHelp} aria-label="راهنمای نقشه"><img src="/assets/map-help.svg" alt="راهنما" /></button>
    </header>
    <footer className="island-map-footer">برای دیدن همه مسیر، صفحه را بالا و پایین بکش</footer>
    {helpOpen && <div className="map-help-backdrop" role="presentation" onClick={()=>setHelpOpen(false)}>
      <section className="map-help-panel" role="dialog" aria-modal="true" aria-labelledby="map-help-title" onClick={e=>e.stopPropagation()}>
        <button className="map-help-close" onClick={()=>setHelpOpen(false)} aria-label="بستن"><X /></button>
        <div className="map-help-mark">؟</div>
        <h2 id="map-help-title">راهنمای نقشه</h2>
        <p>در دهکده الفبا، سه مسیر برای یادگیری داری. روی هر دهکده بزن تا وارد مرحله مخصوص آن شوی.</p>
        <div className="map-help-list">{villages.map((v,i)=><button key={v.id} onClick={()=>{setHelpOpen(false);sound.playPop();onVillage(v.id)}}><span>{i+1}</span><strong>{v.title}</strong><small>{v.text}</small></button>)}</div>
        <button className="map-help-done" onClick={()=>setHelpOpen(false)}>فهمیدم، بریم بازی!</button>
      </section>
    </div>}
  </main>;
};
