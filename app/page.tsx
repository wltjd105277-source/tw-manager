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

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [characters, setCharacters] = useState<string[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [serverTime, setServerTime] = useState('')
  const [welcomeMsg, setWelcomeMsg] = useState('황지성 님 대기 중')
  const [cheerMsg, setCheerMsg] = useState('오늘도 V-DOOSAN!')

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const savedLinks = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(savedLinks.length ? savedLinks : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }, { name: '공홈', url: 'https://tales.nexon.com' }])
    setWelcomeMsg(localStorage.getItem('tw_welcome') || '황지성 님 대기 중')
    setCheerMsg(localStorage.getItem('tw_cheer') || '오늘도 V-DOOSAN!')
    fetchData()
    const timer = setInterval(() => {
      const now = new Date();
      setServerTime(now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  // --- 편집 기능 ---
  const editWelcome = () => { if(!isAdmin) return; const m = prompt('인사말:', welcomeMsg); if(m) { setWelcomeMsg(m); localStorage.setItem('tw_welcome', m); }}
  const editCheer = () => { if(!isAdmin) return; const m = prompt('응원 문구:', cheerMsg); if(m) { setCheerMsg(m); localStorage.setItem('tw_cheer', m); }}
  const addLink = () => { const n = prompt('이름:'); const u = prompt('URL:','https://'); if(n&&u){ const nl=[...links,{name:n,url:u}]; setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const deleteLink = (i:number) => { if(confirm('삭제?')){ const nl=links.filter((_,idx)=>idx!==i); setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const renameChar = (old: string) => { if(!isAdmin) return; const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const setupDefault = async () => {
    if(!confirm('리스트를 세팅할까요?')) return
    await supabase.from('tw_quests').delete().neq('id', 0)
    const items: any[] = []
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => items.push({ title: q.title, category: q.category, is_done: false }))
    characters.forEach(c => DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => items.push({ title: q.title, category: `${c}${q.category}`, is_done: false })))
    await supabase.from('tw_quests').insert(items); fetchData();
  }
  const toggleQuest = async (id: number, is_done: boolean) => {
    const ns = !is_done; await supabase.from('tw_quests').update({ is_done: ns }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: ns } : q))
  }

  const progress = useMemo(() => {
    const relevant = quests.filter(q => q.category.includes(activeChar) || q.category.includes('계정'))
    if (relevant.length === 0) return 0
    return Math.round((relevant.filter(q => q.is_done).length / relevant.length) * 100)
  }, [quests, activeChar])

  return (
    <main className="min-h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden relative">
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 3.5s ease-in-out infinite; }
      `}</style>

      {/* 1. 상단 헤더 */}
      <header className="relative z-10 p-6 flex justify-between items-center bg-slate-950/50 border-b border-white/5">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-white/5 rounded-xl text-green-400">☰</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">TW <span className="text-green-500">Center</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}>
            {isAdmin ? 'EDITING...' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-green-600 text-white rounded-xl font-black text-[10px]">TASKS</button>
      </header>

      {/* 2. 메인 화면 (퀵 링크 아이콘 추가) */}
      <div className="relative z-10 flex flex-col items-center justify-start h-[85vh] p-8 pt-12 overflow-y-auto scrollbar-hide">
        {/* 젤리삐 아이콘 */}
        <div className="relative mb-8 animate-float">
          <svg viewBox="0 0 100 100" className="w-20 h-20 shadow-green-500/20 drop-shadow-2xl">
            <circle cx="50" cy="55" r="35" fill="#FFEB3B" stroke="#222" strokeWidth="2"/><circle cx="40" cy="48" r="3" fill="#222"/><circle cx="60" cy="48" r="3" fill="#222"/>
            <path d="M45 62C48 65 52 65 55 62" stroke="#222" strokeWidth="2" fill="none"/><path d="M50 20C50 20 65 5 75 10C85 15 70 30 50 25" fill="#4CAF50" stroke="#222" strokeWidth="2"/>
          </svg>
        </div>

        {/* 인사말 영역 */}
        <div className="text-center mb-10">
          <p className="text-[9px] text-green-400 font-bold tracking-[0.2em] uppercase mb-2">KST: {serverTime}</p>
          <h2 onClick={editWelcome} className={`text-2xl font-black text-white italic ${isAdmin ? 'bg-white/10 rounded cursor-pointer' : ''}`}>
            {welcomeMsg} {isAdmin && '✎'}
          </h2>
          <p onClick={editCheer} className={`text-slate-400 text-xs font-bold mt-1 ${isAdmin ? 'bg-white/10 rounded cursor-pointer' : ''}`}>
            {cheerMsg} {isAdmin && '✎'}
          </p>
        </div>

        {/* 🔥 신규 기능: 메인 퀵 링크 아이콘 바 */}
        <div className="w-full flex justify-center gap-4 mb-10 overflow-x-auto py-2 scrollbar-hide">
          {links.map((l:any, i:number) => (
            <div key={i} className="flex flex-col items-center gap-2 group relative">
              <a href={l.url} target="_blank" className="w-14 h-14 bg-slate-900/80 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                <span className="text-green-500 font-black text-lg uppercase">{l.name.substring(0,1)}</span>
              </a>
              <span className="text-[10px] font-bold text-slate-500">{l.name}</span>
              {isAdmin && (
                <button onClick={() => deleteLink(i)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] flex items-center justify-center shadow-md">✕</button>
              )}
            </div>
          ))}
          {isAdmin && (
            <button onClick={addLink} className="w-14 h-14 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-slate-600 font-bold hover:border-green-500 hover:text-green-500 transition-all">+</button>
          )}
        </div>

        {/* 진행률 카드 */}
        <div className="w-full max-w-sm bg-slate-900/60 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{activeChar} Progress</span>
            <span className="text-4xl font-black text-white italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6"><div className="h-full bg-green-500 transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.5)]" style={{ width: `${progress}%` }} /></div>
          <button onClick={() => setShowQuests(true)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest">Open Task List</button>
        </div>
      </div>

      {/* 3. 우측 퀘스트 사이드바 (기능 유지) */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-[#0f172a] h-full shadow-2xl overflow-y-auto">
            <div className="p-6 bg-green-700 flex justify-between items-center text-white font-black uppercase">
              <span className="tracking-tighter italic">Quest Registry</span>
              {isAdmin && <button onClick={setupDefault} className="text-[8px] bg-black/20 px-2 py-1 rounded">Setup</button>}
            </div>
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-white/5 scrollbar-hide">
              {characters.map(c => (
                <button key={c} onClick={() => isAdmin ? renameChar(c) : setActiveChar(c)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${activeChar === c ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500'}`}>{c} {isAdmin && '✎'}</button>
              ))}
            </div>
            <div className="p-6 space-y-8">
              {/* 숙제 리스트 렌더링 (동일하게 유지) */}
              {['일퀘', '주간퀘'].map(type => (
                <div key={type} className="space-y-6">
                  {[`${activeChar}_${type}`, `계정_${type}`].map(id => (
                    <div key={id}>
                      <h3 className="text-[10px] font-black text-green-500 mb-4 tracking-widest uppercase flex items-center gap-2"><div className="w-1 h-3 bg-green-500 rounded-full" /> {id.replace('_', ' ')}</h3>
                      <div className="space-y-3">
                        {quests.filter(q => q.category === id).map(q => (
                          <div key={q.id} onClick={() => !isAdmin && toggleQuest(q.id, q.is_done)} className={`flex justify-between p-4 rounded-2xl border transition-all ${q.is_done ? 'bg-white/5 border-transparent opacity-30 scale-95' : 'bg-white/5 border-white/10 cursor-pointer'}`}>
                            <span className="font-bold text-sm">{q.title}</span>
                            {!isAdmin && <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>{q.is_done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* 4. 좌측 사이드바 (백업용 유지) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 bg-[#0f172a] h-full shadow-2xl p-6 border-r border-white/5">
             <div className="flex justify-between mb-8 items-center font-black text-green-500 uppercase tracking-widest"><h2>Settings</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase">Link Management</p>
             <div className="space-y-3">
               {links.map((l:any, i:number) => (
                 <div key={i} className="flex items-center gap-2">
                   <a href={l.url} target="_blank" className="flex-1 p-4 bg-white/5 rounded-2xl font-bold text-sm text-slate-400">{l.name}</a>
                   {isAdmin && <button onClick={() => deleteLink(i)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl font-bold text-xs">✕</button>}
                 </div>
               ))}
             </div>
          </aside>
          <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={() => setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}