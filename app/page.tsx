'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/gtag'

export default function Home() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Spots state
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)
  const [soldOut, setSoldOut] = useState(false)

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')

  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('svj_user_email')
    if (stored) {
      router.replace('/generator')
      return
    }

    // Capture UTM params
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source')
    const medium = params.get('utm_medium')
    const campaign = params.get('utm_campaign')
    if (source) localStorage.setItem('utm_source', source)
    if (medium) localStorage.setItem('utm_medium', medium)
    if (campaign) localStorage.setItem('utm_campaign', campaign)

    // Fetch spots
    fetch('/api/spots')
      .then((r) => r.json())
      .then((data) => {
        setSpotsRemaining(data.spots_remaining)
        setSoldOut(data.spots_remaining <= 0)
      })
      .catch(() => {
        // If spots fetch fails, show form anyway — don't block signups
        setSpotsRemaining(null)
        setSoldOut(false)
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    if (honeypot) return
    setLoading(true)
    setError('')

    try {
      // Check if this is a returning user — skip spots and go straight in
      const checkRes = await fetch(`/api/check-user?email=${encodeURIComponent(email)}`)
      const { exists } = await checkRes.json()

      if (exists) {
        localStorage.setItem('svj_user_email', email)
        router.push('/generator')
        return
      }

      // New user — check spots before subscribing
      if (soldOut) {
        setError('This week is full. Use the waitlist form below.')
        setLoading(false)
        return
      }

      const signupSource = localStorage.getItem('utm_source') || 'direct'

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: honeypot, signup_source: signupSource }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      // Increment spots for new signups only
      await fetch('/api/spots/increment', { method: 'POST' })

      localStorage.setItem('svj_user_email', email)
      trackEvent('email_signup', {
        event_category: 'conversion',
        event_label: 'hook_generator_signup',
      })
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!waitlistEmail) return
    setWaitlistLoading(true)
    setWaitlistError('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      setWaitlistDone(true)
    } catch (err: unknown) {
      setWaitlistError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-5">
        <span className="text-white font-semibold text-sm tracking-wide">SVJ Media</span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          {submitted ? (
            /* ── Confirmation screen ───────────────────────────────── */
            <div className="flex flex-col items-center text-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-6">
                <circle cx="24" cy="24" r="22" stroke="#2563EB" strokeWidth="2" />
                <path d="M15 24L21 30L33 18" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <h2 className="text-[22px] font-bold text-white mb-4">Check your email.</h2>

              <p className="text-[#9CA3AF] text-sm leading-[1.7] max-w-[420px] mb-8">
                We sent you an email on how to use the hook generator better than 99% of people and get the best results out of every session.
                <br /><br />
                Before you open the tool, read it. It takes two minutes and it changes how you use everything here.
                <br /><br />
                If it landed in Promotions or Spam, move it to Primary so you don't miss it.
              </p>

              <button
                onClick={() => router.push('/generator')}
                className="w-full sm:w-auto bg-white text-black font-semibold px-6 py-[10px] rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors"
              >
                Take me to the generator
              </button>

              <p className="mt-4 text-[#555555] text-xs">
                Didn't get the email? Check your spam folder or make sure you entered the right address.
              </p>
            </div>

          ) : soldOut ? (
            /* ── Sold out / waitlist state ─────────────────────────── */
            waitlistDone ? (
              <div className="flex flex-col items-center text-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-6">
                  <circle cx="24" cy="24" r="22" stroke="#2563EB" strokeWidth="2" />
                  <path d="M15 24L21 30L33 18" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h2 className="text-[22px] font-bold text-white mb-4">You are on the list.</h2>
                <p className="text-[#9CA3AF] text-sm leading-[1.7] max-w-[420px]">
                  We will email you Monday when the next 20 spots open. Make sure our email lands in your Primary inbox or you will miss it.
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
                  Write Top 1% Hooks in 10 Seconds
                </h1>

                <div className="bg-[#111111] border border-[#222222] rounded-[8px] px-4 py-4 mb-6">
                  <p className="text-white text-sm font-semibold mb-1">This week is full.</p>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">
                    All 20 spots for this week have been taken. Drop your email below and you will be first in line when spots open again next Monday.
                  </p>
                </div>

                {/* Returning user re-entry */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
                  <p className="text-[#9CA3AF] text-xs">Already have access? Enter your email to get back in.</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-[#111111] border border-[#222222] text-white placeholder-[#9CA3AF] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold py-3 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Checking...' : 'Get back in'}
                  </button>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                </form>

                <div className="border-t border-[#222222] pt-4 mb-2">
                  <p className="text-[#9CA3AF] text-xs mb-3">New here? Join the waitlist for next week.</p>
                </div>

                <form onSubmit={handleWaitlist} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-[#111111] border border-[#222222] text-white placeholder-[#9CA3AF] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={waitlistLoading}
                    className="w-full bg-white text-black font-semibold py-3 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {waitlistLoading ? 'Joining...' : 'Join the waitlist'}
                  </button>
                </form>

                {waitlistError && (
                  <p className="mt-3 text-red-400 text-sm">{waitlistError}</p>
                )}

                <p className="mt-4 text-[#9CA3AF] text-xs text-center">
                  Free forever. No spam. SVJ Media.
                </p>
              </>
            )

          ) : (
            /* ── Normal state — spots available ────────────────────── */
            <>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
                Write Top 1% Hooks in 10 Seconds
              </h1>
              <p className="text-[#9CA3AF] text-base sm:text-lg leading-relaxed mb-6">
                The free tool built on the SVJ short-form formula. Used by the Top 1% Streamers and Creators.
              </p>

              <div className="bg-[#111111] border border-[#222222] rounded-[8px] px-4 py-3 mb-6">
                <p className="text-[#9CA3AF] text-xs leading-relaxed">
                  <span className="text-white font-medium">Bookmark this page</span> after you sign up and save the link. Your access is tied to this browser automatically — so you can come back and use it anytime without signing in again. If you switch browsers or devices, just re-enter your email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                />

                {spotsRemaining !== null && spotsRemaining > 0 && (
                  <p className="text-[#9CA3AF] text-[13px]">
                    {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining this week.
                  </p>
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#111111] border border-[#222222] text-white placeholder-[#9CA3AF] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-semibold py-3 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting up...' : 'Get free access'}
                </button>
              </form>

              {error && (
                <p className="mt-3 text-red-400 text-sm">{error}</p>
              )}

              <p className="mt-4 text-[#9CA3AF] text-xs text-center">
                Free forever. No spam. SVJ Media.
              </p>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
