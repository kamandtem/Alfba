import React from 'react';
import { hasRealEmoji } from '../../data/wordBank';

/** تصویر یک واژه: ایموجی واقعی، یا نماد واحد «صفحهٔ خالی» برای واژه‌هایی که تصویر ندارند */
export const WordPic: React.FC<{ value?: string; className?: string }> = ({ value, className = '' }) => (
  hasRealEmoji(value)
    ? <span className={className} aria-hidden="true">{value}</span>
    : <img className={`word-placeholder-icon ${className}`} src="/assets/word-placeholder.svg" alt="" draggable={false} />
);
