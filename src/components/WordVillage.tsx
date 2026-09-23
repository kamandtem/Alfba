import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Eraser, Flag, Package, RefreshCw, Undo2, Volume2, X } from 'lucide-react';
import { CURRICULUM, LETTER_BOX } from '../data/curriculum';
import { findWord, lessonWords, WordEntry, wordsUpTo } from '../data/wordBank';
import { finishProblem, parseToken, plainSequence, renderSequence, validateSequence } from '../utils/pieces';
import { sound } from '../utils/audio';
import { shuffle, toFa, useCurrentLesson } from '../utils/lessonState';
import { LessonPicker } from './shared/LessonPicker';
import { cheer, FeedbackState, FeedbackToast, praise } from './shared/Feedback';

type Mode = 'lesson' | 'suggest' | 'free';
interface FreePiece { id: string; token: string; x: number; y: number }
interface SeqItem { id: string; token: string }
interface LineWord { id: string; x: number; seq: SeqItem[]; closed: boolean; status?: 'good' | 'bad' }
type Drag =
  | { kind: 'new'; token: string; cx: number; cy: number }
  | { kind: 'free'; id: string; token: string; cx: number; cy: number; ox: number; oy: number; moved: boolean }
  | { kind: 'word'; id: string; cx: number; cy: number; ox: number; oy: number; moved: boolean };

const uid = () => Math.random().toString(36).slice(2, 9);
const speakable = (s: string) => s.replace(/[\u064B-\u0652\u200D]/g, '');

