import { RATING_KEYS, RATING_LABELS, SCALES } from "@/lib/ratings"
import { getI18n } from "@/lib/i18n/server"

export async function RatingLegend() {
  const { t, f } = await getI18n()
  return (
    <section id="reytingler" aria-labelledby="reytingler-baslik" className="scroll-mt-20 py-8">
      <h2 id="reytingler-baslik" className="text-lg font-semibold tracking-tight">
        {t.ratings.scalesTitle}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {RATING_KEYS.map((key) => {
          const scale = SCALES[key]
          return (
            <article key={key} className="flex flex-col rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">{key === "wg" ? t.ratings.wg : RATING_LABELS[key]}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.ratings.descriptions[key]}</p>
              <div className="mt-5 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
                {scale.map((s) => (
                  <span key={s.level} className="flex-1" style={{ backgroundColor: s.color }} />
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {scale.map((s, i) => {
                  const min = i === 0 ? 0 : scale[i - 1].max
                  return (
                    <li key={s.level} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {t.ratings.skill[s.level]}
                      </span>
                      <span className="font-mono text-muted-foreground tabular-nums">{`${f.int(min)}+`}</span>
                    </li>
                  )
                })}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}
