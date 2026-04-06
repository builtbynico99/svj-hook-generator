'use client'

import { useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'

export default function ABTester() {
  const [hookA, setHookA] = useState('')
  const [hookB, setHookB] = useState('')
  const [loading, setLoading] = useState(false)
  const [winner, setWinner] = useState<'A' | 'B' | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  async function handleTest() {
    if (!hookA.trim() || !hookB.trim()) return
    setLoading(true)
    setError('')
    setWinner(null)
    setReason('')

    try {
      const res = await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hookA, hookB }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Test failed')
      }
      const data = await res.json()
      setWinner(data.winner)
      setReason(data.reason)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const aWins = winner === 'A'
  const bWins = winner === 'B'

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Nav />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Which hook wins?</h1>
          <p className="text-[#9CA3AF] text-sm">Paste two hooks. Get a verdict in seconds.</p>
        </div>

        {/* Textareas — side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Hook A */}
          <div
            className={`bg-[#111111] border rounded-[8px] p-4 transition-all duration-300 ${
              winner === null
                ? 'border-[#222222]'
                : aWins
                ? 'border-[#2563EB]'
                : 'border-[#222222] opacity-40'
            }`}
          >
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              Hook A
            </label>
            <textarea
              value={hookA}
              onChange={(e) => setHookA(e.target.value)}
              rows={3}
              placeholder="Paste your first hook here..."
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white placeholder-[#555555] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
            />
            {aWins && (
              <p className="text-[#2563EB] text-xs font-semibold mt-2 uppercase tracking-wider">Winner</p>
            )}
          </div>

          {/* Hook B */}
          <div
            className={`bg-[#111111] border rounded-[8px] p-4 transition-all duration-300 ${
              winner === null
                ? 'border-[#222222]'
                : bWins
                ? 'border-[#2563EB]'
                : 'border-[#222222] opacity-40'
            }`}
          >
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              Hook B
            </label>
            <textarea
              value={hookB}
              onChange={(e) => setHookB(e.target.value)}
              rows={3}
              placeholder="Paste your second hook here..."
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white placeholder-[#555555] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
            />
            {bWins && (
              <p className="text-[#2563EB] text-xs font-semibold mt-2 uppercase tracking-wider">Winner</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleTest}
            disabled={loading || !hookA.trim() || !hookB.trim()}
            className="bg-white text-black font-semibold px-8 py-3.5 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Pick the winner ↗'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-6 text-center">{error}</p>}

        {/* Result */}
        {winner && reason && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Verdict</p>
              <p className="text-white text-sm leading-relaxed">{reason}</p>
            </div>

            <p className="text-[#9CA3AF] text-[13px] leading-relaxed text-center">
              Want hooks like this generated daily?{' '}
              <Link href="/generator" className="text-[#2563EB] hover:underline">
                Use the SVJ Hook Generator.
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
