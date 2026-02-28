import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { createAnthropic } from "@ai-sdk/anthropic"
import { Anthropic } from "@anthropic-ai/sdk"
import { getProgramChatTools } from "@/lib/ai/program-chat-tools"
import { getProgramChatSystemPrompt } from "@/lib/ai/program-chat-prompt"
import { createGenerationLog } from "@/lib/db/ai-generation-log"
import { MODEL_SONNET } from "@/lib/ai/anthropic"

export const maxDuration = 120

// ─── Validation ──────────────────────────────────────────────────────────────

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(5000),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
})

// ─── Rate limit ──────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 300_000 // 5 minutes

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, timestamps)
    return false
  }
  timestamps.push(now)
  rateLimitMap.set(userId, timestamps)
  return true
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let userId: string | undefined

  try {
    // Auth
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }
    userId = session.user.id

    // Rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes." },
        { status: 429 }
      )
    }

    // Parse body
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Trim to last 20 messages
    const recentMessages = parsed.data.messages.slice(-20)

    // Build stream with tools
    const provider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const tools = getProgramChatTools(userId)
    const systemPrompt = getProgramChatSystemPrompt()

    const result = streamText({
      model: provider(MODEL_SONNET),
      maxOutputTokens: 4096,
      system: systemPrompt,
      messages: recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools,
      stopWhen: stepCountIs(5),
    })

    // SSE streaming
    const capturedUserId = userId
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        // Heartbeat to keep connection alive during long tool executions
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(":\n\n"))
          } catch {
            // Controller may be closed
          }
        }, 15000)

        try {
          for await (const part of result.fullStream) {
            switch (part.type) {
              case "text-delta":
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "delta", text: part.text })}\n\n`
                  )
                )
                break

              case "tool-call":
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_start",
                      tool: part.toolName,
                    })}\n\n`
                  )
                )
                break

              case "tool-result": {
                const toolResult = part.output as Record<string, unknown>
                if (
                  part.toolName === "generate_program" &&
                  toolResult?.success
                ) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "program_created",
                        programId: toolResult.program_id,
                        validationPass: toolResult.validation_pass,
                        durationMs: toolResult.duration_ms,
                      })}\n\n`
                    )
                  )
                } else if (
                  part.toolName === "generate_program" &&
                  !toolResult?.success
                ) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_result",
                        tool: part.toolName,
                        summary: (toolResult?.summary as string) ?? "Generation failed",
                        error: true,
                      })}\n\n`
                    )
                  )
                } else {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_result",
                        tool: part.toolName,
                        summary: (toolResult?.summary as string) ?? "Done",
                      })}\n\n`
                    )
                  )
                }
                break
              }
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          )
          clearInterval(heartbeat)
          controller.close()

          // Log usage (fire-and-forget)
          const usage = await result.usage
          const tokensUsed =
            (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)
          createGenerationLog({
            program_id: null,
            client_id: null,
            requested_by: capturedUserId,
            status: "completed",
            input_params: { feature: "program_chat_builder" },
            output_summary: null,
            error_message: null,
            model_used: MODEL_SONNET,
            tokens_used: tokensUsed,
            duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
            current_step: 0,
            total_steps: 0,
          }).catch(() => {})
        } catch (err) {
          clearInterval(heartbeat)
          console.error("[Program Chat] Stream error:", err)
          if (err instanceof Error && err.stack) {
            console.error("[Program Chat] Stack:", err.stack)
          }
          const message =
            err instanceof Error ? err.message : "Stream error"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message })}\n\n`
            )
          )
          controller.close()

          createGenerationLog({
            program_id: null,
            client_id: null,
            requested_by: capturedUserId,
            status: "failed",
            input_params: { feature: "program_chat_builder" },
            output_summary: null,
            error_message: message,
            model_used: MODEL_SONNET,
            tokens_used: null,
            duration_ms: Date.now() - startTime,
            completed_at: null,
            current_step: 0,
            total_steps: 0,
          }).catch(() => {})
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[Program Chat] Error:", error)

    if (userId) {
      createGenerationLog({
        program_id: null,
        client_id: null,
        requested_by: userId,
        status: "failed",
        input_params: { feature: "program_chat_builder" },
        output_summary: null,
        error_message:
          error instanceof Error ? error.message : "Unknown error",
        model_used: MODEL_SONNET,
        tokens_used: null,
        duration_ms: Date.now() - startTime,
        completed_at: null,
        current_step: 0,
        total_steps: 0,
      }).catch(() => {})
    }

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "AI rate limit reached. Please try again in a moment." },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
