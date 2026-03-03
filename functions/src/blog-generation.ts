import { getFirestore, FieldValue } from "firebase-admin/firestore"
import { z } from "zod"
import { callAgent, MODEL_SONNET } from "./ai/anthropic.js"
import { getSupabase } from "./lib/supabase.js"

// ─── System Prompt ───────────────────────────────────────────────────────────

const BLOG_GENERATION_PROMPT = `You are an expert content writer for DJP Athlete, a fitness coaching platform run by Darren Paul, a strength & conditioning coach with 20+ years of experience working with athletes at every level.

Your writing style:
- Professional but approachable — you're a real coach sharing real expertise
- Evidence-based — reference training principles, sports science concepts
- Practical — give readers actionable takeaways they can use immediately
- Engaging — use clear structure with headings, short paragraphs, and varied formatting
- No fluff, no fads — just what works

Sources and references (MANDATORY):
- You MUST include inline hyperlinks using <a href="..."> tags to real, specific articles or pages that support your claims
- NEVER link to homepages (e.g., nsca.com) or search result pages (e.g., pubmed.ncbi.nlm.nih.gov/?term=...)
- ONLY link to a specific article, position statement, guideline, fact sheet, or publication page — the URL should point to ONE piece of content about a specific topic
- Use DOI links for research papers when you know the DOI (e.g., https://doi.org/10.1519/JSC.0000000000000XXX) — DOI links are permanent and never break
- You MUST include at least 3-4 inline source references per post, placed naturally where claims are made
- ALWAYS include a "References" or "Further Reading" section at the end listing the specific articles/pages cited with their full titles as link text
- The link text should describe what the source actually says, not just the organization name
- IMPORTANT: All URLs will be automatically validated after generation. Any link that returns a 404 will be removed. Only use URLs you are highly confident are real and currently live.
- Example: <p>A <a href="https://doi.org/10.1519/SSC.0000000000000764">2023 review in Strength and Conditioning Journal</a> found that progressive overload remains the cornerstone of hypertrophy training.</p>
- Example: <p>The <a href="https://www.who.int/news-room/fact-sheets/detail/physical-activity">WHO Fact Sheet on Physical Activity</a> recommends at least 150 minutes of moderate-intensity activity per week for adults.</p>

Content structure:
- Start with a compelling hook or observation (no heading needed for the intro)
- Use <h2> for major sections and <h3> for subsections
- Mix paragraph text with bullet lists and blockquotes for variety
- End with a practical takeaway or call to reflection

HTML rules — ONLY use these elements:
<h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <u>, <a href="...">
Do NOT use <h1> (the title serves that purpose).
Do NOT use inline styles, classes, or <br> tags.
Use separate <p> tags for each paragraph.

Length guidelines:
- "short": ~500 words, 3-4 sections
- "medium": ~1000 words, 5-6 sections
- "long": ~1500 words, 7-8 sections

Tone guidelines:
- "professional": Authoritative, data-driven, coach-to-client educational tone
- "conversational": Friendly, relatable, first-person "I've seen this with my athletes..." style
- "motivational": Inspiring, empowering, encouraging action and commitment

You must output a JSON object with these fields:
- title: Compelling, SEO-friendly blog title (max 200 chars)
- slug: URL-friendly lowercase with hyphens only (max 200 chars)
- excerpt: Engaging summary that makes readers want to click (10-500 chars)
- content: Full blog post body as semantic HTML using ONLY the allowed elements above
- category: One of "Performance", "Recovery", "Coaching", or "Youth Development"
- tags: Array of 3-5 lowercase keyword tags
- meta_description: SEO meta description (max 160 chars)

Output ONLY the JSON object, no additional text.`

// ─── URL Validation ─────────────────────────────────────────────────────────

/**
 * Validates all <a href="..."> URLs in the generated HTML.
 * Removes any links that return 404 or are unreachable, keeping the link text.
 */
async function validateUrls(html: string): Promise<string> {
  const linkRegex = /<a\s+href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi
  const links: { full: string; url: string; text: string }[] = []

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    links.push({ full: match[0], url: match[1], text: match[3] })
  }

  if (links.length === 0) return html

  // Check all URLs in parallel with a 8s timeout per request
  const checks = await Promise.allSettled(
    links.map(async (link) => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        // Use GET with minimal download — some sites block HEAD requests
        const res = await fetch(link.url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; DJPAthlete-Bot/1.0; +https://djpathlete.com)",
          },
        })
        clearTimeout(timeout)
        // Read and discard body to avoid memory leaks
        await res.text().catch(() => {})
        return { ...link, ok: res.status < 400 }
      } catch {
        return { ...link, ok: false }
      }
    })
  )

  let cleaned = html
  let removed = 0

  for (const result of checks) {
    if (result.status === "fulfilled" && !result.value.ok) {
      // Replace broken link with just the text content
      cleaned = cleaned.replace(result.value.full, result.value.text)
      removed++
      console.log(`[blog-generation] Removed broken link: ${result.value.url}`)
    }
  }

  if (removed > 0) {
    console.log(`[blog-generation] Removed ${removed}/${links.length} broken links`)
  }

  return cleaned
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const blogResultSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: z.enum(["Performance", "Recovery", "Coaching", "Youth Development"]),
  tags: z.array(z.string()),
  meta_description: z.string(),
})

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function handleBlogGeneration(jobId: string): Promise<void> {
  const db = getFirestore()
  const jobRef = db.collection("ai_jobs").doc(jobId)

  const jobSnap = await jobRef.get()
  if (!jobSnap.exists) return

  const job = jobSnap.data()!
  if (job.status !== "pending") return

  await jobRef.update({ status: "processing", updatedAt: FieldValue.serverTimestamp() })

  const input = job.input as {
    prompt: string
    tone?: string
    length?: string
    userId: string
  }

  const startTime = Date.now()

  try {
    const userMessage = `Write a blog post about: ${input.prompt}

Tone: ${input.tone ?? "professional"}
Target length: ${input.length ?? "medium"}
Current date: ${new Date().toISOString().slice(0, 10)}`

    const result = await callAgent(
      BLOG_GENERATION_PROMPT,
      userMessage,
      blogResultSchema,
      { model: MODEL_SONNET, maxTokens: 8192 }
    )

    // Validate all URLs in the generated content — remove any 404s
    const validatedContent = await validateUrls(result.content.content)
    const finalResult = { ...result.content, content: validatedContent }

    // Log generation (non-fatal)
    try {
      const supabase = getSupabase()
      await supabase.from("ai_generation_log").insert({
        program_id: null,
        client_id: null,
        requested_by: input.userId,
        status: "completed",
        input_params: { feature: "blog_generation", prompt: input.prompt, tone: input.tone, length: input.length },
        output_summary: `Generated blog: ${result.content.title}`,
        error_message: null,
        model_used: MODEL_SONNET,
        tokens_used: result.tokens_used,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
        current_step: 0,
        total_steps: 0,
      })
    } catch { /* non-fatal */ }

    await jobRef.update({
      status: "completed",
      result: finalResult,
      updatedAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`[blog-generation] Job ${jobId} failed:`, errorMessage)

    await jobRef.update({
      status: "failed",
      error: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}
