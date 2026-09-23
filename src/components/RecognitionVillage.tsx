import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eraser, RefreshCw, Volume2, X } from 'lucide-react';
import { CURRICULUM, CurriculumLesson, LikeWord } from '../data/curriculum';
import { WORD_BANK } from '../data/wordBank';
import { sound } from '../utils/audio';
import { shuffle, toFa, useCurrentLesson } from '../utils/lessonState';
import { LessonPicker } from './shared/LessonPicker';
import { cheer, FeedbackState, FeedbackToast, praise } from './shared/Feedback';

const houses = [
  { id: 'trace' as const, title: 'بازی اول', subtitle: 'روی نشانه دست بکش', asset: '/assets/letters-house-1.svg' },
  { id: 'hunt' as const, title: 'بازی دوم', subtitle: 'حرف را پیدا کن', asset: '/assets/letters-house-2.svg' },
  { id: 'like' as const, title: 'بازی سوم', subtitle: 'چی مثلِ چی؟', asset: '/assets/letters-house-3.svg' },
  { id: 'flash' as const, title: 'بازی چهارم', subtitle: 'فلش‌کارت', asset: '/assets/letters-house-4.svg' },
] as const;
type House = typeof houses[number]['id'];

export const RecognitionVillage: React.FC<{ onBack: () => void; onHome: () => void; onComplete: (t: 'letter' | 'word', id?: string) => void }> = ({ onBack, onHome, onComplete }) => {
  const [house, setHouse] = useState<House | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [lessonOrder] = useCurrentLesson();
  const lesson = CURRICULUM[lessonOrder - 1];
  const chooseHouse = (id: House) => { sound.playPop(); setHouse(id); };
  const done = useCallback(() => onComplete('letter', lesson.id), [onComplete, lesson.id]);

  if (house) {
    const h = houses.find(x => x.id === house)!;
    return <main className="recognition-game-screen" dir="rtl">
      <header className="letters-game-header">
        <button onClick={() => setHouse(null)} aria-label="بازگشت به خانه‌ها"><span>‹</span></button>
        <div><small>{h.title}</small><strong>{h.subtitle}</strong></div>
        <button onClick={onHome} aria-label="صفحه شروع"><img src="/assets/letters-home.svg" alt="خانه" /></button>
      </header>
      <div className="recognition-game-body">
        <LessonPicker />
        {house === 'trace' && <LetterTrace key={lesson.id} lesson={lesson} onDone={done} />}
        {house === 'hunt' && <LetterHunt key={lesson.id} lesson={lesson} onDone={done} />}
        {house === 'like' && <LikeWhat key={lesson.id} lesson={lesson} onDone={done} />}
        {house === 'flash' && <FlashCards key={lesson.id} lesson={lesson} />}
      </div>
    </main>;
  }
  return <main className="letters-village-screen" dir="rtl">
    <div className="letters-village-content">
      <img className="letters-village-map" src="/assets/letters-map.svg" alt="مسیر دهکده آشنایی با حروف" />
      <div className="letters-village-shade" aria-hidden="true" />
      <section className="letters-houses" aria-label="بازی‌های آشنایی با حروف">
        {houses.map((h, i) => <button key={h.id} className={`letters-house house-${i + 1}`} onClick={() => chooseHouse(h.id)} aria-label={`${h.title}: ${h.subtitle}`}><img src={h.asset} alt="" /><span><b>{h.title}</b><small>{h.subtitle}</small></span></button>)}
      </section>
    </div>
    <header className="letters-village-header">
      <button onClick={onHome} aria-label="بازگشت به صفحه شروع"><img src="/assets/letters-home.svg" alt="خانه" /></button>
      <div><span>دهکده اول</span><strong>آشنایی با حروف</strong></div>
      <button onClick={() => { sound.playPop(); setHelpOpen(true); }} aria-label="راهنما"><img src="/assets/letters-help.svg" alt="راهنما" /></button>
    </header>
    <footer className="letters-village-footer">نشانهٔ امروز: <b className="tahriri inline-glyph">{lesson.sign}</b> · یک خانه را انتخاب کن</footer>
    {helpOpen && <div className="letters-help-backdrop" onClick={() => setHelpOpen(false)}><section className="letters-help-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <button className="letters-help-close" onClick={() => setHelpOpen(false)}><X /></button>
      <div className="letters-help-mark">؟</div><h2>آشنایی با حروف</h2>
      <p>همهٔ بازی‌ها طبق ترتیب درس‌های کتاب فارسی اول جلو می‌روند و فقط از نشانه‌هایی استفاده می‌کنند که تا درسِ انتخاب‌شده خوانده‌ای.</p>
      <LessonPicker />
      <div className="letters-help-list">{houses.map((h, i) => <button key={h.id} onClick={() => { setHelpOpen(false); chooseHouse(h.id); }}><span>{i + 1}</span><b>{h.title}</b><small>{h.subtitle}</small></button>)}</div>
    </section></div>}
  </main>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۱: شکل پررنگ بالا، شکل توخالی/خط‌چین بزرگ پایین، دست‌کشیدن و «انجام دادم» */
const TRACE_FONT = 'Tahriri';
const LetterTrace: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const items = useMemo(() => {
    const list: { text: string; label: string }[] = [];
    const formsText = lesson.forms.join('  ');
    for (let r = 1; r <= 3; r++) list.push({ text: formsText, label: `نشانهٔ «${lesson.sign}» · بار ${toFa(r)} از ${toFa(3)}` });
    if (lesson.forms.length > 2) lesson.forms.forEach(f => list.push({ text: f, label: `یک شکل از «${lesson.sign}»` }));
    WORD_BANK.filter(w => w.lesson === lesson.order).slice(0, 4).forEach(w => list.push({ text: w.word, label: `واژهٔ درس: ${w.emoji}` }));
    return list;
  }, [lesson]);
  const [index, setIndex] = useState(0);
  const [fb, setFb] = useState<FeedbackState>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const layout = useRef<{ w: number; h: number; size: number; strokes: { x: number; y: number }[][] }>({ w: 0, h: 0, size: 100, strokes: [] });
  const drawing = useRef(false);
  const item = items[index % items.length];

  const drawGuide = useCallback(async () => {
    const wrap = wrapRef.current, guide = guideRef.current, ink = inkRef.current;
    if (!wrap || !guide || !ink) return;
    try { await document.fonts.load(`100px ${TRACE_FONT}`); } catch { /* ignore */ }
    const w = wrap.clientWidth, h = Math.max(240, Math.min(420, Math.round(w * 0.55)));
    const dpr = window.devicePixelRatio || 1;
    for (const c of [guide, ink]) { c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`; c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0); }
    const ctx = guide.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = h * 1.3;
    ctx.font = `${size}px ${TRACE_FONT}`;
    const tw = ctx.measureText(item.text).width;
    if (tw > w * 0.9) size = size * (w * 0.9) / tw;
    ctx.font = `${size}px ${TRACE_FONT}`;
    // خط زمینه
    ctx.strokeStyle = 'rgba(120,150,190,.25)'; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(10, h * 0.56); ctx.lineTo(w - 10, h * 0.56); ctx.stroke();
    // شکل توخالی: درون خیلی کم‌رنگ، دور خط‌چین
    ctx.fillStyle = 'rgba(210,220,235,.55)';
    ctx.fillText(item.text, w / 2, h * 0.5);
    ctx.setLineDash([Math.max(4, size * 0.03), Math.max(3, size * 0.022)]);
    ctx.lineWidth = Math.max(1.5, size * 0.008); ctx.strokeStyle = '#7b8798';
    ctx.strokeText(item.text, w / 2, h * 0.5);
    ctx.setLineDash([]);
    layout.current = { w, h, size, strokes: [] };
    ink.getContext('2d')!.clearRect(0, 0, w, h);
  }, [item.text]);

  useEffect(() => { drawGuide(); const on = () => drawGuide(); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, [drawGuide]);
  useEffect(() => { sound.speakPersian(`روی ${item.text.includes(' ') ? 'نشانه‌ها' : 'نشانه'} دست بکش`); }, [index]); // eslint-disable-line

  const pos = (e: React.PointerEvent) => { const r = inkRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: React.PointerEvent) => { e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId); drawing.current = true; layout.current.strokes.push([pos(e)]); };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return; const p = pos(e); const s = layout.current.strokes[layout.current.strokes.length - 1]; const last = s[s.length - 1]; s.push(p);
    const ctx = inkRef.current!.getContext('2d')!; ctx.strokeStyle = lesson.part === 1 ? '#ef5b5b' : '#6c5ce7'; ctx.lineWidth = Math.max(8, layout.current.size * 0.045); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const up = () => { drawing.current = false; };
  const clear = () => { layout.current.strokes = []; const { w, h } = layout.current; inkRef.current?.getContext('2d')!.clearRect(0, 0, w, h); };

  /** درصد پوشش شکل نشانه با خط کودک */
  const coverage = () => {
    const { w, h, size, strokes } = layout.current;
    const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
    const m = mask.getContext('2d')!; m.direction = 'rtl'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.font = `${size}px ${TRACE_FONT}`; m.fillStyle = '#000'; m.fillText(item.text, w / 2, h * 0.5);
    const inkC = document.createElement('canvas'); inkC.width = w; inkC.height = h;
    const k = inkC.getContext('2d')!; k.strokeStyle = '#000'; k.lineWidth = Math.max(14, size * 0.07); k.lineCap = 'round'; k.lineJoin = 'round';
    strokes.forEach(s => { k.beginPath(); s.forEach((p, i) => i ? k.lineTo(p.x, p.y) : k.moveTo(p.x, p.y)); if (s.length === 1) k.lineTo(s[0].x + 0.1, s[0].y); k.stroke(); });
    const a = m.getImageData(0, 0, w, h).data, b = k.getImageData(0, 0, w, h).data;
    let glyph = 0, hit = 0, inkPx = 0, inkOn = 0;
    for (let i = 3; i < a.length; i += 16) { const g = a[i] > 60, s = b[i] > 60; if (g) { glyph++; if (s) hit++; } if (s) { inkPx++; if (g) inkOn++; } }
    return { cover: glyph ? hit / glyph : 0, precision: inkPx ? inkOn / inkPx : 0 };
  };

  const finish = () => {
    if (!layout.current.strokes.length) { setFb({ tone: 'info', text: 'اول با انگشتت روی خط‌چین‌ها دست بکش.' }); return; }
    const { cover, precision } = coverage();
    if (cover >= 0.45 && precision >= 0.18) {
      sound.playSuccess(); const p = praise(); sound.speakPersian(p); setFb({ tone: 'good', text: `${p} خیلی خوب نوشتی.` }); onDone();
      window.setTimeout(() => setIndex(i => (i + 1) % items.length), 900);
    } else {
      sound.speakPersian('کمی بیشتر روی خط‌چین دست بکش');
      setFb({ tone: 'try', text: cover < 0.45 ? 'هنوز همهٔ شکل را نکشیده‌ای؛ کمی بیشتر روی خط‌چین دست بکش.' : 'از خط‌چین بیرون رفتی؛ آرام‌تر و روی خود نشانه بکش.' });
    }
  };

  return <div className="mini-game trace-game">
    <div className="trace-model" aria-label="شکل نشانه">
      <span className="tahriri trace-model-glyph">{item.text}</span>
      <button onClick={() => sound.speakPersian(lesson.spoken)} aria-label="شنیدن"><Volume2 /></button>
    </div>
    <p className="trace-label">{item.label} <em>({toFa(index % items.length + 1)} از {toFa(items.length)})</em></p>
    <div className="trace-canvas-wrap" ref={wrapRef}>
      <canvas ref={guideRef} className="trace-guide" />
      <canvas ref={inkRef} className="trace-ink" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    </div>
    <div className="trace-actions">
      <button className="soft-btn" onClick={clear}><Eraser /> پاک کن</button>
      <button className="big-done" onClick={finish}><Check /> انجام دادم</button>
      <button className="soft-btn" onClick={() => { clear(); setIndex(i => (i + 1) % items.length); }}>بعدی <ChevronLeft /></button>
    </div>
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
  </div>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۲: پیدا کردن حرف در میان حروف خاکستری درهم */
const LetterHunt: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const [round, setRound] = useState(0);
  const target = lesson.forms[round % lesson.forms.length];
  const cells = useMemo(() => {
    const targetCount = 4 + Math.floor(Math.random() * 3);
    const pool = new Set<string>();
    CURRICULUM.forEach(l => { if (l.order <= Math.max(lesson.order + 3, 10)) l.forms.forEach(f => pool.add(f)); });
    lesson.forms.forEach(f => pool.add(f));
    pool.delete(target);
    const distractors = shuffle([...pool]).filter(f => f.replace(/[\u200D]/g, '') !== target.replace(/[\u200D]/g, ''));
    const list: string[] = [];
    for (let i = 0; i < targetCount; i++) list.push(target);
    for (let i = 0; list.length < 24; i++) list.push(distractors[i % distractors.length]);
    return shuffle(list).map((g, i) => ({ id: i, g, isTarget: g === target, rot: Math.round(Math.random() * 24 - 12), dx: Math.round(Math.random() * 30 - 15), dy: Math.round(Math.random() * 24 - 12), scale: 0.85 + Math.random() * 0.35 }));
  }, [round, lesson, target]);
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const total = cells.filter(c => c.isTarget).length;
  useEffect(() => { setFound([]); sound.speakPersian(`نشانهٔ ${lesson.spoken} را پیدا کن`); }, [round]); // eslint-disable-line

  const tap = (c: typeof cells[number]) => {
    if (found.includes(c.id)) return;
    if (c.isTarget) {
      const n = [...found, c.id]; setFound(n); sound.playPop();
      if (n.length === total) { sound.playSuccess(); const p = praise(); sound.speakPersian(p); setFb({ tone: 'good', text: `${p} همه را پیدا کردی.` }); onDone(); }
    } else { setWrong(c.id); sound.speakPersian('این نیست'); window.setTimeout(() => setWrong(null), 600); }
  };

  return <div className="mini-game hunt-game">
    <div className="hunt-target">
      <span>این را پیدا کن:</span>
      <b className="tahriri">{target}</b>
      <button onClick={() => sound.speakPersian(lesson.spoken)} aria-label="شنیدن"><Volume2 /></button>
    </div>
    <div className="hunt-field" aria-label="حروف درهم">
      {cells.map(c => <button key={c.id} className={`hunt-glyph tahriri ${found.includes(c.id) ? 'found' : ''} ${wrong === c.id ? 'wrong' : ''}`} style={{ transform: `translate(${c.dx}%, ${c.dy}%) rotate(${c.rot}deg) scale(${c.scale})` }} onClick={() => tap(c)}>{c.g}</button>)}
    </div>
    <div className="hunt-footer"><span>{toFa(found.length)} از {toFa(total)} پیدا شد</span><button className="soft-btn" onClick={() => setRound(r => r + 1)}><RefreshCw /> دور بعد</button></div>
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
  </div>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۳: «آ» مثلِ ...؟ انتخاب همهٔ کلمه‌های درست */
const ALL_LIKE: LikeWord[] = (() => { const m = new Map<string, LikeWord>(); CURRICULUM.forEach(l => l.likeWords.forEach(w => { if (w.emoji && !m.has(w.word)) m.set(w.word, w); })); return [...m.values()]; })();
const hasSign = (lesson: CurriculumLesson, word: string) => lesson.chars.some(ch => word.includes(ch)) || (lesson.order === 1 && word.includes('آ'));

const LikeWhat: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const [round, setRound] = useState(0);
  const options = useMemo(() => {
    const correct = shuffle(lesson.likeWords.filter(w => w.emoji)).slice(0, 3);
    const wrong = shuffle(ALL_LIKE.filter(w => !hasSign(lesson, w.word))).slice(0, 6 - correct.length);
    return shuffle([...correct.map(w => ({ ...w, ok: true })), ...wrong.map(w => ({ ...w, ok: false }))]);
  }, [lesson, round]);
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const need = options.filter(o => o.ok).length;
  useEffect(() => { setPicked([]); sound.speakPersian(`${lesson.spoken} مثلِ؟`); }, [round]); // eslint-disable-line

  const choose = (o: typeof options[number]) => {
    if (picked.includes(o.word)) return;
    sound.speakPersian(o.word.replace(/[\u064B-\u0652]/g, ''));
    if (o.ok) {
      const n = [...picked, o.word]; setPicked(n); sound.playPop();
      if (n.length === need) { sound.playSuccess(); const p = praise(); setFb({ tone: 'good', text: `${p} همهٔ کلمه‌های «${lesson.sign}» را پیدا کردی.` }); onDone(); }
    } else { setShake(o.word); setFb({ tone: 'try', text: `«${o.word}» صدای «${lesson.sign}» ندارد. ${cheer()}` }); window.setTimeout(() => setShake(null), 650); }
  };

  return <div className="mini-game like-game">
    <h2 className="like-prompt"><b className="tahriri">{lesson.forms.join(' ')}</b> مثلِ ...؟</h2>
    <p className="game-hint">کلمه‌هایی را انتخاب کن که صدای «{lesson.sign}» دارند ({toFa(picked.length)} از {toFa(need)})</p>
    <div className="like-grid">
      {options.map(o => <button key={o.word} className={`like-card ${picked.includes(o.word) ? 'picked' : ''} ${shake === o.word ? 'wrong' : ''}`} onClick={() => choose(o)}>
        <span className="like-emoji">{o.emoji}</span><b className="tahriri">{o.word}</b>{picked.includes(o.word) && <i><Check /></i>}
      </button>)}
    </div>
    <div className="hunt-footer"><span /><button className="soft-btn" onClick={() => setRound(r => r + 1)}><RefreshCw /> کلمه‌های تازه</button></div>
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
  </div>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۴: فلش‌کارت؛ رو: «نـ ن مثلِ؟» — پشت: تصویر و نوشتهٔ کلمه */
const FlashCards: React.FC<{ lesson: CurriculumLesson }> = ({ lesson }) => {
  const cards = lesson.likeWords;
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const card = cards[i % cards.length];
  const go = (d: number) => { setFlip(false); window.setTimeout(() => setI(x => (x + d + cards.length) % cards.length), 180); sound.playPop(); };
  const toggle = () => { setFlip(f => { if (!f) sound.speakPersian(card.word.replace(/[\u064B-\u0652]/g, '')); else sound.speakPersian(`${lesson.spoken} مثلِ؟`); return !f; }); };
  return <div className="mini-game flash-game">
    <div className={`flash-card ${flip ? 'flipped' : ''}`} onClick={toggle} role="button" aria-label="کارت را برگردان">
      <div className="flash-face front"><b className="tahriri">{lesson.forms.join(' ')}</b><span>مثلِ ...؟</span><small>برای دیدن جواب، روی کارت بزن</small></div>
      <div className="flash-face back"><span className="flash-emoji">{card.emoji}</span><b className="tahriri">{card.word}</b><small className="tahriri">{lesson.forms.join(' ')} مثلِ {card.word}</small></div>
    </div>
    <div className="flash-nav">
      <button className="soft-btn" onClick={() => go(-1)}><ChevronRight /> قبلی</button>
      <span>{toFa(i % cards.length + 1)} / {toFa(cards.length)}</span>
      <button className="soft-btn" onClick={() => go(1)}>بعدی <ChevronLeft /></button>
    </div>
  </div>;
};
