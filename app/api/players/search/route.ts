import { NextResponse, type NextRequest } from "next/server"
import { parseRegion, searchPlayers, WargamingError } from "@/lib/wargaming"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = (params.get("q") ?? "").trim()
  const region = parseRegion(params.get("region"))

  if (query.length < 3 || query.length > 24 || !/^[\w-]+$/.test(query)) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchPlayers(region, query)
    return NextResponse.json({ results })
  } catch (e) {
    const message = e instanceof WargamingError ? e.message : "Arama sırasında bir hata oluştu."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
