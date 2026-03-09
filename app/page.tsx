'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

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
  const [centerIcon, setCenterIcon] = useState('') // 커스텀 아이콘 상태

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const savedLinks = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(savedLinks.length ? savedLinks : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }])
    
    // 저장된 아이콘 불러오기
    setCenterIcon(localStorage.getItem('tw_center_icon') || '')
    
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  // --- 아이콘 수정 기능 ---
  const editCenterIcon = () => {
    if (!isAdmin) return
    const url = prompt('중앙에 넣고 싶은 이미지 주소(URL)를 입력하세요:', centerIcon)
    if (url !== null) {
      setCenterIcon(url)
      localStorage.setItem('tw_center_icon', url)
    }
  }

  // --- 데이터 관리 기능 (RLS 설정 필수) ---
  const addQuest = async (cat: string) => {
    const title = prompt(`${cat} 카테고리에 추가할 숙제 이름:`)
    if (!title) return
    const { error } = await supabase.from('tw_quests').insert([{ title, category: cat, is_done: false }])
    if (error) alert(`추가 실패: ${error.message}\nSupabase RLS 설정을 확인하세요!`)
    else fetchData()
  }

  const setupDefault = async () => {
    if(!confirm('리스트를 세팅할까요?')) return
    await supabase.from('tw_quests').delete().neq('id', 0)
    const items: any[] = []
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => items.push({ title: q.title, category: q.category, is_done: false }))
    characters.forEach(c => DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => items.push({ title: q.title, category: `${c}${q.category}`, is_done: false })))
    await supabase.from('tw_quests').insert(items); fetchData();
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    const ns = !is_done
    await supabase.from('tw_quests').update({ is_done: ns }).eq('id', id)
    setQuests(quests.map(q => q.id === id ? { ...q, is_done: ns } : q))
  }

  const progress = useMemo(() => {
    const relevant = quests.filter(q => q.category.includes(activeChar) || q.category.includes('계정'))
    if (relevant.length === 0) return 0
    return Math.round((relevant.filter(q => q.is_done).length / relevant.length) * 100)
  }, [quests, activeChar])

  return (
    <main className="min-h-screen bg-[#f0f4f8] font-sans text-slate-900 overflow-hidden relative">
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 3.5s ease-in-out infinite; }
      `}</style>

      {/* 헤더 */}
      <header className="relative z-10 p-5 flex justify-between items-center bg-white border-b border-blue-100 shadow-sm">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-blue-50 rounded-xl text-blue-600 font-bold text-[10px]">LINKS</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter">TW <span className="text-blue-600">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400'}`}>
            {isAdmin ? 'EDIT MODE' : 'PLAYER'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px]">TASKS</button>
      </header>

      {/* 메인 대시보드 */}
      <div className="relative z-10 flex flex-col items-center justify-start h-[85vh] p-8 pt-16">
        {/* 커스텀 아이콘 영역 */}
        <div onClick={editCenterIcon} className={`relative mb-12 animate-float ${isAdmin ? 'cursor-pointer group' : ''}`}>
          {centerIcon ? (
            <img src={centerIcon} alt="Custom Icon" className="w-24 h-24 object-contain drop-shadow-2xl rounded-2xl" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-xl">
              <circle cx="50" cy="55" r="35" fill="#FFEB3B" stroke="#222" strokeWidth="2"/><circle cx="40" cy="48" r="3" fill="#222"/><circle cx="60" cy="48" r="3" fill="#222"/>
              <path d="M45 62C48 65 52 65 55 62" stroke="#222" strokeWidth="2" fill="none"/><path d="M50 20C50 20 65 5 75 10C85 15 70 30 50 25" fill="#4CAF50" stroke="#222" strokeWidth="2"/>
            </svg>
          )}
          {isAdmin && <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">이미지 변경</div>}
        </div>

        {/* 퀵 링크 바 */}
        <div className="w-full flex justify-center gap-4 mb-12 overflow-x-auto py-2 scrollbar-hide">
          {links.map((l:any, i:number) => (
            <a key={i} href={l.url} target="_blank" className="w-14 h-14 bg-white border border-blue-100 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all relative">
              <span className="text-blue-600 font-black text-lg uppercase">{l.name.substring(0,1)}</span>
            </a>
          ))}
        </div>

        {/* 진행률 카드 */}
        <div className="w-full max-w-sm bg-white border border-blue-100 p-6 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeChar} Status</span>
            <span className="text-4xl font-black text-slate-800 italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden mb-6"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
          <button onClick={() => setShowQuests(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Check Task List</button>
        </div>
      </div>

      {/* 우측 퀘스트 사이드바 (개별 추가 버튼 포함) */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="font-black text-lg">QUEST REGISTRY</h2>
              <button onClick={() => setShowQuests(false)} className="text-xl">✕</button>
            </div>
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-blue-50 scrollbar-hide">
              {characters.map(c => (
                <button key={c} onClick={() => setActiveChar(c)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${activeChar === c ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-500'}`}>{c}</button>
              ))}
            </div>
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              {[ {id: `${activeChar}_일퀘`, title: '캐릭별 일퀘'}, {id: '계정_일퀘', title: '계정별 일퀘'}, {id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘'}, {id: '계정_주간퀘', title: '계정별 주간퀘'} ].map(sec => (
                 <div key={sec.id}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sec.title}</h3>
                      {isAdmin && <button onClick={() => addQuest(sec.id)} className="text-[9px] text-blue-600 font-bold">+ 개별 추가</button>}
                    </div>
                    <div className="space-y-3">
                      {quests.filter(q=>q.category===sec.id).map(q=>(
                        <div key={q.id} className="flex gap-2">
                          <div onClick={()=>toggleQuest(q.id,q.is_done)} className={`flex-1 flex justify-between p-4 rounded-2xl border transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-30' : 'bg-white border-blue-100 cursor-pointer'}`}>
                            <span className="font-bold text-sm text-slate-700">{q.title}</span>
                            <div className={`w-5 h-5 rounded-full border-2 ${q.is_done ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`} />
                          </div>
                          {isAdmin && <button onClick={() => supabase.from('tw_quests').delete().eq('id', q.id).then(()=>fetchData())} className="p-4 bg-red-100 text-red-600 rounded-2xl font-bold text-[10px]">삭제</button>}
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
               {isAdmin && <button onClick={setupDefault} className="w-full py-4 mt-10 bg-green-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-green-500/20">🚀 전체 숙제 세팅</button>}
            </div>
          </aside>
        </div>
      )}

      {/* 좌측 사이드바 (기존 유지) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r border-blue-50 flex flex-col">
             <div className="flex justify-between mb-8 items-center font-black uppercase text-slate-800 tracking-widest"><h2>Links</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3">
               {links.map((l:any, i:number) => (
                 <a key={i} href={l.url} target="_blank" className="block p-4 bg-blue-50 rounded-2xl font-bold text-sm text-slate-600">{l.name}</a>
               ))}
             </div>
          </aside>
          <div className="flex-1 bg-black/40" onClick={() => setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}