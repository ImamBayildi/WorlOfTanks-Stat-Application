import { ADSENSE_PUBLISHER_ID } from "@/lib/adsense"

export function GET() {
  const publisher = ADSENSE_PUBLISHER_ID
  if (!/^ca-pub-\d{16}$/.test(publisher)) return new Response("", { status: 404 })
  return new Response(`google.com, ${publisher.slice(3)}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
