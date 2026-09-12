import React, { useMemo, useState } from 'react';
import { Check, Volume2, X } from 'lucide-react';
import { CURRICULUM, CurriculumLesson } from '../data/curriculum';
import { PERSIAN_LETTERS } from '../data/persianAlphabet';
import { ActiveScreen } from '../types';
import { sound } from '../utils/audio';
import { TracePractice } from './TracePractice';

const houses = [
  { id:'trace' as const, title:'بازی اول', subtitle:'ردگیری نشانه‌ها', asset:'/assets/letters-house-1.svg' },
  { id:'hunt' as const, title:'بازی دوم', subtitle:'شکار حرف هم‌رنگ', asset:'/assets/letters-house-2.svg' },
  { id:'word' as const, title:'بازی سوم', subtitle:'حرف در کلمه', asset:'/assets/letters-house-3.svg' },
  { id:'match' as const, title:'بازی چهارم', subtitle:'اتصال حروف مشابه', asset:'/assets/letters-house-4.svg' },
  { id:'flip' as const, title:'بازی پنجم', subtitle:'چی مثل چی؟', asset:'/assets/letters-house-5.svg' },
] as const;
type House = typeof houses[number]['id'];

export const RecognitionVillage: React.FC<{onBack:()=>void;onHome:()=>void;onComplete:(t:'letter'|'word',id?:string)=>void}> = ({onBack,onHome,onComplete}) => {
  const [house,setHouse]=useState<House|null>(null); const [helpOpen,setHelpOpen]=useState(false);
  const [lessonIndex,setLessonIndex]=useState(0); const lesson=CURRICULUM[lessonIndex];
  const selectLesson=(i:number)=>{setLessonIndex(i);sound.speakPersian(CURRICULUM[i].title)};
  const chooseHouse=(id:House)=>{sound.playPop();setHouse(id)};
  if(house) return <main className="recognition-game-screen" dir="rtl">
    <header className="letters-game-header"><button onClick={()=>setHouse(null)} aria-label="بازگشت به خانه‌ها"><span>‹</span></button><div><small>{houses.find(h=>h.id===house)?.title}</small><strong>{houses.find(h=>h.id===house)?.subtitle}</strong></div><button onClick={onHome} aria-label="صفحه شروع"><img src="/assets/letters-home.svg" alt="خانه"/></button></header>
    <div className="recognition-game-body"><div className="lesson-picker"><span>نشانه {lesson.order} از {CURRICULUM.length}</span><select value={lessonIndex} onChange={e=>selectLesson(Number(e.target.value))}>{CURRICULUM.map((l,i)=><option key={l.id} value={i}>{l.order}. {l.sign}</option>)}</select></div>
      {house==='trace'&&<TracePractice curriculumLetterIds={lesson.letterIds} onActivityComplete={(type,id)=>onComplete(type==='math'?'letter':type,id)}/>} 
      {house==='hunt'&&<ColorHunt lesson={lesson} onDone={()=>onComplete('letter',lesson.id)}/>} 
      {house==='word'&&<LetterInWord lesson={lesson}/>} {house==='match'&&<MatchingHouse lesson={lesson}/>} {house==='flip'&&<FlipHouse lesson={lesson}/>} 
    </div>
  </main>;
  return <main className="letters-village-screen" dir="rtl">
    <div className="letters-village-content"><img className="letters-village-map" src="/assets/letters-map.svg" alt="مسیر دهکده آشنایی با حروف"/><div className="letters-village-shade" aria-hidden="true"/><section className="letters-houses" aria-label="بازی‌های آشنایی با حروف">
      {houses.map((h,i)=><button key={h.id} className={`letters-house house-${i+1}`} onClick={()=>chooseHouse(h.id)} aria-label={`${h.title}: ${h.subtitle}`}><img src={h.asset} alt=""/><span><b>{h.title}</b><small>{h.subtitle}</small></span></button>)}
    </section></div>
    <header className="letters-village-header"><button onClick={onHome} aria-label="بازگشت به صفحه شروع"><img src="/assets/letters-home.svg" alt="خانه"/></button><div><span>دهکده اول</span><strong>آشنایی با حروف</strong></div><button onClick={()=>{sound.playPop();setHelpOpen(true)}} aria-label="راهنما"><img src="/assets/letters-help.svg" alt="راهنما"/></button></header>
    <footer className="letters-village-footer">یکی از خانه‌ها را انتخاب کن تا بازی را شروع کنیم</footer>
    {helpOpen&&<div className="letters-help-backdrop" onClick={()=>setHelpOpen(false)}><section className="letters-help-panel" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><button className="letters-help-close" onClick={()=>setHelpOpen(false)}><X/></button><div className="letters-help-mark">؟</div><h2>آشنایی با حروف</h2><p>در این دهکده پنج بازی داریم. هر خانه یک بازی آموزشی است و با انتخاب آن می‌توانی یادگیری حروف را شروع کنی.</p><div className="letters-help-list">{houses.map((h,i)=><button key={h.id} onClick={()=>{setHelpOpen(false);chooseHouse(h.id)}}><span>{i+1}</span><b>{h.title}</b><small>{h.subtitle}</small></button>)}</div></section></div>}
  </main>;
};

