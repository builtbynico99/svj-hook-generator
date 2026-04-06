'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { triggerCopyAnimation } from '@/lib/copyAnimation'
import NicheDropdown from '@/components/NicheDropdown'

type Mode = 'creator' | 'streamer'
type Hook = { id: string; type: string; text: string; score: number }
type HistoryItem = { hook_text: string; created_at: string; platform: string; niche: string }

const PLATFORMS = ['Reels', 'YouTube Shorts', 'TikTok']
const STYLES = ['Pattern break', 'Bold claim', 'Curiosity gap', 'Contrarian']

export default function Generator() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [totalGenerations, setTotalGenerations] = useState(0)
  const [mode, setMode] = useState<Mode>('creator')
  const [platform, setPlatform] = useState('Reels')
  const [niche, setNiche] = useState('All niches')
  const [style, setStyle] = useState('Pattern break')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [hooks, setHooks] = useState<Hook[]>([])
  const [productInsight, setProductInsight] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [copied, setCopied] = useState<number | null>(null) // kept for compat, unused after refactor
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({})
  const [displayedText, setDisplayedText] = useState<string[]>([])
  const [typingDone, setTypingDone] = useState<boolean[]>([])
  const [showProduct, setShowProduct] = useState(false)
  const [streak, setStreak] = useState(0)
  const [qualifies, setQualifies] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [dailyGenerations, setDailyGenerations] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [countdown, setCountdown] = useState(0)

  // Revenue calculator state
  const [followers, setFollowers] = useState(50000)
  const [engagementRate, setEngagementRate] = useState(1.0)
  const [price, setPrice] = useState(25)

  const fetchUser = useCallback(async (userEmail: string) => {
    const res = await fetch(`/api/user?email=${encodeURIComponent(userEmail)}`)
    if (res.ok) {
      const data = await res.json()
      setTotalGenerations(data.total_generations ?? 0)
      setStreak(data.current_streak ?? 0)

      // Check partnership qualifier
      const gens = data.total_generations ?? 0
      const str = data.current_streak ?? 0
      const createdAt = data.created_at ? new Date(data.created_at) : null
      const daysSinceCreation = createdAt
        ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        : 0
      setQualifies(gens >= 30 && str >= 5 && daysSinceCreation >= 7)
    }
  }, [])

  const fetchHistory = useCallback(async (userEmail: string) => {
    const res = await fetch(`/api/history?email=${encodeURIComponent(userEmail)}`)
    if (res.ok) {
      const data = await res.json()
      setHistory(data.hooks ?? [])
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('svj_user_email')
    if (!stored) { router.replace('/'); return }
    setEmail(stored)
    fetchUser(stored)
    fetchHistory(stored)
  }, [router, fetchUser, fetchHistory])

  useEffect(() => {
    if (mode === 'creator') { setNiche('All niches'); setPlatform('Reels') }
    else { setNiche('All niches'); setPlatform('TikTok') }
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
        setDisplayedText((prev) => { const next = [...prev]; next[idx] = full.slice(0, i); return next })
        await new Promise((r) => setTimeout(r, SPEED))
      }
      setTypingDone((prev) => { const next = [...prev]; next[idx] = true; return next })
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
      if (data.streak) setStreak(data.streak)
      if (data.dailyGenerations != null) setDailyGenerations(data.dailyGenerations)
      if (data.dailyLimit != null) setDailyLimit(data.dailyLimit)
      fetchHistory(email)
      // Layer 8: start 5-second UI countdown
      let secs = 5
      setCountdown(secs)
      const timer = setInterval(() => {
        secs -= 1
        if (secs <= 0) { clearInterval(timer); setCountdown(0) }
        else setCountdown(secs)
      }, 1000)
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

  function copyHook(text: string, btn: HTMLButtonElement) {
    triggerCopyAnimation(btn, text)
  }

  const limitReached = dailyGenerations >= dailyLimit
  const buttonLabel = loading
    ? 'Generating...'
    : countdown > 0
    ? `Generate again in ${countdown}...`
    : limitReached
    ? 'Daily limit reached'
    : 'Generate hooks ↗'
  const buttonDisabled = loading || countdown > 0 || limitReached
  const showAcademy = totalGenerations >= 1
  const showUpsells = totalGenerations >= 3

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Nav />

      {/* pb-24 on mobile to clear the fixed generate bar */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 pb-28 md:pb-12">

        {/* Header row: streak + qualifier badge */}
        {(streak >= 2 || qualifies) && (
          <div className="flex justify-end items-center gap-2 mb-4">
            {streak >= 2 && (
              <div className="flex items-center gap-1.5 bg-[#111111] border border-[#222222] rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                <span className="text-[#9CA3AF] text-[12px] leading-none">Day {streak} streak</span>
              </div>
            )}
            {qualifies && (
              <button
                onClick={() => setModalOpen(true)}
                className="border border-[#2563EB] rounded-full px-3 py-1 text-[11px] text-[#2563EB] hover:bg-[#2563EB]/10 transition-colors"
              >
                SVJ Partnership — You may qualify.
              </button>
            )}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setMode('creator')}
            className={`flex-1 py-3 rounded-[8px] text-sm font-semibold border transition-colors ${
              mode === 'creator' ? 'bg-white text-black border-white' : 'bg-transparent text-[#9CA3AF] border-[#222222] hover:border-[#444444]'
            }`}
          >
            Content Creator
          </button>
          <button
            onClick={() => setMode('streamer')}
            className={`flex-1 py-3 rounded-[8px] text-sm font-semibold border transition-colors ${
              mode === 'streamer' ? 'bg-white text-black border-white' : 'bg-transparent text-[#9CA3AF] border-[#222222] hover:border-[#444444]'
            }`}
          >
            Streamer
          </button>
        </div>

        {/* Inputs Card — 12px gap between children on mobile */}
        <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-6 flex flex-col gap-3 md:gap-5">

          {/* Platform tabs — horizontal scroll on mobile, wrap on desktop */}
          <div>
            <p className="text-[#9CA3AF] text-xs font-medium mb-2 uppercase tracking-wider">Platform</p>
            <div className="flex gap-2 overflow-x-auto md:flex-wrap scrollbar-hide">
              {PLATFORMS.map((p) => {
                const isStreamerReel = mode === 'streamer' && p === 'Reels'
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`shrink-0 px-4 py-2 rounded-[8px] text-xs font-medium border transition-colors ${
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

          {/* Niche dropdown — full width always */}
          <div>
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              Niche
            </label>
            <NicheDropdown mode={mode} value={niche} onChange={setNiche} />
          </div>

          {/* Hook style tabs — horizontal scroll on mobile, wrap on desktop */}
          <div>
            <p className="text-[#9CA3AF] text-xs font-medium mb-2 uppercase tracking-wider">Hook style</p>
            <div className="flex gap-2 overflow-x-auto md:flex-wrap scrollbar-hide">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`shrink-0 px-4 py-2 rounded-[8px] text-xs font-medium border transition-colors ${
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

          {/* Topic textarea — 4 rows on mobile, 3 on desktop */}
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
              rows={4}
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white placeholder-[#555555] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none md:rows-3"
            />
          </div>
        </div>

        {/* Generate button — desktop only (mobile uses fixed bar) */}
        <div className="btn-glow-wrap mb-8 hidden md:block">
          <button
            onClick={handleGenerate}
            disabled={buttonDisabled || !topic.trim()}
            className="w-full bg-white text-black font-semibold py-3.5 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {/* Layer 5: Daily limit reached card */}
        {limitReached && (
          <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-6">
            <p className="text-white font-semibold text-sm mb-1">You hit your 10 hooks for today.</p>
            <p className="text-[#9CA3AF] text-sm mb-4">Come back tomorrow. Or stop waiting and build something that generates while you sleep.</p>
            <a
              href="https://svjmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black text-xs font-semibold px-4 py-2.5 rounded-[8px] hover:bg-[#E5E7EB] transition-colors"
            >
              Join SVJ Academy — free
            </a>
          </div>
        )}

        {/* Output */}
        {hooks.length > 0 && (
          <div className="space-y-4 mb-6">
            {/* Saved hooks pill — mobile only, top right of output */}
            {history.length > 0 && (
              <div className="flex justify-end md:hidden">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="text-xs text-[#9CA3AF] border border-[#222222] px-3 py-1.5 rounded-full hover:text-white hover:border-[#444444] transition-colors"
                >
                  Saved hooks ({history.length})
                </button>
              </div>
            )}

            {/* Hook cards */}
            {hooks.map((hook, idx) => {
              const done = typingDone[idx] ?? false
              return (
                <div key={idx} className="bg-[#111111] border border-[#222222] rounded-[8px] p-5">
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
                          !done ? 'border-[#222222] text-[#333333] cursor-not-allowed'
                          : ratings[hook.id] === 1 ? 'bg-green-500 border-green-500 text-white'
                          : 'border-[#222222] text-[#9CA3AF] hover:border-green-500 hover:text-green-500'
                        }`}
                      >👍</button>
                      <button
                        onClick={() => done && ratehook(hook.id, -1)}
                        disabled={!done}
                        title="This didn't work"
                        className={`text-sm px-2.5 py-1.5 rounded-[8px] border transition-colors ${
                          !done ? 'border-[#222222] text-[#333333] cursor-not-allowed'
                          : ratings[hook.id] === -1 ? 'bg-red-500 border-red-500 text-white'
                          : 'border-[#222222] text-[#9CA3AF] hover:border-red-500 hover:text-red-500'
                        }`}
                      >👎</button>
                      <button
                        onClick={(e) => done && copyHook(hook.text, e.currentTarget)}
                        disabled={!done}
                        style={{ transition: 'transform 100ms ease-out, color 200ms ease' }}
                        className={`text-xs border px-3 py-1.5 rounded-[8px] transition-colors ${
                          !done ? 'border-[#222222] text-[#333333] cursor-not-allowed'
                          : 'text-[#9CA3AF] border-[#222222] hover:text-white hover:border-[#444444]'
                        }`}
                      >
                        Copy
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
                <p className="text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-1">Product opportunity</p>
                <p className="text-white text-sm leading-relaxed">{productInsight}</p>
              </div>
            )}

            {/* Hook history — desktop inline, hidden on mobile (uses bottom sheet) */}
            {history.length > 0 && (
              <div className="hidden md:block bg-[#111111] border border-[#222222] rounded-[8px] overflow-hidden">
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
                        <p className="text-[#9CA3AF] text-xs mb-1">{item.platform} · {item.niche}</p>
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
              disabled={buttonDisabled}
              className="w-full border border-[#222222] text-[#9CA3AF] font-medium py-3 rounded-[8px] text-sm hover:text-white hover:border-[#444444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : countdown > 0 ? `Generate again in ${countdown}...` : limitReached ? 'Daily limit reached' : 'Generate 3 more'}
            </button>
          </div>
        )}

        {/* Revenue Potential Calculator — shown at 7+ lifetime generations */}
        {totalGenerations >= 7 && (
          <div className="bg-[#111111] border border-[#222222] rounded-[12px] p-5 mb-6">
            <p className="text-white text-sm font-semibold mb-5">What your audience is worth.</p>

            {/* Sliders */}
            <div className="space-y-5 mb-6">
              {/* Followers */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[#9CA3AF] text-xs uppercase tracking-wider">Follower count</label>
                  <span className="text-white text-xs font-medium">{followers.toLocaleString()} followers</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={2000000}
                  step={1000}
                  value={followers}
                  onChange={(e) => setFollowers(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Engagement rate */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[#9CA3AF] text-xs uppercase tracking-wider">Engagement rate</label>
                  <span className="text-white text-xs font-medium">{engagementRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={engagementRate}
                  onChange={(e) => setEngagementRate(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Price */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[#9CA3AF] text-xs uppercase tracking-wider">Paid community price</label>
                  <span className="text-white text-xs font-medium">${price}/month</span>
                </div>
                <input
                  type="range"
                  min={9}
                  max={49}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>
            </div>

            {/* Metric cards */}
            {(() => {
              const monthly = Math.round(followers * (engagementRate / 100) * price)
              const svjTakes = Math.round(monthly * 0.30)
              const youKeep = Math.round(monthly * 0.70)
              const fmt = (n: number) => `$${n.toLocaleString()}`
              return (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-[8px] p-3 text-center">
                      <p className="text-[#9CA3AF] text-[10px] uppercase tracking-wider mb-1">Monthly Revenue</p>
                      <p className="text-white text-sm font-bold">{fmt(monthly)}</p>
                      <p className="text-[#555555] text-[10px]">/month</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-[8px] p-3 text-center">
                      <p className="text-[#9CA3AF] text-[10px] uppercase tracking-wider mb-1">SVJ Takes</p>
                      <p className="text-white text-sm font-bold">{fmt(svjTakes)}</p>
                      <p className="text-[#555555] text-[10px]">/month</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#2563EB] rounded-[8px] p-3 text-center">
                      <p className="text-[#9CA3AF] text-[10px] uppercase tracking-wider mb-1">You Keep</p>
                      <p className="text-[#2563EB] text-sm font-bold">{fmt(youKeep)}</p>
                      <p className="text-[#555555] text-[10px]">/month</p>
                    </div>
                  </div>
                  <p className="text-[#555555] text-[13px] leading-relaxed mb-4">
                    Conservative case. Based on 1% of your audience converting to a $25/month community.
                  </p>
                </>
              )
            })()}

            <a
              href="https://svjmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors"
            >
              See how SVJ builds this for you
            </a>
          </div>
        )}

        {/* Upsell: SVJ Academy */}
        {showAcademy && (
          <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-4 flex gap-4 items-start">
            <div className="w-1 shrink-0 h-full min-h-[60px] bg-[#2563EB] rounded-full" />
            <div>
              <p className="text-white font-semibold text-sm mb-1">SVJ Academy — Free.</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-3">
                The community where creators compare what is working, share hooks that converted, and get feedback from the SVJ team.
              </p>
              <a href="https://svjmedia.com" target="_blank" rel="noopener noreferrer"
                className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors">
                Join SVJ Academy
              </a>
            </div>
          </div>
        )}

        {/* Upsell: Blueprint + Partnership */}
        {showUpsells && (
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 flex flex-col">
              <span className="text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-3">Blueprint — $97 one-time</span>
              <p className="text-white font-semibold text-sm mb-2">The 30-Day Blueprint</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4 flex-1">
                The full SVJ monetization framework. Community architecture, funnel logic, product positioning. Self-paced, yours forever.
              </p>
              <a href="https://svjmedia.com" target="_blank" rel="noopener noreferrer"
                className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors text-center">
                Get the Blueprint
              </a>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 flex flex-col">
              <span className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3">Partnership</span>
              <p className="text-white font-semibold text-sm mb-2">Work with SVJ directly.</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4 flex-1">
                {mode === 'streamer'
                  ? 'Streaming consistently to 1,000+ concurrent viewers? SVJ builds your full backend — paid community, VIP program, digital products — on rev share. Zero upfront.'
                  : 'Posting consistently to 50K+ followers? SVJ builds your full monetization backend on rev share. Zero upfront.'}
              </p>
              <a href="https://svjmedia.com" target="_blank" rel="noopener noreferrer"
                className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors text-center">
                Apply to partner
              </a>
            </div>
          </div>
        )}
      </main>

      {/* ── Fixed generate bar — mobile only ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0A] border-t border-[#222222] h-14 flex items-center px-8">
        <button
          onClick={handleGenerate}
          disabled={buttonDisabled || !topic.trim()}
          className="w-full h-10 bg-white text-black font-semibold rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>

      {/* ── Bottom sheet — mobile saved hooks ────────────────────────────────── */}
      {/* ── Partnership qualifier modal ───────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-[480px] bg-[#111111] border border-[#222222] rounded-[12px] p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] text-lg leading-none hover:text-white transition-colors"
            >
              ✕
            </button>

            <h2 className="text-white text-[18px] font-bold mb-4 leading-snug">
              You may qualify for an SVJ Partnership.
            </h2>
            <p className="text-[#9CA3AF] text-[14px] leading-[1.6] mb-4">
              You have been using the tool consistently. That is exactly the signal SVJ looks for. Partners get their full monetization backend built — paid community, digital products, funnels — on rev share. Zero upfront.
            </p>
            <p className="text-[#9CA3AF] text-[13px] leading-relaxed mb-6">
              {mode === 'streamer'
                ? 'Best fit: streamers with 1,000+ concurrent viewers.'
                : 'Best fit: creators posting consistently to 50K+ followers.'}
            </p>
            <a
              href="https://svjmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white text-black text-sm font-semibold py-3 rounded-[8px] text-center hover:bg-[#E5E7EB] transition-colors"
            >
              Apply to partner
            </a>
          </div>
        </div>
      )}

      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            onClick={() => setSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#111111] border-t border-[#222222] rounded-t-[16px] max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222]">
              <p className="text-white text-sm font-semibold">Saved hooks</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-[#9CA3AF] text-lg leading-none hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-[#222222]">
              {history.slice(0, 10).map((item, idx) => (
                <div key={idx} className="px-5 py-3">
                  <p className="text-[#9CA3AF] text-xs mb-1">{item.platform} · {item.niche}</p>
                  <p className="text-white text-sm">{item.hook_text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
