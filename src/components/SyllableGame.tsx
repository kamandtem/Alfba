import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, RotateCcw, Volume2 } from 'lucide-react';
import { CurriculumLesson, bookLessonOf, kidDisplay, kidGlyph } from '../data/curriculum';
import { WORD_BANK } from '../data/wordBank';
import { lessonOfWord, plainWord } from '../utils/pieces';
import { parseSyllables, ParsedWord, SoundCell, SOUND_ONLY_UNTIL_BOOK, SYLLABLE_WORDS } from '../utils/syllables';
import { sound } from '../utils/audio';
import { shuffle, toFa } from '../utils/lessonState';
import { vibrate } from '../utils/native';
import { FeedbackState, FeedbackToast, praise } from './shared/Feedback';

/**
 * بازی پنجم دهکدهٔ اول: «بخش‌بخش کن» (هجا و صدا) — مثل جدول‌های صفحهٔ ۴۸، ۵۰، ۵۵ و ۶۴ کتاب نگارش اول.
 * طبقهٔ اول: خود کلمه (حرف‌ها لمسی‌اند) ← با کشیدن انگشت چند حرف را انتخاب کن و در طبقهٔ دوم بگذار.
 * طبقهٔ دوم: به تعداد بخش‌های کلمه خانه دارد. طبقهٔ سوم: هر خانه فقط یک حرف/صدا می‌گیرد؛ اعراب خانهٔ خط‌تیره‌دار دارد.
 * درس‌های ۱ تا ۳ کتاب فقط «صداهای هر کلمه» را جدا می‌کنند (گردی‌ها، مثل صفحهٔ ۲۸، ۳۴، ۴۰ و ۴۳).
 */

const speakable = (s: string) => s.replace(/[\u064B-\u0652\u200D\u0640]/g, '');
const emojiOf = (w: string) => WORD_BANK.find(e => e.plain === plainWord(w))?.emoji || '';

/** ۳ تا ۴ واژه برای درس انتخاب‌شده؛ فقط واژه‌هایی که همهٔ نشانه‌هایشان خوانده شده */
export function syllableWordsFor(order: number): string[] {
  const o = Math.max(2, order);
  const book = bookLessonOf(o);
  const out: string[] = [];
  for (let b = book; b >= 1 && out.length < 4; b--) {
    for (const w of SYLLABLE_WORDS[b] || []) if (out.length < 4 && !out.includes(w) && lessonOfWord(w) <= o) out.push(w);
    if (b === book && out.length >= 3) break;
  }
  return out.length ? out : ['آب', 'بابا'];
}

type CombinationVowel = { id: string; lesson: number; forms: string[]; output: string };
type CombinationConsonant = { id: string; lesson: number; form: string; name: string };

/** جدول ترکیبات مقدماتی کتاب: مصوت‌ها افقی، صامت‌های خوانده‌شده عمودی. */
const COMBINATION_VOWELS: CombinationVowel[] = [
  { id: 'aa', lesson: 1, forms: ['آ', 'ا'] },
  { id: 'a', lesson: 3, forms: ['اَ', 'ـَ'] },
  { id: 'e', lesson: 13, forms: ['اِ', 'ـِ', 'ـه', 'ه'] },
  { id: 'o', lesson: 16, forms: ['اُ', 'ـُ'] },
  { id: 'ou', lesson: 7, forms: ['او', 'و'] },
  { id: 'ey', lesson: 11, forms: ['ایـ', 'یـ', 'ی'] },
];

const COMBINATION_CONSONANTS: CombinationConsonant[] = [
  { id: 'be', lesson: 2, form: 'بـ', name: 'ب' },
  { id: 'dal', lesson: 4, form: 'د', name: 'د' },
  { id: 'mim', lesson: 5, form: 'مـ', name: 'م' },
  { id: 'sin', lesson: 6, form: 'سـ', name: 'س' },
  { id: 'te', lesson: 8, form: 'تـ', name: 'ت' },
  { id: 're', lesson: 9, form: 'ر', name: 'ر' },
  { id: 'noon', lesson: 10, form: 'نـ', name: 'ن' },
  { id: 'ze', lesson: 12, form: 'ز', name: 'ز' },
  { id: 'shin', lesson: 14, form: 'شـ', name: 'ش' },
  { id: 'kaf', lesson: 17, form: 'کـ', name: 'ک' },
  { id: 'pe', lesson: 19, form: 'پـ', name: 'پ' },
];

