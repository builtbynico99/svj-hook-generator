'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'

export default function Scorer() {
  const [hook, setHook] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string[]>([])
  const [error, setError] = useState('')

  function scoreColor(s: number) {
    if (s >= 80) return 'text-green-400'
    if (s >= 55) return 'text-yellow-400'
    return 'text-red-400'
  }

  async function handleScore() {
    if (!hook.trim()) return
    setLoading(true)
    setError('')
    setScore(null)
    setFeedback([])

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Scoring failed')
      }
      const data = await res.json()
      setScore(data.score)
      setFeedback(data.feedback)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Nav />

      <main className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Hook Scorer</h1>
        <p className="text-[#9CA3AF] text-sm mb-8">
          Paste any hook. Get a score and three specific notes on what to fix.
        </p>

        <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-4">
          <textarea
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            placeholder="Paste any hook here."
            rows={4}
            className="w-full bg-[#0A0A0A] border border-[#222222] text-white placeholder-[#555555] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
          />
        </div>

        <button
          onClick={handleScore}
          disabled={loading || !hook.trim()}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          {loading ? 'Scoring...' : 'Score it'}
        </button>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {score !== null && (
          <div className="space-y-4">
            {/* Score display */}
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-6 text-center">
              <p className="text-[#9CA3AF] text-xs uppercase tracking-wider mb-2">Score</p>
              <p className={`text-7xl font-bold ${scoreColor(score)}`}>{score}</p>
              <p className="text-[#9CA3AF] text-xs mt-2">out of 100</p>
            </div>

            {/* Feedback */}
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-3">Feedback</p>
              <ul className="space-y-3">
                {feedback.map((note, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-white leading-relaxed">
                    <span className="text-[#2563EB] font-bold shrink-0">—</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
