'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// --- 지성 님의 고정 숙제 리스트 ---
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

  useEffect(() => {
    const charList = JSON.parse(localStorage.getItem('tw_chars') || '["지성A", "지성B", "지성C"]')
    setCharacters(charList)
    setActiveChar(charList[0])
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('tw_quests').select('*').order('id', { ascending: true })
    if (data) setQuests(data)
  }

  // --- 버튼 하나로 모든 숙제 자동 생성 ---
  const setupDefaultQuests = async () => {
    if (!confirm('현재 리스트를 지우고 지성 님의 고정 숙제로 다시 세팅할까요?')) return
    await supabase.from('tw_quests').delete().neq('id', 0)
    const newItems: any[] = []
    
    // 계정 숙제는 딱 한 번만 생성 (모든 탭에서 이 데이터를 같이 봄)
    DEFAULT_QUESTS.filter(q => q.type === 'account').forEach(q => {
      newItems.push({ title: q.title, category: q.category, is_done: false })
    })

    // 캐릭별 숙제는 각 캐릭터 이름별로 생성
    characters.forEach(char => {
      DEFAULT_QUESTS.filter(q => q.type === 'char').forEach(q => {
        newItems.push({ title: q.title, category: `${char}${q.category}`, is_done: false })
      })
    })

    const { error } = await supabase.from('tw_quests').insert(newItems)
    if (!error) { fetchData() }
  }

  // --- 핵심 수정: 개별 체크 로직 (id로만 업데이트) ---
  const toggleQuest = async (id: number, is_done: boolean) => {
    const nextStatus = !is_done
    const { error } = await supabase.from('tw_quests').update({ is_done: nextStatus }).eq('id', id)
    if (!error) {
      // 이제 계정 퀘스트라도 딱 해당 숙제 하나만 체크가 바뀝니다.
      setQuests(quests.map(q => q.id === id ? { ...q, is_done: nextStatus } : q))
    }
  }

  const getQuests = (cat: string) => quests.filter(q => q.category === cat)

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-slate-800">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">TW <span className="text-blue-600">PRO</span></h1>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={setupDefaultQuests} className="text-[10px] bg-green-500 text-white px-3 py-1 rounded-full font-bold">🚀 리스트 초기 세팅</button>
            )}
            <button onClick={() => setIsAdmin(!isAdmin)} className={`text-[10px] px-3 py-1 rounded-full font-bold ${isAdmin ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {isAdmin ? '관리 종료' : '편집 모드'}
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {characters.map(char => (
            <button key={char} onClick={() => setActiveChar(char)} className={`px-5 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeChar === char ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{char}</button>
          ))}
        </div>
      </header>

      <div className="p-5 max-w-md mx-auto space-y-8">
        {[
          { id: `${activeChar}_일퀘`, title: '캐릭별 일퀘' },
          { id: '계정_일퀘', title: '계정별 일퀘 (전캐릭 공유)' },
          { id: `${activeChar}_주간퀘`, title: '캐릭별 주간퀘' },
          { id: '계정_주간퀘', title: '계정별 주간퀘 (전캐릭 공유)' }
        ].map(section => (
          <div key={section.id}>
            <h3 className="text-[11px] font-black text-slate-400 mb-4 flex items-center gap-2 tracking-[0.2em] uppercase">
              <div className="w-1 h-4 bg-blue-500 rounded-full" /> {section.title}
            </h3>
            <div className="space-y-3">
              {getQuests(section.id).map(q => (
                <div key={q.id} onClick={() => toggleQuest(q.id, q.is_done)} className={`flex justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${q.is_done ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-sm'}`}>
                  <span className={`font-bold ${q.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{q.title}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.is_done ? 'bg-blue-500 border-blue-500 shadow-inner' : 'border-slate-200'}`}>
                    {q.is_done && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}