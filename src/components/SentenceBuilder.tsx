import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, GripVertical, RotateCcw, Volume2, X } from 'lucide-react';
import { SENTENCES_BY_LEVEL } from '../data/curriculum';
import { sound } from '../utils/audio';

type Level='easy'|'medium'|'hard';
export const SentenceBuilder:React.FC<{onBack:()=>void;onComplete:(t:'word',id?:string)=>void}>=({onBack,onComplete})=>{
  const [level,setLevel]=useState<Level>('easy'); const [index,setIndex]=useState(0); const [order,setOrder]=useState<string[]>([]); const [result,setResult]=useState<'idle'|'good'|'try'>('idle');
  const sentences=SENTENCES_BY_LEVEL[level]; const answer=sentences[index%sentences.length] || 'آب آمد'; const words=useMemo(()=>answer.split(' '),[answer]);
  const shuffled=useMemo(()=>[...words].sort((a,b)=>b.localeCompare(a,'fa')),[words]);
  const counts=order.reduce<Record<string,number>>((a,w)=>({...a,[w]:(a[w]||0)+1}),{}); const available=shuffled.filter(w=>{if((counts[w]||0)>0){counts[w]-=1;return false}return true});
  const reset=()=>{setOrder([]);setResult('idle')};
  const choose=(w:string)=>setOrder(o=>[...o,w]);
  const check=()=>{const ok=order.join(' ')===answer;setResult(ok?'good':'try');if(ok){sound.playSuccess();sound.speakPersian(`آفرین! ${answer}`);onComplete('word',`sentence-${level}-${index}`)}else sound.speakPersian('دوباره امتحان کن')};
  return <main className="sentence-screen" dir="rtl"><header className="village-page-header"><button onClick={onBack}><ArrowRight/></button><div><span>دهکده جمله‌سازی</span><h1>کلمه‌ها را کنار هم بچین</h1></div><button className="speak-top" onClick={()=>sound.speakPersian(answer)}><Volume2/></button></header>
    <div className="sentence-levels">{(['easy','medium','hard'] as Level[]).map(l=><button key={l} className={level===l?'active':''} onClick={()=>{setLevel(l);setIndex(0);reset()}}>{l==='easy'?'آسان':l==='medium'?'متوسط':'سخت'}<small>{l==='easy'?'۲ تا ۳ کلمه':l==='medium'?'۳ تا ۶ کلمه':'۵ تا ۸ کلمه'}</small></button>)}</div>
    <section className="sentence-workspace"><div className="sentence-prompt"><span>جمله {index+1} از {sentences.length}</span><h2>جمله درست را بساز</h2><p>هر کلمه را لمس کن یا آن را بکش و در جای خودش بگذار.</p></div><div className={`sentence-answer ${result}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const w=e.dataTransfer.getData('word');if(w)choose(w)}}>{order.length?order.map((w,i)=><button key={`${w}-${i}`} draggable onDragStart={e=>e.dataTransfer.setData('word',w)} onClick={()=>setOrder(o=>o.filter((_,j)=>j!==i))}>{w}</button>):<span>کلمه‌ها را اینجا بچین</span>}</div><div className="sentence-words">{available.map((w,i)=><button key={`${w}-${i}`} onClick={()=>choose(w)} draggable onDragStart={e=>e.dataTransfer.setData('word',w)}><GripVertical/>{w}</button>)}</div><div className="sentence-actions"><button onClick={reset}><RotateCcw/> از اول</button><button className="check-sentence" onClick={check}>بررسی کن <Check/></button></div>{result==='good'&&<div className="feedback good"><Check/> آفرین! جمله را درست ساختی.</div>}{result==='try'&&<div className="feedback try"><X/> هنوز درست نشده، یک بار دیگر امتحان کن.</div>}</section><footer className="sentence-footer"><span>بیش از ۵۰۰ جمله سطح‌بندی‌شده</span><button onClick={()=>{setIndex(i=>i+1);reset()}}>جمله بعدی</button></footer>
  </main>;
};
