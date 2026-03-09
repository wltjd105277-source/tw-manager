'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const DEFAULT_QUESTS = [
  { title: '발굴지', category: '_일퀘', type: 'char' }, { title: '힘의 근원', category: '_일퀘', type: 'char' },
  { title: '렐릭(네냐플 100마리)', category: '_일퀘', type: 'char' }, { title: '번뜩이는 분노 (SS등급)', category: '_일퀘', type: 'char' },
  { title: '네스칼', category: '_일퀘', type: 'char' }, { title: '프라바 방어전', category: '_주간퀘', type: 'char' },
  { title: '프시키의 미궁', category: '계정_일퀘', type: 'account' }, { title: '프시키의 허상', category: '계정_일퀘', type: 'account' },
  { title: '룬의 던전', category: '계정_일퀘', type: 'account' }, { title: '테시스 코어 던전', category: '계정_일퀘', type: 'account' },
  { title: '머큐리얼/루미너스(보스 5)', category: '계정_일퀘', type: 'account' }, { title: '심연의 보물창고', category: '계정_일퀘', type: 'account' },
  { title: '어밴던 로드', category: '계정_주간퀘', type: 'account' }, { title: '어비스 심층 - 일반', category: '계정_주간퀘', type: 'account' },
  { title: '신조의 둥지 - 일반', category: '계정_주간퀘', type: 'account' }
]

