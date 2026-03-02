import Anthropic from "@anthropic-ai/sdk"
import type { ZodSchema } from "zod"
import type { AgentCallResult } from "./types.js"
import pRetry from "p-retry"

export { Anthropic }

export const MODEL_SONNET = "claude-sonnet-4-20250514"
export const MODEL_HAIKU = "claude-haiku-4-5-20251001"
const DEFAULT_MAX_TOKENS = 8192

// ─── Singleton client ───────────────────────────────────────────────────────

let _client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return _client
}

// ─── Transient error detection ───────────────────────────────────────────────

function isTransientError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return error.status === 429 || error.status >= 500
  }
  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes("429") || msg.includes("529") || msg.includes("500") || msg.includes("502") || msg.includes("503")) {
      return true
    }
  }
  return false
}

// ─── callAgent: structured output via raw Anthropic SDK ─────────────────────

export async function callAgent<T>(
  systemPrompt: string,
  userMessage: string,
  schema: ZodSchema<T>,
  options?: {
    maxTokens?: number
    model?: string
    cacheSystemPrompt?: boolean
  }
): Promise<AgentCallResult<T>> {
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS
  const modelId = options?.model ?? MODEL_SONNET
  const client = getClient()

  const result = await pRetry(
    async () => {
      const systemContent: Anthropic.Messages.TextBlockParam[] = [{
        type: "text" as const,
        text: systemPrompt,
        ...(options?.cacheSystemPrompt ? { cache_control: { type: "ephemeral" as const } } : {}),
      }]

      // Request JSON output with the schema description
      const schemaJson = JSON.stringify((schema as { _def?: { shape?: unknown } })._def?.shape ?? {})

      const response = await client.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        system: systemContent,
        messages: [{
          role: "user",
          content: userMessage + (schemaJson !== "{}" ? `\n\nYou MUST respond with valid JSON matching this schema. Output ONLY the JSON object.` : ""),
        }],
      })

      // Extract text content
      const textBlock = response.content.find((b) => b.type === "text")
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Anthropic response")
      }

      // Parse JSON from response
      const jsonStr = textBlock.text.trim()
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON object found in response")
      }

      const parsed = JSON.parse(jsonMatch[0])
      const validated = schema.parse(parsed)

      const tokens_used = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

      return {
        content: validated as T,
        tokens_used,
      }
    },
    {
      retries: 2,
      shouldRetry: (error) => isTransientError(error),
      onFailedAttempt: (context) => {
        console.warn(
          `[callAgent] Attempt ${context.attemptNumber} failed (${context.retriesLeft} retries left): ${context.error.message}`
        )
      },
    }
  )

  return result
}

// ─── streamRaw: raw Anthropic streaming for Firebase Functions ──────────────

export async function* streamRaw(opts: {
  system: string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>
  messages: Array<{ role: "user" | "assistant"; content: string }>
  maxTokens?: number
  model?: string
}): AsyncGenerator<{ type: "text"; text: string } | { type: "usage"; input_tokens: number; output_tokens: number }> {
  const client = getClient()
  const modelId = opts.model ?? MODEL_SONNET
  const maxTokens = opts.maxTokens ?? 1024

  const systemContent: Anthropic.Messages.TextBlockParam[] =
    typeof opts.system === "string"
      ? [{ type: "text" as const, text: opts.system }]
      : opts.system.map((block) => ({
          type: "text" as const,
          text: block.text,
          ...(block.cache_control ? { cache_control: block.cache_control } : {}),
        }))

  const stream = client.messages.stream({
    model: modelId,
    max_tokens: maxTokens,
    system: systemContent,
    messages: opts.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield { type: "text", text: event.delta.text }
    }
  }

  const finalMessage = await stream.finalMessage()
  yield {
    type: "usage",
    input_tokens: finalMessage.usage?.input_tokens ?? 0,
    output_tokens: finalMessage.usage?.output_tokens ?? 0,
  }
}
