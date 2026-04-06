import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { hookId, rating } = await req.json()

    if (!hookId || (rating !== 1 && rating !== -1)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('hooks')
      .update({ rating })
      .eq('id', hookId)

    if (error) {
      console.error('Feedback error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  }
}
