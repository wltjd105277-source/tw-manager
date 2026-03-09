'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
      if (data) setQuests(data)
    }
    fetchData()
  }, [])

  const toggleQuest = async (id: number, is_done: boolean) => {
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-50 p-5 pb-20 font-sans text-slate-900">
      {/* 상단 헤더 */}
      <header className="mb-8 mt-4 text-center">
        <h1 className="text-3xl font-black tracking-tight text-indigo-900 drop-shadow-sm italic">
          TALESWEAVER <span className="text-blue-500">QUEST</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-indigo-400 uppercase tracking-widest">Ji-Seong's Daily Routine</p>
      </header>

      {/* 숙제 리스트 카드 */}
      <section className="space-y-4 max-w-md mx-auto">
        {quests.map((q) => (
          <div 
            key={q.id} 
            onClick={() => toggleQuest(q.id, q.is_done)}
            className={`group relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm
              ${q.is_done 
                ? 'bg-slate-50/50 border-slate-200 opacity-60' 
                : 'bg-white border-white hover:border-blue-300 hover:shadow-md active:scale-95'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${q.is_done ? 'bg-slate-300' : 'bg-blue-500 animate-pulse'}`} />
              <span className={`text-lg font-bold tracking-tight ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {q.title}
              </span>
            </div>
            
            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-colors
              ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
              {q.is_done && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* 하단 푸터 (LANstar 느낌 한 스푼) */}
      <footer className="fixed bottom-6 left-0 right-0 text-center">
        <div className="inline-block bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            System Powered by <span className="text-blue-500">Ji-Seong Hwang</span>
          </p>
        </div>
      </footer>
    </main>
  )
}