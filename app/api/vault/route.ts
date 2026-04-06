import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('product_vault')
    .select('id, product_type, pitch, topic, created_at')
    .eq('user_email', email)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ items: [] })
  return NextResponse.json({ items: data })
}

export async function POST(req: NextRequest) {
  try {
    const { email, productType, pitch, topic } = await req.json()
    if (!email || !pitch) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = getSupabase()
    await supabase.from('product_vault').insert({
      user_email: email,
      product_type: productType ?? '',
      pitch,
      topic: topic ?? '',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  }
}