const combinationText = (consonant: CombinationConsonant, vowel: CombinationVowel, form: string) => {
  const base = consonant.name;
  if (vowel.id === 'aa') return `${base}ا`;
  if (vowel.id === 'ou') return `${base}و`;
  if (vowel.id === 'ey') return `${base}ی`;
  if (vowel.id === 'e' && (form === 'ـه' || form === 'ه')) return `${base}ه`;
  if (vowel.id === 'a') return `${base}َ`;
  if (vowel.id === 'e') return `${base}ِ`;
  if (vowel.id === 'o') return `${base}ُ`;
  return `${base}${form}`;
};

type Chip = { id: string; cell: SoundCell; used: boolean };
type Drag = { kind: 'sel' | 'chip'; chipId?: string; x: number; y: number; sx: number; sy: number; moved: boolean; label: string } | null;
type UnitBox = { left: number; top: number; width: number; height: number };

/** کلمهٔ طبقهٔ اول به صورت یک متن کامل و خوانا دیده می‌شود؛ لایه‌های نامرئی روی هر حرف، انتخاب با کشیدن را ممکن می‌کنند. */
const SelectableWord: React.FC<{
  parsed: ParsedWord;
  usedUnits: Set<number>;
  sel: { a: number; b: number } | null;
  onUnitDown: (e: React.PointerEvent, unit: number) => void;
}> = ({ parsed, usedUnits, sel, onUnitDown }) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [boxes, setBoxes] = useState<UnitBox[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current, textEl = textRef.current;
    const node = textEl?.firstChild;
    if (!wrap || !textEl || !node) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const base = wrap.getBoundingClientRect();
      const next: UnitBox[] = [];
      for (const unit of parsed.units) {
        const start = Math.min(...unit.cells.map(c => c.i));
        const end = Math.max(...unit.cells.map(c => c.i)) + 1;
        const range = document.createRange();
        try { range.setStart(node, start); range.setEnd(node, end); } catch { continue; }
        const rects = Array.from(range.getClientRects()).filter(r => r.width > 0 || r.height > 0);
        if (!rects.length) continue;
        const left = Math.min(...rects.map(r => r.left));
        const top = Math.min(...rects.map(r => r.top));
        const right = Math.max(...rects.map(r => r.right));
        const bottom = Math.max(...rects.map(r => r.bottom));
        next.push({ left: left - base.left - 3, top: top - base.top - 5, width: right - left + 6, height: bottom - top + 10 });
      }
      if (next.length !== parsed.units.length) {
        const r = textEl.getBoundingClientRect();
        const w = r.width / Math.max(1, parsed.units.length);
        setBoxes(parsed.units.map((_, i) => ({ left: r.width - (i + 1) * w, top: 0, width: w, height: r.height })));
      } else setBoxes(next);
    };
    measure();
    try { document.fonts.load('80px "Tahriri"', parsed.word).then(measure).catch(() => undefined); } catch { /* ignore */ }
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer) observer.observe(wrap);
    window.addEventListener('resize', measure);
    return () => { alive = false; observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [parsed]);

  return <span ref={wrapRef} className="syl-word-select" dir="rtl">
    <span ref={textRef} className="syl-word-visible">{parsed.word}</span>
    {boxes.map((box, i) => {
      const unit = parsed.units[i];
      if (!unit) return null;
      const used = usedUnits.has(unit.index);
      return <button key={unit.index} type="button" data-unit={unit.index} disabled={used}
        className={`syl-unit-hit ${used ? 'used' : ''} ${sel && unit.index >= sel.a && unit.index <= sel.b ? 'sel' : ''}`}
        style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
        onPointerDown={e => onUnitDown(e, unit.index)} aria-label={`انتخاب بخش ${unit.cells.map(c => c.text).join('')}`} />;
    })}
  </span>;
};

