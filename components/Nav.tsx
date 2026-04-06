import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="border-b border-[#222222] px-6 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/generator" className="text-white font-semibold text-sm tracking-wide">
          SVJ Media
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/generator" className="text-[#9CA3AF] text-sm hover:text-white transition-colors">
            Hooks
          </Link>
          <Link href="/titles" className="text-[#9CA3AF] text-sm hover:text-white transition-colors">
            YT Titles
          </Link>
          <Link href="/vault" className="text-[#9CA3AF] text-sm hover:text-white transition-colors">
            Vault
          </Link>
          <Link href="/scorer" className="text-[#9CA3AF] text-sm hover:text-white transition-colors">
            Scorer
          </Link>
        </div>
      </div>
    </nav>
  )
}
