import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/client/", "/api/"],
      },
      // Explicitly allow AI crawlers
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Google-Extended", "Claude-Web", "PerplexityBot", "Applebot-Extended"],
        allow: ["/", "/blog/"],
        disallow: ["/admin/", "/client/", "/api/"],
      },
    ],
    sitemap: "https://djpathlete.com/sitemap.xml",
  }
}
