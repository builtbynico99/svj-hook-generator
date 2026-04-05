import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SCORER_PROMPT } from '@/lib/prompts'

function parseScore(text: string): { score: number; feedback: string[] } {
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0

  const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+?)$/i)
  const feedbackRaw = feedbackMatch ? feedbackMatch[1].trim() : ''
  const feedback = feedbackRaw
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)

  return { score, feedback }
}

export async function POST(req: NextRequest) {
  const { hook } = await req.json()

  if (!hook) {
    return NextResponse.json({ error: 'Hook text is required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SCORER_PROMPT,
    messages: [{ role: 'user', content: hook }],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
  const { score, feedback } = parseScore(rawText)

  return NextResponse.json({ score, feedback })
}
