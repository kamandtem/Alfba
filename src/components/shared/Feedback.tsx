import React, { useEffect } from 'react';

export type FeedbackState = { tone: 'good' | 'try' | 'info'; text: string; emoji?: string } | null;

const PRAISE = ['آفرین!', 'عالی بود!', 'صد آفرین!', 'باریکلا!', 'تو فوق‌العاده‌ای!'];
const CHEER = ['اشکالی ندارد، دوباره امتحان کن.', 'نزدیک بودی! یک بار دیگر.', 'تو می‌توانی، دوباره تلاش کن.', 'کمی بیشتر دقت کن، موفق می‌شوی.'];
export const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
export const cheer = () => CHEER[Math.floor(Math.random() * CHEER.length)];

export const FeedbackToast: React.FC<{ state: FeedbackState; onClose: () => void; ms?: number }> = ({ state, onClose, ms = 3200 }) => {
  useEffect(() => { if (!state) return; const t = window.setTimeout(onClose, ms); return () => window.clearTimeout(t); }, [state, onClose, ms]);
  if (!state) return null;
  return <div className={`fb-toast ${state.tone}`} role="status" onClick={onClose}>
    <span className="fb-emoji">{state.emoji || (state.tone === 'good' ? '🌟' : state.tone === 'try' ? '💪' : '💡')}</span>
    <p>{state.text}</p>
  </div>;
};
