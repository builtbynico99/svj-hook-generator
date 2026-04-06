import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are the SVJ hook analyst. You will receive two short-form video hooks. Pick the stronger one and explain why in exactly two sentences. Be direct. No fluff. Format exactly: WINNER: [A or B]\nREASON: [two sentences]`

function parseResult(text: string): { winner: 'A' | 'B'; reason: string } {
  const winnerMatch = text.match(/WINNER:\s*([AB])/i)
  const reasonMatch = text.match(/REASON:\s*([\s\S]+?)$/i)
  const winner = (winnerMatch?.[1]?.toUpperCase() ?? 'A') as 'A' | 'B'
  const reason = reasonMatch?.[1]?.trim() ?? ''
  return { winner, reason }
}

export async function POST(req: NextRequest) {
  try {
    const { hookA, hookB } = await req.json()
    if (!hookA || !hookB) return NextResponse.json({ error: 'Both hooks required' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Hook A: ${hookA}\n\nHook B: ${hookB}` }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const { winner, reason } = parseResult(raw)
    return NextResponse.json({ winner, reason })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
