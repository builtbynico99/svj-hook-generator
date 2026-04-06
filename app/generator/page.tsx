'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type Mode = 'creator' | 'streamer'
type Hook = { id: string; type: string; text: string; score: number }
type HistoryItem = { hook_text: string; created_at: string; platform: string; niche: string }

const CREATOR_NICHES = ['Personal Finance', 'Fitness', 'Lifestyle', 'Business', 'Creator Economy', 'Gaming', 'Other']
const STREAMER_NICHES = ['FPS/Competitive', 'IRL/Variety', 'Sports', 'Just Chatting', 'Roleplay/RPG', 'Other']
const PLATFORMS = ['Reels', 'YouTube Shorts', 'TikTok']
const STYLES = ['Pattern break', 'Bold claim', 'Curiosity gap', 'Contrarian']

export default function Generator() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [totalGenerations, setTotalGenerations] = useState(0)
  const [mode, setMode] = useState<Mode>('creator')
  const [platform, setPlatform] = useState('Reels')
  const [niche, setNiche] = useState('Personal Finance')
  const [style, setStyle] = useState('Pattern break')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [hooks, setHooks] = useState<Hook[]>([])
  const [productInsight, setProductInsight] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({})
  const [displayedText, setDisplayedText] = useState<string[]>([])
  const [typingDone, setTypingDone] = useState<boolean[]>([])
  const [showProduct, setShowProduct] = useState(false)
  const [error, setError] = useState('')

  const fetchUser = useCallback(async (userEmail: string) => {
    const res = await fetch(
      `/api/user?email=${encodeURIComponent(userEmail)}`
    )
    if (res.ok) {
      const data = await res.json()
      setTotalGenerations(data.total_generations ?? 0)
    }
  }, [])

  const fetchHistory = useCallback(async (userEmail: string) => {
    const res = await fetch(
      `/api/history?email=${encodeURIComponent(userEmail)}`
    )
    if (res.ok) {
      const data = await res.json()
      setHistory(data.hooks ?? [])
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('svj_user_email')
    if (!stored) {
      router.replace('/')
      return
    }
    setEmail(stored)
    fetchUser(stored)
    fetchHistory(stored)
  }, [router, fetchUser, fetchHistory])

  // When mode changes, reset niche to first option for that mode
  useEffect(() => {
    if (mode === 'creator') {
      setNiche('Personal Finance')
      setPlatform('Reels')
    } else {
      setNiche('FPS/Competitive')
      setPlatform('TikTok')
    }
  }, [mode])

  useEffect(() => {
    if (hooks.length === 0) return
    setDisplayedText(hooks.map(() => ''))
    setTypingDone(hooks.map(() => false))
    setShowProduct(false)

    let cancelled = false
    const SPEED = 18

    async function typeHook(idx: number) {
      const full = hooks[idx].text
      for (let i = 0; i <= full.length; i++) {
        if (cancelled) return
        setDisplayedText((prev) => {
          const next = [...prev]
          next[idx] = full.slice(0, i)
          return next
        })
        await new Promise((r) => setTimeout(r, SPEED))
      }
      setTypingDone((prev) => {
        const next = [...prev]
        next[idx] = true
        return next
      })
    }

    async function runAll() {
      for (let i = 0; i < hooks.length; i++) {
        await typeHook(i)
        if (cancelled) return
      }
      setShowProduct(true)
    }

    runAll()
    return () => { cancelled = true }
  }, [hooks])

  async function handleGenerate() {
    if (!topic.trim() || !email) return
    setLoading(true)
    setError('')
    setHooks([])
    setProductInsight('')
    setDisplayedText([])
    setTypingDone([])
    setShowProduct(false)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, niche, style, mode, email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }
      const data = await res.json()
      setHooks(data.hooks)
      setProductInsight(data.productInsight)
      setTotalGenerations((prev) => prev + 1)
      fetchHistory(email)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function ratehook(hookId: string, rating: 1 | -1) {
    if (!hookId) return
    setRatings((prev) => ({ ...prev, [hookId]: rating }))
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hookId, rating }),
    })
  }

  function copyHook(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const niches = mode === 'creator' ? CREATOR_NICHES : STREAMER_NICHES
  const showAcademy = totalGenerations >= 1
  const showUpsells = totalGenerations >= 3

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Nav />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setMode('creator')}
            className={`flex-1 py-3 rounded-[8px] text-sm font-semibold border transition-colors ${
              mode === 'creator'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-[#9CA3AF] border-[#222222] hover:border-[#444444]'
            }`}
          >
            Content Creator
          </button>
          <button
            onClick={() => setMode('streamer')}
            className={`flex-1 py-3 rounded-[8px] text-sm font-semibold border transition-colors ${
              mode === 'streamer'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-[#9CA3AF] border-[#222222] hover:border-[#444444]'
            }`}
          >
            Streamer
          </button>
        </div>

        {/* Inputs Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-6">
          {/* Platform tabs */}
          <div className="mb-5">
            <p className="text-[#9CA3AF] text-xs font-medium mb-2 uppercase tracking-wider">Platform</p>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => {
                const isStreamerReel = mode === 'streamer' && p === 'Reels'
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2 rounded-[8px] text-xs font-medium border transition-colors ${
                      platform === p
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : isStreamerReel
                        ? 'bg-transparent text-[#555555] border-[#222222]'
                        : 'bg-transparent text-[#9CA3AF] border-[#222222] hover:border-[#444444]'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Niche dropdown */}
          <div className="mb-5">
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white rounded-[8px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] transition-colors appearance-none cursor-pointer"
            >
              {niches.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Hook style tabs */}
          <div className="mb-5">
            <p className="text-[#9CA3AF] text-xs font-medium mb-2 uppercase tracking-wider">Hook style</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-2 rounded-[8px] text-xs font-medium border transition-colors ${
                    style === s
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-transparent text-[#9CA3AF] border-[#222222] hover:border-[#444444]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div>
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              {mode === 'creator' ? "What's your video about?" : 'Describe the clip or moment.'}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mode === 'creator'
                  ? 'e.g. How I paid off $30K in 12 months...'
                  : 'e.g. I clutched a 1v4 after my team thought we lost...'
              }
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white placeholder-[#555555] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Generate button */}
        <div className="btn-glow-wrap mb-8">
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-white text-black font-semibold py-3.5 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate hooks ↗'}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-6">{error}</p>
        )}

        {/* Output */}
        {hooks.length > 0 && (
          <div className="space-y-4 mb-6">
            {/* Hook cards */}
            {hooks.map((hook, idx) => {
              const done = typingDone[idx] ?? false
              return (
                <div
                  key={idx}
                  className="bg-[#111111] border border-[#222222] rounded-[8px] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">
                        Hook {idx + 1} — {hook.type}
                      </p>
                      <p className="text-white text-base leading-relaxed mb-3">
                        {displayedText[idx] ?? ''}
                        {!done && <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-pulse align-middle" />}
                      </p>
                      <div className="w-full h-[3px] rounded-[2px] bg-[#222222] overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-[2px]"
                          style={{
                            width: done ? `${hook.score}%` : '0%',
                            transition: done ? 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => done && ratehook(hook.id, 1)}
                        disabled={!done}
                        title="This worked"
                        className={`text-sm px-2.5 py-1.5 rounded-[8px] border transition-colors ${
                          !done
                            ? 'border-[#222222] text-[#333333] cursor-not-allowed'
                            : ratings[hook.id] === 1
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-[#222222] text-[#9CA3AF] hover:border-green-500 hover:text-green-500'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => done && ratehook(hook.id, -1)}
                        disabled={!done}
                        title="This didn't work"
                        className={`text-sm px-2.5 py-1.5 rounded-[8px] border transition-colors ${
                          !done
                            ? 'border-[#222222] text-[#333333] cursor-not-allowed'
                            : ratings[hook.id] === -1
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'border-[#222222] text-[#9CA3AF] hover:border-red-500 hover:text-red-500'
                        }`}
                      >
                        👎
                      </button>
                      <button
                        onClick={() => done && copyHook(hook.text, idx)}
                        disabled={!done}
                        className={`text-xs border px-3 py-1.5 rounded-[8px] transition-colors ${
                          !done
                            ? 'border-[#222222] text-[#333333] cursor-not-allowed'
                            : 'text-[#9CA3AF] border-[#222222] hover:text-white hover:border-[#444444]'
                        }`}
                      >
                        {copied === idx ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Product opportunity */}
            {productInsight && (
              <div
                className="border-l-4 border-[#2563EB] bg-[#111111] rounded-r-[8px] px-5 py-4 transition-opacity duration-700"
                style={{ opacity: showProduct ? 1 : 0 }}
              >
                <p className="text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-1">
                  Product opportunity
                </p>
                <p className="text-white text-sm leading-relaxed">{productInsight}</p>
              </div>
            )}

            {/* Hook history */}
            {history.length > 0 && (
              <div className="bg-[#111111] border border-[#222222] rounded-[8px] overflow-hidden">
                <button
                  onClick={() => setHistoryOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <span>Hook history ({history.length})</span>
                  <span className="text-lg leading-none">{historyOpen ? '−' : '+'}</span>
                </button>
                {historyOpen && (
                  <div className="border-t border-[#222222] divide-y divide-[#222222]">
                    {history.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="px-5 py-3">
                        <p className="text-[#9CA3AF] text-xs mb-1">
                          {item.platform} · {item.niche}
                        </p>
                        <p className="text-white text-sm">{item.hook_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generate more */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full border border-[#222222] text-[#9CA3AF] font-medium py-3 rounded-[8px] text-sm hover:text-white hover:border-[#444444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate 3 more'}
            </button>
          </div>
        )}

        {/* Upsell: SVJ Academy (after gen 1) */}
        {showAcademy && (
          <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-4 flex gap-4 items-start">
            <div className="w-1 shrink-0 h-full min-h-[60px] bg-[#2563EB] rounded-full" />
            <div>
              <p className="text-white font-semibold text-sm mb-1">SVJ Academy — Free.</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-3">
                The community where creators compare what is working, share hooks that converted, and get feedback from the SVJ team.
              </p>
              <a
                href="https://svjmedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors"
              >
                Join SVJ Academy
              </a>
            </div>
          </div>
        )}

        {/* Upsell: Blueprint + Partnership (after gen 3) */}
        {showUpsells && (
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Blueprint */}
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 flex flex-col">
              <span className="text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-3">
                Blueprint — $97 one-time
              </span>
              <p className="text-white font-semibold text-sm mb-2">The 30-Day Blueprint</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4 flex-1">
                The full SVJ monetization framework. Community architecture, funnel logic, product positioning. Self-paced, yours forever.
              </p>
              <a
                href="https://svjmedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors text-center"
              >
                Get the Blueprint
              </a>
            </div>

            {/* Partnership */}
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 flex flex-col">
              <span className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3">
                Partnership
              </span>
              <p className="text-white font-semibold text-sm mb-2">Work with SVJ directly.</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4 flex-1">
                {mode === 'streamer'
                  ? 'Streaming consistently to 1,000+ concurrent viewers? SVJ builds your full backend — paid community, VIP program, digital products — on rev share. Zero upfront.'
                  : 'Posting consistently to 50K+ followers? SVJ builds your full monetization backend on rev share. Zero upfront.'}
              </p>
              <a
                href="https://svjmedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors text-center"
              >
                Apply to partner
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
