import { getFirestore, FieldValue } from "firebase-admin/firestore"
import { generateProgramSync } from "./ai/orchestrator.js"
import type { AiGenerationRequest, AssessmentContext } from "./ai/orchestrator.js"

export async function handleProgramGeneration(jobId: string): Promise<void> {
  const db = getFirestore()
  const jobRef = db.collection("ai_jobs").doc(jobId)

  const jobSnap = await jobRef.get()
  if (!jobSnap.exists) {
    console.error(`[program-generation] Job ${jobId} not found`)
    return
  }

  const job = jobSnap.data()!
  if (job.status !== "pending") {
    console.log(`[program-generation] Job ${jobId} already ${job.status}, skipping`)
    return
  }

  // Mark as processing
  await jobRef.update({ status: "processing", updatedAt: FieldValue.serverTimestamp() })

  const input = job.input as {
    request: AiGenerationRequest
    requestedBy: string
    assessmentContext?: AssessmentContext
  }

  try {
    console.log(`[program-generation] Starting for job ${jobId}`)
    const result = await generateProgramSync(
      input.request,
      input.requestedBy,
      input.assessmentContext
    )

    // Write result to job doc
    await jobRef.update({
      status: "completed",
      result: {
        program_id: result.program_id,
        validation: {
          pass: result.validation.pass,
          warnings: result.validation.issues.filter((i) => i.type === "warning").length,
          errors: result.validation.issues.filter((i) => i.type === "error").length,
        },
        token_usage: result.token_usage,
        duration_ms: result.duration_ms,
        retries: result.retries,
      },
      updatedAt: FieldValue.serverTimestamp(),
    })
    console.log(`[program-generation] Job ${jobId} completed — program_id: ${result.program_id}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`[program-generation] Job ${jobId} failed:`, errorMessage)

    await jobRef.update({
      status: "failed",
      error: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}
