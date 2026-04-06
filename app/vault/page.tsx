'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type VaultItem = {
  id: string
  product_type: string
  pitch: string
  topic: string
  created_at: string
}

export default function Vault() {
  const router = useRouter()
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem('svj_user_email')
    if (!email) { router.replace('/'); return }

    fetch(`/api/vault?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false))
  }, [router])

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  const count = items.length

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Nav />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 pb-28 md:pb-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Product Idea Vault</h1>
          <p className="text-[#9CA3AF] text-sm">
            Every product opportunity from your sessions. Saved automatically.
          </p>
        </div>

        {loading && (
          <p className="text-[#9CA3AF] text-sm">Loading...</p>
        )}

        {!loading && count === 0 && (
          <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-6 text-center">
            <p className="text-[#9CA3AF] text-sm">No product ideas yet.</p>
            <p className="text-[#555555] text-xs mt-1">Generate hooks to start building your vault.</p>
          </div>
        )}

        {!loading && count > 0 && (
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-[#111111] border border-[#222222] rounded-[8px] p-5"
              >
                {item.product_type && (
                  <p className="text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-1">
                    {item.product_type}
                  </p>
                )}
                <p className="text-white text-sm leading-relaxed mb-2">{item.pitch}</p>
                {item.topic && (
                  <p className="text-[#555555] text-xs mb-2">
                    From: {item.topic.length > 80 ? item.topic.slice(0, 80) + '…' : item.topic}
                  </p>
                )}
                <p className="text-[#444444] text-xs">{formatDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upsell: Blueprint — show at 3+ ideas */}
        {count >= 3 && (
          <div className="border-l-2 border-[#2563EB] bg-[#111111] rounded-r-[8px] p-5 mb-4">
            <p className="text-white text-sm font-semibold mb-1">
              You have {count} product ideas sitting here.
            </p>
            <p className="text-[#9CA3AF] text-[13px] leading-relaxed mb-4">
              The Blueprint shows you exactly how to pick one and build it in 30 days. $97 one-time.
            </p>
            <a
              href="https://svjmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors"
            >
              Get the Blueprint
            </a>
          </div>
        )}

        {/* Upsell: Partnership — show at 7+ ideas */}
        {count >= 7 && (
          <div className="border-l-2 border-[#2563EB] bg-[#111111] rounded-r-[8px] p-5 mb-4">
            <p className="text-white text-sm font-semibold mb-1">
              Your content is ready for a full backend.
            </p>
            <p className="text-[#9CA3AF] text-[13px] leading-relaxed mb-4">
              Creators with this much product clarity are exactly who SVJ partners with.
            </p>
            <a
              href="https://svjmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-[#E5E7EB] transition-colors"
            >
              Apply to partner
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
