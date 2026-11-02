import { bigint, bigserial, date, doublePrecision, integer, jsonb, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core"

export type CompactTank = [
  tankId: number,
  battles: number,
  wins: number,
  damage: number,
  frags: number,
  spots: number,
  def: number,
  assist: number,
]

export const players = pgTable(
  "players",
  {
    region: text("region").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    nickname: text("nickname").notNull(),
    clanTag: text("clan_tag"),
    battles: integer("battles").notNull().default(0),
    winRate: real("win_rate"),
    avgDamage: real("avg_damage"),
    wn8: integer("wn8"),
    wnx: integer("wnx"),
    wg: integer("wg"),
    weekBattles: integer("week_battles").notNull().default(0),
    weekWinRate: real("week_win_rate"),
    weekAvgDamage: real("week_avg_damage"),
    weekWn8: integer("week_wn8"),
    weekWnx: integer("week_wnx"),
    monthBattles: integer("month_battles").notNull().default(0),
    monthWinRate: real("month_win_rate"),
    monthAvgDamage: real("month_avg_damage"),
    monthWn8: integer("month_wn8"),
    monthWnx: integer("month_wnx"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.region, t.accountId] })],
)

/** One row per player per UTC day with cumulative totals (see lib/aggregate.ts). Filled by the crawler and page views. */
export const accountSnapshots = pgTable(
  "account_snapshots",
  {
    region: text("region").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    day: date("day", { mode: "string" }).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    agg: doublePrecision("agg").array().notNull(),
  },
  (t) => [primaryKey({ columns: [t.region, t.accountId, t.day] })],
)

/** Every active account the crawler knows about, whether or not it was ever searched on the site. */
export const crawlAccounts = pgTable(
  "crawl_accounts",
  {
    region: text("region").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    nickname: text("nickname").notNull(),
    battles: integer("battles").notNull().default(-1),
    lastBattleAt: timestamp("last_battle_at", { withTimezone: true }),
    nextCheckAt: timestamp("next_check_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.region, t.accountId] })],
)

export const crawlState = pgTable("crawl_state", {
  key: text("key").primaryKey(),
  cursor: bigint("cursor", { mode: "number" }).notNull(),
  emptyStreak: integer("empty_streak").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const playerSnapshots = pgTable("player_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  region: text("region").notNull(),
  accountId: bigint("account_id", { mode: "number" }).notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  battles: integer("battles").notNull(),
  tanks: jsonb("tanks").$type<CompactTank[]>().notNull(),
})
