import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, website, signup_source } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Honeypot check — bots fill this, real users don't
  if (website) {
    return NextResponse.json({ success: true })
  }

  const apiSecret = process.env.CONVERTKIT_API_SECRET
  const tagId = process.env.CONVERTKIT_TAG_ID

  console.log(`[subscribe] email=${email} tagId=${tagId} apiSecret=${apiSecret ? 'set' : 'MISSING'}`)

  // Step 1: Create subscriber
  const subResponse = await fetch('https://api.convertkit.com/v3/subscribers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_secret: apiSecret, email }),
  })

  const subData = await subResponse.json()

  if (!subResponse.ok) {
    console.error('[subscribe] subscriber creation failed:', JSON.stringify(subData))
  } else {
    console.log('[subscribe] subscriber created:', subData?.subscriber?.id)
  }

  // Step 2: Apply tag regardless (tag endpoint also creates subscriber if missing)
  const tagResponse = await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_secret: apiSecret, email }),
  })

  const tagData = await tagResponse.json()

  if (!tagResponse.ok) {
    console.error('[subscribe] tag apply failed:', JSON.stringify(tagData))
  } else {
    console.log('[subscribe] tag applied successfully — subscriber id:', tagData?.subscription?.subscriber?.id)
  }

  // Step 3: Upsert user into Supabase
  const supabase = getSupabase()
  const { error } = await supabase.from('users').upsert(
    { email, convertkit_tagged: true, signup_source: signup_source || 'direct' },
    { onConflict: 'email' }
  )

  if (error) {
    console.error('[subscribe] Supabase upsert error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
