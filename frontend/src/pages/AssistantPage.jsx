import { ArrowUpRight, BookOpenCheck, Bot, ExternalLink, Leaf, LoaderCircle, MessageCircleQuestion, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { askFarmingAssistant, getAssistantSources } from '../services/assistant'

const COPY = {
  en: {
    name: 'English',
    eyebrow: 'Grounded farming assistant',
    title: 'Ask about your rice crop.',
    subtitle: 'Practical explanations grounded only in approved RRDI and IRRI guidance.',
    placeholder: 'Ask about symptoms, disease conditions, or management…',
    send: 'Ask assistant',
    thinking: 'Checking approved guidance…',
    sources: 'Sources used',
    library: 'Approved knowledge library',
    disclaimer: 'This assistant is an information aid, not a confirmed diagnosis. Verify serious or fast-spreading problems with an agriculture officer.',
    prompts: [
      'How can I tell rice blast from brown spot?',
      'What should I do when bacterial leaf blight appears?',
      'What symptoms suggest tungro?',
    ],
  },
  si: {
    name: 'සිංහල',
    eyebrow: 'මූලාශ්‍ර මත පදනම් වූ ගොවි සහායක',
    title: 'ඔබේ වී වගාව ගැන අසන්න.',
    subtitle: 'RRDI සහ IRRI අනුමත මාර්ගෝපදේශ මත පමණක් පදනම් වූ ප්‍රායෝගික පැහැදිලි කිරීම්.',
    placeholder: 'රෝග ලක්ෂණ, හිතකර තත්ත්ව හෝ පාලනය ගැන අසන්න…',
    send: 'සහායකගෙන් අසන්න',
    thinking: 'අනුමත මාර්ගෝපදේශ පරීක්ෂා කරමින්…',
    sources: 'භාවිත කළ මූලාශ්‍ර',
    library: 'අනුමත දැනුම් මූලාශ්‍ර',
    disclaimer: 'මෙය තොරතුරු සහායකයකි; නිශ්චිත රෝග විනිශ්චයක් නොවේ. බරපතළ හෝ වේගයෙන් පැතිරෙන ගැටලු කෘෂිකර්ම නිලධාරියෙකු සමඟ තහවුරු කරන්න.',
    prompts: [
      'කොළ පිපිරුම සහ දුඹුරු පැල්ලම වෙන්කර හඳුනාගන්නේ කෙසේද?',
      'බැක්ටීරියා කොළ අංගමාරය පෙනුනොත් කළ යුත්තේ කුමක්ද?',
      'ටුන්ග්‍රෝ රෝගයේ ලක්ෂණ මොනවාද?',
    ],
  },
  ta: {
    name: 'தமிழ்',
    eyebrow: 'ஆதாரபூர்வ விவசாய உதவியாளர்',
    title: 'உங்கள் நெற்பயிரைப் பற்றி கேளுங்கள்.',
    subtitle: 'அங்கீகரிக்கப்பட்ட RRDI மற்றும் IRRI வழிகாட்டுதல்களை மட்டும் அடிப்படையாகக் கொண்ட நடைமுறை விளக்கங்கள்.',
    placeholder: 'அறிகுறிகள், நோய்க்கான சூழல் அல்லது மேலாண்மை பற்றி கேளுங்கள்…',
    send: 'உதவியாளரிடம் கேளுங்கள்',
    thinking: 'அங்கீகரிக்கப்பட்ட வழிகாட்டுதலைச் சரிபார்க்கிறது…',
    sources: 'பயன்படுத்திய ஆதாரங்கள்',
    library: 'அங்கீகரிக்கப்பட்ட அறிவுத் தொகுப்பு',
    disclaimer: 'இது தகவல் உதவி மட்டுமே; உறுதிப்படுத்தப்பட்ட நோயறிதல் அல்ல. தீவிரமாக அல்லது வேகமாகப் பரவும் பிரச்சினைகளை விவசாய அலுவலரிடம் உறுதிப்படுத்துங்கள்.',
    prompts: [
      'நெல் பிளாஸ்ட் மற்றும் பழுப்பு புள்ளியை எவ்வாறு வேறுபடுத்துவது?',
      'பாக்டீரியா இலை கருகல் தோன்றினால் என்ன செய்ய வேண்டும்?',
      'டுங்ரோ நோயின் அறிகுறிகள் என்ன?',
    ],
  },
}

function SourceLinks({ sources, label }) {
  if (!sources?.length) return null
  return (
    <div className="mt-4 border-t border-forest/10 pt-3">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-forest/55">{label}</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-white px-3 py-1.5 text-[10px] font-semibold text-forest hover:border-forest/35">
            {source.publisher.includes('RRDI') ? 'RRDI' : 'IRRI'} <ExternalLink size={10} />
          </a>
        ))}
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const [language, setLanguage] = useState('en')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const copy = COPY[language]

  useEffect(() => {
    getAssistantSources().then(setSources).catch(() => setSources([]))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage)
    setMessages([])
    setQuestion('')
    setError('')
  }

  async function submit(value) {
    const text = value.trim()
    if (!text || loading) return
    const userMessage = { role: 'user', content: text }
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setError('')
    setLoading(true)
    try {
      const response = await askFarmingAssistant(text, language, history)
      setMessages((current) => [...current, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        suggestions: response.suggestedQuestions,
      }])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    submit(question)
  }

  const latestSuggestions = messages.length
    ? messages.at(-1)?.suggestions || []
    : copy.prompts

  return (
    <section className="relative overflow-hidden px-5 py-10 sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-leaf/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow flex items-center gap-2"><Sparkles size={13} /> {copy.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/50 sm:text-base">{copy.subtitle}</p>
          </div>
          <div className="inline-flex self-start rounded-xl border border-ink/10 bg-white/70 p-1 shadow-sm">
            {Object.entries(COPY).map(([code, value]) => (
              <button key={code} type="button" onClick={() => changeLanguage(code)} className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${language === code ? 'bg-forest text-white' : 'text-ink/50 hover:text-forest'}`}>
                {value.name}
              </button>
            ))}
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="overflow-hidden rounded-[24px] border border-ink/10 bg-white/70 shadow-gentle">
            <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white"><Bot size={20} /></span>
              <div><h2 className="text-sm font-semibold">PaddyScan Assistant</h2><p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-forest/60"><ShieldCheck size={11} /> RRDI + IRRI grounded</p></div>
            </div>

            <div className="h-[500px] overflow-y-auto p-4 sm:p-6">
              {!messages.length && (
                <div className="grid min-h-[290px] place-items-center text-center">
                  <div>
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-forest/10 text-forest"><MessageCircleQuestion size={27} /></span>
                    <h2 className="mt-5 text-xl font-semibold">{copy.title}</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/45">{copy.subtitle}</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${message.role === 'user' ? 'bg-ink text-white' : 'bg-forest/10 text-forest'}`}>
                      {message.role === 'user' ? <UserRound size={14} /> : <Leaf size={14} />}
                    </span>
                    <article className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-tr-sm bg-forest text-white' : 'rounded-tl-sm border border-forest/10 bg-[#f3f6ed] text-ink/75'}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'assistant' && <SourceLinks sources={message.sources} label={copy.sources} />}
                    </article>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-forest/10 text-forest"><Leaf size={14} /></span>
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[#f3f6ed] px-4 py-3 text-xs text-ink/45"><LoaderCircle className="animate-spin" size={14} /> {copy.thinking}</div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <div className="border-t border-ink/10 bg-white/65 p-4 sm:p-5">
              {latestSuggestions.length > 0 && !loading && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {latestSuggestions.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => submit(prompt)} className="shrink-0 rounded-full border border-forest/15 bg-white px-3 py-2 text-[10px] font-medium text-forest hover:border-forest/35 hover:bg-forest/5">{prompt}</button>
                  ))}
                </div>
              )}
              {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <label className="sr-only" htmlFor="assistant-question">{copy.placeholder}</label>
                <textarea id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event) }
                }} rows="2" maxLength="1200" placeholder={copy.placeholder} className="min-h-[48px] flex-1 resize-none rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm leading-5 outline-none transition placeholder:text-ink/30 focus:border-forest/40 focus:ring-2 focus:ring-forest/10" />
                <button type="submit" disabled={loading || question.trim().length < 2} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-35" aria-label={copy.send}><Send size={18} /></button>
              </form>
            </div>
          </div>

          <aside className="rounded-[22px] border border-ink/10 bg-white/55 p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2 text-forest"><BookOpenCheck size={18} /><h2 className="text-sm font-semibold">{copy.library}</h2></div>
            <p className="mt-2 text-xs leading-5 text-ink/45">Answers are generated only from these reviewed government and research-institute pages.</p>
            <div className="mt-5 max-h-[355px] space-y-2 overflow-y-auto pr-1">
              {sources.map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-3 rounded-xl border border-ink/8 bg-white/70 p-3 hover:border-forest/25">
                  <div><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-forest/55">{source.publisher.includes('RRDI') ? 'RRDI' : 'IRRI'}</span><p className="mt-1 text-xs font-medium leading-4 text-ink/70">{source.title.replace(/^.*—\s*/, '')}</p></div>
                  <ArrowUpRight className="mt-1 shrink-0 text-ink/25 group-hover:text-forest" size={13} />
                </a>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-amber-50 p-3 text-[10px] leading-5 text-amber-900/75"><ShieldCheck className="mb-2" size={15} />{copy.disclaimer}</div>
          </aside>
        </div>
      </div>
    </section>
  )
}
