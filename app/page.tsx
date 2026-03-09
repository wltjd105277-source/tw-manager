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
      // 1. 숙제 데이터 가져오기
      const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
      if (data) setQuests(data)

      // 2. 자정(00:00) 초기화 로직
      const lastReset = localStorage.getItem('tw_last_reset_00')
      const now = new Date()
      
      // 오늘 날짜의 00:00:00 시간 설정
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      
      // 마지막 초기화 기록이 없거나, 그 기록이 오늘 자정 이전이라면? (날짜가 바뀌었다면)
      if (!lastReset || new Date(lastReset) < todayMidnight) {
        await supabase.from('tw_quests').update({ is_done: false }).eq('category', '일일')
        localStorage.setItem('tw_last_reset_00', now.toISOString())
        window.location.reload() // 화면 새로고침해서 반영
      }
    }
    fetchData()
  }, [])

  const toggleQuest = async (id: number, is_done: boolean) => {
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  return (
    <main className="min-h-screen bg-[#f0f4f8] p-5 pb-24 font-sans text-slate-900">
      <header className="mb-10 mt-6 text-center">
        <div className="inline-block bg-white px-4 py-1 rounded-full shadow-sm border border-slate-200 mb-3">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Premium Manager</p>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-800 italic">
          TW <span className="text-blue-600">QUEST</span>
        </h1>
        <div className="flex justify-center gap-2 mt-2">
           <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-bold uppercase">Reset 00:00</span>
        </div>
      </header>

      <section className="max-w-md mx-auto space-y-4">
        {quests.map((q) => (
          <div 
            key={q.id} 
            onClick={() => toggleQuest(q.id, q.is_done)}
            className={`relative flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer shadow-sm
              ${q.is_done 
                ? 'bg-slate-100/80 border-transparent opacity-60 scale-[0.98]' 
                : 'bg-white border-white hover:border-blue-200 active:scale-95 shadow-indigo-100'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-2 h-10 rounded-full ${q.is_done ? 'bg-slate-300' : 'bg-blue-500 animate-pulse'}`} />
              <div>
                <span className={`text-lg font-bold block ${q.is_done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {q.title}
                </span>
              </div>
            </div>
            
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
              ${q.is_done ? 'bg-blue-500 rotate-[360deg]' : 'bg-slate-100'}`}>
              {q.is_done ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 bg-slate-300 rounded-full" />
              )}'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 관리할 캐릭터 목록 (이름을 자유롭게 수정하세요!)
const CHARACTERS = ['지성A', '지성B', '지성C']

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState(CHARACTERS[0])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
      if (data) setQuests(data)

      // 자정 초기화 로직 (00:00)
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
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  // 선택된 캐릭터의 숙제만 필터링 (DB의 'category' 컬럼에 캐릭터 이름을 넣었다고 가정)
  const filteredQuests = quests.filter(q => q.category === activeChar || q.category === '일일')

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-slate-900">
      {/* 고정 상단 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black tracking-tighter text-slate-800 italic">TW <span className="text-blue-600">PRO</span></h1>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg font-bold">RESET 00:00</span>
        </div>

        {/* 캐릭터 선택 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CHARACTERS.map((char) => (
            <button
              key={char}
              onClick={() => setActiveChar(char)}
              className={`px-6 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap
                ${activeChar === char 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105' 
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              {char}
            </button>
          ))}
        </div>
      </header>

      {/* 숙제 리스트 */}
      <section className="p-5 max-w-md mx-auto space-y-3 mt-4">
        {filteredQuests.length > 0 ? (
          filteredQuests.map((q) => (
            <div 
              key={q.id} 
              onClick={() => toggleQuest(q.id, q.is_done)}
              className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer
                ${q.is_done 
                  ? 'bg-slate-50 border-transparent opacity-50' 
                  : 'bg-white border-white shadow-sm hover:border-blue-100 active:scale-95'}`}
            >
              <span className={`text-base font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {q.title}
              </span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
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
            </div>
          </div>
        ))}
      </section>

      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xs">
        <div className="bg-slate-900/90 backdrop-blur-xl text-white py-4 rounded-3xl shadow-2xl text-center border border-white/10">
          <p className="text-[11px] font-bold tracking-[0.2em] opacity-80 uppercase">
            System Updated for <span className="text-blue-400">Ji-Seong Hwang</span>
          </p>
        </div>
      </footer>
    </main>
  )
}