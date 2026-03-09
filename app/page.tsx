'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [characters, setCharacters] = useState<string[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)

  useEffect(() => {
    const savedChars = localStorage.getItem('tw_chars')
    const charList = savedChars ? JSON.parse(savedChars) : ['지성A', '지성B', '지성C']
    setCharacters(charList)
    setActiveChar(charList[0])
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)

    const now = new Date()
    // 1. 일일 초기화 (매일 00:00)
    const lastDaily = localStorage.getItem('tw_reset_daily')
    const today00 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    if (!lastDaily || new Date(lastDaily) < today00) {
      await supabase.from('tw_quests').update({ is_done: false }).ilike('category', '%일퀘%')
      localStorage.setItem('tw_reset_daily', now.toISOString())
      window.location.reload()
    }

    // 2. 주간 초기화 (매주 월요일 00:00)
    const lastWeekly = localStorage.getItem('tw_reset_weekly')
    const day = now.getDay() // 0:일, 1:월...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday00 = new Date(now.setDate(diff))
    monday00.setHours(0, 0, 0, 0)

    if (!lastWeekly || new Date(lastWeekly) < monday00) {
      await supabase.from('tw_quests').update({ is_done: false }).ilike('category', '%주간퀘%')
      localStorage.setItem('tw_reset_weekly', now.toISOString())
      window.location.reload()
    }
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  // 지성 님의 리스트에 따른 분류 로직
  const renderQuestSection = (title: string, filterFn: (q: any) => boolean) => (
    <div className="mb-8">
      <h2 className="text-sm font-black text-slate-400 mb-4 px-2 uppercase tracking-widest flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-500 rounded-full" /> {title}
      </h2>
      <div className="space-y-3">
        {quests.filter(filterFn).map(q => (
          <div key={q.id} onClick={() => toggleQuest(q.id, q.is_done)} className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm'}`}>
            <span className={`font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{q.title}</span>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
              {q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic">TW <span className="text-blue-600">PRO</span></h1>
          <div className="flex gap-2">
            <div className="text-[9px] bg-slate-800 text-white px-2 py-1 rounded-md font-bold uppercase">Reset 00:00</div>
            <div className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded-md font-bold uppercase">Mon Reset</div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {characters.map(char => (
            <button key={char} onClick={() => setActiveChar(char)} className={`px-6 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeChar === char ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{char}</button>
          ))}
        </div>
      </header>

      <div className="p-5 max-w-md mx-auto">
        {renderQuestSection("캐릭별 일퀘", q => q.category === `${activeChar}_일퀘`)}
        {renderQuestSection("계정별 일퀘", q => q.category === '계정_일퀘')}
        {renderQuestSection("캐릭별 주간퀘", q => q.category === `${activeChar}_주간퀘`)}
        {renderQuestSection("계정별 주간퀘", q => q.category === '계정_주간퀘')}
      </div>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-slate-900 text-white py-4 rounded-3xl text-center shadow-2xl">
        <p className="text-[10px] font-bold tracking-widest opacity-70 uppercase">Character: {activeChar}</p>
      </footer>
    </main>
  )
}