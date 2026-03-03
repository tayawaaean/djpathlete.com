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
- You MUST include inline hyperlinks to credible sources using <a href="..."> tags throughout the content
- Link to SPECIFIC pages about the topic — NEVER link to just a homepage. Link to the actual guideline, position statement, article, or resource page that supports the claim.
- Use these verified deep-link URLs when relevant:
  NSCA:
    - Position statements: https://www.nsca.com/education/articles/nsca-position-statements/
    - Youth resistance training position statement: https://www.nsca.com/education/articles/nsca-position-statements/youth-resistance-training/
    - Certification info: https://www.nsca.com/certification/cscs/
  ACSM:
    - Exercise guidelines: https://www.acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines
    - Current comments / position stands: https://www.acsm.org/education-resources/expert-consensus/current-comments
  BJSM:
    - Articles by topic: https://bjsm.bmj.com/collection/ (append topic slug)
  PubMed:
    - Search results by topic: https://pubmed.ncbi.nlm.nih.gov/?term= (append search terms with + between words)
    - Example: https://pubmed.ncbi.nlm.nih.gov/?term=periodization+strength+training
  WHO:
    - Physical activity fact sheet: https://www.who.int/news-room/fact-sheets/detail/physical-activity
    - Physical activity guidelines: https://www.who.int/publications/i/item/9789240015128
  Sports Medicine Australia:
    - Fact sheets: https://sma.org.au/resources-advice/fact-sheets/
    - Injury prevention: https://sma.org.au/resources-advice/injury-fact-sheets/
  Other trusted sources:
    - Examine.com (evidence-based supplement/nutrition): https://examine.com/supplements/ or https://examine.com/topics/
    - Precision Nutrition: https://www.precisionnutrition.com/all-about-recovery
    - Science for Sport: https://www.scienceforsport.com/
- When referencing a concept (e.g., periodization, progressive overload, RPE), link the claim text directly to a PubMed search or relevant resource page about that concept
- You MUST include at least 3-4 inline <a href="..."> source references per post, placed naturally where claims are made
- ALWAYS include a "References" or "Further Reading" section at the end with 2-3 hyperlinks to the specific pages referenced
- Example: <p>Research on <a href="https://pubmed.ncbi.nlm.nih.gov/?term=sleep+athletic+recovery">sleep and athletic recovery</a> consistently shows that 7-9 hours is critical for adaptation.</p>
- Example: <p>The <a href="https://www.who.int/news-room/fact-sheets/detail/physical-activity">WHO physical activity guidelines</a> recommend at least 150 minutes of moderate activity per week.</p>

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
      result: result.content,
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
