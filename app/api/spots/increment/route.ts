import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function getMondayUTC(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function POST() {
  const supabase = getSupabase()
  const weekStart = getMondayUTC()

  // Ensure row exists
  await supabase
    .from('weekly_spots')
    .upsert({ week_start: weekStart, spots_taken: 0, spots_limit: 20 }, { onConflict: 'week_start' })

  // Read current value then increment
  const { data } = await supabase
    .from('weekly_spots')
    .select('spots_taken')
    .eq('week_start', weekStart)
    .single()

  if (data) {
    await supabase
      .from('weekly_spots')
      .update({ spots_taken: (data.spots_taken ?? 0) + 1 })
      .eq('week_start', weekStart)
  }

  return NextResponse.json({ success: true })
}
