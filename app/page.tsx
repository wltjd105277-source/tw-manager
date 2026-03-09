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
    const fetchQuests = async () => {
      const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
      if (data) setQuests(data)
    }
    fetchQuests()
  }, [])

  const toggleQuest = async (id: number, is_done: boolean) => {
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  return (
    <main className="p-8 max-w-md mx-auto min-h-screen bg-sky-50">
      <h1 className="text-2xl font-bold mb-6 text-blue-600 border-b-2 border-blue-200 pb-2 italic">
        Talesweaver Homework
      </h1>
      <div className="space-y-3">
        {quests.map((q) => (
          <div key={q.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
            <span className={q.is_done ? 'line-through text-gray-300' : 'text-gray-700 font-medium'}>
              {q.title}
            </span>
            <input 
              type="checkbox" 
              checked={q.is_done} 
              onChange={() => toggleQuest(q.id, q.is_done)}
              className="w-6 h-6 cursor-pointer"
            />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-blue-300 mt-10 font-light italic text-gray-400">지성님의 테일즈위버 매니저 v1.0</p>
    </main>
  )
}