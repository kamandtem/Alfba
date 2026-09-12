import React, { useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Sparkles, Home } from 'lucide-react';
import { sound } from '../utils/audio';
import { toPersianDigits } from '../data/persianAlphabet';
import { ActiveScreen } from '../types';

interface HeaderNavProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  starsCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentScreen,
  onNavigate,
  starsCount
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playPop();
  };

  const titles: Record<ActiveScreen, string> = {
    home: 'تخته جادویی الفبا',
    magnetic_board: '🧲 تخته حروف و کلمه‌سازی',
    trace_practice: '✏️ تمرین نوشتن و خط‌کشی',
    word_games: '📖 کلمه‌ها و تکمیل حرف',
    math_games: '🔢 بازی با عددها و چینه',
    progress_garden: '🌱 باغچه پیشرفت من'
  };

  return (
    <header
      id="app-header-nav"
      className="w-full h-16 md:h-18 px-3 md:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between z-30 flex-shrink-0"
    >
      <div className="flex items-center gap-2">
        {currentScreen !== 'home' ? (
          <button
            id="header-back-btn"
            onClick={() => {
              sound.playPop();
              onNavigate('home');
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-950 font-bold text-sm md:text-base border border-amber-300 shadow-sm transition-all"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="hidden sm:inline">بازگشت</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow">
              الف
            </div>
            <h1 className="text-base md:text-lg font-black text-slate-800">
              {titles[currentScreen]}
            </h1>
          </div>
        )}

        {currentScreen !== 'home' && (
          <h2 className="text-sm md:text-base font-black text-slate-800 mr-2 truncate">
            {titles[currentScreen]}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Kid's Star Counter */}
        <button
          id="header-stars-badge"
          onClick={() => {
            sound.playPop();
            onNavigate('progress_garden');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-sm md:text-base shadow-sm transition-all"
          title="مشاهده باغچه پیشرفت"
        >
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
          <span>{toPersianDigits(starsCount)}</span>
          <span className="text-xs text-amber-700 hidden sm:inline">ستاره</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          id="header-sound-toggle-btn"
          onClick={handleToggleSound}
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-rose-100 border-rose-300 text-rose-600'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}
          title={isMuted ? 'روشن کردن صدا' : 'قطع صدا'}
          aria-label="تنظیمات صدا"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Quick Home Button when in subscreen */}
        {currentScreen !== 'home' && (
          <button
            id="header-home-quick-btn"
            onClick={() => {
              sound.playPop();
              onNavigate('home');
            }}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-all"
            title="خانه"
          >
            <Home className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};
