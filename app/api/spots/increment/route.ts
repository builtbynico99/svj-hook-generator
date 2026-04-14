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

  // Get current row
  const { data, error: fetchError } = await supabase
    .from('weekly_spots')
    .select('spots_taken')
    .eq('week_start', weekStart)
    .single()

  if (fetchError || !data) {
    // Row doesn't exist — create it with spots_taken = 1
    const { error: insertError } = await supabase
      .from('weekly_spots')
      .insert({ week_start: weekStart, spots_taken: 1, spots_limit: 20 })
    if (insertError) console.error('[increment] insert error:', insertError)
    else console.log('[increment] created row with spots_taken=1')
    return NextResponse.json({ success: true })
  }

  // Row exists — increment
  const newCount = (data.spots_taken ?? 0) + 1
  const { error: updateError } = await supabase
    .from('weekly_spots')
    .update({ spots_taken: newCount })
    .eq('week_start', weekStart)

  if (updateError) console.error('[increment] update error:', updateError)
  else console.log('[increment] spots_taken updated to:', newCount)

  return NextResponse.json({ success: true })
}
