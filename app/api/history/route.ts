import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('hooks')
    .select('hook_text, platform, niche, created_at')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ hooks: [] })

  return NextResponse.json({ hooks: data })
}
