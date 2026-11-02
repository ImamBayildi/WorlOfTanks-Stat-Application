"use server"

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { pool } from "@/lib/db"

const FEEDBACK_EMAIL = "franoiws00@gmail.com"
const KINDS = ["bug", "error", "suggestion"] as const
const MAX_PER_WINDOW = 5
const WINDOW_MINUTES = 10

export type FeedbackKind = (typeof KINDS)[number]
export type FeedbackResult =
  | { ok: true; id?: string; emailed?: boolean }
  | { ok: false; error: "invalid" | "rateLimited" | "server" }

let tableReady: Promise<unknown> | null = null
function ensureTable() {
  tableReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id bigserial PRIMARY KEY,
      kind text NOT NULL,
      message text NOT NULL,
      contact text,
      page_url text,
      user_agent text,
      ip_hash text,
      emailed boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS feedback_ip_created_idx ON feedback (ip_hash, created_at);
  `)
  return tableReady
}

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

async function sendEmail(data: { kind: string; message: string; contact: string; pageUrl: string }) {
  const subject = `[Wotrate] ${data.kind}: ${data.message.slice(0, 60).replace(/\s+/g, " ")}`
  const text = [
    `Tür: ${data.kind}`,
    `Sayfa: ${data.pageUrl || "-"}`,
    `İletişim: ${data.contact || "-"}`,
    "",
    data.message,
  ].join("\n")

  if (!process.env.RESEND_API_KEY) return false
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FEEDBACK_FROM_EMAIL ?? "Wotrate <onboarding@resend.dev>",
      to: [FEEDBACK_EMAIL],
      reply_to: data.contact.includes("@") ? data.contact : undefined,
      subject,
      text,
    }),
  })
  return res.ok
}

export async function markFeedbackEmailed(id: string) {
  if (!/^\d+$/.test(id)) return
  await pool.query(`UPDATE feedback SET emailed = true WHERE id = $1 AND created_at > now() - interval '5 minutes'`, [id])
}

export async function submitFeedback(formData: FormData): Promise<FeedbackResult> {
  if (clean(formData.get("website"), 200)) return { ok: true }

  const kind = clean(formData.get("kind"), 20) as FeedbackKind
  const message = clean(formData.get("message"), 4000)
  const contact = clean(formData.get("contact"), 200)
  const pageUrl = clean(formData.get("pageUrl"), 500)
  if (!KINDS.includes(kind) || message.length < 5) return { ok: false, error: "invalid" }

  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32)

  try {
    await ensureTable()
    const recent = await pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM feedback WHERE ip_hash = $1 AND created_at > now() - make_interval(mins => $2)`,
      [ipHash, WINDOW_MINUTES],
    )
    if ((recent.rows[0]?.n ?? 0) >= MAX_PER_WINDOW) return { ok: false, error: "rateLimited" }

    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO feedback (kind, message, contact, page_url, user_agent, ip_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [kind, message, contact || null, pageUrl || null, h.get("user-agent")?.slice(0, 300) ?? null, ipHash],
    )

    const id = String(inserted.rows[0].id)
    const emailed = await sendEmail({ kind, message, contact, pageUrl }).catch(() => false)
    if (emailed) await markFeedbackEmailed(id)
    return { ok: true, id, emailed }
  } catch (error) {
    console.error("[feedback] submit failed", error)
    return { ok: false, error: "server" }
  }
}
