import { getFirestore, FieldValue } from "firebase-admin/firestore"
import { streamRaw, MODEL_SONNET, MODEL_HAIKU } from "./ai/anthropic.js"
import { buildAdminContext } from "./ai/admin-context.js"
import { retrieveSimilarContext, formatRagContext, embedConversationMessage } from "./ai/rag.js"
import { getSupabase } from "./lib/supabase.js"

const AI_CHAT_API_MESSAGE_LIMIT = 10
const AI_CHAT_CONTEXT_TIMEOUT_MS = 10_000

export async function handleAdminChat(jobId: string): Promise<void> {
  const db = getFirestore()
  const jobRef = db.collection("ai_jobs").doc(jobId)
  const chunksRef = jobRef.collection("chunks")
  let chunkIndex = 0

  const jobSnap = await jobRef.get()
  if (!jobSnap.exists) return

  const job = jobSnap.data()!
  if (job.status !== "pending") return

  await jobRef.update({ status: "streaming", updatedAt: FieldValue.serverTimestamp() })

  const input = job.input as {
    messages: Array<{ role: "user" | "assistant"; content: string }>
    model?: string
    session_id?: string
    userId: string
  }

  const startTime = Date.now()
  const userId = input.userId
  const sessionId = input.session_id ?? `admin-chat-${userId}-${Date.now()}`

  try {
    // Build platform context with timeout
    let platformContext: string
    try {
      platformContext = await Promise.race([
        buildAdminContext(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Context build timed out")), AI_CHAT_CONTEXT_TIMEOUT_MS)
        ),
      ])
    } catch {
      platformContext = "[Platform data temporarily unavailable. Answer based on general knowledge.]"
    }

    // System prompt blocks
    const systemBlocks = [
      {
        type: "text" as const,
        text: `You are the AI assistant for DJP Athlete, a fitness coaching platform run by Darren Paul. You help the admin (Darren) manage his business by analyzing client data, revenue, and training progress.

You have access to real-time platform data shown below. Use this data to:
- Answer questions about clients, revenue, programs, and progress
- Proactively suggest actions to improve client retention and revenue
- Identify clients who need attention (inactive, stalled progress, etc.)
- Spot trends and opportunities
- Provide specific, actionable recommendations

Be concise, direct, and data-driven. Use exact numbers from the data. When suggesting actions, be specific about which clients or programs you're referring to.

Current date: ${new Date().toLocaleDateString()}`,
      },
      {
        type: "text" as const,
        text: platformContext,
        cache_control: { type: "ephemeral" as const },
      },
    ]

    // Trim history
    const recentMessages = input.messages.slice(-AI_CHAT_API_MESSAGE_LIMIT)

    // Choose model
    let model: string
    if (input.model === "haiku") {
      model = MODEL_HAIKU
    } else if (input.model === "sonnet") {
      model = MODEL_SONNET
    } else {
      const lastUserMsg = recentMessages.filter((m) => m.role === "user").pop()
      const queryLength = lastUserMsg?.content.length ?? 0
      const isSimpleQuery = queryLength < 80 && recentMessages.length <= 4
      model = isSimpleQuery ? MODEL_HAIKU : MODEL_SONNET
    }

    // RAG
    const lastUserMsgForRag = recentMessages.filter((m) => m.role === "user").pop()
    const ragBlocks: Array<{ type: "text"; text: string }> = []
    if (lastUserMsgForRag) {
      const ragResults = await retrieveSimilarContext(
        lastUserMsgForRag.content,
        "admin_chat",
        { excludeSession: sessionId, threshold: 0.5, limit: 3 }
      )
      const ragContext = formatRagContext(ragResults)
      if (ragContext) {
        ragBlocks.push({ type: "text", text: ragContext })
      }
    }

    // Stream response, writing chunks to Firestore
    const allSystemBlocks = [...systemBlocks, ...ragBlocks]
    let accumulatedText = ""

    const stream = streamRaw({
      system: allSystemBlocks,
      messages: recentMessages,
      maxTokens: 1024,
      model,
    })

    let tokensInput = 0
    let tokensOutput = 0

    for await (const event of stream) {
      if (event.type === "text") {
        accumulatedText += event.text
        await chunksRef.doc(String(chunkIndex++).padStart(6, "0")).set({
          index: chunkIndex - 1,
          type: "delta",
          data: { text: event.text },
          createdAt: FieldValue.serverTimestamp(),
        })
      } else if (event.type === "usage") {
        tokensInput = event.input_tokens
        tokensOutput = event.output_tokens
      }
    }

    // Save conversation history to Supabase
    const supabase = getSupabase()
    const lastUserMsg = recentMessages.filter((m) => m.role === "user").pop()
    try {
      const batch: Array<Record<string, unknown>> = []
      if (lastUserMsg) {
        batch.push({
          user_id: userId,
          feature: "admin_chat",
          session_id: sessionId,
          role: "user",
          content: lastUserMsg.content,
          metadata: {},
          tokens_input: null,
          tokens_output: null,
          model_used: null,
        })
      }
      batch.push({
        user_id: userId,
        feature: "admin_chat",
        session_id: sessionId,
        role: "assistant",
        content: accumulatedText,
        metadata: { model },
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        model_used: model,
      })

      const { data: saved } = await supabase
        .from("ai_conversation_history")
        .insert(batch)
        .select()

      const assistantMsg = saved?.find((m: Record<string, unknown>) => m.role === "assistant")
      if (assistantMsg) {
        await chunksRef.doc(String(chunkIndex++).padStart(6, "0")).set({
          index: chunkIndex - 1,
          type: "message_id",
          data: { id: assistantMsg.id },
          createdAt: FieldValue.serverTimestamp(),
        })
        embedConversationMessage(assistantMsg.id).catch(() => {})
      }
    } catch {
      // Conversation save failure is non-fatal
    }

    // Log generation
    const tokensUsed = tokensInput + tokensOutput
    try {
      await supabase.from("ai_generation_log").insert({
        program_id: null,
        client_id: null,
        requested_by: userId,
        status: "completed",
        input_params: { feature: "admin_chat" },
        output_summary: null,
        error_message: null,
        model_used: model,
        tokens_used: tokensUsed,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
        current_step: 0,
        total_steps: 0,
      })
    } catch { /* non-fatal */ }

    // Done chunk
    await chunksRef.doc(String(chunkIndex++).padStart(6, "0")).set({
      index: chunkIndex - 1,
      type: "done",
      data: {},
      createdAt: FieldValue.serverTimestamp(),
    })

    await jobRef.update({
      status: "completed",
      updatedAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`[admin-chat] Job ${jobId} failed:`, errorMessage)

    await chunksRef.doc(String(chunkIndex++).padStart(6, "0")).set({
      index: chunkIndex - 1,
      type: "error",
      data: { message: errorMessage },
      createdAt: FieldValue.serverTimestamp(),
    })

    await jobRef.update({
      status: "failed",
      error: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}
