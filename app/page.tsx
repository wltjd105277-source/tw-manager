'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// 지성 님 고정 숙제 데이터
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
  const [links, setLinks] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showQuests, setShowQuests] = useState(false)

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const savedLinks = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(savedLinks.length ? savedLinks : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }])
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  // --- 편집 기능 ---
  const addLink = () => {
    const name = prompt('사이트 이름:'); const url = prompt('주소:', 'https://');
    if (name && url) {
      const newList = [...links, { name, url }]; setLinks(newList);
      localStorage.setItem('tw_links', JSON.stringify(newList));
    }
  }
  const deleteLink = (idx: number) => { if(confirm('삭제?')) { const newList = links.filter((_, i) => i !== idx); setLinks(newList); localStorage.setItem('tw_links', JSON.stringify(newList)); }}
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const addChar = () => { const name = prompt('새 캐릭터:'); if(name) updateChars([...characters, name]); }
  const renameChar = (old: string) => { const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const setupDefault = async () => {
    if(!confirm('데이터를 초기화하고 지성 님 고정 숙제로 세팅할까요?')) return
    await supabase.from('tw_quests').delete().neq('id', 0)
    const newItems: any[] = []
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => newItems.push({ title: q.title, category: q.category, is_done: false }))
    characters.forEach(char => {
      DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => newItems.push({ title: q.title, category: `${char}${q.category}`, is_done: false }))
    })
    await supabase.from('tw_quests').insert(newItems); fetchData();
  }
  const deleteQuest = async (id: number) => { if(confirm('삭제?')) { await supabase.from('tw_quests').delete().eq('id', id); fetchData(); }}
  const toggleQuest = async (id: number, is_done: boolean) => {
    const nextStatus = !is_done
    await supabase.from('tw_quests').update({ is_done: nextStatus }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: nextStatus } : q))
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      {/* 1. 상단 헤더 */}
      <header className="bg-white border-b border-slate-100 p-5 flex justify-between items-center shadow-sm">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-slate-50 rounded-xl text-blue-600 font-bold text-xs">LINKS</button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black italic tracking-tighter">TW <span className="text-blue-600">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white' : 'text-slate-300'}`}>
            {isAdmin ? 'EDITING...' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="p-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100">QUESTS</button>
      </header>

      {/* 2. 메인 대기 화면 */}
      <div className="flex flex-col items-center justify-center h-[75vh] text-center px-10">
        <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
           <div className="w-8 h-8 bg-blue-600 rounded-lg animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-1">{activeChar} 님 대기 중</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Select Quests on the right</p>
      </div>

      {/* 3. 좌측 링크 사이드바 */}
      {showLinks && (
        <div className="fixed inset-0 z-40 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r flex flex-col">
             <div className="flex justify-between mb-8 items-center"><h2 className="font-black text-slate-800">LINKS</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3 flex-1 overflow-y-auto">
               {links.map((l:any, i:number) => (
                 <div key={i} className="relative">
                    <a href={l.url} target="_blank" className="block p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-600 hover:bg-blue-50 transition-all">{l.name}</a>
                    {isAdmin && <button onClick={() => deleteLink(i)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[8px]">✕</button>}
                 </div>
               ))}
               {isAdmin && <button onClick={addLink} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-bold">+ LINK ADD</button>}
             </div>
          </aside>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinks(false)} />
        </div>
      )}

      {/* 4. 우측 퀘스트 사이드바 (중요: 복구 완료) */}
      {showQuests && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="font-black text-lg uppercase">Daily Check</h2>
                {isAdmin && <button onClick={setupDefault} className="text-[9px] bg-green-500 px-2 py-1 rounded-md font-bold mt-1 uppercase">🚀 Setup Data</button>}
              </div>
              <button onClick={() => setShowQuests(false)} className="text-xl">✕</button>
            </div>

            <div className="p-4 flex gap-2 overflow-x-auto border-b border-slate-50 scrollbar-hide">
              {characters.map(char => (
                <button key={char} onClick={() => isAdmin ? renameChar(char) : setActiveChar(char)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeChar === char ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                  {char} {isAdmin && '✎'}
                </button>
              ))}
              {isAdmin && <button onClick={addChar} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs">+</button>}
            </div>

            <div className="p-6 space-y-8 flex-1">
              {[
                { id: `${activeChar}_일퀘`, title: '캐릭별 일퀘' },
                { id: '계정_일퀘', title: '계정별 일퀘 (공유)' },
                { id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘' },
                { id: '계정_주간퀘', title: '계정별 주간퀘 (공유)' }
              ].map(section => (
                <div key={section.id}>
                  <h3 className="text-[10px] font-black text-slate-400 mb-4 tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" /> {section.title}
                  </h3>
                  <div className="space-y-3">
                    {quests.filter(q => q.category === section.id).map(q => (
                      <div key={q.id} className="flex gap-2">
                        <div onClick={() => !isAdmin && toggleQuest(q.id, q.is_done)} className={`flex-1 flex justify-between p-4 rounded-2xl border-2 transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm'}`}>
                          <span className={`text-sm font-bold ${q.is_done ? 'line-through text-slate-300' : 'text-slate-700'}`}>{q.title}</span>
                          {!isAdmin && <div className={`w-5 h-5 rounded-full border-2 ${q.is_done ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`} />}
                        </div>
                        {isAdmin && <button onClick={() => deleteQuest(q.id)} className="p-3 bg-red-50 text-red-500 rounded-xl font-bold text-[10px]">삭제</button>}
                      </div>
                    ))}
                    {quests.filter(q => q.category === section.id).length === 0 && (
                      <p className="text-[10px] text-slate-300 font-bold text-center py-4 italic">No quests here.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}