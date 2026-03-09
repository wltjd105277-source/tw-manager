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
  const [newTitle, setNewTitle] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)

    const lastReset = localStorage.getItem('tw_last_reset_00')
    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    if (!lastReset || new Date(lastReset) < todayMidnight) {
      await supabase.from('tw_quests').update({ is_done: false }).eq('category', '일일')
      localStorage.setItem('tw_last_reset_00', now.toISOString())
      window.location.reload()
    }
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  const addQuest = async () => {
    if (!newTitle) return
    const { data } = await supabase
      .from('tw_quests')
      .insert([{ title: newTitle, category: activeChar, is_done: false }])
      .select()
    if (data) {
      setQuests([...quests, data[0]])
      setNewTitle('')
    }
  }

  const deleteQuest = async (id: number) => {
    if (!confirm('정말 삭제할까요?')) return
    const { error } = await supabase.from('tw_quests').delete().eq('id', id)
    if (!error) setQuests(quests.filter(q => q.id !== id))
  }

  const filteredQuests = quests.filter(q => q.category === activeChar || q.category === '일일')

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-32 font-sans text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black tracking-tighter text-slate-800 italic">TW <span className="text-blue-600">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${isAdmin ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {isAdmin ? '관리 종료' : '편집 모드'}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CHARACTERS.map((char) => (
            <button key={char} onClick={() => setActiveChar(char)} className={`px-6 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeChar === char ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              {char}
            </button>
          ))}
        </div>
      </header>

      <section className="p-5 max-w-md mx-auto space-y-3 mt-4">
        {filteredQuests.map((q) => (
          <div key={q.id} className="flex items-center gap-2">
            <div onClick={() => !isAdmin && toggleQuest(q.id, q.is_done)} className={`flex-1 flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm cursor-pointer'}`}>
              <span className={`text-base font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{q.title}</span>
              {!isAdmin && <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>{q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}</div>}
            </div>
            {isAdmin && <button onClick={() => deleteQuest(q.id)} className="p-4 bg-red-100 text-red-500 rounded-2xl font-bold">삭제</button>}
          </div>
        ))}
      </section>

      <footer className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        {isAdmin ? (
          <div className="flex gap-2 max-w-md mx-auto">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={`${activeChar} 숙제 추가...`} className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500" />
            <button onClick={addQuest} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold">추가</button>
          </div>
        ) : (
          <div className="bg-slate-900 text-white py-4 rounded-[2.5rem] shadow-2xl text-[10px] font-bold tracking-[0.3em] text-center">CURRENT: {activeChar}</div>
        )}
      </footer>
    </main>
  )
}