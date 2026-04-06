import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabase } from '@/lib/supabase'
import { getCreatorPrompt, getStreamerPrompt } from '@/lib/prompts'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function parseResponse(text: string): { hooks: { type: string; text: string }[]; productInsight: string } {
  const hooks: { type: string; text: string }[] = []
  const hookRegex = /HOOK\s+\d+\s*\(([^)]+)\):\s*([\s\S]*?)(?=HOOK\s+\d+|PRODUCT:|$)/gi
  let match

  while ((match = hookRegex.exec(text)) !== null) {
    const hookType = match[1].trim()
    const hookText = match[2].trim()
    if (hookText) hooks.push({ type: hookType, text: hookText })
  }

  const productMatch = text.match(/PRODUCT:\s*([\s\S]+?)$/i)
  const productInsight = productMatch ? productMatch[1].trim() : ''

  return { hooks, productInsight }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, platform, niche, style, mode, email } = await req.json()

    if (!topic || !platform || !niche || !style || !mode || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const systemPrompt =
      mode === 'streamer'
        ? getStreamerPrompt(platform, niche, style)
        : getCreatorPrompt(platform, niche, style)

    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const { hooks, productInsight } = parseResponse(rawText)

    // Save hooks to Supabase
    const hookInserts = hooks.map((h) => ({
      user_email: email,
      hook_text: h.text,
      platform,
      niche,
      style,
      topic,
      mode,
    }))

    const supabase = getSupabase()

    let savedHooks: { id: string; type: string; text: string }[] = hooks.map((h) => ({ id: '', ...h }))

    if (hookInserts.length > 0) {
      const { data } = await supabase.from('hooks').insert(hookInserts).select('id')
      if (data) {
        savedHooks = hooks.map((h, i) => ({ id: data[i]?.id ?? '', ...h }))
      }
    }

    // Increment total_generations
    const { data: userData } = await supabase
      .from('users')
      .select('total_generations')
      .eq('email', email)
      .single()

    const currentCount = userData?.total_generations ?? 0
    await supabase
      .from('users')
      .update({ total_generations: currentCount + 1 })
      .eq('email', email)

    return NextResponse.json({ hooks: savedHooks, productInsight })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Generate error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
