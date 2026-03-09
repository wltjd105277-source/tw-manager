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
  const [centerIcon, setCenterIcon] = useState('')

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const savedLinks = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(savedLinks.length ? savedLinks : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }])
    setCenterIcon(localStorage.getItem('tw_center_icon') || '')
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  // --- 모든 수정 기능 ---
  const editIcon = () => { if(isAdmin) { const url = prompt('이미지 URL 입력:', centerIcon); if(url !== null) { setCenterIcon(url); localStorage.setItem('tw_center_icon', url); }}}
  const addLink = () => { const n = prompt('이름:'); const u = prompt('URL:','https://'); if(n&&u){ const nl=[...links,{name:n,url:u}]; setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const deleteLink = (i:number) => { if(confirm('삭제?')){ const nl=links.filter((_,idx)=>idx!==i); setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const renameChar = (old: string) => { if(!isAdmin) return; const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const addChar = () => { if(!isAdmin) return; const name = prompt('새 캐릭:'); if(name) updateChars([...characters, name]); }
  
  const setupDefault = async () => {
    if(!confirm('데이터 초기화 후 고정 숙제로 세팅할까요?')) return
    const { error: delErr } = await supabase.from('tw_quests').delete().neq('id', 0)
    if(delErr) return alert(`삭제 실패: ${delErr.message}\nSupabase RLS 설정을 확인하세요!`);
    
    const items: any[] = []
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => items.push({ title: q.title, category: q.category, is_done: false }))
    characters.forEach(c => DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => items.push({ title: q.title, category: `${c}${q.category}`, is_done: false })))
    
    const { error: insErr } = await supabase.from('tw_quests').insert(items)
    if(insErr) alert(`추가 실패: ${insErr.message}`);
    else fetchData();
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    const ns = !is_done; await supabase.from('tw_quests').update({ is_done: ns }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: ns } : q))
  }

  const progress = useMemo(() => {
    const relevant = quests.filter(q => q.category.includes(activeChar) || q.category.includes('계정'))
    return relevant.length ? Math.round((relevant.filter(q => q.is_done).length / relevant.length) * 100) : 0
  }, [quests, activeChar])

  return (
    <main className="min-h-screen bg-[#f0f4f8] font-sans text-slate-900 overflow-hidden relative">
      <style jsx global>{` @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } } .animate-float { animation: float 3.5s ease-in-out infinite; } `}</style>

      {/* 헤더 */}
      <header className="p-5 flex justify-between items-center bg-white border-b border-blue-100 shadow-sm relative z-10">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-blue-50 rounded-xl text-blue-600 font-bold text-[10px]">LINKS</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter">TW <span className="text-blue-600 font-bold">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            {isAdmin ? 'EDIT MODE ACTIVE' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px]">TASKS</button>
      </header>

      {/* 메인 화면 */}
      <div className="flex flex-col items-center justify-start h-[85vh] p-8 pt-16 relative z-10 overflow-y-auto">
        <div onClick={editIcon} className={`relative mb-12 animate-float ${isAdmin ? 'cursor-pointer ring-4 ring-blue-500/20 rounded-2xl' : ''}`}>
          {centerIcon ? (
            <img src={centerIcon} alt="Icon" className="w-24 h-24 object-contain drop-shadow-2xl rounded-2xl" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-xl">
              <circle cx="50" cy="55" r="35" fill="#FFEB3B" stroke="#222" strokeWidth="2"/><circle cx="40" cy="48" r="3" fill="#222"/><circle cx="60" cy="48" r="3" fill="#222"/>
              <path d="M45 62C48 65 52 65 55 62" stroke="#222" strokeWidth="2" fill="none"/><path d="M50 20C50 20 65 5 75 10C85 15 70 30 50 25" fill="#4CAF50" stroke="#222" strokeWidth="2"/>
            </svg>
          )}
          {isAdmin && <div className="absolute inset-0 flex items-center justify-center bg-blue-600/40 rounded-2xl text-white text-[10px] font-black">EDIT ICON</div>}
        </div>

        {/* 퀵 링크 아이콘 */}
        <div className="w-full flex justify-center gap-4 mb-12 overflow-x-auto py-2 scrollbar-hide">
          {links.map((l:any, i:number) => (
            <div key={i} className="flex flex-col items-center gap-2 relative">
              <a href={l.url} target="_blank" className="w-14 h-14 bg-white border border-blue-100 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                <span className="text-blue-600 font-black text-lg uppercase">{l.name.substring(0,1)}</span>
              </a>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[60px]">{l.name}</span>
              {isAdmin && <button onClick={() => deleteLink(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] flex items-center justify-center shadow-md">✕</button>}
            </div>
          ))}
          {isAdmin && <button onClick={addLink} className="w-14 h-14 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold hover:border-blue-500">+</button>}
        </div>

        {/* 진행률 카드 */}
        <div className="w-full max-w-sm bg-white border border-blue-100 p-6 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeChar} Status</span>
            <span className="text-4xl font-black text-slate-800 italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden mb-6"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
          <button onClick={() => setShowQuests(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Check List</button>
        </div>
      </div>

      {/* 우측 퀘스트 사이드바 */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="font-black text-lg">QUEST REGISTRY</h2>
              <button onClick={() => setShowQuests(false)} className="text-xl">✕</button>
            </div>
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-blue-50 scrollbar-hide">
              {characters.map(c => (
                <button key={c} onClick={() => isAdmin ? renameChar(c) : setActiveChar(c)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeChar === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{c} {isAdmin && '✎'}</button>
              ))}
              {isAdmin && <button onClick={addChar} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs">+</button>}
            </div>
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              {[ {id: `${activeChar}_일퀘`, title: '캐릭별 일퀘'}, {id: '계정_일퀘', title: '계정별 일퀘'}, {id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘'}, {id: '계정_주간퀘', title: '계정별 주간퀘'} ].map(sec => (
                 <div key={sec.id}>
                    <h3 className="text-[10px] font-black text-slate-400 mb-4 tracking-widest uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {sec.title}</h3>
                    <div className="space-y-3">
                      {quests.filter(q=>q.category===sec.id).map(q=>(
                        <div key={q.id} className="flex gap-2">
                          <div onClick={()=>toggleQuest(q.id,q.is_done)} className={`flex-1 flex justify-between p-4 rounded-2xl border transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-30 scale-95' : 'bg-white border-blue-100 cursor-pointer'}`}>
                            <span className="font-bold text-sm text-slate-700">{q.title}</span>
                          </div>
                          {isAdmin && <button onClick={() => supabase.from('tw_quests').delete().eq('id', q.id).then(()=>fetchData())} className="p-4 bg-red-100 text-red-600 rounded-2xl font-bold text-[10px]">삭제</button>}
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
               {isAdmin && <button onClick={setupDefault} className="w-full py-4 mt-10 bg-green-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-green-500/20">🚀 전체 숙제 세팅</button>}
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}