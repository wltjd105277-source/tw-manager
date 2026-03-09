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
  const [links, setLinks] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)

  useEffect(() => {
    const savedChars = localStorage.getItem('tw_chars')
    const charList = savedChars ? JSON.parse(savedChars) : ['지성A', '지성B', '지성C']
    setCharacters(charList)
    setActiveChar(charList[0])
    
    const savedLinks = localStorage.getItem('tw_links')
    setLinks(savedLinks ? JSON.parse(savedLinks) : [
      { name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' },
      { name: '테일즈위버 공홈', url: 'https://tales.nexon.com' }
    ])
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
    
    // 초기화 로직 (00:00 일일 / 월요일 주간)
    const now = new Date()
    const lastDaily = localStorage.getItem('tw_reset_daily')
    const today00 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    if (!lastDaily || new Date(lastDaily) < today00) {
      await supabase.from('tw_quests').update({ is_done: false }).ilike('category', '%일퀘%')
      localStorage.setItem('tw_reset_daily', now.toISOString())
      window.location.reload()
    }
  }

  // --- 핵심 기능: 계정별 퀘스트 일괄 체크 ---
  const toggleQuest = async (id: number, is_done: boolean, category: string) => {
    const nextStatus = !is_done;
    
    if (category.startsWith('계정')) {
      // 계정별 퀘스트는 같은 카테고리 전체를 업데이트
      const { error } = await supabase
        .from('tw_quests')
        .update({ is_done: nextStatus })
        .eq('category', category)
      
      if (!error) {
        setQuests(quests.map(q => q.category === category ? { ...q, is_done: nextStatus } : q))
      }
    } else {
      // 캐릭별 퀘스트는 단일 항목만 업데이트
      const { error } = await supabase
        .from('tw_quests')
        .update({ is_done: nextStatus })
        .eq('id', id)
      
      if (!error) {
        setQuests(quests.map(q => q.id === id ? { ...q, is_done: nextStatus } : q))
      }
    }
  }

  // --- 편집 및 관리 기능 ---
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const addCharacter = () => { const name = prompt('새 캐릭 이름:'); if(name) updateChars([...characters, name]); }
  const renameChar = (old: string) => { if(!isAdmin) return; const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const deleteQuest = async (id: number) => { if(confirm('삭제?')) { await supabase.from('tw_quests').delete().eq('id', id); setQuests(quests.filter(q => q.id !== id)); } }
  
  const addQuest = async (cat: string) => {
    const title = prompt(`${cat}에 추가할 숙제 이름:`)
    if(!title) return
    const { data } = await supabase.from('tw_quests').insert([{ title, category: cat, is_done: false }]).select()
    if(data) setQuests([...quests, data[0]])
  }

  const getQuests = (cat: string) => quests.filter(q => q.category === cat)

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-slate-800">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLinks(true)} className="p-2 bg-slate-100 rounded-xl text-slate-500">☰</button>
            <h1 className="text-xl font-black italic">TW <span className="text-blue-600">PRO</span></h1>
          </div>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[10px] px-3 py-1 rounded-full font-bold ${isAdmin ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {isAdmin ? '관리 종료' : '편집 모드'}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {characters.map(char => (
            <button key={char} onClick={() => isAdmin ? renameChar(char) : setActiveChar(char)} className={`px-5 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeChar === char ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
              {char} {isAdmin && '✎'}
            </button>
          ))}
          {isAdmin && <button onClick={addCharacter} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl font-bold">+</button>}
        </div>
      </header>

      {/* 좌측 사이드바 생략 가능 (기존 기능 유지) */}
      {showLinks && (
        <div className="fixed inset-0 z-30 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r">
             <div className="flex justify-between mb-8 items-center"><h2 className="font-black">USEFUL LINKS</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3">{links.map((l, i) => (<a key={i} href={l.url} target="_blank" className="block p-4 bg-slate-50 rounded-2xl font-bold text-sm">{l.name}</a>))}</div>
          </aside>
          <div className="flex-1 bg-black/20" onClick={() => setShowLinks(false)} />
        </div>
      )}

      {/* 메인 리스트 영역 */}
      <div className="p-5 max-w-md mx-auto space-y-8">
        {[
          { id: `${activeChar}_일퀘`, title: '캐릭별 일퀘' },
          { id: '계정_일퀘', title: '계정별 일퀘 (일괄 체크)' },
          { id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘' },
          { id: '계정_주간퀘', title: '계정별 주간퀘 (일괄 체크)' }
        ].map(section => (
          <div key={section.id}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" /> {section.title}
              </h3>
              {isAdmin && <button onClick={() => addQuest(section.id)} className="text-[10px] text-blue-500 font-bold">+ 추가</button>}
            </div>
            <div className="space-y-3">
              {getQuests(section.id).map(q => (
                <div key={q.id} className="flex gap-2 items-center">
                  <div 
                    onClick={() => !isAdmin && toggleQuest(q.id, q.is_done, q.category)} 
                    className={`flex-1 flex justify-between p-5 rounded-3xl border-2 transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm cursor-pointer'}`}
                  >
                    <span className={`font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{q.title}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                      {q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => deleteQuest(q.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold text-xs">삭제</button>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}