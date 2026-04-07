'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const NAV_LINKS = [
  { href: '/generator', label: 'Generator' },
  { href: '/ab-tester', label: 'A/B Tester' },
  { href: '/titles', label: 'YT Titles' },
  { href: '/scorer', label: 'Hook Scorer' },
  { href: '/vault', label: 'Vault' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#222222]">
      {/* ── Desktop: single row ─────────────────────────────────────── */}
      <div className="hidden md:flex max-w-2xl mx-auto px-6 py-4 items-center justify-between">
        <Link href="/generator">
          <Image src="/svj-logo.png" alt="SVJ" height={28} width={84} style={{ height: 28, width: 'auto' }} priority />
        </Link>
        <div className="flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${pathname === href ? 'text-white' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mobile: logo row + scrollable nav row ───────────────────── */}
      <div className="md:hidden">
        {/* Logo row */}
        <div className="px-4 pt-3 pb-2">
          <Link href="/generator">
            <Image src="/svj-logo.png" alt="SVJ" height={24} width={72} style={{ height: 24, width: 'auto' }} priority />
          </Link>
        </div>
        {/* Scrollable nav links */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="shrink-0 whitespace-nowrap px-[14px] py-[6px] rounded-[20px] border transition-colors"
                style={{
                  fontSize: '13px',
                  color: active ? '#ffffff' : '#9CA3AF',
                  backgroundColor: active ? '#1a1a1a' : 'transparent',
                  borderColor: active ? '#555555' : '#333333',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
