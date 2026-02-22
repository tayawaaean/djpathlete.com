import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { aiGenerationRequestSchema } from "@/lib/validators/ai-generation"
import { generateProgramSync } from "@/lib/ai/orchestrator"
import { createGenerationLog } from "@/lib/db/ai-generation-log"
import { createCloudTask } from "@/lib/cloud-tasks"

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log("[generate] Request body:", JSON.stringify(body, null, 2))

    const result = aiGenerationRequestSchema.safeParse(body)

    if (!result.success) {
      console.log("[generate] Validation failed:", result.error.flatten().fieldErrors)
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Dev mode: run synchronously (existing behavior)
    if (process.env.NODE_ENV === "development") {
      console.log("[generate] Dev mode: running synchronous pipeline for client:", result.data.client_id)
      const startTime = Date.now()

      const orchestrationResult = await generateProgramSync(
        result.data,
        session.user.id
      )

      console.log(`[generate] Complete in ${Date.now() - startTime}ms — program_id: ${orchestrationResult.program_id}`)

      return NextResponse.json(
        {
          program_id: orchestrationResult.program_id,
          validation: orchestrationResult.validation,
          token_usage: orchestrationResult.token_usage,
          duration_ms: orchestrationResult.duration_ms,
          retries: orchestrationResult.retries,
        },
        { status: 201 }
      )
    }

    // Production: create log and enqueue background job
    console.log("[generate] Creating generation log and enqueueing Cloud Task for client:", result.data.client_id)

    const log = await createGenerationLog({
      program_id: null,
      client_id: result.data.client_id,
      requested_by: session.user.id,
      status: "pending",
      input_params: result.data as unknown as Record<string, unknown>,
      output_summary: null,
      error_message: null,
      model_used: "haiku+sonnet-mixed",
      tokens_used: null,
      duration_ms: null,
      completed_at: null,
      current_step: 0,
      total_steps: 3,
    })

    await createCloudTask({ logId: log.id, step: 1 })

    console.log(`[generate] Enqueued step 1 for logId=${log.id}`)

    return NextResponse.json(
      {
        log_id: log.id,
        status: "pending",
      },
      { status: 202 }
    )
  } catch (error) {
    console.error("[generate] AI program generation failed:", error)

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during program generation."
    console.error("[generate] Returning error to client:", message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
