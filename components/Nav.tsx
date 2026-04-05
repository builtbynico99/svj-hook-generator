import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="border-b border-[#222222] px-6 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/generator" className="text-white font-semibold text-sm tracking-wide">
          SVJ Media
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/generator"
            className="text-[#9CA3AF] text-sm hover:text-white transition-colors"
          >
            Generator
          </Link>
          <Link
            href="/scorer"
            className="text-[#9CA3AF] text-sm hover:text-white transition-colors"
          >
            Hook Scorer
          </Link>
        </div>
      </div>
    </nav>
  )
}
