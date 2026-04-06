import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .select('total_generations, is_streamer, current_streak, created_at')
    .eq('email', email)
    .single()

  if (error) return NextResponse.json({ total_generations: 0 })

  return NextResponse.json(data)
}
