'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('svj_user_email')
    if (stored) {
      router.replace('/generator')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      localStorage.setItem('svj_user_email', email)
      setSubmittedEmail(email)
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
            <>
              <div className="mb-6">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center mb-5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">You're in.</h2>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Access saved to <span className="text-white font-medium">{submittedEmail}</span> on this browser.
                </p>
              </div>

              <div className="bg-[#111111] border border-[#222222] rounded-[8px] px-4 py-4 mb-6 space-y-2">
                <p className="text-white text-sm font-medium">Before you continue:</p>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Bookmark this page now. Your access is automatic on this browser — but if you open a new browser or device, you will need to re-enter <span className="text-white">{submittedEmail}</span> to get back in.
                </p>
              </div>

              <button
                onClick={() => router.push('/generator')}
                className="w-full bg-white text-black font-semibold py-3 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors"
              >
                Go to generator ↗
              </button>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
