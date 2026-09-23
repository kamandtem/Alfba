import React, { useCallback, useEffect, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HomeScreen } from './components/HomeScreen';
import { MagneticBoard } from './components/MagneticBoard';
import { TracePractice } from './components/TracePractice';
import { WordGames } from './components/WordGames';
import { MathGames } from './components/MathGames';
import { ProgressGarden } from './components/ProgressGarden';
import { SplashScreen } from './components/SplashScreen';
import { SubjectSelect } from './components/SubjectSelect';
import { VillageMap } from './components/VillageMap';
import { RecognitionVillage } from './components/RecognitionVillage';
import { SentenceBuilder } from './components/SentenceBuilder';
import { WordVillage } from './components/WordVillage';
import { ActiveScreen, UserProgress } from './types';
import { loadProgress, recordActivityCompleted } from './utils/progressStorage';
import { sound } from './utils/audio';

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>('splash');
  const [progress, setProgress] = useState<UserProgress>(loadProgress());
  const [subject, setSubject] = useState<'persian'|'math'>('persian');
  const [skipNativeSplash, setSkipNativeSplash] = useState(false);
  const complete = useCallback((type:'letter'|'word'|'math', id?:string)=>setProgress(recordActivityCompleted(type,id)),[]);
  const navigate = (next:ActiveScreen) => { sound.playPop(); setScreen(next); };
  useEffect(()=>{ if(screen==='splash') document.body.classList.add('app-splash'); else document.body.classList.remove('app-splash'); },[screen]);

  if(screen==='splash') return <SplashScreen skipNativeSplash={skipNativeSplash} onStart={()=>{setSkipNativeSplash(true);navigate('village_map')}} onProgress={()=>{setSkipNativeSplash(true);navigate('village_map')}}/>;
  if(screen==='subject_select') return <SubjectSelect onSelect={s=>{setSubject(s);navigate(s==='persian'?'village_map':'math_games')}}/>;
  if(screen==='village_map') return <VillageMap onSubject={()=>{setSkipNativeSplash(true);navigate('splash')}} onNavigate={navigate} onVillage={v=>navigate(v==='recognition'?'recognition_village':v==='word'?'word_village':'sentence_builder')}/>;
  if(screen==='recognition_village') return <RecognitionVillage onBack={()=>navigate('village_map')} onHome={()=>{setSkipNativeSplash(true);navigate('splash')}} onComplete={complete}/>;
  if(screen==='word_village') return <WordVillage onBack={()=>navigate('village_map')} onComplete={complete}/>;
  if(screen==='sentence_builder') return <SentenceBuilder onBack={()=>navigate('village_map')} onComplete={complete}/>;

  return <div id="persian-first-grade-app-root" className="min-h-screen w-full text-slate-800 flex flex-col select-none overflow-x-hidden font-sans" dir="rtl">
    <HeaderNav currentScreen={screen} onNavigate={navigate} starsCount={progress.starsCount}/>
    <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-1 sm:p-2">
      {screen==='home' && <HomeScreen onNavigate={navigate} progress={progress}/>} 
      {screen==='magnetic_board' && <MagneticBoard onActivityComplete={complete}/>} 
      {screen==='trace_practice' && <TracePractice onActivityComplete={complete}/>} 
      {screen==='word_games' && <WordGames onActivityComplete={complete}/>} 
      {screen==='math_games' && <MathGames onActivityComplete={complete}/>} 
      {screen==='progress_garden' && <ProgressGarden progress={progress} onBack={()=>navigate('village_map')}/>} 
    </main>
  </div>;
}
