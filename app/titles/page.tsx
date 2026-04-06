'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type Title = { type: string; text: string }

const NICHES = ['Personal Finance', 'Fitness', 'Lifestyle', 'Business', 'Creator Economy', 'Gaming', 'Other']
const STYLES = ['Access/Proximity', 'Emotional contradiction', 'Curiosity gap', 'Contrarian', 'Number-driven']

export default function Titles() {
  const router = useRouter()
  const [niche, setNiche] = useState('Personal Finance')
  const [style, setStyle] = useState('Curiosity gap')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [titles, setTitles] = useState<Title[]>([])
  const [copied, setCopied] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('svj_user_email')
    if (!stored) router.replace('/')
  }, [router])

  async function handleGenerate() {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setTitles([])

    try {
      const res = await fetch('/api/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, niche, style }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }
      const data = await res.json()
      setTitles(data.titles)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyTitle(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Nav />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">YouTube Title Generator</h1>
          <p className="text-[#9CA3AF] text-sm">
            5 high-CTR titles per topic. Built on patterns that drive clicks.
          </p>
        </div>

        {/* Inputs Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-5 mb-6">
          {/* Niche */}
          <div className="mb-5">
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white rounded-[8px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] transition-colors appearance-none cursor-pointer"
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Style tabs */}
          <div className="mb-5">
            <p className="text-[#9CA3AF] text-xs font-medium mb-2 uppercase tracking-wider">Title style</p>
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

          {/* Topic */}
          <div>
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider block mb-2">
              What's your video about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How I grew from 0 to 100K subscribers without paid ads..."
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#222222] text-white placeholder-[#555555] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-[8px] text-sm hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          {loading ? 'Generating...' : 'Generate titles ↗'}
        </button>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {titles.length > 0 && (
          <div className="space-y-3 mb-8">
            {titles.map((title, idx) => (
              <div
                key={idx}
                className="bg-[#111111] border border-[#222222] rounded-[8px] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">
                      Title {idx + 1} — {title.type}
                    </p>
                    <p className="text-white text-base leading-relaxed">{title.text}</p>
                    <p className={`text-xs mt-2 ${title.text.length > 60 ? 'text-yellow-500' : 'text-[#555555]'}`}>
                      {title.text.length} characters {title.text.length > 60 ? '— consider shortening' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => copyTitle(title.text, idx)}
                    className="shrink-0 text-xs text-[#9CA3AF] border border-[#222222] px-3 py-1.5 rounded-[8px] hover:text-white hover:border-[#444444] transition-colors"
                  >
                    {copied === idx ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full border border-[#222222] text-[#9CA3AF] font-medium py-3 rounded-[8px] text-sm hover:text-white hover:border-[#444444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate 5 more'}
            </button>
          </div>
        )}

        {/* Data note */}
        <div className="border-l-4 border-[#222222] px-4 py-3">
          <p className="text-[#555555] text-xs leading-relaxed">
            Titles improve as you add real performance data. Share your top CTR titles with SVJ and we will inject them directly into the generator.
          </p>
        </div>
      </main>
    </div>
  )
}
