import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getMondayUTC(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function GET() {
  const supabase = getSupabase()
  const weekStart = getMondayUTC()

  // Get or create this week's row
  let { data, error } = await supabase
    .from('weekly_spots')
    .select('spots_taken, spots_limit')
    .eq('week_start', weekStart)
    .single()

  if (error || !data) {
    // Row doesn't exist yet — insert it
    const { data: inserted, error: insertError } = await supabase
      .from('weekly_spots')
      .insert({ week_start: weekStart, spots_taken: 0, spots_limit: 20 })
      .select('spots_taken, spots_limit')
      .single()

    if (insertError) {
      console.error('[spots] insert error:', insertError)
      return NextResponse.json({ spots_taken: 0, spots_limit: 20, spots_remaining: 20 })
    }
    data = inserted
  }

  const spots_remaining = Math.max(0, (data.spots_limit ?? 20) - (data.spots_taken ?? 0))
  return NextResponse.json(
    { spots_taken: data.spots_taken, spots_limit: data.spots_limit, spots_remaining },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}