// 젤리삐 SVG 아이콘 (나뭇잎 포함)
const JellypiIcon = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="55" r="35" fill="#FFEB3B" stroke="#222" strokeWidth="3"/> {/* 몸통 */}
    <circle cx="40" cy="48" r="4" fill="#222"/> {/* 왼쪽 눈 */}
    <circle cx="60" cy="48" r="4" fill="#222"/> {/* 오른쪽 눈 */}
    <path d="M45 62C48 65 52 65 55 62" stroke="#222" strokeWidth="3" strokeLinecap="round"/> {/* 입 */}
    <path d="M50 20C50 20 65 5 75 10C85 15 70 30 50 25" fill="#4CAF50" stroke="#222" strokeWidth="2"/> {/* 나뭇잎 */}
    <path d="M50 25L50 15" stroke="#222" strokeWidth="2"/> {/* 줄기 */}
  </svg>
)

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [characters, setCharacters] = useState<string[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [serverTime, setServerTime] = useState('') // 서버 시간 (KST)

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const linkList = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(linkList.length ? linkList : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }])
    fetchData()

    // 실시간 KST 시간 업데이트
    const timer = setInterval(() => {
      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60000));
      setServerTime(kst.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  // 진행률 계산
  const progress = useMemo(() => {
    const relevant = quests.filter(q => q.category.includes(activeChar) || q.category.includes('계정'))
    if (relevant.length === 0) return 0
    return Math.round((relevant.filter(q => q.is_done).length / relevant.length) * 100)
  }, [quests, activeChar])

  // --- 기존 편집/체크 기능 (100% 동일) ---
  const addLink = () => { const n = prompt('이름:'); const u = prompt('URL:','https://'); if(n&&u){ const nl = [...links,{name:n,url:u}]; setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); fetchData(); }}
  const deleteLink = (i:number) => { if(confirm('삭제?')){ const nl=links.filter((_,idx)=>idx!==i); setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); fetchData(); }}
  const setupDefault = async () => {
    if(!confirm('데이터 초기화?')) return
    await supabase.from('tw_quests').delete().neq('id',0)
    const items:any[] = []
    DEFAULT_QUESTS.filter(q=>q.type==='account').forEach(q=>items.push({title:q.title,category:q.category,is_done:false}))
    characters.forEach(c => DEFAULT_QUESTS.filter(q=>q.type==='char').forEach(q=>items.push({title:q.title,category:`${c}${q.category}`,is_done:false})))
    await supabase.from('tw_quests').insert(items); fetchData();
  }
  const toggleQuest = async (id:number, is_done:boolean) => {
    const ns = !is_done; await supabase.from('tw_quests').update({is_done:ns}).eq('id',id)
    setQuests(quests.map(q=>q.id===id?{...q,is_done:ns}:q))
  }

  return (
    <main className="min-h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden relative">
      {/* 배경 장식 (게임 월드맵 느낌) */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-green-600/10 blur-[150px] rounded-full" />

      {/* 1. 상단 헤더 */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-lg bg-slate-950/50 border-b border-white/5">
        <button onClick={()=>setShowLinks(true)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 text-green-400">☰</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter text-white">TW <span className="text-green-500 text-xs">Jellypi OS</span></h1>
          <button onClick={()=>setIsAdmin(!isAdmin)} className={`text-[9px] font-bold px-2 rounded-full mt-0.5 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}>
            {isAdmin ? 'EDIT MODE' : 'PLAYER'}
          </button>
        </div>
        <button onClick={()=>setShowQuests(true)} className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-2xl shadow-xl shadow-green-500/10 text-white font-black text-xs uppercase tracking-tighter">Tasks</button>
      </header>

      {/* 2. 메인 대시보드 (Jellypi Tracker) */}
      <div className="relative z-10 p-8 flex flex-col items-center justify-center h-[75vh]">
        
        {/* 중앙 젤리삐 아이콘 & 받침대 */}
        <div className="relative mb-12 flex flex-col items-center">
           <div className="relative z-10 scale-125 animate-float">
             <JellypiIcon /> {/* */}
           </div>
           {/* 홀로그램 받침대 */}
           <div className="w-32 h-6 bg-green-600/20 rounded-[100%] border border-green-500/30 -mt-5 blur-[2px] animate-pulse" />
           <div className="absolute -bottom-8 bg-black/60 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl border border-green-500/20 tracking-widest uppercase">
              The Jellypi Tracker
           </div>
        </div>

        <div className="space-y-2 mb-10 text-center">
          <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase">TALESWEAVER KST Time: <span className="text-green-400 font-black">{serverTime}</span></p>
          <h2 className="text-3xl font-black text-white tracking-tight">지성 님, <span className="text-green-500 italic font-black">Ready for Quests!</span></h2>
        </div>

        {/* 진행률 카드 (최적화) */}
        <div className="w-full max-w-sm bg-slate-950/60 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-xl shadow-2xl shadow-green-500/5">
          <div className="flex justify-between items-end mb-4 gap-3">
             <div className="flex-1">
               <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">{activeChar} Progress</p>
               <h3 className="text-2xl font-black text-white truncate">{activeChar}</h3>
             </div>
             <span className="text-5xl font-black text-green-500 italic">{progress}%</span>
          </div>
          
          {/* 게이지 바 */}
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5 p-[1px]">
             <div className="h-full bg-gradient-to-r from-green-600 to-lime-400 transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }} />
          </div>

          <button onClick={()=>setShowQuests(true)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-500/20">
             오늘의 숙제 체크하기
          </button>
        </div>
      </div>

      {/* 3. 우측 퀘스트 사이드바 (기존 기능 100% 동일) */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={()=>setShowQuests(false)} />
          <aside className="w-[88%] max-w-sm bg-[#0f172a] h-full shadow-2xl border-l border-white/5 overflow-y-auto">
            <div className="p-8 bg-green-700 text-white">
              <h2 className="font-black text-2xl italic tracking-tighter uppercase">Quest Registry</h2>
              {isAdmin && <button onClick={setupDefault} className="text-[10px] bg-black/30 px-3 py-1.5 rounded-lg font-bold mt-3 border border-white/10 uppercase tracking-widest">🚀 리스트 자동 세팅</button>}
            </div>
            
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-white/5 scrollbar-hide">
              {characters.map(c => (
                <button key={c} onClick={()=>isAdmin?renameChar(c):setActiveChar(c)} className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeChar===c ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500'}`}>{c}</button>
              ))}
            </div>

            <div className="p-8 space-y-10 flex-1">
               {[{id: `${activeChar}_일퀘`, title: '캐릭별 일퀘'}, {id: '계정_일퀘', title: '계정별 일퀘 (공유)'}, {id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘'}, {id: '계정_주간퀘', title: '계정별 주간퀘 (공유)'}].map(section => (
                 <div key={section.id}>
                    <h3 className="text-[10px] font-black text-green-400 mb-4 tracking-[0.2em] uppercase flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> {section.title}
                    </h3>
                    <div className="space-y-3">
                      {quests.filter(q=>q.category===section.id).map(q=>(
                        <div key={q.id} onClick={()=>!isAdmin&&toggleQuest(q.id,q.is_done)} className={`flex justify-between p-5 rounded-3xl border transition-all ${q.is_done ? 'bg-slate-900 border-transparent opacity-30 scale-95' : 'bg-white/5 border-white/10 hover:border-green-500/30'}`}>
                          <span className="font-bold text-sm text-slate-200">{q.title}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'border-white/20'}`}>
                            {q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      ))}
                      {quests.filter(q=>q.category===section.id).length === 0 && <p className="text-center text-slate-600 py-10 text-[10px] italic">No quests. Press 'SETUP' in Edit mode.</p>}
                    </div>
                 </div>
               ))}
            </div>
          </aside>
        </div>
      )}

      {/* 4. 좌측 링크 사이드바 (편집 복구 완료) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-72 bg-[#0f172a] h-full shadow-2xl p-8 border-r border-white/5 flex flex-col">
             <div className="flex justify-between mb-10 items-center"><h2 className="font-black text-green-500 tracking-widest uppercase">Portals</h2><button onClick={()=>setShowLinks(false)} className="text-slate-500">✕</button></div>
             <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
               {links.map((l:any, i:number)=>(
                 <div key={i} className="relative group">
                    <a href={l.url} target="_blank" className="block p-5 bg-white/5 rounded-[1.5rem] font-bold text-sm text-slate-300 hover:text-white hover:bg-green-950/30 transition-all border border-white/5 hover:border-green-500/30">{l.name}</a>
                    {isAdmin && <button onClick={()=>deleteLink(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] shadow-xl">✕</button>}
                 </div>
               ))}
               {isAdmin && <button onClick={addLink} className="w-full py-4 border-2 border-dashed border-white/10 rounded-[1.5rem] text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-green-500 hover:text-green-500 transition-all">+ Add Portal</button>}
             </div>
          </aside>
          <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={()=>setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}