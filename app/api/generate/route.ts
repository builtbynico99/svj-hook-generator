import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabase } from '@/lib/supabase'
import { getCreatorPrompt, getStreamerPrompt } from '@/lib/prompts'

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function parseResponse(text: string): { hooks: { type: string; text: string; score: number }[]; productInsight: string } {
  const hooks: { type: string; text: string; score: number }[] = []
  const hookRegex = /HOOK\s+\d+\s*\(([^)]+)\):\s*([\s\S]*?)(?=HOOK\s+\d+|PRODUCT:|$)/gi
  let match

  while ((match = hookRegex.exec(text)) !== null) {
    const hookType = match[1].trim()
    const hookText = match[2].trim()
    if (hookText) hooks.push({ type: hookType, text: hookText, score: 0 })
  }

  const productMatch = text.match(/PRODUCT:\s*([\s\S]+?)(?=SCORE\s+1:|$)/i)
  const productInsight = productMatch ? productMatch[1].trim() : ''

  // Parse scores and attach to hooks
  for (let i = 0; i < hooks.length; i++) {
    const scoreMatch = text.match(new RegExp(`SCORE\\s+${i + 1}:\\s*(\\d+)`, 'i'))
    if (scoreMatch) hooks[i].score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)))
  }

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

    // Parse product insight into type + pitch
    // Expected format: "[Product type]: [one-line pitch]"
    let productType = ''
    let productPitch = productInsight
    const colonIdx = productInsight.indexOf(':')
    if (colonIdx !== -1) {
      productType = productInsight.slice(0, colonIdx).trim()
      productPitch = productInsight.slice(colonIdx + 1).trim()
    }

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

    let savedHooks: { id: string; type: string; text: string; score: number }[] = hooks.map((h) => ({ id: '', ...h }))

    if (hookInserts.length > 0) {
      const { data } = await supabase.from('hooks').insert(hookInserts).select('id')
      if (data) {
        savedHooks = hooks.map((h, i) => ({ id: data[i]?.id ?? '', ...h }))
      }
    }

    // Fetch user for streak + total_generations update
    const { data: userData } = await supabase
      .from('users')
      .select('total_generations, last_generation_date, current_streak')
      .eq('email', email)
      .single()

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const last = userData?.last_generation_date ?? null
    const prevStreak = userData?.current_streak ?? 0
    const currentCount = userData?.total_generations ?? 0

    let newStreak = prevStreak
    if (last === null || last < getPreviousDay(today)) {
      // No history or gap > 1 day — reset
      newStreak = 1
    } else if (last === getPreviousDay(today)) {
      // Generated yesterday — extend streak
      newStreak = prevStreak + 1
    }
    // If last === today, streak stays the same (already generated today)

    await supabase
      .from('users')
      .update({
        total_generations: currentCount + 1,
        last_generation_date: today,
        current_streak: newStreak,
      })
      .eq('email', email)

    // Passively save product insight to vault (fire and forget)
    if (productPitch) {
      supabase.from('product_vault').insert({
        user_email: email,
        product_type: productType,
        pitch: productPitch,
        topic,
      }).then(() => {})
    }

    return NextResponse.json({ hooks: savedHooks, productInsight, streak: newStreak })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Generate error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
