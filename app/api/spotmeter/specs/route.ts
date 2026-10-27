import { NextResponse, type NextRequest } from "next/server"
import { getTankSpec } from "@/lib/spotmeter/data"

const MAX_TANKS = 16

export async function GET(req: NextRequest) {
  const slugs = [...new Set((req.nextUrl.searchParams.get("slugs") ?? "").split(",").filter(Boolean))].slice(0, MAX_TANKS)
  if (!slugs.length) return NextResponse.json({ specs: {} })
  try {
    const entries = await Promise.all(slugs.map(async (s) => [s, await getTankSpec(s)] as const))
    const specs = Object.fromEntries(entries.filter(([, v]) => v))
    return NextResponse.json({ specs }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } })
  } catch (e) {
    console.error("[spotmeter] specs failed", e)
    return NextResponse.json({ error: "Tank data unavailable" }, { status: 502 })
  }
}
