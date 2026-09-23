import React from 'react';
import { CURRICULUM, lessonForToday, weekLabel } from '../../data/curriculum';
import { toFa, useCurrentLesson } from '../../utils/lessonState';
import { sound } from '../../utils/audio';

/** انتخاب درس بر اساس سرفصل کتاب؛ درس پیشنهادی امروز با ستاره مشخص است */
export const LessonPicker: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [lesson, setLesson] = useCurrentLesson();
  const today = lessonForToday();
  const current = CURRICULUM[lesson - 1];
  return <label className={`lesson-select ${compact ? 'compact' : ''}`}>
    <span>درس</span>
    <select value={lesson} onChange={e => { const n = Number(e.target.value); setLesson(n); sound.speakPersian(`نشانهٔ ${CURRICULUM[n - 1].spoken}`); }}>
      {CURRICULUM.map(l => <option key={l.id} value={l.order}>{toFa(l.order)}. {l.sign}{l.order === today ? ' ⭐' : ''}</option>)}
    </select>
    {!compact && <small>{current.part === 1 ? 'نشانه‌ها ۱' : 'نشانه‌ها ۲'} · {weekLabel(current.week)}</small>}
  </label>;
};
