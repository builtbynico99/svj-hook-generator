import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabase } from '@/lib/supabase'
import { getCreatorPrompt, getStreamerPrompt } from '@/lib/prompts'
import { getEmailLimiter, getIpLimiter, getClientIp, EMAIL_REGEX } from '@/lib/ratelimit'

const DAILY_LIMIT = 10
const COOLDOWN_SECONDS = 8

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

  for (let i = 0; i < hooks.length; i++) {
    const scoreMatch = text.match(new RegExp(`SCORE\\s+${i + 1}:\\s*(\\d+)`, 'i'))
    if (scoreMatch) hooks[i].score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)))
  }

  return { hooks, productInsight }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, platform, niche, style, mode, email } = body

    // ── Layer 3: Email format validation ─────────────────────────────────────
    if (!topic || !platform || !niche || !style || !mode || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'unauthorized', message: 'Invalid email format.' }, { status: 401 })
    }

    const supabase = getSupabase()
    const ip = getClientIp(req)

    // ── Layer 1: Upstash email rate limit (10/24h) ────────────────────────────
    const emailLimiter = getEmailLimiter()
    if (emailLimiter) {
      const { success } = await emailLimiter.limit(`email:${email}`)
      if (!success) {
        return NextResponse.json({
          error: 'limit_reached',
          message: 'You have reached your daily limit of 10 generations. Come back tomorrow.',
        }, { status: 429 })
      }
    }

    // ── Layer 2: Upstash IP rate limit (20/24h) ───────────────────────────────
    const ipLimiter = getIpLimiter()
    if (ipLimiter) {
      const { success } = await ipLimiter.limit(`ip:${ip}`)
      if (!success) {
        return NextResponse.json({
          error: 'limit_reached',
          message: 'You have reached your daily limit of 10 generations. Come back tomorrow.',
        }, { status: 429 })
      }
    }

    // ── Layer 3: Verify email exists in Supabase ──────────────────────────────
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('total_generations, last_generation_date, current_streak, daily_generations, last_reset_date, last_generation_time')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        error: 'unauthorized',
        message: 'Please sign up to use the generator.',
      }, { status: 401 })
    }

    // ── Layer 7: Server-side cooldown (8 seconds) ─────────────────────────────
    if (userData.last_generation_time) {
      const lastTime = new Date(userData.last_generation_time).getTime()
      const elapsed = (Date.now() - lastTime) / 1000
      if (elapsed < COOLDOWN_SECONDS) {
        return NextResponse.json({
          error: 'too_fast',
          message: 'Slow down.',
        }, { status: 429 })
      }
    }

    // ── Layer 4: Supabase daily cap ───────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10)
    let dailyCount = userData.daily_generations ?? 0

    if (userData.last_reset_date !== today) {
      // New day — reset counter
      dailyCount = 0
    }

    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json({
        error: 'limit_reached',
        message: 'You have reached your daily limit of 10 generations. Come back tomorrow.',
      }, { status: 429 })
    }

    // ── Fetch top-rated hooks to use as few-shot examples ────────────────────
    const { data: topHooks } = await supabase
      .from('hooks')
      .select('hook_text')
      .eq('platform', platform)
      .eq('niche', niche)
      .eq('mode', mode)
      .eq('rating', 1)
      .order('created_at', { ascending: false })
      .limit(5)

    const examples = topHooks?.map((h: { hook_text: string }) => h.hook_text) ?? []

    // ── Call Anthropic ────────────────────────────────────────────────────────
    const systemPrompt =
      mode === 'streamer'
        ? getStreamerPrompt(platform, niche, style, examples)
        : getCreatorPrompt(platform, niche, style, examples)

    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const { hooks, productInsight } = parseResponse(rawText)

    // Parse product insight
    let productType = ''
    let productPitch = productInsight
    const colonIdx = productInsight.indexOf(':')
    if (colonIdx !== -1) {
      productType = productInsight.slice(0, colonIdx).trim()
      productPitch = productInsight.slice(colonIdx + 1).trim()
    }

    // Save hooks
    const hookInserts = hooks.map((h) => ({
      user_email: email,
      hook_text: h.text,
      platform,
      niche,
      style,
      topic,
      mode,
    }))

    let savedHooks: { id: string; type: string; text: string; score: number }[] = hooks.map((h) => ({ id: '', ...h }))

    if (hookInserts.length > 0) {
      const { data } = await supabase.from('hooks').insert(hookInserts).select('id')
      if (data) savedHooks = hooks.map((h, i) => ({ id: data[i]?.id ?? '', ...h }))
    }

    // ── Update user record ────────────────────────────────────────────────────
    const last = userData.last_generation_date ?? null
    const prevStreak = userData.current_streak ?? 0
    const currentCount = userData.total_generations ?? 0
    const newDailyCount = dailyCount + 1
    const nowIso = new Date().toISOString()

    let newStreak = prevStreak
    if (last === null || last < getPreviousDay(today)) {
      newStreak = 1
    } else if (last === getPreviousDay(today)) {
      newStreak = prevStreak + 1
    }

    await supabase.from('users').update({
      total_generations: currentCount + 1,
      last_generation_date: today,
      current_streak: newStreak,
      daily_generations: newDailyCount,
      last_reset_date: today,
      last_generation_time: nowIso,
    }).eq('email', email)

    // Passively save product insight to vault
    if (productPitch) {
      supabase.from('product_vault').insert({
        user_email: email,
        product_type: productType,
        pitch: productPitch,
        topic,
      }).then(() => {})
    }

    return NextResponse.json({
      hooks: savedHooks,
      productInsight,
      streak: newStreak,
      dailyGenerations: newDailyCount,
      dailyLimit: DAILY_LIMIT,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Generate error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
