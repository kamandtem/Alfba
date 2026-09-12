import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Eraser, Hand, Lightbulb, RotateCcw, Volume2 } from 'lucide-react';
import { PERSIAN_LETTERS, HARAKAT_LIST } from '../data/persianAlphabet';
import { FIRST_GRADE_WORDS } from '../data/words';
import { PersianLetter, PlacedMagneticPiece, WordItem } from '../types';
import { clusterPieces, computePersianForms, findSnapCandidate, getHarakatById, getLetterById, getLetterGlyph } from '../utils/persianEngine';
import { sound } from '../utils/audio';

interface Props { onActivityComplete: (type: 'letter'|'word', id?: string) => void }
type Category = 'all'|'vowel'|'consonant'|'harakat';
type TrayPayload = { type:'letter'|'harakat'|'combo'; id:string; preferredForm?:'isolated'|'initial'; harakatId?:string; customGlyph?:string };

const uid = () => `piece_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

export const MagneticBoard: React.FC<Props> = ({ onActivityComplete }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const celebrated = useRef(new Set<string>());
  const dragStart = useRef<{x:number;y:number;positions:Map<string,{x:number;y:number}>}>({x:0,y:0,positions:new Map()});
  const [pieces, setPieces] = useState<PlacedMagneticPiece[]>([]);
  const [draggingId, setDraggingId] = useState<string|null>(null);
  const [snap, setSnap] = useState<{x:number;y:number}|null>(null);
  const [category, setCategory] = useState<Category>('all');
  const [selectedLetter, setSelectedLetter] = useState<PersianLetter|null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [guided, setGuided] = useState(false);
  const [toast, setToast] = useState<WordItem|null>(null);

  const clusters = useMemo(() => clusterPieces(pieces, FIRST_GRADE_WORDS), [pieces]);
  const challenge = FIRST_GRADE_WORDS[challengeIndex % FIRST_GRADE_WORDS.length];

  useEffect(() => {
    const match = clusters.find(c => c.matchedWord && !celebrated.current.has(`${c.id}:${c.normalizedText}`));
    if (!match?.matchedWord) return;
    celebrated.current.add(`${match.id}:${match.normalizedText}`);
    setToast(match.matchedWord); sound.playSuccess(); sound.speakPersian(`آفرین! کلمه ${match.matchedWord.word} رو ساختی`);
    onActivityComplete('word', match.matchedWord.id);
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [clusters, onActivityComplete]);

  useEffect(() => {
    const clamp = () => {
      const b = boardRef.current; if (!b) return;
      setPieces(old => old.map(p => ({...p, x:Math.max(24,Math.min(b.clientWidth-24,p.x)), y:Math.max(28,Math.min(b.clientHeight-28,p.y))})));
    };
    window.addEventListener('resize', clamp); return () => window.removeEventListener('resize', clamp);
  }, []);

  const pointOnBoard = (clientX:number, clientY:number) => {
    const b = boardRef.current; if (!b) return null;
    const r = b.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    return {x:Math.max(28,Math.min(r.width-28,clientX-r.left)), y:Math.max(32,Math.min(r.height-32,clientY-r.top))};
  };

  const addPayload = (payload:TrayPayload, at?:{x:number;y:number}) => {
    const b=boardRef.current; if(!b) return;
    const point=at || {x:b.clientWidth/2+(Math.random()*72-36), y:b.clientHeight/2+(Math.random()*48-24)};
    const letterId = payload.type === 'combo' ? 'alef' : payload.id;
    const letterPiece:PlacedMagneticPiece = {id:uid(),type:'letter',letterId,x:point.x,y:point.y,preferredForm:payload.preferredForm,customGlyph:payload.customGlyph};
    if(payload.type==='harakat') {
      setPieces(old=>[...old,{id:uid(),type:'harakat',harakatId:payload.id,x:point.x,y:point.y}]);
      sound.speakPersian(getHarakatById(payload.id)?.name || 'اعراب'); return;
    }
    const additions:PlacedMagneticPiece[]=[letterPiece];
    if(payload.type==='combo' && payload.harakatId){
      const h=getHarakatById(payload.harakatId)!;
      additions.push({id:uid(),type:'harakat',harakatId:h.id,x:point.x,y:point.y+(h.position==='above'?-34:34),attachedToLetterId:letterPiece.id});
    }
    setPieces(old=>[...old,...additions]); sound.playPop();
    sound.speakPersian(payload.type==='combo' ? `الف ${getHarakatById(payload.harakatId||'')?.name}` : getLetterById(letterId)?.name || 'حرف');
  };

  const startPieceDrag=(e:React.PointerEvent,piece:PlacedMagneticPiece)=>{
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDraggingId(piece.id); sound.playPop();
    const positions=new Map<string,{x:number;y:number}>();
    pieces.forEach(p=>{ if(p.id===piece.id || (piece.type==='letter' && p.attachedToLetterId===piece.id)) positions.set(p.id,{x:p.x,y:p.y}); });
    dragStart.current={x:e.clientX,y:e.clientY,positions};
    if(piece.type==='harakat' && piece.attachedToLetterId) setPieces(old=>old.map(p=>p.id===piece.id?{...p,attachedToLetterId:undefined}:p));
  };

  const movePiece=(e:React.PointerEvent)=>{
    if(!draggingId) return; const b=boardRef.current; if(!b)return;
    const dx=e.clientX-dragStart.current.x, dy=e.clientY-dragStart.current.y;
    const base=dragStart.current.positions.get(draggingId); if(!base)return;
    const x=Math.max(28,Math.min(b.clientWidth-28,base.x+dx)); const y=Math.max(32,Math.min(b.clientHeight-32,base.y+dy));
    setPieces(old=>old.map(p=>{
      const original=dragStart.current.positions.get(p.id); return original?{...p,x:original.x+(x-base.x),y:original.y+(y-base.y)}:p;
    }));
    const current=pieces.find(p=>p.id===draggingId); if(current){const candidate=findSnapCandidate({...current,x,y},pieces,draggingId);setSnap(candidate?{x:candidate.snapX,y:candidate.snapY}:null);}
  };

  const endPieceDrag=()=>{
    if(!draggingId)return;
    setPieces(old=>{
      const current=old.find(p=>p.id===draggingId); if(!current)return old;
      const target=findSnapCandidate(current,old,draggingId); if(!target)return old;
      sound.playSnap(); const dx=target.snapX-current.x,dy=target.snapY-current.y;
      return old.map(p=>{
        if(p.id===draggingId) return {...p,x:target.snapX,y:target.snapY,attachedToLetterId:target.snapType==='harakat_attach'?target.targetPiece.id:undefined};
        if(current.type==='letter' && p.attachedToLetterId===current.id) return {...p,x:p.x+dx,y:p.y+dy};
        return p;
      });
    }); setDraggingId(null); setSnap(null);
  };

  const detach=()=>{const b=boardRef.current;if(!b)return;setPieces(old=>old.map((p,i)=>({...p,attachedToLetterId:undefined,x:48+(i*76)%Math.max(80,b.clientWidth-96),y:70+Math.floor((i*76)/Math.max(80,b.clientWidth-96))*72})));sound.playPop();};
  const clear=()=>{setPieces([]);celebrated.current.clear();setToast(null);sound.playPop();};
  const speak=()=>{const words=clusters.map(c=>c.connectedText).join('، ');sound.speakPersian(words||'حرف‌ها را روی تخته بگذار');};
  const filtered=PERSIAN_LETTERS.filter(l=>category==='all'||l.category===category);

  const trayDrag=(e:React.DragEvent,payload:TrayPayload)=>{e.dataTransfer.setData('application/x-persian-piece',JSON.stringify(payload));e.dataTransfer.effectAllowed='copy';};
  const drop=(e:React.DragEvent)=>{e.preventDefault();try{const payload=JSON.parse(e.dataTransfer.getData('application/x-persian-piece')) as TrayPayload;const point=pointOnBoard(e.clientX,e.clientY);if(point)addPayload(payload,point);}catch{/* ignored */}};

  const letterGlyph=(piece:PlacedMagneticPiece, letter:PersianLetter)=>{
    if(piece.customGlyph) return piece.customGlyph;
    const cluster=clusters.find(c=>c.pieces.some(p=>p.id===piece.id));
    if(!cluster)return getLetterGlyph(letter,piece.preferredForm||'isolated');
    const letterPieces=cluster.pieces.filter(p=>p.type==='letter');
    const idx=letterPieces.findIndex(p=>p.id===piece.id);
    const defs=letterPieces.map(p=>getLetterById(p.letterId||'')).filter((v):v is PersianLetter=>Boolean(v));
    return getLetterGlyph(letter,computePersianForms(defs)[idx]||piece.preferredForm||'isolated');
  };

  const variantButtons = selectedLetter ? (
    <div className="variant-strip" aria-label={`شکل‌های آموزشی ${selectedLetter.name}`}>
      <strong>{selectedLetter.name}</strong>
      <TrayButton label="غیرآخر" glyph={selectedLetter.initial} color={selectedLetter.color} payload={{type:'letter',id:selectedLetter.id,preferredForm:'initial'}} add={addPayload} drag={trayDrag}/>
      <TrayButton label="آخر" glyph={selectedLetter.isolated} color={selectedLetter.color} payload={{type:'letter',id:selectedLetter.id,preferredForm:'isolated'}} add={addPayload} drag={trayDrag}/>
      {selectedLetter.id==='alef' && <TrayButton label="آ اول و آخر" glyph="آ" color={selectedLetter.color} payload={{type:'letter',id:'alef',customGlyph:'آ'}} add={addPayload} drag={trayDrag}/>}
      {selectedLetter.id==='alef' && HARAKAT_LIST.slice(0,3).map(h=><TrayButton key={`a-${h.id}`} label={`الف با ${h.name.split(' ')[0]}`} glyph={`ا${h.symbol}`} color={h.color} payload={{type:'combo',id:'alef',harakatId:h.id}} add={addPayload} drag={trayDrag}/>)}
      
      {selectedLetter.id==='alef' && HARAKAT_LIST.slice(0,3).map(h=><TrayButton key={h.id} label={`${h.name.split(' ')[0]} تنها`} glyph={h.symbol} color={h.color} payload={{type:'harakat',id:h.id}} add={addPayload} drag={trayDrag}/>)}
      <button className="close-variants" onClick={()=>setSelectedLetter(null)}>بستن</button>
    </div>
  ):null;

  return <section className="magic-board-shell" aria-label="تخته جادویی ساخت واژه">
    <header className="board-topline">
      <div className="board-instruction"><Hand/><span><b>بگیر و بکش.</b> حروف نزدیک هم خودشان وصل می‌شوند.</span></div>
      <div className="mode-switch">
        <button className={!guided?'active':''} onClick={()=>setGuided(false)}>ساخت آزاد</button>
        <button className={guided?'active':''} onClick={()=>{setGuided(true);sound.speakPersian(`کلمه ${challenge.word} را بساز`)}}>تمرین با راهنما</button>
      </div>
    </header>

    <div ref={boardRef} className="word-board" onPointerMove={movePiece} onPointerUp={endPieceDrag} onPointerCancel={endPieceDrag} onDragOver={e=>e.preventDefault()} onDrop={drop}>
      <div className="board-baseline"/>
      {guided&&<button className="challenge-chip" onClick={()=>sound.speakPersian(challenge.word)}><span>{challenge.imageEmoji}</span><b>{challenge.word}</b><Volume2/></button>}
      {snap&&<span className="snap-ring" style={{left:snap.x,top:snap.y}}/>}
      {pieces.map(piece=>{
        const isDrag=piece.id===draggingId;
        if(piece.type==='letter'){
          const l=getLetterById(piece.letterId||'');if(!l)return null;
          return <span key={piece.id} className={`free-glyph letter-glyph ${isDrag?'dragging':''}`} onPointerDown={e=>startPieceDrag(e,piece)} style={{left:piece.x,top:piece.y,color:l.color}} aria-label={l.name}>{letterGlyph(piece,l)}</span>;
        }
        const h=getHarakatById(piece.harakatId||'');if(!h)return null;
        return <span key={piece.id} className={`free-glyph harakat-glyph ${isDrag?'dragging':''}`} onPointerDown={e=>startPieceDrag(e,piece)} style={{left:piece.x,top:piece.y,color:h.color}} aria-label={h.name}>{h.symbol}</span>;
      })}
      {!pieces.length&&<div className="empty-board"><span>اَ</span><p>یک حرف از پایین بردار و اینجا بگذار</p></div>}
      <div className="board-tools">
        <button onClick={speak} aria-label="خواندن"><Volume2/></button><button onClick={detach} aria-label="جدا کردن"><RotateCcw/></button><button onClick={clear} aria-label="پاک کردن"><Eraser/></button>
      </div>
      {clusters.some(c=>c.matchedWord)&&<div className="recognized-ribbon">{clusters.filter(c=>c.matchedWord).map(c=><button key={c.id} onClick={()=>sound.speakPersian(c.matchedWord!.word)}><CheckCircle2/> {c.matchedWord!.word}</button>)}</div>}
      {toast&&<div className="praise-toast" role="status"><span>{toast.imageEmoji}</span><div><b>آفرین! 👏</b><small>کلمه «{toast.word}» رو ساختی</small></div></div>}
    </div>

    <footer className="letter-tray">
      <div className="tray-tabs">
        {([['all','همه'],['vowel','صداها'],['consonant','حروف'],['harakat','اعراب']] as [Category,string][]).map(([id,label])=><button key={id} className={category===id?'active':''} onClick={()=>{setCategory(id);setSelectedLetter(null)}}>{label}</button>)}
        <span><Lightbulb/> لمس کن یا بکش</span>
      </div>
      {variantButtons || <div className="tray-scroll">
        {category==='harakat' ? HARAKAT_LIST.map(h=><TrayButton key={h.id} label={h.name.split(' ')[0]} glyph={h.symbol} color={h.color} payload={{type:'harakat',id:h.id}} add={addPayload} drag={trayDrag}/>) : filtered.map(l=><button key={l.id} className="letter-key" style={{'--key-color':l.color} as React.CSSProperties} onClick={()=>setSelectedLetter(l)}><span>{l.isolated}</span><small>{l.name}</small></button>)}
      </div>}
    </footer>
    {guided&&<div className="challenge-next"><span>{challenge.imageEmoji} «{challenge.word}» را بساز</span><button onClick={()=>{setChallengeIndex(i=>i+1);clear()}}>واژه بعدی</button></div>}
  </section>;
};

function TrayButton({label,glyph,color,payload,add,drag}:{label:string;glyph:string;color:string;payload:TrayPayload;add:(p:TrayPayload)=>void;drag:(e:React.DragEvent,p:TrayPayload)=>void}){
  return <button draggable onDragStart={e=>drag(e,payload)} onClick={()=>add(payload)} className="variant-key" style={{'--key-color':color} as React.CSSProperties} title={label}><span>{glyph}</span><small>{label}</small></button>;
}
