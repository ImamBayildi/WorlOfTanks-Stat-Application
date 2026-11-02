"use client"

import { useState, useTransition } from "react"
import { MessageSquare, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/components/i18n-provider"
import { markFeedbackEmailed, submitFeedback, type FeedbackKind } from "@/app/feedback-actions"
import { cn } from "cn"

const KINDS: FeedbackKind[] = ["bug", "error", "suggestion"]
const FEEDBACK_EMAIL = "franoiws00@gmail.com"

// FormSubmit blocks server/datacenter IPs behind a Cloudflare challenge, so the keyless relay runs from the visitor's browser.
async function relayToInbox(kind: FeedbackKind, data: FormData) {
  const message = String(data.get("message") ?? "")
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `[Wotrate] ${kind}: ${message.slice(0, 60).replace(/\s+/g, " ")}`,
        _template: "box",
        _captcha: "false",
        type: kind,
        page: String(data.get("pageUrl") ?? "-"),
        contact: String(data.get("contact") ?? "") || "-",
        message,
      }),
    })
    const json = (await res.json().catch(() => null)) as { success?: string | boolean } | null
    return res.ok && (json?.success === true || json?.success === "true")
  } catch {
    return false
  }
}

export function FeedbackWidget() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<FeedbackKind>("bug")
  const [status, setStatus] = useState<"idle" | "sent" | "invalid" | "rateLimited" | "server">("idle")
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    data.set("kind", kind)
    data.set("pageUrl", window.location.href)
    startTransition(async () => {
      const result = await submitFeedback(data)
      if (result.ok) {
        if (result.id && !result.emailed) {
          const relayed = await relayToInbox(kind, data)
          if (relayed) await markFeedbackEmailed(result.id).catch(() => {})
        }
        form.reset()
        setStatus("sent")
      } else {
        setStatus(result.error)
      }
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setStatus("idle")
      }}
    >
      <PopoverTrigger
        aria-label={t.feedback.open}
        className="fixed right-4 bottom-4 z-40 flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground opacity-60 shadow-sm backdrop-blur transition-opacity hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-popup-open:opacity-100"
      >
        <MessageSquare className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={8} className="w-80 gap-3 p-4">
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
            <Check className="size-6 text-primary" aria-hidden="true" />
            <p className="font-medium">{t.feedback.thanks}</p>
            <p className="text-xs text-muted-foreground">{t.feedback.thanksDetail}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold">{t.feedback.title}</h2>
              <p className="text-xs text-muted-foreground">{t.feedback.subtitle}</p>
            </div>

            <div role="radiogroup" aria-label={t.feedback.kindLabel} className="flex gap-1 rounded-lg bg-muted p-1">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    kind === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.feedback.kinds[k]}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="feedback-message">
              {t.feedback.messageLabel}
            </label>
            <Textarea
              id="feedback-message"
              name="message"
              required
              minLength={5}
              maxLength={4000}
              rows={4}
              placeholder={t.feedback.messagePlaceholder}
              className="min-h-24 resize-none"
            />

            <label className="sr-only" htmlFor="feedback-contact">
              {t.feedback.contactLabel}
            </label>
            <Input
              id="feedback-contact"
              name="contact"
              maxLength={200}
              autoComplete="email"
              placeholder={t.feedback.contactPlaceholder}
            />

            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

            {status !== "idle" && (
              <p className="text-xs text-destructive" role="alert">
                {t.feedback.errors[status]}
              </p>
            )}

            <Button type="submit" size="sm" disabled={pending}>
              {pending ? t.feedback.sending : t.feedback.send}
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}
