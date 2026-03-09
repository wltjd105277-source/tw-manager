'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// 지성 님 고정 숙제 15종
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
  const [characters, setCharacters] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [centerIcon, setCenterIcon] = useState('')
  const [serverTime, setServerTime] = useState('')

  useEffect(() => {
    setCenterIcon(localStorage.getItem('tw_center_icon') || '')
    fetchData()
    const timer = setInterval(() => {
      setServerTime(new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [])

  const fetchData = async () => {
    const { data: cData } = await supabase.from('tw_characters').select('*').order('id', { ascending: true })
    if (cData && cData.length > 0) {
      setCharacters(cData)
      if (!activeChar) setActiveChar(cData[0].name)
    } else {
      setCharacters([])
      setActiveChar('')
    }
    const { data: qData } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (qData) setQuests(qData)
    const { data: lData } = await supabase.from('tw_links').select('*').order('id', { ascending: true })
    if (lData) setLinks(lData)
  }

  // --- 캐릭터 관리 ---
  const addChar = async () => {
    const name = prompt('새 캐릭터 이름:'); 
    if(name) { await supabase.from('tw_characters').insert([{ name }]); fetchData(); }
  }
  const deleteChar = async (id: number, name: string) => {
    if(!confirm(`'${name}' 캐릭터를 삭제할까요? (숙제 데이터도 함께 삭제됩니다)`)) return;
    await supabase.from('tw_characters').delete().eq('id', id);
    await supabase.from('tw_quests').delete().like('category', `${name}%`);
    fetchData();
  }
  const renameChar = async (id: number, oldName: string) => {
    if(!isAdmin) return;
    const name = prompt('새 이름:', oldName);
    if(name) { 
      await supabase.from('tw_characters').update({ name }).eq('id', id);
      await supabase.from('tw_quests').update({ category: name + '_일퀘' }).eq('category', oldName + '_일퀘');
      await supabase.from('tw_quests').update({ category: name + '_주간퀘' }).eq('category', oldName + '_주간퀘');
      fetchData(); 
    }
  }

  // --- 링크 관리 ---
  const addLink = async () => {
    const n = prompt('이름:'); const u = prompt('URL:','https://');
    if(n&&u){ await supabase.from('tw_links').insert([{ name: n, url: u }]); fetchData(); }
  }
  const deleteLink = async (id: number) => { if(confirm('삭제?')){ await supabase.from('tw_links').delete().eq('id', id); fetchData(); }}

  // --- 숙제 세팅 ---
  const setupDefault = async () => {
    if(!confirm('모든 데이터를 초기화하고 지성 님 숙제 리스트를 생성할까요?')) return
    await supabase.from('tw_quests').delete().neq('id', 0)
    const items: any[] = []
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => items.push({ title: q.title, category: q.category, is_done: false }))
    characters.forEach(c => DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => items.push({ title: q.title, category: `${c.name}${q.category}`, is_done: false })))
    await supabase.from('tw_quests').insert(items); fetchData();
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    const ns = !is_done; await supabase.from('tw_quests').update({ is_done: ns }).eq('id', id)
    setQuests(prev => prev.map(q => q.id === id ? { ...q, is_done: ns } : q))
  }

  const progress = useMemo(() => {
    const relevant = (quests || []).filter(q => q.category.includes(activeChar) || q.category.includes('계정'))
    return relevant.length ? Math.round((relevant.filter(q => q.is_done).length / relevant.length) * 100) : 0
  }, [quests, activeChar])

  return (
    <main className="min-h-screen bg-[#f0f4f8] font-sans text-slate-900 overflow-hidden relative">
      <style>{` @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } } .animate-float { animation: float 3.5s ease-in-out infinite; } `}</style>

      {/* 헤더 */}
      <header className="p-5 flex justify-between items-center bg-white border-b border-blue-100 shadow-sm relative z-30">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-blue-50 rounded-xl text-blue-600 font-bold text-[10px] uppercase">Links</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter text-slate-800">TW <span className="text-blue-600 font-bold">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            {isAdmin ? 'EDIT MODE' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase">Tasks</button>
      </header>

      {/* 메인 화면 */}
      <div className="flex flex-col items-center justify-start h-[85vh] p-8 pt-12 relative z-10 overflow-y-auto scrollbar-hide">
        <div onClick={() => isAdmin && setCenterIcon(prompt('URL:', centerIcon) || '')} className={`mb-10 animate-float ${isAdmin ? 'ring-4 ring-blue-500/20 rounded-2xl cursor-pointer' : ''}`}>
          <img src={centerIcon || 'https://api.dicebear.com/7.x/bottts/svg?seed=jelly'} className="w-24 h-24 object-contain drop-shadow-2xl rounded-2xl" />
        </div>

        {/* 퀵 링크 바 */}
        <div className="w-full flex justify-center gap-4 mb-10 overflow-x-auto py-2 scrollbar-hide">
          {links.map((l:any) => (
            <div key={l.id} className="flex flex-col items-center gap-2 relative">
              <a href={l.url} target="_blank" className="w-14 h-14 bg-white border border-blue-100 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                <span className="text-blue-600 font-black text-lg uppercase">{l.name.substring(0,1)}</span>
              </a>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[50px]">{l.name}</span>
              {isAdmin && <button onClick={() => deleteLink(l.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] flex items-center justify-center shadow-md">✕</button>}
            </div>
          ))}
          {isAdmin && <button onClick={addLink} className="w-14 h-14 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold">+</button>}
        </div>

        <div className="w-full max-w-sm bg-white border border-blue-100 p-6 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-end mb-4 text-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeChar || 'None'} Status</span>
            <span className="text-4xl font-black italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden mb-6"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
          <p className="text-center text-[9px] font-black text-slate-300 uppercase">KST: {serverTime}</p>
        </div>
      </div>

      {/* 좌측 링크 사이드바 (삭제 및 추가 버튼 복구!) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r border-blue-50 flex flex-col relative z-50">
             <div className="flex justify-between mb-8 items-center font-black text-slate-800 uppercase tracking-widest">
               <h2>Portals</h2>
               <button onClick={() => setShowLinks(false)} className="p-2 text-slate-400">✕</button>
             </div>
             <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide pr-1">
               {links.map((l:any) => (
                 <div key={l.id} className="relative group">
                    <a href={l.url} target="_blank" className="block p-4 bg-blue-50/50 rounded-2xl font-bold text-sm text-slate-600 border border-blue-50 hover:bg-blue-100 transition-all">
                      {l.name}
                    </a>
                    {/* 🔥 링크 삭제 버튼 복구 */}
                    {isAdmin && (
                      <button onClick={() => deleteLink(l.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] shadow-lg flex items-center justify-center">✕</button>
                    )}
                 </div>
               ))}
               {/* 🔥 링크 추가 버튼 복구 */}
               {isAdmin && (
                 <button onClick={addLink} className="w-full py-4 mt-4 border-2 border-dashed border-blue-200 rounded-2xl text-blue-500 text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all">
                   + Add New Portal
                 </button>
               )}
             </div>
          </aside>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinks(false)} />
        </div>
      )}

      {/* 우측 퀘스트 사이드바 (캐릭터 삭제 포함) */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-blue-50 relative z-50">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center font-black uppercase">
              <span>Registry</span>
              <button onClick={() => setShowQuests(false)} className="text-xl">✕</button>
            </div>
            <div className="p-4 flex gap-3 overflow-x-auto border-b border-blue-50 scrollbar-hide">
              {characters.map(c => (
                <div key={c.id} className="relative group flex-shrink-0">
                  <button onClick={() => isAdmin ? renameChar(c.id, c.name) : setActiveChar(c.name)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeChar === c.name ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>{c.name} {isAdmin && '✎'}</button>
                  {isAdmin && <button onClick={() => deleteChar(c.id, c.name)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-lg border border-white">✕</button>}
                </div>
              ))}
              {isAdmin && <button onClick={addChar} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs flex-shrink-0">+</button>}
            </div>
            <div className="p-6 space-y-8 flex-1 overflow-y-auto pr-2 scrollbar-hide">
               {activeChar && [ {id: `${activeChar}_일퀘`, title: '캐릭별 일퀘'}, {id: '계정_일퀘', title: '계정별 일퀘'}, {id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘'}, {id: '계정_주간퀘', title: '계정별 주간퀘'} ].map(sec => (
                 <div key={sec.id}>
                    <h3 className="text-[10px] font-black text-slate-400 mb-4 tracking-widest uppercase flex items-center gap-2"><div className="w-1 h-3 bg-blue-500 rounded-full" /> {sec.title}</h3>
                    <div className="space-y-3">
                      {quests.filter(q=>q.category===sec.id).map(q=>(
                        <div key={q.id} className="flex gap-2">
                          <div onClick={()=>toggleQuest(q.id,q.is_done)} className={`flex-1 flex justify-between p-4 rounded-2xl border transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-30 scale-95' : 'bg-white border-blue-100 cursor-pointer'}`}>
                            <span className="font-bold text-sm text-slate-700">{q.title}</span>
                            <div className={`w-5 h-5 rounded-full border-2 ${q.is_done ? 'bg-blue-600 border-blue-600 shadow-md' : 'border-slate-200'}`} />
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