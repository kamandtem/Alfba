import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, Volume2, X } from 'lucide-react';
import { sentenceSuggestionsForLesson } from '../data/sentenceBank';
import { CURRICULUM } from '../data/curriculum';
import { sound } from '../utils/audio';
import { shuffle, toFa, useCurrentLesson } from '../utils/lessonState';
import { LessonPicker } from './shared/LessonPicker';
import { GameHeader } from './shared/GameHeader';
import { useBackHandler } from '../utils/backNav';
import { OkArt } from './shared/ArtButtons';

const plain = (s: string) => s.replace(/[\u064B-\u0652]/g, '');

/** دهکده سوم: جمله‌سازی — فقط جمله‌هایی که همهٔ نشانه‌هایشان تا درس انتخاب‌شده خوانده شده */
export const SentenceBuilder: React.FC<{ onBack: () => void; onComplete: (t: 'word', id?: string) => void }> = ({ onBack, onComplete }) => {
  const [lessonOrder] = useCurrentLesson();
  const pool = useMemo(() => sentenceSuggestionsForLesson(lessonOrder), [lessonOrder]);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [result, setResult] = useState<'idle' | 'good' | 'try'>('idle');
  const sentence = pool.length ? pool[index % pool.length] : null;
  const words = useMemo(() => sentence ? sentence.text.split(' ') : [], [sentence]);
  const shuffled = useMemo(() => { let s = shuffle(words.map((_, i) => i)); if (words.length > 1 && s.every((v, i) => v === i)) s = s.reverse(); return s; }, [words]);
  useEffect(() => { setOrder([]); setResult('idle'); }, [sentence?.id]);
  useBackHandler(() => { onBack(); });
  const autoTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);
  const nextSentence = () => { window.clearTimeout(autoTimer.current); setIndex(i => i + 1); };
  const reset = () => { setOrder([]); setResult('idle'); };
  const check = () => {
    if (!sentence) return;
    const ok = order.map(i => words[i]).join(' ') === sentence.text;
    setResult(ok ? 'good' : 'try');
    if (ok) { sound.playSuccess(); sound.speakPersian(`آفرین! ${plain(sentence.text)}`); onComplete('word', sentence.id); window.clearTimeout(autoTimer.current); autoTimer.current = window.setTimeout(nextSentence, 2400); /* خودکار ← جملهٔ بعدی */ }
    else sound.speakPersian('نزدیک بودی، دوباره امتحان کن');
  };
  return <main className="sentence-screen" dir="rtl">
    <GameHeader kicker="دهکدهٔ سوم" title="جمله‌سازی" emoji="💬" tone="sky" onBack={onBack}><LessonPicker compact /></GameHeader>
    {!sentence ? <section className="sentence-workspace"><div className="sentence-prompt"><h2>هنوز زود است!</h2><p>جمله‌سازی از درس {toFa(4)} (نشانهٔ «د») شروع می‌شود. درس را از بالا عوض کن.</p></div></section> :
      <section className="sentence-workspace">
        <div className="sentence-prompt"><span>جمله {toFa(index % pool.length + 1)} از {toFa(pool.length)} · تا نشانهٔ «{CURRICULUM[lessonOrder - 1].sign}»</span><h2>کلمه‌ها را به ترتیب بچین</h2><p>روی کلمه‌ها به ترتیب بزن تا جمله ساخته شود.</p>
          <button className="speak-top" onClick={() => sound.speakPersian(plain(sentence.text))} aria-label="شنیدن جمله"><Volume2 /></button></div>
        <div className={`sentence-answer ${result}`}>{order.length ? order.map((wi, i) => <button key={`${wi}-${i}`} className="tahriri" onClick={() => { setOrder(o => o.filter((_, j) => j !== i)); setResult('idle'); }}>{words[wi]}</button>) : <span>کلمه‌ها اینجا کنار هم می‌نشینند</span>}</div>
        <div className="sentence-words">{shuffled.filter(i => !order.includes(i)).map(i => <button key={i} className="tahriri" onClick={() => { setOrder(o => [...o, i]); sound.playPop(); }}>{words[i]}</button>)}</div>
        <div className="sentence-actions"><button onClick={reset}><RotateCcw /> از اول</button><OkArt className="sentence-ok" onClick={check} /></div>
        {result === 'good' && <div className="feedback good"><Check /> آفرین! جمله را درست ساختی.</div>}
        {result === 'try' && <div className="feedback try"><X /> هنوز درست نشده؛ تو می‌توانی، یک بار دیگر.</div>}
      </section>}
    <footer className="sentence-footer"><span>{toFa(pool.length)} جمله متناسب با درس تو</span><button onClick={nextSentence}>جمله بعدی</button></footer>
  </main>;
};