const ColorHunt:React.FC<{lesson:CurriculumLesson;onDone:()=>void}>=({lesson,onDone})=>{const [found,setFound]=useState<number[]>([]);const target=lesson.sign.split(' ')[0].replace('ـ','').replace('یـ','ی');const options=Array.from({length:8},(_,i)=>i%3===0?target:['م','ا','ب','د','س','ن','ر'][i%7]);return <div className="mini-game"><GameTitle title="شکار حرف هم‌رنگ" hint={`همه «${target}»ها را پیدا کن`} onSpeak={()=>sound.speakPersian(target)}/><div className="hunt-board">{options.map((l,i)=><button key={i} className={found.includes(i)?'found':''} onClick={()=>{if(l===target&&!found.includes(i)){const n=[...found,i];setFound(n);sound.playPop();if(n.length===options.filter(x=>x===target).length)onDone()}}}>{l}</button>)}</div><p className="game-hint">{found.length} از {options.filter(x=>x===target).length} پیدا شد</p></div>};
const LetterInWord:React.FC<{lesson:CurriculumLesson}>=({lesson})=>{const [selected,setSelected]=useState<string|null>(null);const words=lesson.introWords;return <div className="mini-game"><GameTitle title="حرف در کلمه" hint={`کلمه‌ای را انتخاب کن که «${lesson.sign.split(' ')[0]}» را دارد`} onSpeak={()=>sound.speakPersian(lesson.sign)}/><div className="word-choice-grid">{words.map(w=><button key={w} className={selected===w?'picked':''} onClick={()=>{setSelected(w);sound.speakPersian(w)}}>{w}</button>)}</div>{selected&&<div className="feedback good"><Check/> عالی! «{selected}» صدای {lesson.sign} را دارد.</div>}</div>};
const MatchingHouse:React.FC<{lesson:CurriculumLesson}>=({lesson})=>{const base=lesson.sign.replaceAll('ـ','').split(' ')[0];const pairs=[base,'م','س','ت'];const forms=[`${base}ـ`,'مـ','سـ','تـ'];const [matches,setMatches]=useState<string[]>([]);return <div className="mini-game"><GameTitle title="اتصال حروف مشابه" hint="هر نشانه را به شکلش وصل کن" onSpeak={()=>sound.speakPersian(lesson.sign)}/><div className="matching-columns"><div>{pairs.map(x=><button key={x} onClick={()=>setMatches(m=>m.includes(x)?m:m.concat(x))} className={matches.includes(x)?'matched':''}>{x}</button>)}</div><div>{forms.map(x=><button key={x} onClick={()=>setMatches(m=>m.includes(x)?m:m.concat(x))} className={matches.includes(x)?'matched':''}>{x}</button>)}</div></div><p className="game-hint">۳ جفت را پیدا کن، یک گزینه هم برای فکر کردن اضافه شده.</p></div>};
const FlipHouse:React.FC<{lesson:CurriculumLesson}>=({lesson})=>{const [flip,setFlip]=useState(false);const example=lesson.introWords[0]||'آب';return <div className="mini-game"><GameTitle title="چی مثل چی؟" hint={`این نشانه در چه کلمه‌ای می‌آید؟`} onSpeak={()=>sound.speakPersian(lesson.sign)}/><button className={`flip-card ${flip?'flipped':''}`} onClick={()=>{setFlip(v=>!v);sound.playPop()}}>{!flip?<><span className="flip-glyph">{lesson.sign.split(' ')[0]}</span><b>حدس بزن، بعد کارت را برگردان</b></>:<><span className="flip-emoji">{example==='آب'?'💧':'🍎'}</span><strong>{example}</strong><small>{lesson.title}</small></>}</button></div>};
const GameTitle:React.FC<{title:string;hint:string;onSpeak:()=>void}>=({title,hint,onSpeak})=><div className="game-title"><div><span>خانه آموزشی</span><h2>{title}</h2><p>{hint}</p></div><button onClick={onSpeak}><Volume2/></button></div>;
