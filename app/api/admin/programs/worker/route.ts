import { NextResponse } from "next/server"
import { runStep1, runStep2, runStep3 } from "@/lib/ai/orchestrator"
import { createCloudTask } from "@/lib/cloud-tasks"
import { updateGenerationLog } from "@/lib/db/ai-generation-log"

export const maxDuration = 120

export async function POST(request: Request) {
  // Verify shared secret
  const secret = request.headers.get("x-cloud-tasks-secret")
  if (!secret || secret !== process.env.CLOUD_TASKS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let logId: string | undefined
  let step: number | undefined

  try {
    const body = await request.json()
    logId = body.logId as string
    step = body.step as number

    if (!logId || !step || step < 1 || step > 3) {
      return NextResponse.json(
        { error: "Invalid payload: logId and step (1-3) required" },
        { status: 400 }
      )
    }

    console.log(`[worker] Processing step ${step} for logId=${logId}`)

    // Run the step
    switch (step) {
      case 1:
        await runStep1(logId)
        break
      case 2:
        await runStep2(logId)
        break
      case 3:
        await runStep3(logId)
        break
    }

    // Enqueue next step if not the last
    if (step < 3) {
      const nextStep = (step + 1) as 1 | 2 | 3
      await createCloudTask({ logId, step: nextStep })
      console.log(`[worker] Enqueued step ${nextStep} for logId=${logId}`)
    }

    return NextResponse.json({ success: true, step })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error"
    console.error(`[worker] Step ${step} failed for logId=${logId}:`, message)

    // Determine if this is a permanent or transient failure
    const isPermanent =
      message.includes("not found") ||
      message.includes("Invalid") ||
      message.includes("Failed to generate") ||
      (error instanceof Error && error.message.includes("after") && error.message.includes("attempts"))

    if (isPermanent && logId) {
      // Permanent failure — mark as failed and return 200 so Cloud Tasks doesn't retry
      await updateGenerationLog(logId, {
        status: "failed",
        error_message: message,
      }).catch((e) => console.error("[worker] Failed to update log:", e))

      return NextResponse.json({ error: message, permanent: true }, { status: 200 })
    }

    // Transient failure — return 500 so Cloud Tasks retries
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
