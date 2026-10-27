import Link from "next/link"
import { Trophy } from "lucide-react"
import { tintStyle } from "@/components/stat-tile"
import { getI18n } from "@/lib/i18n/server"
import { getRatingColor, type SCALES } from "@/lib/ratings"
import type { LeaderboardRow, LeaderboardSort } from "@/lib/types"
import { cn } from "@/lib/utils"

const REGION_SHORT = { eu: "EU", com: "NA", asia: "ASIA" } as const
const MEDALS = ["#f5c451", "#c8ccd4", "#d08a4f"]

function Pill({ scale, value, text, active }: { scale: keyof typeof SCALES; value: number | null; text: string; active: boolean }) {
  const color = getRatingColor(scale, value)
  return (
    <span
      className={cn(
        "inline-flex min-w-16 justify-center rounded-md border px-2 py-1 font-mono text-sm font-semibold tabular-nums",
        !color && "border-transparent text-muted-foreground",
        active && "ring-1 ring-foreground/20",
      )}
      style={color ? { ...tintStyle(color, active ? 20 : 12), color } : undefined}
    >
      {text}
    </span>
  )
}

export async function LeaderboardTable({ rows, sort, caption }: { rows: LeaderboardRow[]; sort: LeaderboardSort; caption: string }) {
  const { t, f } = await getI18n()
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <Trophy className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">{t.leaderboard.emptyTitle}</p>
        <p className="max-w-md text-sm text-muted-foreground">{t.leaderboard.emptyText}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="border-b border-border px-5 py-3 text-left text-xs text-muted-foreground">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="w-14 px-5 py-3 text-left font-medium">#</th>
              <th scope="col" className="px-3 py-3 text-left font-medium">{t.common.player}</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">{t.common.battles}</th>
              <th scope="col" className="px-3 py-3 text-center font-medium">{t.common.winRate}</th>
              <th scope="col" className="hidden px-3 py-3 text-right font-medium md:table-cell">{t.common.avgDamage}</th>
              <th scope="col" className="px-3 py-3 text-center font-medium">WN8</th>
              <th scope="col" className="px-3 py-3 text-center font-medium">WNX</th>
              <th scope="col" className="hidden px-5 py-3 text-center font-medium lg:table-cell">{t.ratings.wg}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.region}-${r.accountId}`} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <td className="px-5 py-2.5">
                  <span
                    className="inline-flex size-7 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums"
                    style={i < 3 ? { ...tintStyle(MEDALS[i], 22), color: MEDALS[i] } : undefined}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/player/${r.region}/${r.accountId}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    <span className="truncate">{r.nickname}</span>
                    {r.clanTag && <span className="text-xs text-muted-foreground">{`[${r.clanTag}]`}</span>}
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {REGION_SHORT[r.region]}
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{f.int(r.battles)}</td>
                <td className="px-3 py-2.5 text-center">
                  <Pill scale="winRate" value={r.winRate} text={f.pct(r.winRate)} active={sort === "winRate"} />
                </td>
                <td className="hidden px-3 py-2.5 text-right font-mono tabular-nums md:table-cell">{f.int(r.avgDamage)}</td>
                <td className="px-3 py-2.5 text-center">
                  <Pill scale="wn8" value={r.wn8} text={f.int(r.wn8)} active={sort === "wn8"} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Pill scale="wnx" value={r.wnx} text={f.int(r.wnx)} active={sort === "wnx"} />
                </td>
                <td className="hidden px-5 py-2.5 text-center lg:table-cell">
                  <Pill scale="wg" value={r.wg} text={f.int(r.wg)} active={sort === "wg"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
