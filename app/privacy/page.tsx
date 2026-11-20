import type { Metadata } from "next"
import { getI18n } from "@/lib/i18n/server"

export const metadata: Metadata = { title: "Privacy & cookies", alternates: { canonical: "/privacy" } }

const copy = {
  tr: { title: "Gizlilik ve çerezler", paragraphs: [
    "Wotrate, herkese açık oyuncu istatistiklerini Wargaming üzerinden alır ve dönemsel karşılaştırmalar için veritabanında saklar. Dil tercihiniz tarayıcınızda bir çerezle tutulur. Site kullanımını anlamak için Vercel Analytics kullanılır.",
    "Geri bildirim formuyla gönderdiğiniz mesaj ve isteğe bağlı iletişim bilgileri bildiriminizi değerlendirmek için işlenir. Bağış ödemeleri Stripe tarafından işlenir.",
    "Reklamlar etkinleştirildiğinde Google AdSense kullanılır. Google ve diğer reklam sağlayıcıları; reklam göstermek, ölçmek ve tercihinize göre kişiselleştirmek için çerezler, IP adresi ve cihaz bilgileri kullanabilir. Kişiselleştirilmiş reklamlar bu siteye veya başka sitelere önceki ziyaretlerinize dayanabilir.",
    "Reklam izinlerinizi gösterilen Google gizlilik mesajından yönetebilirsiniz. Reklam kurulumu tamamlandığında izin tercihlerini tekrar açma seçeneği de sunulur. Google reklam tercihlerinizi aşağıdaki bağlantıdan ayrıca yönetebilirsiniz. Gizlilikle ilgili talepleriniz için sitedeki Geri bildirim düğmesini kullanabilirsiniz.",
  ], preferences: "Google reklam tercihleri", google: "Google verileri nasıl kullanır?" },
  en: { title: "Privacy and cookies", paragraphs: [
    "Wotrate retrieves public player statistics from Wargaming and stores them for period comparisons. A browser cookie remembers your language preference. We use Vercel Analytics to understand site usage.",
    "Feedback messages and optional contact details are processed to review your report. Donation payments are processed by Stripe.",
    "When advertising is enabled, we use Google AdSense. Google and other advertising providers may use cookies, IP addresses and device information to deliver, measure and, depending on your choices, personalize ads. Personalized ads may be based on previous visits to this or other websites.",
    "You can manage advertising consent in the Google privacy message shown to you. Once advertising setup is complete, an option to reopen consent preferences will also be provided. You can additionally manage Google ad preferences using the link below. Use the site's Feedback button for privacy requests.",
  ], preferences: "Google ad preferences", google: "How Google uses information" },
  ru: { title: "Конфиденциальность и cookie", paragraphs: [
    "Wotrate получает публичную статистику игроков из Wargaming и сохраняет её для сравнения периодов. Cookie хранит выбранный язык. Для анализа посещений используется Vercel Analytics.",
    "Сообщения обратной связи и необязательные контактные данные обрабатываются для рассмотрения обращения. Платежи пожертвований обрабатывает Stripe.",
    "При включении рекламы используется Google AdSense. Google и другие рекламные поставщики могут использовать cookie, IP-адрес и сведения об устройстве для показа, измерения и, в зависимости от вашего выбора, персонализации рекламы на основе предыдущих посещений этого или других сайтов.",
    "Согласие на рекламу можно настроить в сообщении Google. После завершения настройки рекламы будет доступно повторное открытие настроек согласия. Рекламные предпочтения Google также доступны по ссылке ниже. По вопросам конфиденциальности используйте кнопку обратной связи.",
  ], preferences: "Настройки рекламы Google", google: "Как Google использует данные" },
}

export default async function PrivacyPage() {
  const { locale } = await getI18n()
  const c = copy[locale]
  return <main className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="mb-6 text-3xl font-semibold">{c.title}</h1>
    <div className="space-y-5 text-sm leading-7 text-muted-foreground">{c.paragraphs.map(p => <p key={p}>{p}</p>)}</div>
    <div className="mt-6 flex flex-wrap gap-5 text-sm text-primary">
      <a href="https://myadcenter.google.com/" className="underline">{c.preferences}</a>
      <a href="https://policies.google.com/technologies/partner-sites" className="underline">{c.google}</a>
    </div>
  </main>
}