export const WordVillage: React.FC<{ onBack: () => void; onComplete: (t: 'word', id?: string) => void }> = ({ onBack, onComplete }) => {
  const [lessonOrder] = useCurrentLesson();
  const lesson = CURRICULUM[lessonOrder - 1];
  const [mode, setMode] = useState<Mode>('lesson');
  const boardRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef(new Map<string, HTMLSpanElement>());
  const [size, setSize] = useState({ w: 360, h: 460 });
  const [free, setFree] = useState<FreePiece[]>([]);
  const [words, setWords] = useState<LineWord[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [boxOpen, setBoxOpen] = useState(false);
  const [boxKey, setBoxKey] = useState<string | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [shakeWord, setShakeWord] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const lastWord = useRef<string | null>(null);

  // --- هندسهٔ تخته
  useLayoutEffect(() => {
    const b = boardRef.current; if (!b) return;
    const ro = new ResizeObserver(() => setSize({ w: b.clientWidth, h: b.clientHeight }));
    ro.observe(b); setSize({ w: b.clientWidth, h: b.clientHeight });
    return () => ro.disconnect();
  }, []);
  const parkH = size.h * 0.42;               // بخش بالایی: جای حروف (بدون چسبندگی)
  const lineY = parkH + (size.h - parkH) * 0.55; // خط مغناطیسی
  const band = Math.max(38, (size.h - parkH) * 0.2);

  // --- کلمه‌های هدف
  const lessonList = useMemo<WordEntry[]>(() => lessonWords(Math.max(2, lessonOrder), 8), [lessonOrder]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [suggestion, setSuggestion] = useState<WordEntry | null>(null);
  const pickSuggestion = useCallback(() => {
    const pool = wordsUpTo(Math.max(2, lessonOrder));
    const recent = pool.filter(w => w.lesson >= lessonOrder - 3);
    const src = recent.length >= 4 && Math.random() < 0.7 ? recent : pool;
    setSuggestion(src[Math.floor(Math.random() * src.length)]);
  }, [lessonOrder]);
  const target: WordEntry | null = mode === 'lesson' ? lessonList[targetIdx % lessonList.length] : mode === 'suggest' ? suggestion : null;

  const slot = useCallback((i: number, jitter = true) => {
    const cols = Math.max(3, Math.floor((size.w - 40) / 84));
    const r = Math.floor(i / cols), c = i % cols;
    const cellW = (size.w - 40) / cols;
    return { x: size.w - 20 - cellW * (c + 0.5) + (jitter ? Math.random() * 16 - 8 : 0), y: 58 + r * 78 + (jitter ? Math.random() * 12 - 6 : 0) };
  }, [size.w]);
  const freeSlot = useCallback((list: FreePiece[]) => {
    for (let i = 0; i < 40; i++) { const s = slot(i, false); if (s.y > parkH - 30) break; if (!list.some(p => Math.abs(p.x - s.x) < 40 && Math.abs(p.y - s.y) < 36)) return slot(i); }
    return { x: 40 + Math.random() * (size.w - 80), y: 50 + Math.random() * (parkH - 90) };
  }, [slot, parkH, size.w]);

  const resetBoard = useCallback((t: WordEntry | null, m: Mode) => {
    setWords([]); setSolved(false); lastWord.current = null;
    if (m === 'lesson' && t) {
      const tokens = shuffle(t.tokens.filter(tk => parseToken(tk).kind !== 'mark'));
      setFree(tokens.map((token, i) => ({ id: uid(), token, ...slot(i) })));
      sound.speakPersian(`کلمهٔ ${speakable(t.word)} را بساز`);
    } else {
      setFree([]);
      if (t) sound.speakPersian(`کلمهٔ ${speakable(t.word)} را بنویس`);
    }
  }, [slot]);

  useEffect(() => { if (mode === 'suggest' && !suggestion) pickSuggestion(); }, [mode, suggestion, pickSuggestion]);
  useEffect(() => { setTargetIdx(0); setSuggestion(null); }, [lessonOrder]);
  useEffect(() => { resetBoard(target, mode); }, [mode, target?.id, size.w > 0]); // eslint-disable-line

  // --- پیام‌ها
  const say = (tone: 'good' | 'try' | 'info', text: string, emoji?: string) => { setFb({ tone, text, emoji }); sound.speakPersian(text.replace(/[«»]/g, '')); };
  const block = (msg: string, wordId?: string) => { setFb({ tone: 'try', text: msg, emoji: '✋' }); sound.speakPersian(msg.replace(/«[^»]*»/g, '')); if (wordId) { setShakeWord(wordId); window.setTimeout(() => setShakeWord(null), 600); } };

  // --- هندسهٔ کلمه‌ها روی خط
  const wordSpan = (w: LineWord) => { const el = wordRefs.current.get(w.id); const width = el ? el.getBoundingClientRect().width : 60 * w.seq.length; return { right: w.x, left: w.x - width }; };

  /** گذاشتن یک قطعه روی خط مغناطیسی */
  const dropOnLine = (token: string, x: number): boolean => {
    const def = parseToken(token);
    let best: { w: LineWord; where: 'append' | 'prepend'; d: number } | null = null;
    for (const w of words) {
      const s = wordSpan(w);
      const dl = Math.abs(x - s.left), dr = Math.abs(x - s.right);
      if (x >= s.left - 80 && x <= s.right + 80) {
        const where = dl <= dr ? 'append' : 'prepend';
        const d = Math.min(dl, dr);
        if (!best || d < best.d) best = { w, where, d };
      }
    }
    if (best) {
      const w = best.w;
      if (w.closed) { block('این کلمه تمام شده؛ کلمهٔ تازه را جای دیگری روی خط شروع کن.', w.id); return false; }
      if (def.kind === 'mark' && best.where === 'prepend') best.where = 'append';
      const item = { id: uid(), token };
      const seq = best.where === 'append' ? [...w.seq, item] : [item, ...w.seq];
      const v = validateSequence(seq.map(s => parseToken(s.token)));
      if (!v.ok) { block(v.message!, w.id); return false; }
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, seq, status: undefined } : o));
      lastWord.current = w.id; sound.playSnap(); return true;
    }
    const v = validateSequence([def]);
    if (!v.ok) { block(v.message!); return false; }
    const id = uid();
    setWords(ws => [...ws, { id, x: Math.min(size.w - 12, x + 30), seq: [{ id: uid(), token }], closed: false }]);
    lastWord.current = id; sound.playSnap(); return true;
  };

  // --- کشیدن و رها کردن با اشاره‌گر (سازگار با لمس در اندروید)
  const toLocal = (cx: number, cy: number) => { const r = boardRef.current!.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top, inside: cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom }; };
  const onLine = (y: number) => y > parkH && Math.abs(y - lineY) <= band;

  const startNew = (e: React.PointerEvent, token: string) => { e.preventDefault(); setDrag({ kind: 'new', token, cx: e.clientX, cy: e.clientY }); setBoxOpen(false); sound.playPop(); };
  const startFree = (e: React.PointerEvent, p: FreePiece) => { e.preventDefault(); const l = toLocal(e.clientX, e.clientY); setDrag({ kind: 'free', id: p.id, token: p.token, cx: e.clientX, cy: e.clientY, ox: l.x - p.x, oy: l.y - p.y, moved: false }); };
  const startWord = (e: React.PointerEvent, w: LineWord) => { e.preventDefault(); const l = toLocal(e.clientX, e.clientY); setDrag({ kind: 'word', id: w.id, cx: e.clientX, cy: e.clientY, ox: l.x - w.x, oy: l.y - lineY, moved: false }); };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag(d => d ? { ...d, cx: e.clientX, cy: e.clientY, ...(d.kind !== 'new' ? { moved: d.moved || Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 3 } : {}) } as Drag : d);
    const up = (e: PointerEvent) => { finishDrag(e.clientX, e.clientY); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }); // eslint-disable-line

  const finishDrag = (cx: number, cy: number) => {
    const d = drag; setDrag(null); if (!d || !boardRef.current) return;
    const l = toLocal(cx, cy);
    const clampX = (x: number) => Math.max(30, Math.min(size.w - 30, x));
    const clampY = (y: number) => Math.max(34, Math.min(size.h - 34, y));
    if (d.kind === 'new') {
      if (!l.inside) return;
      if (onLine(l.y)) { if (!dropOnLine(d.token, l.x)) setFree(f => [...f, { id: uid(), token: d.token, ...freeSlot(f) }]); }
      else setFree(f => [...f, { id: uid(), token: d.token, x: clampX(l.x), y: clampY(l.y) }]);
      return;
    }
    if (d.kind === 'free') {
      if (!d.moved) { sound.speakPersian(speakable(parseToken(d.token).glyph)); return; }
      const x = l.x - d.ox, y = l.y - d.oy;
      if (onLine(l.y)) {
        const ok = dropOnLine(d.token, x);
        setFree(f => ok ? f.filter(p => p.id !== d.id) : f.map(p => p.id === d.id ? { ...p, ...freeSlot(f.filter(q => q.id !== d.id)) } : p));
      } else setFree(f => f.map(p => p.id === d.id ? { ...p, x: clampX(x), y: clampY(y) } : p));
      return;
    }
    // کشیدن کلمه
    const w = words.find(o => o.id === d.id); if (!w) return;
    if (!d.moved) { sound.speakPersian(speakable(renderSequence(w.seq.map(s => parseToken(s.token))))); return; }
    const x = l.x - d.ox;
    if (onLine(l.y)) setWords(ws => ws.map(o => o.id === w.id ? { ...o, x: Math.max(40, Math.min(size.w - 8, x)) } : o));
    else { // کلمه از خط جدا شد: حروفش آزاد می‌شوند
      const letters = w.seq;
      setWords(ws => ws.filter(o => o.id !== w.id));
      setFree(f => [...f, ...letters.map((s, i) => ({ id: s.id, token: s.token, x: clampX(x - i * 70), y: clampY(l.y - d.oy) }))]);
      sound.playPop();
    }
  };

  const popLast = (w: LineWord) => {
    const last = w.seq[w.seq.length - 1]; if (!last) return;
    const seq = w.seq.slice(0, -1);
    setWords(ws => seq.length ? ws.map(o => o.id === w.id ? { ...o, seq, closed: false, status: undefined } : o) : ws.filter(o => o.id !== w.id));
    setFree(f => [...f, { id: last.id, token: last.token, ...freeSlot(f) }]); sound.playPop();
  };

  // --- پایان / تایید
  const finish = () => {
    const open = words.filter(w => !w.closed && w.seq.length);
    if (!open.length) { say('info', 'اول حروف را روی خطِ مغناطیسی کنار هم بگذار.'); return; }
    if (mode !== 'free' && open.length > 1) { block('حروف را روی خط به هم بچسبان تا یک کلمه شود.'); return; }
    const w = mode === 'free' ? (open.find(o => o.id === lastWord.current) || open[open.length - 1]) : open[0];
    const defs = w.seq.map(s => parseToken(s.token));
    const problem = finishProblem(defs);
    if (problem) { block(problem, w.id); return; }
    const plain = plainSequence(defs);
    if (mode === 'free') {
      const known = findWord(plain);
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, closed: true, status: 'good' } : o));
      if (known) { sound.playSuccess(); say('good', `${praise()} کلمهٔ «${plain}» را نوشتی.`, known.emoji || '🎉'); onComplete('word', known.id); }
      else say('info', `کلمه‌ات تمام شد: «${plain}». آن را بلند بخوان!`, '📝');
      return;
    }
    if (!target) return;
    if (plain === target.plain) {
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, closed: true, status: 'good' } : o)); setSolved(true);
      sound.playSuccess(); say('good', `${praise()} «${target.plain}» را درست ساختی.`, target.emoji || '🎉'); onComplete('word', target.id);
    } else {
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, status: 'bad' } : o));
      say('try', `این «${plain}» شد. ${cheer()}`, '💪');
    }
  };

  const next = () => { if (mode === 'lesson') setTargetIdx(i => i + 1); else pickSuggestion(); };
  const clearAll = () => { resetBoard(target, mode); sound.playPop(); };

  const renderDragGhost = () => {
    if (!drag) return null;
    if (drag.kind === 'word') return null;
    if (drag.kind === 'free' && !drag.moved) return null;
    return <span className="drag-ghost tahriri" style={{ left: drag.cx, top: drag.cy }}>{parseToken(drag.token).glyph}</span>;
  };

  const dragFreeId = drag?.kind === 'free' && drag.moved ? drag.id : null;
  const dragWord = drag?.kind === 'word' && drag.moved ? drag : null;
  const boardRect = boardRef.current?.getBoundingClientRect();
  const hoverLine = !!drag && !!boardRect && drag.kind !== 'word' && onLine(drag.cy - boardRect.top);

  return <main className="word-village" dir="rtl">
    <header className="village-page-header">
      <button onClick={onBack} aria-label="بازگشت">›</button>
      <div><span>دهکده دوم</span><h1>کلمه‌نویسی</h1></div>
      <LessonPicker compact />
    </header>
    <nav className="wv-modes">
      {([['lesson', 'کلمه‌های درس'], ['suggest', 'پیشنهاد کلمه'], ['free', 'نوشتن آزاد']] as [Mode, string][]).map(([m, label]) =>
        <button key={m} className={mode === m ? 'active' : ''} onClick={() => { setMode(m); sound.playPop(); }}>{label}</button>)}
    </nav>

    {target && <section className="wv-target">
      <span className="wv-target-emoji">{target.emoji || '📝'}</span>
      <div><small>{mode === 'lesson' ? `درس ${toFa(Math.max(2, lessonOrder))} · کلمهٔ ${toFa(targetIdx % lessonList.length + 1)} از ${toFa(lessonList.length)}` : 'این کلمه را بنویس:'}</small><b className="tahriri">{target.word}</b></div>
      <button onClick={() => sound.speakPersian(speakable(target.word))} aria-label="شنیدن"><Volume2 /></button>
      <button className={`wv-next ${solved ? 'pulse' : ''}`} onClick={next}><RefreshCw /> کلمهٔ بعدی</button>
    </section>}
    {mode === 'lesson' && lessonOrder === 1 && <p className="wv-note">در درس ۱ هنوز کلمه‌ای نداریم؛ کلمه‌های درس ۲ (آب، بابا) نمایش داده می‌شوند.</p>}
    {mode === 'free' && <p className="wv-note">هر کلمه‌ای دوست داری بساز؛ هر وقت کلمه‌ات تمام شد دکمهٔ «پایان» را بزن.</p>}

    <div ref={boardRef} className={`wv-board ${drag ? 'is-dragging' : ''}`}>
      <div className="wv-park" style={{ height: parkH }}><span>جای حروف</span></div>
      <div className="wv-magnet" style={{ top: parkH }}><span>تختهٔ مغناطیسی</span></div>
      <div className={`wv-line ${hoverLine ? 'hot' : ''}`} style={{ top: lineY }} />
      <div className="wv-band" style={{ top: lineY - band, height: band * 2 }} />

      {free.map(p => p.id === dragFreeId ? null : <span key={p.id} className="wv-piece tahriri" style={{ left: p.x, top: p.y }} onPointerDown={e => startFree(e, p)}>{parseToken(p.token).glyph}</span>)}

      {words.map(w => {
        const defs = w.seq.map(s => parseToken(s.token));
        const moving = dragWord?.id === w.id && boardRect;
        const x = moving ? dragWord!.cx - boardRect!.left - dragWord!.ox : w.x;
        const y = moving ? dragWord!.cy - boardRect!.top - dragWord!.oy : lineY;
        return <div key={w.id} className={`wv-word ${w.closed ? 'closed' : ''} ${w.status || ''} ${shakeWord === w.id ? 'shake' : ''}`} style={{ right: size.w - x, top: y }}>
          <span ref={el => { if (el) wordRefs.current.set(w.id, el); else wordRefs.current.delete(w.id); }} className="tahriri wv-word-text" onPointerDown={e => startWord(e, w)}>{renderSequence(defs)}</span>
          {!w.closed && <button className="wv-pop" onClick={() => popLast(w)} aria-label="برداشتن حرف آخر"><Undo2 /></button>}
        </div>;
      })}
      {!free.length && !words.length && <p className="wv-empty">{mode === 'lesson' ? '' : 'جعبهٔ حروف را باز کن و حرف‌ها را روی تخته بکش'}</p>}
    </div>

    <footer className="wv-actions">
      {mode !== 'lesson' && <button className="wv-box-btn" onClick={() => { setBoxOpen(o => !o); setBoxKey(null); sound.playPop(); }}><Package /> جعبهٔ حروف</button>}
      <button className="soft-btn" onClick={clearAll}><Eraser /> از اول</button>
      <button className="big-done" onClick={finish}>{mode === 'free' ? <><Flag /> پایان</> : <><Check /> تایید</>}</button>
    </footer>

    {boxOpen && <div className="letter-box-backdrop" onClick={() => setBoxOpen(false)}>
      <section className="letter-box" onClick={e => e.stopPropagation()} aria-label="جعبه حروف">
        <header><b>جعبهٔ حروف</b><small>روی یک نشانه بزن، بعد شکلی را که می‌خواهی روی تخته بکش</small><button onClick={() => setBoxOpen(false)} aria-label="بستن"><X /></button></header>
        {boxKey && <div className="box-forms">
          {LETTER_BOX.find(k => k.id === boxKey)!.pieces.map(t => <span key={t} className="box-form tahriri" onPointerDown={e => startNew(e, t)}>{parseToken(t).glyph}</span>)}
        </div>}
        <div className="box-keys">
          {LETTER_BOX.map(k => <button key={k.id} className={`box-key tahriri ${boxKey === k.id ? 'active' : ''} ${k.lesson > lessonOrder ? 'later' : ''}`} onClick={() => { setBoxKey(k.id); sound.playPop(); }}>
            {k.pieces.map(t => parseToken(t).glyph).join(' ')}
          </button>)}
        </div>
      </section>
    </div>}
    {renderDragGhost()}
    <FeedbackToast state={fb} onClose={() => setFb(null)} ms={3800} />
  </main>;
};
