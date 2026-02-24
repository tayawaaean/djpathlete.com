import { autoGenerateProgram } from "@/lib/ai/auto-generate"
import type { AutoGenerateInput } from "@/lib/ai/auto-generate"
import { getProfileByUserId } from "@/lib/db/client-profiles"
import { createServiceRoleClient } from "@/lib/supabase"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AssessmentResult {
  id: string
  user_id: string
  overall_level: string
  squat_level: string
  push_level: string
  pull_level: string
  hinge_level: string
  max_difficulty_score: number
  triggered_program_id: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fetch an assessment result by ID from the database */
async function getAssessmentResult(assessmentResultId: string): Promise<AssessmentResult | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("id", assessmentResultId)
    .single()

  if (error) {
    console.error("[assessment-trigger] Failed to fetch assessment result:", error)
    return null
  }

  return data as AssessmentResult
}

/** Update the assessment result with the triggered program ID */
async function updateAssessmentResultProgram(
  assessmentResultId: string,
  programId: string
): Promise<void> {
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from("assessment_results")
    .update({ triggered_program_id: programId })
    .eq("id", assessmentResultId)

  if (error) {
    console.error("[assessment-trigger] Failed to update assessment result:", error)
  }
}

// ─── Main Trigger Function ──────────────────────────────────────────────────

/**
 * Called after an assessment is saved — triggers auto program generation.
 * This runs in the API route's context (not a background job for now).
 *
 * @param assessmentResultId - The UUID of the saved assessment_result row
 * @param userId - The client's user ID
 * @param isReassessment - Whether this is a reassessment (vs initial assessment)
 */
export async function triggerProgramGeneration(
  assessmentResultId: string,
  userId: string,
  isReassessment: boolean = false
): Promise<{ programId: string } | { error: string }> {
  console.log(`[assessment-trigger] Triggering program generation for user=${userId}, assessment=${assessmentResultId}`)

  try {
    // 1. Fetch the assessment result
    const assessmentResult = await getAssessmentResult(assessmentResultId)
    if (!assessmentResult) {
      return { error: "Assessment result not found" }
    }

    // 2. Fetch the client profile
    const clientProfile = await getProfileByUserId(userId)
    if (!clientProfile) {
      return { error: "Client profile not found" }
    }

    // 3. Build the auto-generate input
    const input: AutoGenerateInput = {
      userId,
      assessmentResultId,
      computedLevels: {
        overall: assessmentResult.overall_level,
        squat: assessmentResult.squat_level,
        push: assessmentResult.push_level,
        pull: assessmentResult.pull_level,
        hinge: assessmentResult.hinge_level,
      },
      maxDifficultyScore: assessmentResult.max_difficulty_score,
      clientProfile,
      generationTrigger: isReassessment ? "reassessment" : "initial_assessment",
    }

    // 4. Run auto-generation
    const result = await autoGenerateProgram(input)

    // 5. Update the assessment result with the triggered program ID
    await updateAssessmentResultProgram(assessmentResultId, result.programId)

    console.log(`[assessment-trigger] Program generation complete: program=${result.programId}`)
    return { programId: result.programId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during program generation"
    console.error("[assessment-trigger] Program generation failed:", message)
    return { error: message }
  }
}
