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
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('svj_user_email')
    if (stored) {
      router.replace('/generator')
      return
    }
    // Capture UTM params and store in localStorage
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source')
    const medium = params.get('utm_medium')
    const campaign = params.get('utm_campaign')
    if (source) localStorage.setItem('utm_source', source)
    if (medium) localStorage.setItem('utm_medium', medium)
    if (campaign) localStorage.setItem('utm_campaign', campaign)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    if (honeypot) return
    setLoading(true)
    setError('')

    try {
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

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-5">
        <span className="text-white font-semibold text-sm tracking-wide">SVJ Media</span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          {!submitted ? (
            <>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
                Write hooks that stop the scroll.
              </h1>
              <p className="text-[#9CA3AF] text-base sm:text-lg leading-relaxed mb-6">
                The free tool built on the SVJ short-form formula. Used by streamers and creators who are done leaving views on the table.
              </p>

              <div className="bg-[#111111] border border-[#222222] rounded-[8px] px-4 py-3 mb-6">
                <p className="text-[#9CA3AF] text-xs leading-relaxed">
                  <span className="text-white font-medium">Bookmark this page</span> after you sign up and save the link. Your access is tied to this browser automatically — so you can come back and use it anytime without signing in again. If you switch browsers or devices, just re-enter your email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Honeypot — hidden from real users, catches bots */}
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
          ) : (
            <div className="flex flex-col items-center text-center">
              {/* Checkmark icon */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-6">
                <circle cx="24" cy="24" r="22" stroke="#2563EB" strokeWidth="2" />
                <path d="M15 24L21 30L33 18" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <h2 className="text-[22px] font-bold text-white mb-4">
                Check your email.
              </h2>

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
          )}

        </div>
      </div>
    </main>
  )
}
