'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

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
    // 캐릭터와 아이콘은 기기별 취향이 다를 수 있어 일단 로컬 유지
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    setCenterIcon(localStorage.getItem('tw_center_icon') || '')
    
    fetchData()
  }, [])

  const fetchData = async () => {
    // 숙제와 링크를 동시에 창고(Supabase)에서 가져옴
    const { data: qData } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (qData) setQuests(qData)

    const { data: lData } = await supabase.from('tw_links').select('*').order('id', { ascending: true })
    if (lData) setLinks(lData)
  }

  // --- 🔗 링크 동기화 편집 (이제 PC-모바일 연동!) ---
  const addLink = async () => {
    const name = prompt('사이트 이름:'); const url = prompt('주소:','https://');
    if (name && url) {
      const { error } = await supabase.from('tw_links').insert([{ name, url }])
      if (error) alert('저장 실패: ' + error.message)
      else fetchData()
    }
  }

  const deleteLink = async (id: number) => {
    if (confirm('삭제할까요?')) {
      await supabase.from('tw_links').delete().eq('id', id)
      fetchData()
    }
  }

  // --- 나머지 기능 유지 ---
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

      <header className="p-5 flex justify-between items-center bg-white border-b border-blue-100 shadow-sm relative z-30">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-blue-50 rounded-xl text-blue-600 font-bold text-[10px]">LINKS</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic text-slate-800 tracking-tighter">TW <span className="text-blue-600">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            {isAdmin ? 'EDIT MODE' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px]">TASKS</button>
      </header>

      <div className="flex flex-col items-center justify-start h-[85vh] p-8 pt-12 relative z-10 overflow-y-auto">
        <div onClick={() => isAdmin && setCenterIcon(prompt('URL:', centerIcon) || '')} className="mb-10 animate-float">
          <img src={centerIcon || 'https://api.dicebear.com/7.x/bottts/svg?seed=jelly'} className="w-24 h-24 object-contain drop-shadow-2xl rounded-2xl" />
        </div>

        {/* 퀵 링크 아이콘 (Supabase 연동 완료!) */}
        <div className="w-full flex justify-center gap-4 mb-10 overflow-x-auto py-2 scrollbar-hide">
          {links.map((l:any) => (
            <div key={l.id} className="flex flex-col items-center gap-2 relative">
              <a href={l.url} target="_blank" className="w-14 h-14 bg-white border border-blue-100 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-black text-lg uppercase">{l.name.substring(0,1)}</span>
              </a>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[50px]">{l.name}</span>
              {isAdmin && <button onClick={() => deleteLink(l.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] flex items-center justify-center">✕</button>}
            </div>
          ))}
          {isAdmin && <button onClick={addLink} className="w-14 h-14 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold">+</button>}
        </div>

        <div className="w-full max-w-sm bg-white border border-blue-100 p-6 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeChar} Progress</span>
            <span className="text-4xl font-black text-slate-800 italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden mb-6"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
          <button onClick={() => setShowQuests(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Check List</button>
        </div>
      </div>

      {/* 좌측 사이드바 (Supabase 연동) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r border-blue-50 flex flex-col relative z-50">
             <div className="flex justify-between mb-8 items-center font-black text-slate-800 uppercase tracking-widest"><h2>Links</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3 flex-1 overflow-y-auto">
               {links.map((l:any) => (
                 <a key={l.id} href={l.url} target="_blank" className="block p-4 bg-blue-50/50 rounded-2xl font-bold text-sm text-slate-600">{l.name}</a>
               ))}
             </div>
          </aside>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}