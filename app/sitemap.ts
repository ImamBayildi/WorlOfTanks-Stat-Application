import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = "https://wotrate.com"
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/reytingler`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/spotmeter`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/donate`, changeFrequency: "monthly", priority: 0.3 },
  ]
}
