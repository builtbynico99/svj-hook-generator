import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, website } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Honeypot check — bots fill this, real users don't
  if (website) {
    return NextResponse.json({ success: true })
  }

  const apiSecret = process.env.CONVERTKIT_API_SECRET
  const tagId = process.env.CONVERTKIT_TAG_ID

  // Add directly as confirmed subscriber with tag — no confirmation email
  const ckResponse = await fetch('https://api.convertkit.com/v3/subscribers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_secret: apiSecret,
      email,
      tags: tagId ? [tagId] : [],
    }),
  })

  if (!ckResponse.ok) {
    const err = await ckResponse.text()
    console.error('ConvertKit subscribe error:', err)
  }

  // Upsert user into Supabase
  const supabase = getSupabase()
  const { error } = await supabase.from('users').upsert(
    { email, convertkit_tagged: true },
    { onConflict: 'email' }
  )

  if (error) {
    console.error('Supabase upsert error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
