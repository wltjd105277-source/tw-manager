'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// 기본 추천 사이트 목록
const DEFAULT_LINKS = [
  { name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' },
  { name: '테일즈위버 공홈', url: 'https://tales.nexon.com' },
  { name: 'TW 리포트', url: 'https://twreport.com' }
]

export default function Home() {
  const [quests, setQuests] = useState<any[]>([])
  const [characters, setCharacters] = useState<string[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false) // 사이트 탭 열기/닫기

  useEffect(() => {
    const savedChars = localStorage.getItem('tw_chars')
    const charList = savedChars ? JSON.parse(savedChars) : ['지성A', '지성B', '지성C']
    setCharacters(charList)
    setActiveChar(charList[0])
    
    const savedLinks = localStorage.getItem('tw_links')
    setLinks(savedLinks ? JSON.parse(savedLinks) : DEFAULT_LINKS)
    
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
    
    // 00:00 초기화 로직 생략 (기존과 동일)
  }

  // 사이트 추가/삭제 기능
  const addLink = () => {
    const name = prompt('사이트 이름을 입력하세요:')
    const url = prompt('주소(URL)를 입력하세요:', 'https://')
    if (name && url) {
      const newList = [...links, { name, url }]
      setLinks(newList)
      localStorage.setItem('tw_links', JSON.stringify(newList))
    }
  }

  const deleteLink = (index: number) => {
    if (!confirm('링크를 삭제할까요?')) return
    const newList = links.filter((_, i) => i !== index)
    setLinks(newList)
    localStorage.setItem('tw_links', JSON.stringify(newList))
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    await supabase.from('tw_quests').update({ is_done: !is_done }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: !is_done } : q))
  }

  const filteredQuests = quests.filter(q => q.category === activeChar || q.category === '일일')

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-32 font-sans text-slate-900">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowLinks(!showLinks)}
              className={`p-2 rounded-xl transition-all ${showLinks ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">TW <span className="text-blue-600">PRO</span></h1>
          </div>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[10px] px-3 py-1 rounded-full font-bold ${isAdmin ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {isAdmin ? '관리 종료' : '편집 모드'}
          </button>
        </div>

        {/* 캐릭터 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {characters.map((char) => (
            <button key={char} onClick={() => setActiveChar(char)} className={`px-5 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeChar === char ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
              {char}
            </button>
          ))}
        </div>
      </header>

      <div className="flex">
        {/* 좌측 유용한 사이트 사이드바 (토글식) */}
        {showLinks && (
          <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-2xl p-6 transition-all border-r border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-slate-800 tracking-tight">USEFUL LINKS</h2>
              <button onClick={() => setShowLinks(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-3">
              {links.map((link, i) => (
                <div key={i} className="group relative">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    className="block p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                  >
                    {link.name}
                  </a>
                  {isAdmin && (
                    <button onClick={() => deleteLink(i)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[8px]">✕</button>
                  )}
                </div>
              ))}
              {isAdmin && (
                <button onClick={addLink} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs hover:bg-slate-50">+ 링크 추가</button>
              )}
            </div>
          </aside>
        )}

        {/* 메인 숙제 리스트 */}
        <section className="flex-1 p-5 max-w-md mx-auto space-y-3">
          {filteredQuests.map((q) => (
            <div key={q.id} onClick={() => !isAdmin && toggleQuest(q.id, q.is_done)} className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm'}`}>
              <span className={`text-base font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{q.title}</span>
              {!isAdmin && <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>{q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}</div>}
            </div>
          ))}
        </section>
      </div>

      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xs text-center">
        <div className="bg-slate-900 text-white py-4 rounded-[2.5rem] shadow-2xl text-[10px] font-bold tracking-[0.3em]">
          JI-SEONG'S WORKSPACE
        </div>
      </footer>
    </main>
  )
}