import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  // Use service role key to guarantee write permissions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

  const newCount = (row.spots_taken ?? 0) + 1
  const { error: updateError } = await supabase
    .from('weekly_spots')
    .update({ spots_taken: newCount })
    .eq('week_start', row.week_start)

  if (updateError) {
    console.error('[increment] update error:', updateError)
    return NextResponse.json({ success: false })
  }

  console.log('[increment] spots_taken updated to:', newCount, 'for week:', row.week_start)
  return NextResponse.json({ success: true })
}
