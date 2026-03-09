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
  
  // 메인 화면 문구 상태
  const [welcomeMsg, setWelcomeMsg] = useState('황지성 님 대기 중')
  const [cheerMsg, setCheerMsg] = useState('오늘도 V-DOOSAN!')

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const savedLinks = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(savedLinks.length ? savedLinks : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }])
    
    // 메인 문구 로드
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

  // --- 메인 화면 수정 기능 ---
  const editWelcome = () => { if(!isAdmin) return; const m = prompt('인사말 수정:', welcomeMsg); if(m) { setWelcomeMsg(m); localStorage.setItem('tw_welcome', m); }}
  const editCheer = () => { if(!isAdmin) return; const m = prompt('응원 문구 수정:', cheerMsg); if(m) { setCheerMsg(m); localStorage.setItem('tw_cheer', m); }}

  // --- 링크 편집 기능 ---
  const addLink = () => { const n = prompt('이름:'); const u = prompt('URL:','https://'); if(n&&u){ const nl=[...links,{name:n,url:u}]; setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const deleteLink = (i:number) => { if(confirm('삭제?')){ const nl=links.filter((_,idx)=>idx!==i); setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}

  // --- 퀘스트 편집 기능 ---
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const renameChar = (old: string) => { if(!isAdmin) return; const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const addChar = () => { if(!isAdmin) return; const name = prompt('새 캐릭터:'); if(name) updateChars([...characters, name]); }
  const setupDefault = async () => {
    if(!confirm('데이터 초기화 후 세팅할까요?')) return
    await supabase.from('tw_quests').delete().neq('id', 0)
    const items: any[] = []
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => items.push({ title: q.title, category: q.category, is_done: false }))
    characters.forEach(c => DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => items.push({ title: q.title, category: `${c}${q.category}`, is_done: false })))
    await supabase.from('tw_quests').insert(items); fetchData();
  }
  const deleteQuest = async (id: number) => { if(confirm('삭제?')) { await supabase.from('tw_quests').delete().eq('id', id); fetchData(); }}
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
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* 1. 상단 헤더 */}
      <header className="relative z-10 p-6 flex justify-between items-center bg-slate-950/50 border-b border-white/5">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-white/5 rounded-xl text-green-400">☰</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic text-white tracking-tighter">TW <span className="text-green-500">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}>
            {isAdmin ? 'EDITING...' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-green-600 text-white rounded-xl font-black text-[10px]">TASKS</button>
      </header>

      {/* 2. 메인 화면 (터치 수정 기능 추가) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[75vh] p-8">
        <div className="relative mb-12 animate-float">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <circle cx="50" cy="55" r="35" fill="#FFEB3B" stroke="#222" strokeWidth="2"/><circle cx="40" cy="48" r="3" fill="#222"/><circle cx="60" cy="48" r="3" fill="#222"/>
            <path d="M45 62C48 65 52 65 55 62" stroke="#222" strokeWidth="2" fill="none"/><path d="M50 20C50 20 65 5 75 10C85 15 70 30 50 25" fill="#4CAF50" stroke="#222" strokeWidth="2"/>
          </svg>
        </div>

        <div className="text-center mb-8">
          <p className="text-[10px] text-green-400 font-bold tracking-widest uppercase mb-2">KST: {serverTime}</p>
          <h2 onClick={editWelcome} className={`text-2xl font-black text-white italic transition-all ${isAdmin ? 'bg-white/10 rounded px-2 cursor-pointer' : ''}`}>
            {welcomeMsg} {isAdmin && '✎'}
          </h2>
          <p onClick={editCheer} className={`text-slate-400 text-xs font-bold mt-2 transition-all ${isAdmin ? 'bg-white/10 rounded px-2 cursor-pointer' : ''}`}>
            {cheerMsg} {isAdmin && '✎'}
          </p>
        </div>

        <div className="w-full max-w-sm bg-slate-900/80 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{activeChar} Status</span>
            <span className="text-4xl font-black text-white italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6"><div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
          <button onClick={() => setShowQuests(true)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm">OPEN LIST</button>
        </div>
      </div>

      {/* 3. 우측 퀘스트 사이드바 (삭제 기능 포함) */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-[#0f172a] h-full shadow-2xl overflow-y-auto">
            <div className="p-6 bg-green-700 flex justify-between items-center text-white font-black uppercase">
              <span>Quests</span>
              {isAdmin && <button onClick={setupDefault} className="text-[8px] bg-black/20 px-2 py-1 rounded">Setup</button>}
            </div>
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-white/5 scrollbar-hide">
              {characters.map(c => (
                <button key={c} onClick={() => isAdmin ? renameChar(c) : setActiveChar(c)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${activeChar === c ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500'}`}>{c} {isAdmin && '✎'}</button>
              ))}
              {isAdmin && <button onClick={addChar} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-xs">+</button>}
            </div>
            <div className="p-6 space-y-8">
              {[
                { id: `${activeChar}_일퀘`, title: '캐릭별 일퀘' },
                { id: '계정_일퀘', title: '계정별 일퀘' },
                { id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘' },
                { id: '계정_주간퀘', title: '계정별 주간퀘' }
              ].map(sec => (
                <div key={sec.id}>
                  <h3 className="text-[10px] font-black text-green-500 mb-4 tracking-widest uppercase flex items-center gap-2"><div className="w-1 h-3 bg-green-500 rounded-full" />{sec.title}</h3>
                  <div className="space-y-3">
                    {quests.filter(q => q.category === sec.id).map(q => (
                      <div key={q.id} className="flex gap-2">
                        <div onClick={() => !isAdmin && toggleQuest(q.id, q.is_done)} className={`flex-1 flex justify-between p-4 rounded-2xl border transition-all ${q.is_done ? 'bg-white/5 border-transparent opacity-30' : 'bg-white/5 border-white/10 cursor-pointer'}`}>
                          <span className="font-bold text-sm">{q.title}</span>
                          {!isAdmin && <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>{q.is_done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>}
                        </div>
                        {isAdmin && <button onClick={() => deleteQuest(q.id)} className="p-3 bg-red-500/20 text-red-500 rounded-xl font-bold text-[10px]">삭제</button>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* 4. 좌측 링크 사이드바 (삭제/추가 복구) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 bg-[#0f172a] h-full shadow-2xl p-6 border-r border-white/10">
             <div className="flex justify-between mb-8 items-center font-black text-green-500 uppercase tracking-widest"><h2>Links</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3">
               {links.map((l:any, i:number) => (
                 <div key={i} className="relative">
                    <a href={l.url} target="_blank" className="block p-4 bg-white/5 rounded-2xl font-bold text-sm text-slate-400 hover:text-white border border-white/5">{l.name}</a>
                    {isAdmin && <button onClick={() => deleteLink(i)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[8px]">✕</button>}
                 </div>
               ))}
               {isAdmin && <button onClick={addLink} className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest">+ Add Link</button>}
             </div>
          </aside>
          <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={() => setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}