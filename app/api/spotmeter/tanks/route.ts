import { NextResponse } from "next/server"
import { getTankList } from "@/lib/spotmeter/data"

export async function GET() {
  try {
    const tanks = await getTankList()
    return NextResponse.json({ tanks }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } })
  } catch (e) {
    console.error("[spotmeter] list failed", e)
    return NextResponse.json({ error: "Tank list unavailable" }, { status: 502 })
  }
}
