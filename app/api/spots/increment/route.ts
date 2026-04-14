import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getMondayUTC(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function POST() {
  // Use service role key for atomic update
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const weekStart = getMondayUTC()

  // Ensure row exists
  await supabase
    .from('weekly_spots')
    .upsert({ week_start: weekStart, spots_taken: 0, spots_limit: 20 }, { onConflict: 'week_start' })

  // Read then increment (simple and reliable)
  const { data } = await supabase
    .from('weekly_spots')
    .select('spots_taken')
    .eq('week_start', weekStart)
    .single()

  if (data !== null) {
    const { error } = await supabase
      .from('weekly_spots')
      .update({ spots_taken: (data.spots_taken ?? 0) + 1 })
      .eq('week_start', weekStart)

    if (error) console.error('[increment] update error:', error)
    else console.log('[increment] spots_taken now:', (data.spots_taken ?? 0) + 1)
  }

  return NextResponse.json({ success: true })
}
