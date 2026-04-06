'use client'

import { useState, useEffect, useRef } from 'react'

const CREATOR_NICHES = [
  'All niches',
  'Gaming / Streaming',
  'Personal Finance',
  'Fitness / Health',
  'Lifestyle / Vlogging',
  'Business / Entrepreneurship',
  'Creator Economy',
  'Other',
]

const STREAMER_NICHES = [
  'All niches',
  'FPS / Competitive',
  'IRL / Variety',
  'Sports',
  'Just Chatting',
  'Roleplay / RPG',
  'Other',
]

type Props = {
  mode: 'creator' | 'streamer'
  value: string
  onChange: (value: string) => void
}

export default function NicheDropdown({ mode, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const options = mode === 'creator' ? CREATOR_NICHES : STREAMER_NICHES

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Determine open direction
  function handleToggle() {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < 260)
    }
    setOpen((prev) => !prev)
  }

  function handleSelect(option: string) {
    onChange(option)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between bg-[#111111] border border-[#333333] rounded-[8px] px-[14px] h-[42px] text-sm text-white hover:border-[#555555] transition-colors"
      >
        <span>{value}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 right-0 z-50 bg-[#111111] border border-[#333333] rounded-[8px] overflow-y-auto"
          style={{
            marginTop: openUp ? undefined : '4px',
            marginBottom: openUp ? '4px' : undefined,
            bottom: openUp ? '100%' : undefined,
            top: openUp ? undefined : '100%',
            maxHeight: '240px',
          }}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full flex items-center gap-2.5 px-[14px] py-[10px] text-sm text-left hover:bg-[#1a1a1a] transition-colors"
              style={{ color: option === value ? '#ffffff' : '#9CA3AF' }}
            >
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: option === value ? '#2563EB' : 'transparent',
                  flexShrink: 0,
                }}
              />
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
