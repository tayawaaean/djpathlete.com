import { embedText } from "@/lib/ai/embeddings"
import {
  getConversationMessageById,
  updateMessageEmbedding,
  searchSimilarConversations,
  type ConversationSearchResult,
} from "@/lib/db/ai-conversations"
import { getFeedbackForMessage } from "@/lib/db/ai-feedback"
import type { AiFeature } from "@/types/database"

// ─── Embed a conversation message (async, fire-and-forget) ──────────────────

export async function embedConversationMessage(messageId: string): Promise<void> {
  const message = await getConversationMessageById(messageId)

  // Only embed assistant messages
  if (message.role !== "assistant") return

  // Build text to embed: feature context + content
  const metadataSummary = buildMetadataSummary(message.feature, message.metadata)
  const textToEmbed = `Feature: ${message.feature}${metadataSummary ? ` | ${metadataSummary}` : ""}\n${message.content}`.slice(0, 2000)

  const embedding = await embedText(textToEmbed)
  await updateMessageEmbedding(message.id, embedding)
}

function buildMetadataSummary(
  feature: string,
  metadata: Record<string, unknown>
): string {
  const parts: string[] = []

  if (metadata.exercise_name) parts.push(`Exercise: ${metadata.exercise_name}`)
  if (metadata.model) parts.push(`Model: ${metadata.model}`)
  if (metadata.step) parts.push(`Step: ${metadata.step}`)
  if (metadata.client_id) parts.push(`Client: ${metadata.client_id}`)

  // For coach feature, include analysis summary
  if (feature === "ai_coach" && metadata.analysis) {
    const analysis = metadata.analysis as Record<string, unknown>
    if (analysis.plateau_detected) parts.push("Plateau detected")
    if (analysis.deload_recommended) parts.push("Deload recommended")
  }

  return parts.join(" | ")
}

// ─── Retrieve similar context ───────────────────────────────────────────────

export interface RagContext {
  id: string
  content: string
  feature: string
  metadata: Record<string, unknown>
  similarity: number
  avgRating: number | null
}

export async function retrieveSimilarContext(
  query: string,
  feature: AiFeature,
  opts?: {
    excludeSession?: string
    threshold?: number
    limit?: number
    timeoutMs?: number
  }
): Promise<RagContext[]> {
  const timeoutMs = opts?.timeoutMs ?? 2000

  try {
    const results = await Promise.race([
      doRetrieval(query, feature, opts),
      new Promise<RagContext[]>((_, reject) =>
        setTimeout(() => reject(new Error("RAG retrieval timed out")), timeoutMs)
      ),
    ])
    return results
  } catch {
    // Timeout or error — proceed without RAG context
    return []
  }
}

async function doRetrieval(
  query: string,
  feature: AiFeature,
  opts?: {
    excludeSession?: string
    threshold?: number
    limit?: number
  }
): Promise<RagContext[]> {
  const queryEmbedding = await embedText(query)

  const matches = await searchSimilarConversations(queryEmbedding, {
    feature,
    excludeSession: opts?.excludeSession,
    threshold: opts?.threshold ?? 0.4,
    limit: opts?.limit ?? 5,
  })

  // Enrich with feedback ratings
  const enriched = await Promise.all(
    matches.map(async (match) => {
      let avgRating: number | null = null
      try {
        const feedback = await getFeedbackForMessage(match.id)
        if (feedback.length > 0) {
          const ratings = feedback
            .flatMap((f) => [f.accuracy_rating, f.relevance_rating, f.helpfulness_rating])
            .filter((r): r is number => r != null)
          if (ratings.length > 0) {
            avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
          }
        }
      } catch {
        // Feedback lookup failure is non-fatal
      }

      return {
        id: match.id,
        content: match.content,
        feature: match.feature,
        metadata: match.metadata,
        similarity: match.similarity,
        avgRating,
      }
    })
  )

  // Filter out poorly-rated responses (below 2.0 average)
  return enriched.filter(
    (r) => r.avgRating === null || r.avgRating >= 2.0
  )
}

// ─── Format RAG context for prompt injection ────────────────────────────────

export function formatRagContext(results: RagContext[]): string {
  if (results.length === 0) return ""

  const sections = results.map((result, idx) => {
    const metaSummary = buildMetadataSummary(result.feature, result.metadata)
    const ratingStr = result.avgRating
      ? ` (quality: ${result.avgRating.toFixed(1)}/5)`
      : ""
    const truncatedContent = result.content.length > 800
      ? result.content.slice(0, 800) + "..."
      : result.content

    return `### Scenario ${idx + 1}${ratingStr}
Context: ${result.feature}${metaSummary ? ` | ${metaSummary}` : ""}
Response: ${truncatedContent}`
  })

  return `## Similar Past Scenarios

The following are relevant past AI responses. Use them as reference to maintain consistency and quality, but adapt to the current situation.

${sections.join("\n\n")}`
}

// ─── Build augmented prompt ─────────────────────────────────────────────────

export function buildRagAugmentedPrompt(
  basePrompt: string,
  ragContext: string
): string {
  if (!ragContext) return basePrompt
  return `${basePrompt}\n\n${ragContext}`
}
