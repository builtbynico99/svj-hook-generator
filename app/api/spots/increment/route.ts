import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST() {
  const supabase = getSupabase()

  // Find the most recent week row rather than computing Monday
  const { data: row, error: fetchError } = await supabase
    .from('weekly_spots')
    .select('week_start, spots_taken')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !row) {
    console.error('[increment] no row found:', fetchError)
    return NextResponse.json({ success: false, error: 'No spots row found' })
  }

  console.log('[increment] found row:', row.week_start, 'spots_taken:', row.spots_taken)

  const newCount = (row.spots_taken ?? 0) + 1
  const { error: updateError } = await supabase
    .from('weekly_spots')
    .update({ spots_taken: newCount })
    .eq('week_start', row.week_start)

  if (updateError) {
    console.error('[increment] update error:', updateError)
  } else {
    console.log('[increment] updated to:', newCount)
  }

  return NextResponse.json({ success: true })
}
