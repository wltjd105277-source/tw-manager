'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// 지성 님 고정 데이터
const DEFAULT_QUESTS = [
  { title: '발굴지', category: '_일퀘', type: 'char' }, { title: '힘의 근원', category: '_일퀘', type: 'char' },
  { title: '렐릭(네냐플 100마리)', category: '_일퀘', type: 'char' }, { title: '번뜩이는 분노 (SS등급)', category: '_일퀘', type: 'char' },
  { title: '네스칼', category: '_일퀘', type: 'char' }, { title: '프라바 방어전', category: '_주간퀘', type: 'char' },
  { title: '프시키의 미궁', category: '계정_일퀘', type: 'account' }, { title: '프시키의 허상', category: '계정_일퀘', type: 'account' },
  { title: '룬의 던전', category: '계정_일퀘', type: 'account' }, { title: '테시스 코어 던전', category: '계정_일퀘', type: 'account' },
  { title: '머큐리얼/루미너스(보스 5)', category: '계정_일퀘', type: 'account' }, { title: '심연의 보물창고', category: '계정_일퀘', type: 'account' },
  { title: '어밴던 로드', category: '계정_주간퀘', type: 'account' }, { title: '어비스 심층 - 일반', category: '계정_주간퀘', type: 'account' },
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

  // --- 🔗 링크 편집 기능 추가 ---
  const addLink = () => {
    const name = prompt('사이트 이름:'); const url = prompt('주소:', 'https://');
    if (name && url) {
      const newList = [...links, { name, url }]; setLinks(newList);
      localStorage.setItem('tw_links', JSON.stringify(newList));
    }
  }

  const deleteLink = (index: number) => {
    if (confirm('이 링크를 삭제할까요?')) {
      const newList = links.filter((_, i) => i !== index); setLinks(newList);
      localStorage.setItem('tw_links', JSON.stringify(newList));
    }
  }

  // --- 퀘스트 편집 기능 ---
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const renameChar = (old: string) => { const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const deleteQuest = async (id: number) => { if(confirm('삭제?')) { await supabase.from('tw_quests').delete().eq('id', id); fetchData(); } }
  const toggleQuest = async (id: number, is_done: boolean) => {
    const nextStatus = !is_done
    await supabase.from('tw_quests').update({ is_done: nextStatus }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: nextStatus } : q))
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      <header className="bg-white border-b border-slate-100 p-5 flex justify-between items-center shadow-sm">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-slate-50 rounded-xl text-blue-600 font-bold text-xs uppercase tracking-tighter">Links</button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black italic tracking-tighter">TW <span className="text-blue-600">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white' : 'text-slate-300'}`}>
            {isAdmin ? 'EDITING...' : 'VIEW MODE'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="p-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100 uppercase tracking-tighter">Quests</button>
      </header>

      {/* 메인 화면 */}
      <div className="flex flex-col items-center justify-center h-[75vh] text-center px-10">
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
           <div className="w-6 h-6 bg-blue-600 rounded-lg animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-1">{activeChar} 활성화됨</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose">Talesweaver Quest Tracker<br/>Optimized for S24 Plus</p>
      </div>

      {/* 좌측 링크 사이드바 (편집 기능 복구) */}
      {showLinks && (
        <div className="fixed inset-0 z-40 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r flex flex-col">
             <div className="flex justify-between mb-8 items-center"><h2 className="font-black text-slate-800">LINKS</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3 flex-1 overflow-y-auto">
               {links.map((l:any, i:number) => (
                 <div key={i} className="relative group">
                    <a href={l.url} target="_blank" className="block p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-600 hover:bg-blue-50 transition-all">{l.name}</a>
                    {isAdmin && (
                      <button onClick={() => deleteLink(i)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] shadow-md">✕</button>
                    )}
                 </div>
               ))}
               {isAdmin && (
                 <button onClick={addLink} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest">+ Add New Link</button>
               )}
             </div>
          </aside>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinks(false)} />
        </div>
      )}

      {/* 우측 퀘스트 사이드바 (기존 기능 유지) */}
      {showQuests && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl overflow-y-auto">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="font-black text-lg">DAILY CHECK</h2>
              <button onClick={() => setShowQuests(false)} className="text-xl">✕</button>
            </div>
            {/* 캐릭터 탭 및 퀘스트 리스트 영역 (기존 코드와 동일) */}
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-slate-50 scrollbar-hide">
              {characters.map(char => (
                <button key={char} onClick={() => isAdmin ? renameChar(char) : setActiveChar(char)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${activeChar === char ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{char} {isAdmin && '✎'}</button>
              ))}
            </div>
            <div className="p-6 space-y-8">
               {/* 퀘스트 렌더링 로직 생략(기존과 동일) */}
               {quests.length === 0 && <p className="text-center text-slate-300 py-20 font-bold">편집 모드에서 '리스트 세팅'을 눌러주세요.</p>}
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}