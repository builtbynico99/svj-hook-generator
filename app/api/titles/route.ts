import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getYouTubeTitlePrompt } from '@/lib/prompts'

function parseTitles(text: string): { type: string; text: string }[] {
  const titles: { type: string; text: string }[] = []
  const regex = /TITLE\s+\d+\s*\(([^)]+)\):\s*([\s\S]*?)(?=TITLE\s+\d+|$)/gi
  let match

  while ((match = regex.exec(text)) !== null) {
    const type = match[1].trim()
    const titleText = match[2].trim()
    if (titleText) titles.push({ type, text: titleText })
  }

  return titles
}

export async function POST(req: NextRequest) {
  try {
    const { topic, niche, style } = await req.json()

    if (!topic || !niche || !style) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: getYouTubeTitlePrompt(niche, style),
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const titles = parseTitles(rawText)

    return NextResponse.json({ titles })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Titles error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
