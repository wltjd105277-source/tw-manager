'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const CHARACTERS = ['지성A', '지성B', '지성C']

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState(CHARACTERS[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('tw_quests')
          .select('*')
          .order('id', { ascending: true })
        
        if (error) throw error
        if (data) setQuests(data)
      } catch (err) {
        console.error('Error loading quests:', err)
      } finally {
        setLoading(false)
      }

      // 자정 초기화 로직
      const lastReset = localStorage.getItem('tw_last_reset_00')
      const now = new Date()
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      
      if (!lastReset || new Date(lastReset) < todayMidnight) {
        await supabase.from('tw_quests').update({ is_done: false }).eq('category', '일일')
        localStorage.setItem('tw_last_reset_00', now.toISOString())
        window.location.reload()
      }
    }
    fetchData()
  }, [])

  const toggleQuest = async (id: number, is_done: boolean) => {
    const { error } = await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    if (!error) {
      setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
    }
  }

  // 필터링 로직
  const filteredQuests = quests.filter(q => q.category === activeChar || q.category === '일일')

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black tracking-tighter text-slate-800 italic">TW <span className="text-blue-600">PRO</span></h1>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg font-bold">RESET 00:00</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {CHARACTERS.map((char) => (
            <button
              key={char}
              onClick={() => setActiveChar(char)}
              className={`px-6 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap
                ${activeChar === char 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105' 
                  : 'bg-slate-100 text-slate-400'}`}
            >
              {char}
            </button>
          ))}
        </div>
      </header>

      <section className="p-5 max-w-md mx-auto space-y-3 mt-4">
        {loading ? (
          <div className="text-center py-20 text-slate-300 font-bold">로딩 중...</div>
        ) : filteredQuests.length > 0 ? (
          filteredQuests.map((q) => (
            <div 
              key={q.id} 
              onClick={() => toggleQuest(q.id, q.is_done)}
              className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer
                ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm'}`}
            >
              <span className={`text-base font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {q.title}
              </span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                {q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-slate-300 font-bold">등록된 숙제가 없습니다.</div>
        )}
      </section>

      <footer className="fixed bottom-8 left-0 right-0 text-center px-5">
        <div className="bg-slate-900 text-white py-4 rounded-[2.5rem] shadow-2xl text-[10px] font-bold tracking-[0.3em]">
          ACTIVE: {activeChar}
        </div>
      </footer>
    </main>
  )
}