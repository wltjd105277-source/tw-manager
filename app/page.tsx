'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// 지성 님 고정 데이터 (생략 없이 유지)
const DEFAULT_QUESTS = [
  { title: '발굴지', category: '_일퀘', type: 'char' },
  { title: '힘의 근원', category: '_일퀘', type: 'char' },
  { title: '렐릭(네냐플 100마리)', category: '_일퀘', type: 'char' },
  { title: '번뜩이는 분노 (SS등급)', category: '_일퀘', type: 'char' },
  { title: '네스칼', category: '_일퀘', type: 'char' },
  { title: '프라바 방어전', category: '_주간퀘', type: 'char' },
  { title: '프시키의 미궁', category: '계정_일퀘', type: 'account' },
  { title: '프시키의 허상', category: '계정_일퀘', type: 'account' },
  { title: '룬의 던전', category: '계정_일퀘', type: 'account' },
  { title: '테시스 코어 던전', category: '계정_일퀘', type: 'account' },
  { title: '머큐리얼/루미너스(보스 5)', category: '계정_일퀘', type: 'account' },
  { title: '심연의 보물창고', category: '계정_일퀘', type: 'account' },
  { title: '어밴던 로드', category: '계정_주간퀘', type: 'account' },
  { title: '어비스 심층 - 일반', category: '계정_주간퀘', type: 'account' },
  { title: '신조의 둥지 - 일반', category: '계정_주간퀘', type: 'account' }
]

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [characters, setCharacters] = useState<string[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showQuests, setShowQuests] = useState(false) // 퀘스트 사이드바 상태

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    const nextStatus = !is_done
    const { error } = await supabase.from('tw_quests').update({ is_done: nextStatus }).eq('id', id)
    if (!error) setQuests(quests.map(q => q.id === id ? { ...q, is_done: nextStatus } : q))
  }

  const getQuests = (cat: string) => quests.filter(q => q.category === cat)

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      {/* 고정 상단 헤더 */}
      <header className="bg-white border-b border-slate-100 p-5 flex justify-between items-center shadow-sm">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-slate-50 rounded-xl text-blue-500 font-bold text-xs">LINKS</button>
        <h1 className="text-xl font-black italic tracking-tighter">TW <span className="text-blue-600">WORKSPACE</span></h1>
        <button onClick={() => setShowQuests(true)} className="p-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100 font-bold">QUESTS</button>
      </header>

      {/* 메인 화면 (숙제 리스트가 사라진 텅 빈 공간) */}
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-10">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">오늘도 즐거운 테일즈위버!</h2>
        <p className="text-slate-400 text-sm font-medium">상단 우측의 <span className="text-blue-600 font-bold">QUESTS</span> 버튼을 눌러 숙제를 확인하세요.</p>
        
        {/* 현재 캐릭터 표시 */}
        <div className="mt-10 px-6 py-3 bg-white border border-slate-100 rounded-3xl shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Active Hero</p>
           <p className="text-lg font-black text-blue-600">{activeChar}</p>
        </div>
      </div>

      {/* 우측 퀘스트 사이드바 */}
      {showQuests && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-left">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-blue-600 text-white">
              <div>
                <h2 className="font-black text-xl">DAILY QUESTS</h2>
                <p className="text-[10px] opacity-80 font-bold">RESET AT 00:00</p>
              </div>
              <button onClick={() => setShowQuests(false)} className="text-2xl">✕</button>
            </div>

            {/* 사이드바 내부 캐릭터 탭 */}
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-slate-50 scrollbar-hide">
              {characters.map(char => (
                <button key={char} onClick={() => setActiveChar(char)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeChar === char ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{char}</button>
              ))}
            </div>

            <div className="p-6 space-y-8 flex-1">
              {[
                { id: `${activeChar}_일퀘`, title: '캐릭별 일퀘' },
                { id: '계정_일퀘', title: '계정별 일퀘' },
                { id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘' },
                { id: '계정_주간퀘', title: '계정별 주간퀘' }
              ].map(section => (
                <div key={section.id}>
                  <h3 className="text-[10px] font-black text-slate-400 mb-4 tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" /> {section.title}
                  </h3>
                  <div className="space-y-3">
                    {getQuests(section.id).map(q => (
                      <div key={q.id} onClick={() => toggleQuest(q.id, q.is_done)} className={`flex justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm hover:border-blue-100'}`}>
                        <span className={`text-sm font-bold ${q.is_done ? 'line-through text-slate-300' : 'text-slate-700'}`}>{q.title}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                          {q.is_done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* 좌측 링크 사이드바 (기존 코드 유지) */}
      {showLinks && (
        <div className="fixed inset-0 z-40 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r flex flex-col animate-slide-right">
             <div className="flex justify-between mb-8 items-center"><h2 className="font-black text-slate-800">LINKS</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             {/* 링크 리스트 영역 */}
          </aside>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}