export const SyllableGame: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const [section, setSection] = useState<'syllable' | 'combination'>('syllable');
  const combinationVowels = useMemo(() => COMBINATION_VOWELS.filter(v => v.lesson <= Math.min(lesson.order, 19)), [lesson.order]);
  const combinationConsonants = useMemo(() => COMBINATION_CONSONANTS.filter(c => c.lesson <= Math.min(lesson.order, 19)), [lesson.order]);
  const [selectedConsonant, setSelectedConsonant] = useState<CombinationConsonant | null>(null);
  const [selectedVowel, setSelectedVowel] = useState<{ group: CombinationVowel; form: string } | null>(null);
  const [combination, setCombination] = useState('');
  const [combinationNonce, setCombinationNonce] = useState(0);
  const words = useMemo(() => syllableWordsFor(lesson.order), [lesson.order]);
  const soundOnly = bookLessonOf(Math.max(2, lesson.order)) <= SOUND_ONLY_UNTIL_BOOK;
  const [idx, setIdx] = useState(0);
  const word = words[idx % words.length];
  const parsed: ParsedWord = useMemo(() => parseSyllables(word), [word]);
  const N = parsed.cells.length;

  const [stage, setStage] = useState<1 | 2 | 3>(soundOnly ? 2 : 1); // ۱: بخش‌ها ، ۲: صداها ، ۳: تمام
  const [sylDone, setSylDone] = useState<boolean[]>([]);
  const [sel, setSel] = useState<{ a: number; b: number } | null>(null);
  const [filled, setFilled] = useState<(SoundCell | null)[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const swipe = useRef<{ anchor: number } | null>(null);
  const timer = useRef(0);
  const usedUnits = useMemo(() => { const s = new Set<number>(); parsed.syllables.forEach((sy, k) => { if (sylDone[k]) sy.units.forEach(u => s.add(u)); }); return s; }, [parsed, sylDone]);

  const makeChips = useCallback((p: ParsedWord) => {
    const groups = soundOnly ? [p.cells] : p.syllables.map(s => s.cells);
    return groups.flatMap(g => { let s = shuffle(g); if (g.length > 1 && s.every((c, i) => c.i === g[i].i)) s = [...s].reverse(); return s.map(cell => ({ id: `${cell.i}-${Math.random().toString(36).slice(2, 6)}`, cell, used: false })); });
  }, [soundOnly]);

  // شروع هر کلمه
  useEffect(() => {
    window.clearTimeout(timer.current);
    setStage(soundOnly ? 2 : 1); setSylDone(parsed.syllables.map(() => false)); setSel(null); setPicked(null);
    setFilled(parsed.cells.map(() => null)); setChips(makeChips(parsed));
    sound.speakPersian(soundOnly ? `صداهای کلمهٔ ${speakable(word)} را جدا کن` : `کلمهٔ ${speakable(word)} را بخش بخش کن`);
  }, [word, parsed, soundOnly, makeChips]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const nudge = (text: string, key?: string, emoji = '🙈') => {
    vibrate(60); setFb({ tone: 'try', text, emoji }); sound.speakPersian(speakable(text.replace(/«[^»]*»/g, '')));
    if (key) { setShake(key); window.setTimeout(() => setShake(null), 600); }
  };
  const goNext = useCallback(() => { window.clearTimeout(timer.current); setIdx(i => i + 1); }, []);

  const chooseConsonant = (consonant: CombinationConsonant) => {
    setSelectedConsonant(consonant);
    if (selectedVowel) {
      setCombination(combinationText(consonant, selectedVowel.group, selectedVowel.form));
      setCombinationNonce(n => n + 1);
      sound.playSnap();
    } else sound.playPop();
  };
  const chooseVowel = (group: CombinationVowel, form: string) => {
    setSelectedVowel({ group, form });
    if (selectedConsonant) {
      setCombination(combinationText(selectedConsonant, group, form));
      setCombinationNonce(n => n + 1);
      sound.playSnap();
    } else sound.playPop();
  };
  const clearCombination = () => {
    setSelectedConsonant(null);
    setSelectedVowel(null);
    setCombination('');
    sound.playPop();
  };

  const finishWord = () => {
    setStage(3); sound.playSuccess(); const p = praise();
    const last = (idx % words.length) === words.length - 1;
    setFb({ tone: 'good', text: last ? `${p} همهٔ کلمه‌های این درس را ${soundOnly ? 'صدا به صدا جدا کردی' : 'بخش‌بخش کردی'}!` : `${p} «${speakable(word)}» را درست ${soundOnly ? 'جدا کردی' : 'بخش کردی'}.`, emoji: emojiOf(word) || '🌟' });
    sound.speakPersian(p); onDone();
    timer.current = window.setTimeout(goNext, 2000); // خودکار ← کلمهٔ بعد
  };

  /* ---------------- طبقهٔ اول ← دوم: انتخاب چند حرف و گذاشتن در خانهٔ بخش ---------------- */
  const rangeFree = (a: number, b: number) => { for (let u = Math.min(a, b); u <= Math.max(a, b); u++) if (usedUnits.has(u)) return false; return true; };
  const unitAt = (x: number, y: number) => { const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-unit]') as HTMLElement | null; return el ? Number(el.dataset.unit) : null; };
  const dropAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-drop]') as HTMLElement | null;

  const unitDown = (e: React.PointerEvent, u: number) => {
    if (stage !== 1 || usedUnits.has(u)) return;
    e.preventDefault();
    if (sel && u >= sel.a && u <= sel.b) { // کشیدن گروه انتخاب‌شده به سمت طبقهٔ دوم
      setDrag({ kind: 'sel', x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, label: parsed.units.slice(sel.a, sel.b + 1).map(x => x.glyph).join('') });
      return;
    }
    sound.playPop();
    if (sel && (u === sel.a - 1 || u === sel.b + 1) && rangeFree(u, u === sel.a - 1 ? sel.b : sel.a)) {
      const anchor = u === sel.a - 1 ? sel.b : sel.a;
      setSel({ a: Math.min(u, anchor), b: Math.max(u, anchor) }); swipe.current = { anchor };
    } else { setSel({ a: u, b: u }); swipe.current = { anchor: u }; }
  };
  useEffect(() => {
    if (stage !== 1) return;
    const move = (e: PointerEvent) => {
      if (!swipe.current) return;
      const v = unitAt(e.clientX, e.clientY); const a = swipe.current.anchor;
      if (v === null || usedUnits.has(v) || !rangeFree(a, v)) return;
      setSel(s => { const n = { a: Math.min(a, v), b: Math.max(a, v) }; if (s && s.a === n.a && s.b === n.b) return s; sound.playPop(); return n; });
    };
    const up = () => { swipe.current = null; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }); // eslint-disable-line

  const placeSyllable = (k: number) => {
    if (stage !== 1 || sylDone[k]) { if (sylDone[k]) sound.speakPersian(speakable(parsed.syllables[k].plain)); return; }
    if (!sel) { nudge('اول با انگشت روی حرف‌های یک بخش در طبقهٔ اول دست بکش.', undefined, '👆'); return; }
    const need = parsed.syllables[k].units; const got: number[] = []; for (let u = sel.a; u <= sel.b; u++) got.push(u);
    const same = need.length === got.length && need.every((u, i) => u === got[i]);
    if (!same) {
      const inside = got.every(u => need.includes(u));
      if (inside) nudge(`هنوز همهٔ حرف‌های بخش ${toFa(k + 1)} را برنداشتی.`, `syl-${k}`, '✏️');
      else if (need.every(u => got.includes(u))) nudge('زیادی حرف برداشتی! فقط حرف‌های همین بخش را بردار.', `syl-${k}`);
      else if (need[0] > got[got.length - 1] || need[need.length - 1] < got[0]) nudge(`این حرف‌ها مال بخش ${toFa(k + 1)} نیستند؛ خانهٔ دیگری را امتحان کن.`, `syl-${k}`);
      else nudge('این بخش درست نیست. کلمه را آرام بخوان و دوباره انتخاب کن.', `syl-${k}`);
      return;
    }
    const n = sylDone.map((d, i) => d || i === k); setSylDone(n); setSel(null); sound.playSnap();
    sound.speakPersian(speakable(parsed.syllables[k].plain));
    if (n.every(Boolean)) { window.setTimeout(() => { setStage(2); sound.speakPersian('حالا حرف‌های هر بخش را یکی یکی در خانه‌ها بگذار'); }, 700); }
  };

  /* ---------------- طبقهٔ دوم ← سوم: هر خانه فقط یک حرف ---------------- */
  const placeChip = (chipId: string, j: number) => {
    const chip = chips.find(c => c.id === chipId); if (!chip || chip.used) return;
    const target = parsed.cells[j];
    if (filled[j]) { nudge('هر خانه فقط یک حرف می‌گیرد؛ این خانه پُر است.', `cell-${j}`, '✋'); return; }
    if (!soundOnly && target.syl !== chip.cell.syl) { nudge(`این حرف مال بخش ${toFa(chip.cell.syl + 1)} است؛ آن را زیر همان بخش بگذار.`, `cell-${j}`); return; }
    if (target.key !== chip.cell.key) { nudge(target.mark ? 'روی خطِ تیره فقط اعراب (ـَ ـِ ـُ) می‌نشیند.' : chip.cell.mark ? 'اعراب را روی خانهٔ خط‌تیره‌دار بگذار.' : 'این‌جا جای این حرف نیست. به ترتیب صداها دقت کن.', `cell-${j}`); return; }
    const nf = filled.map((f, i) => i === j ? target : f); setFilled(nf);
    setChips(cs => cs.map(c => c.id === chipId ? { ...c, used: true } : c)); setPicked(null); sound.playSnap();
    sound.speakPersian(target.mark ? (target.text === '\u064E' ? 'اَ' : target.text === '\u0650' ? 'اِ' : 'اُ') : speakable(target.text));
    if (nf.every(Boolean)) finishWord();
  };
  const cellTap = (j: number) => { if (stage !== 2) return; if (!picked) { if (!filled[j]) nudge('اول یک حرف از بالا انتخاب کن.', undefined, '👆'); return; } placeChip(picked, j); };
  const chipDown = (e: React.PointerEvent, c: Chip) => {
    if (stage !== 2 || c.used) return; e.preventDefault(); sound.playPop();
    setPicked(c.id); setDrag({ kind: 'chip', chipId: c.id, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, label: kidGlyph(c.cell.glyph) });
  };

  // کشیدن و رها کردن (گروه حروف یا یک حرف)
  useLayoutEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY, moved: d.moved || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8 } : d);
    const up = (e: PointerEvent) => {
      const d = drag; setDrag(null); if (!d) return;
      if (!d.moved) { if (d.kind === 'sel') setSel(null); return; }
      const el = dropAt(e.clientX, e.clientY); if (!el) return;
      const [kind, n] = (el.dataset.drop || '').split(':');
      if (d.kind === 'sel' && kind === 'syl') placeSyllable(Number(n));
      if (d.kind === 'chip' && kind === 'cell' && d.chipId) placeChip(d.chipId, Number(n));
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }); // eslint-disable-line

  const restart = () => { window.clearTimeout(timer.current); setStage(soundOnly ? 2 : 1); setSylDone(parsed.syllables.map(() => false)); setSel(null); setPicked(null); setFilled(parsed.cells.map(() => null)); setChips(makeChips(parsed)); sound.playPop(); };

  const hint = stage === 3 ? 'آفرین! کلمهٔ بعدی می‌آید…'
    : soundOnly ? 'صداهای کلمه را یکی‌یکی از جعبه بردار و به ترتیب در گردی‌ها بگذار.'
    : stage === 1 ? 'با انگشت روی حرف‌های یک بخش دست بکش، بعد آن را در خانهٔ همان بخش در طبقهٔ دوم بگذار.'
    : 'حرف‌های هر بخش را یکی‌یکی بردار و در خانه‌های طبقهٔ سوم بگذار. هر خانه فقط یک حرف!';

  const cellView = (c: SoundCell, j: number, extra = '') => {
    const f = filled[j];
    return <button key={`c${j}`} data-drop={`cell:${j}`} onClick={() => cellTap(j)}
      className={`syl-cell ${extra} ${c.mark ? 'is-mark' : ''} ${f ? 'filled' : ''} ${shake === `cell-${j}` ? 'shake' : ''} ${stage === 2 && picked && !f ? 'ready' : ''}`}
      style={soundOnly ? undefined : { gridColumn: 'span 1' }} aria-label={f ? speakable(f.text) : 'خانهٔ خالی'}>
      {f ? <span className="tahriri">{kidGlyph(f.glyph)}</span> : c.mark ? <i className="syl-dash" aria-hidden="true" /> : <i className="syl-line" aria-hidden="true" />}
    </button>;
  };

  return <div className="mini-game syl-game">
    <div className="syl-top">
      <span className="syl-count">{section === 'combination' ? 'ترکیب صامت و مصوت' : soundOnly ? 'صداهای هر کلمه' : 'بخش‌بخش کن'}{section === 'syllable' && ` · کلمهٔ ${toFa(idx % words.length + 1)} از ${toFa(words.length)}`}</span>
      <button className="syl-speak" onClick={() => sound.speakPersian(section === 'combination' ? (combination ? speakable(combination) : 'صامت و مصوت') : speakable(word))} aria-label="شنیدن"><Volume2 /></button>
    </div>
    <nav className="syl-section-switch" aria-label="بخش‌های بازی پنجم">
      <button className={section === 'syllable' ? 'active' : ''} onClick={() => { setSection('syllable'); sound.playPop(); }}>بخش‌بخش کردن</button>
      <button className={section === 'combination' ? 'active' : ''} onClick={() => { setSection('combination'); sound.playPop(); }}>ترکیبات</button>
    </nav>
    {section === 'syllable' && <p className="syl-hint">{hint}</p>}

    {section === 'combination' ? <section className="combination-game" aria-label="بخش ترکیبات">
      <div className="combination-caption">
        <b>با این چی می‌شود؟</b>
        <span>اول یک صامت، بعد یک مصوت را انتخاب کن.</span>
        <small>این تمرین تا درس «پـ پ» ادامه دارد.</small>
      </div>
      <div className="combination-vowel-rail" aria-label="مصوت‌ها">
        {combinationVowels.map(group => <div key={group.id} className="combination-vowel-group">
          <span className="combination-group-label">{group.forms.map(kidDisplay).join(' ')}</span>
          <div className="combination-vowel-forms">
            {group.forms.map(form => <button key={`${group.id}-${form}`} className={`combination-vowel ${selectedVowel?.group.id === group.id && selectedVowel.form === form ? 'selected' : ''}`} onClick={() => chooseVowel(group, form)}>{kidDisplay(form)}</button>)}
          </div>
        </div>)}
      </div>
      <div className="combination-board-body">
        <div className="combination-consonant-rail" aria-label="صامت‌ها">
          {combinationConsonants.map(c => <button key={c.id} className={`combination-consonant tahriri ${selectedConsonant?.id === c.id ? 'selected' : ''}`} onClick={() => chooseConsonant(c)}>
            <span>{kidGlyph(c.form)}</span><small>{c.name}</small>
          </button>)}
        </div>
        <div className="combination-stage" aria-live="polite">
          {!combination && selectedConsonant && <span className="combination-stage-consonant tahriri">{kidGlyph(selectedConsonant.form)}</span>}
          {!combination && selectedVowel && <span className="combination-stage-vowel tahriri">{kidDisplay(selectedVowel.form)}</span>}
          {combination && <button key={combinationNonce} className="combination-result tahriri" onClick={() => sound.speakPersian(speakable(combination))}>{combination}</button>}
          {!combination && <span className="combination-placeholder">اینجا ترکیب ساخته می‌شود</span>}
        </div>
      </div>
      <div className="combination-actions">
        <button type="button" className="soft-btn combination-clear" onClick={clearCombination} disabled={!selectedConsonant && !selectedVowel && !combination}><RotateCcw /> پاک کردن تخته</button>
      </div>
      {!combinationConsonants.length && <p className="combination-empty">با خواندن درس «بـ ب»، صامت‌ها یکی‌یکی اینجا اضافه می‌شوند.</p>}
    </section> : soundOnly ? <section className="syl-sounds">
      <div className="syl-word-card"><span className="syl-emoji">{emojiOf(word)}</span><b className="tahriri" onClick={() => sound.speakPersian(speakable(word))}>{word}</b></div>
      <div className="syl-tray" aria-label="صداهای درهم">{chips.map(c => <button key={c.id} className={`syl-chip tahriri ${c.used ? 'used' : ''} ${picked === c.id ? 'picked' : ''} ${c.cell.mark ? 'is-mark' : ''}`} onPointerDown={e => chipDown(e, c)} disabled={c.used}>{kidGlyph(c.cell.glyph)}</button>)}</div>
      <div className="syl-circles">{parsed.cells.map((c, j) => cellView(c, j, 'circle'))}</div>
    </section> :
    <section className="syl-table" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }} aria-label="جدول بخش‌ها">
      {/* طبقهٔ اول: خود کلمه، حرف‌ها لمسی */}
      <div className={`syl-row1 ${stage === 1 ? 'active' : ''}`} style={{ gridColumn: `1 / span ${N}` }}>
        {emojiOf(word) && <span className="syl-emoji small">{emojiOf(word)}</span>}
        <SelectableWord parsed={parsed} usedUnits={usedUnits} sel={sel} onUnitDown={unitDown} />
      </div>
      {/* طبقهٔ دوم: خانه‌های بخش (به تعداد هجاها) */}
      {parsed.syllables.map((s, k) => <div key={`s${k}`} data-drop={`syl:${k}`} onClick={() => placeSyllable(k)} style={{ gridColumn: `span ${s.cells.length}` }}
        className={`syl-slot ${sylDone[k] ? 'filled' : ''} ${stage === 1 && sel ? 'ready' : ''} ${shake === `syl-${k}` ? 'shake' : ''}`}>
        {sylDone[k] ? <>
          <b className="tahriri syl-slot-text">{s.glyph}</b>
          {stage === 2 && <div className="syl-slot-chips">{chips.filter(c => c.cell.syl === k).map(c => <button key={c.id} className={`syl-chip mini tahriri ${c.used ? 'used' : ''} ${picked === c.id ? 'picked' : ''} ${c.cell.mark ? 'is-mark' : ''}`} onPointerDown={e => { e.stopPropagation(); chipDown(e, c); }} onClick={e => e.stopPropagation()} disabled={c.used}>{kidGlyph(c.cell.glyph)}</button>)}</div>}
        </> : <span className="syl-slot-empty">بخش {toFa(k + 1)}</span>}
      </div>)}
      {/* طبقهٔ سوم: یک خانه برای هر صدا */}
      {parsed.cells.map((c, j) => cellView(c, j, stage < 2 ? 'locked' : ''))}
    </section>}

    {section === 'syllable' && <div className="syl-actions">
      <button className="soft-btn" onClick={restart}><RotateCcw /> از اول</button>
      <button className="soft-btn" onClick={() => { sound.playPop(); goNext(); }}>کلمهٔ بعدی <ChevronLeft /></button>
    </div>}
    {drag && drag.moved && <span className="drag-ghost tahriri syl-ghost" style={{ left: drag.x, top: drag.y }}>{drag.label}</span>}
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
  </div>;
};
