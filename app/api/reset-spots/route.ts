import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function getMondayUTC(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  // Vercel cron authenticates with CRON_SECRET header — skip check in dev
  const authHeader = req.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const weekStart = getMondayUTC()

  // Insert new week row (ignore conflict if already exists)
  const { error: insertError } = await supabase
    .from('weekly_spots')
    .upsert({ week_start: weekStart, spots_taken: 0, spots_limit: 20 }, { onConflict: 'week_start' })

  if (insertError) {
    console.error('[reset-spots] insert error:', insertError)
  } else {
    console.log('[reset-spots] new week row created for', weekStart)
  }

  // Notify waitlist — pull all unnotified emails
  const { data: waitlist, error: waitlistError } = await supabase
    .from('waitlist')
    .select('id, email')
    .eq('notified', false)

  if (waitlistError) {
    console.error('[reset-spots] waitlist fetch error:', waitlistError)
    return NextResponse.json({ success: true, notified: 0 })
  }

  if (!waitlist || waitlist.length === 0) {
    console.log('[reset-spots] no waitlist emails to notify')
    return NextResponse.json({ success: true, notified: 0 })
  }

  const apiSecret = process.env.CONVERTKIT_API_SECRET
  const spotsOpenTagId = process.env.CONVERTKIT_SPOTS_OPEN_TAG_ID

  let notified = 0
  const notifiedIds: string[] = []

  for (const entry of waitlist) {
    try {
      const res = await fetch(`https://api.convertkit.com/v3/tags/${spotsOpenTagId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_secret: apiSecret, email: entry.email }),
      })
      if (res.ok) {
        notifiedIds.push(entry.id)
        notified++
        console.log('[reset-spots] notified:', entry.email)
      } else {
        const err = await res.text()
        console.error('[reset-spots] CK tag failed for', entry.email, err)
      }
    } catch (e) {
      console.error('[reset-spots] error notifying', entry.email, e)
    }
  }

  // Mark as notified
  if (notifiedIds.length > 0) {
    await supabase.from('waitlist').update({ notified: true }).in('id', notifiedIds)
  }

  return NextResponse.json({ success: true, notified })
}
