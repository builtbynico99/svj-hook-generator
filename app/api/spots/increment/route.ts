import { NextResponse } from 'next/server'

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const key = serviceKey || anonKey

  console.log('[increment] url:', url ? 'set' : 'MISSING', 'serviceKey:', serviceKey ? 'set' : 'MISSING')

  // Get the latest row
  const getRes = await fetch(
    `${url}/rest/v1/weekly_spots?select=week_start,spots_taken&order=week_start.desc&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    }
  )

  const rows = await getRes.json()
  console.log('[increment] rows:', JSON.stringify(rows))

  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: false, error: 'No row found' })
  }

  const row = rows[0]
  const newCount = (row.spots_taken ?? 0) + 1

  const patchRes = await fetch(
    `${url}/rest/v1/weekly_spots?week_start=eq.${row.week_start}`,
    {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ spots_taken: newCount }),
    }
  )

  const patchResult = await patchRes.json()
  console.log('[increment] patch status:', patchRes.status, 'result:', JSON.stringify(patchResult))

  return NextResponse.json({ success: patchRes.ok, status: patchRes.status })
}
