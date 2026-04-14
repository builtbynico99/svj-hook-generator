import { NextResponse } from 'next/server'

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const getRes = await fetch(
    `${url}/rest/v1/weekly_spots?select=week_start,spots_taken&order=week_start.desc&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const rows = await getRes.json()
  if (!rows?.length) return NextResponse.json({ success: false })

  const row = rows[0]
  const newCount = (row.spots_taken ?? 0) + 1

  await fetch(`${url}/rest/v1/weekly_spots?week_start=eq.${row.week_start}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ spots_taken: newCount }),
  })

  return NextResponse.json({ success: true })
}
