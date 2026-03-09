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
  const [serverTime, setServerTime] = useState('')

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList); setActiveChar(charList[0])
    const savedLinks = JSON.parse(localStorage.getItem('tw_links') || '[]')
    setLinks(savedLinks.length ? savedLinks : [{ name: '매직위버', url: 'https://cafe.daum.net/MagicWeaver' }, { name: '공홈', url: 'https://tales.nexon.com' }])
    
    fetchData()
    const timer = setInterval(() => {
      const now = new Date();
      setServerTime(now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  const addLink = () => { const n = prompt('이름:'); const u = prompt('URL:','https://'); if(n&&u){ const nl=[...links,{name:n,url:u}]; setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const deleteLink = (i:number) => { if(confirm('삭제?')){ const nl=links.filter((_,idx)=>idx!==i); setLinks(nl); localStorage.setItem('tw_links',JSON.stringify(nl)); }}
  const updateChars = (list: string[]) => { setCharacters(list); localStorage.setItem('tw_chars', JSON.stringify(list)); }
  const renameChar = (old: string) => { if(!isAdmin) return; const name = prompt('새 이름:', old); if(name) updateChars(characters.map(c => c === old ? name : c)); }
  const addChar = () => { if(!isAdmin) return; const name = prompt('새 캐릭터:'); if(name) updateChars([...characters, name]); }
  
  // 🔥 [오류 수정 시도] 숙제 자동 세팅 (Dashboard RLS 설정이 필수)
  const setupDefaultQuests = async () => {
    if (!confirm('기존 리스트를 지우고 지성 님 고정 숙제로 다시 세팅할까요? (에러 발생 시 대시보드 RLS 설정을 확인하세요)')) return;
    
    // 1. 기존 데이터 삭제
    const { error: deleteError } = await supabase.from('tw_quests').delete().neq('id', 0)
    if (deleteError) { alert(`삭제 에러: ${deleteError.message}\n대시보드에서 ' public.tw_quests' 테이블의 RLS 설정을 'anyone' ALL로 바꿔주세요.`); return; }

    const items: any[] = []
    
    // 계정 숙제 (한 번만)
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => {
      items.push({ title: q.title, category: q.category, is_done: false })
    })

    // 캐릭별 숙제 (각 캐릭별로)
    characters.forEach(c => {
      DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => {
        items.push({ title: q.title, category: `${c}${q.category}`, is_done: false })
      })
    })

    // 2. 새로운 리스트 생성
    const { error: insertError } = await supabase.from('tw_quests').insert(items)
    if (insertError) { alert(`추가 에러: ${insertError.message}\n대시보드에서 ' public.tw_quests' 테이블의 RLS 설정을 'anyone' ALL로 바꿔주세요.`); return; }

    alert('숙제 세팅이 완료되었습니다!');
    fetchData()
  }

  const toggleQuest = async (id: number, is_done: boolean) => {
    const ns = !is_done; await supabase.from('tw_quests').update({ is_done: ns }).eq('id', id)
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

      {/* 1. 상단 헤더 (라이트 모드 테마) */}
      <header className="relative z-10 p-5 flex justify-between items-center bg-white border-b border-blue-100 shadow-sm">
        <button onClick={() => setShowLinks(true)} className="p-2 bg-blue-50 rounded-xl text-blue-600 font-bold text-xs">SETTINGS</button>
        <div className="text-center">
          <h1 className="text-xl font-black italic text-slate-800 tracking-tighter uppercase">TW <span className="text-blue-600">PRO</span></h1>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[8px] font-bold px-2 rounded-full mt-1 ${isAdmin ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400'}`}>
            {isAdmin ? 'EDIT MODE' : 'PLAYER'}
          </button>
        </div>
        <button onClick={() => setShowQuests(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-blue-500/10">TASKS</button>
      </header>

      {/* 2. 메인 대시보드 (깨끗하고 밝은 디자인) */}
      <div className="relative z-10 flex flex-col items-center justify-start h-[85vh] p-8 pt-16 overflow-y-auto scrollbar-hide">
        {/* 젤리삐 아이콘 (가운데 글씨 삭제) */}
        <div className="relative mb-12 animate-float">
          <svg viewBox="0 0 100 100" className="w-20 h-20 shadow-blue-500/20 drop-shadow-2xl">
            <circle cx="50" cy="55" r="35" fill="#FFEB3B" stroke="#222" strokeWidth="2"/><circle cx="40" cy="48" r="3" fill="#222"/><circle cx="60" cy="48" r="3" fill="#222"/>
            <path d="M45 62C48 65 52 65 55 62" stroke="#222" strokeWidth="2" fill="none"/><path d="M50 20C50 20 65 5 75 10C85 15 70 30 50 25" fill="#4CAF50" stroke="#222" strokeWidth="2"/> {/* */}
          </svg>
        </div>

        {/* 퀵 링크 아이콘 바 */}
        <div className="w-full flex justify-center gap-4 mb-12 overflow-x-auto py-2 scrollbar-hide">
          {links.map((l:any, i:number) => (
            <div key={i} className="flex flex-col items-center gap-2 relative">
              <a href={l.url} target="_blank" className="w-14 h-14 bg-white border border-blue-100 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                <span className="text-blue-600 font-black text-lg uppercase">{l.name.substring(0,1)}</span>
              </a>
              <span className="text-[10px] font-bold text-slate-600 truncate max-w-[70px]">{l.name}</span>
              {isAdmin && (
                <button onClick={() => deleteLink(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] flex items-center justify-center shadow-md">✕</button>
              )}
            </div>
          ))}
          {isAdmin && (
            <button onClick={addLink} className="w-14 h-14 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold hover:border-blue-500 hover:text-blue-500 transition-all">+</button>
          )}
        </div>

        {/* 진행률 카드 */}
        <div className="w-full max-w-sm bg-white border border-blue-100 p-6 rounded-[2.5rem] shadow-xl shadow-blue-500/5">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeChar} Status</span>
            <span className="text-4xl font-black text-slate-800 italic">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden mb-6 border border-blue-100 p-[1px]"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
          <button onClick={() => setShowQuests(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20">Check Task List</button>
        </div>
      </div>

      {/* 3. 우측 퀘스트 사이드바 (라이트 모드) */}
      {showQuests && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40" onClick={() => setShowQuests(false)} />
          <aside className="w-[85%] max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-blue-50">
            <div className="p-6 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-slate-800 font-black uppercase tracking-tighter">
              <span>Quest Registry</span>
              {isAdmin && <button onClick={setupDefaultQuests} className="text-[8px] bg-green-500 text-white px-2 py-1.5 rounded-lg shadow uppercase">🚀 Setup</button>}
            </div>
            <div className="p-4 flex gap-2 overflow-x-auto border-b border-blue-50 scrollbar-hide">
              {characters.map(c => (
                <button key={c} onClick={() => isAdmin ? renameChar(c) : setActiveChar(c)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${activeChar === c ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-500'}`}>{c} {isAdmin && '✎'}</button>
              ))}
              {isAdmin && <button onClick={addChar} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs">+</button>}
            </div>
            <div className="p-6 space-y-8 flex-1">
              {[ {id: `${activeChar}_일퀘`, title: '캐릭별 일퀘'}, {id: '계정_일퀘', title: '계정별 일퀘 (전캐릭 공유)'}, {id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘'}, {id: '계정_주간퀘', title: '계정별 주간퀘 (전캐릭 공유)'} ].map(sec => (
                 <div key={sec.id}>
                    <h3 className="text-[10px] font-black text-slate-500 mb-4 tracking-[0.2em] uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {sec.title}</h3>
                    <div className="space-y-3">
                      {quests.filter(q=>q.category===sec.id).map(q=>(
                        <div key={q.id} className="flex gap-2 items-center">
                          <div onClick={()=>!isAdmin&&toggleQuest(q.id,q.is_done)} className={`flex-1 flex justify-between p-5 rounded-3xl border transition-all ${q.is_done ? 'bg-slate-50 border-transparent opacity-30 scale-95' : 'bg-white border-blue-100 hover:border-blue-300 cursor-pointer'}`}>
                            <span className={`font-bold text-sm ${q.is_done ? 'text-slate-400' : 'text-slate-700'}`}>{q.title}</span>
                          </div>
                          {isAdmin && <button onClick={()=>supabase.from('tw_quests').delete().eq('id', q.id).then(()=>fetchData())} className="p-4 bg-red-100 text-red-600 rounded-2xl font-bold text-xs">삭제</button>}
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
            </div>
          </aside>
        </div>
      )}

      {/* 4. 좌측 링크 사이드바 (라이트 모드) */}
      {showLinks && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 bg-white h-full shadow-2xl p-6 border-r border-blue-50 flex flex-col">
             <div className="flex justify-between mb-8 items-center font-black text-slate-800 uppercase tracking-widest"><h2>Links</h2><button onClick={() => setShowLinks(false)}>✕</button></div>
             <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
               {links.map((l:any, i:number) => (
                 <div key={i} className="relative">
                    <a href={l.url} target="_blank" className="block p-4 bg-blue-50/50 rounded-2xl font-bold text-sm text-slate-600 hover:bg-blue-100 transition-all border border-blue-50 hover:border-blue-100">{l.name}</a>
                    {isAdmin && <button onClick={() => deleteLink(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] shadow">✕</button>}
                 </div>
               ))}
               {isAdmin && <button onClick={addLink} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all">+ Add Link</button>}
             </div>
          </aside>
          <div className="flex-1 bg-black/40" onClick={() => setShowLinks(false)} />
        </div>
      )}
    </main>
  )
}