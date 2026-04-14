import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const apiSecret = process.env.CONVERTKIT_API_SECRET
  const waitlistTagId = process.env.CONVERTKIT_WAITLIST_TAG_ID

  // Add to ConvertKit with waitlist tag
  const ckRes = await fetch(`https://api.convertkit.com/v3/tags/${waitlistTagId}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_secret: apiSecret, email }),
  })

  if (!ckRes.ok) {
    const err = await ckRes.text()
    console.error('[waitlist] CK error:', err)
  } else {
    console.log('[waitlist] added to ConvertKit with waitlist tag:', email)
  }

  // Add to Supabase waitlist table
  const supabase = getSupabase()
  const { error } = await supabase
    .from('waitlist')
    .upsert({ email }, { onConflict: 'email' })

  if (error) {
    console.error('[waitlist] supabase error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
