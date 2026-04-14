import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getMondayUTC(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Get the most recent week row
  const res = await fetch(
    `${url}/rest/v1/weekly_spots?select=week_start,spots_taken,spots_limit&order=week_start.desc&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    }
  )

  const rows = await res.json()

  if (!rows?.length) {
    // No row yet — insert one and return full availability
    const weekStart = getMondayUTC()
    await fetch(`${url}/rest/v1/weekly_spots`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ week_start: weekStart, spots_taken: 0, spots_limit: 20 }),
    })
    return NextResponse.json(
      { spots_taken: 0, spots_limit: 20, spots_remaining: 20 },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const row = rows[0]
  const spots_remaining = Math.max(0, (row.spots_limit ?? 20) - (row.spots_taken ?? 0))

  return NextResponse.json(
    { spots_taken: row.spots_taken, spots_limit: row.spots_limit, spots_remaining },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
