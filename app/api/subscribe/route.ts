import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const apiKey = process.env.CONVERTKIT_API_KEY
  const formId = process.env.CONVERTKIT_FORM_ID

  // Subscribe to ConvertKit form
  const ckResponse = await fetch(
    `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, email }),
    }
  )

  if (!ckResponse.ok) {
    const err = await ckResponse.text()
    console.error('ConvertKit subscribe error:', err)
  } else {
    // Tag the subscriber as hook-generator-lead
    const ckData = await ckResponse.json()
    const subscriberId = ckData?.subscription?.subscriber?.id

    if (subscriberId) {
      // Get or create the tag
      const tagsRes = await fetch(
        `https://api.convertkit.com/v3/tags?api_key=${apiKey}`
      )
      const tagsData = await tagsRes.json()
      let tag = tagsData?.tags?.find(
        (t: { name: string }) => t.name === 'hook-generator-lead'
      )

      if (!tag) {
        const createTagRes = await fetch(
          `https://api.convertkit.com/v3/tags`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, tag: { name: 'hook-generator-lead' } }),
          }
        )
        const createTagData = await createTagRes.json()
        tag = createTagData?.tag
      }

      if (tag?.id) {
        await fetch(`https://api.convertkit.com/v3/tags/${tag.id}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey, email }),
        })
      }
    }
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
