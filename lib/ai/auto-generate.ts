import { generateProgramSync } from "@/lib/ai/orchestrator"
import type { AssessmentContext } from "@/lib/ai/orchestrator"
import type { AiGenerationRequest } from "@/lib/validators/ai-generation"
import type { ClientProfile } from "@/types/database"
import { getAssignments, updateAssignment } from "@/lib/db/assignments"
import { createNotification } from "@/lib/db/notifications"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AutoGenerateInput {
  userId: string
  assessmentResultId: string
  computedLevels: {
    overall: string
    squat: string
    push: string
    pull: string
    hinge: string
  }
  maxDifficultyScore: number
  clientProfile: ClientProfile
  generationTrigger: "initial_assessment" | "reassessment"
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Derive default goals from client profile */
function deriveGoals(profile: ClientProfile): string[] {
  if (profile.goals) {
    // Goals may be stored as a comma-separated string or JSON
    try {
      const parsed = JSON.parse(profile.goals)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Not JSON — treat as comma-separated or single value
      return profile.goals.split(",").map((g) => g.trim()).filter(Boolean)
    }
  }
  return ["general_health"]
}

/** Derive default session minutes */
function deriveSessionMinutes(profile: ClientProfile): number {
  return profile.preferred_session_minutes ?? 60
}

/** Derive default sessions per week */
function deriveSessionsPerWeek(profile: ClientProfile): number {
  return profile.preferred_training_days ?? 3
}

// ─── Main Auto-Generation Function ──────────────────────────────────────────

/**
 * Auto-generates a personalized training program after a client completes
 * their assessment. Handles the full lifecycle:
 * 1. Completes any existing active assignments for the user
 * 2. Calls the AI orchestrator with assessment-derived constraints
 * 3. The orchestrator handles program creation and assignment internally
 * 4. Creates a notification for the client
 */
export async function autoGenerateProgram(input: AutoGenerateInput): Promise<{
  programId: string
  success: boolean
}> {
  const {
    userId,
    assessmentResultId,
    computedLevels,
    maxDifficultyScore,
    clientProfile,
    generationTrigger,
  } = input

  console.log(`[auto-generate] Starting for user=${userId}, trigger=${generationTrigger}, maxDifficulty=${maxDifficultyScore}`)

  // 1. Complete any existing active assignments for this user
  try {
    const existingAssignments = await getAssignments(userId)
    const activeAssignments = (existingAssignments ?? []).filter(
      (a) => a.status === "active"
    )

    for (const assignment of activeAssignments) {
      await updateAssignment(assignment.id, {
        status: "completed",
        end_date: new Date().toISOString().split("T")[0],
        notes: `Auto-completed: new program generated from ${generationTrigger}`,
      })
      console.log(`[auto-generate] Completed existing assignment ${assignment.id}`)
    }
  } catch (err) {
    console.error("[auto-generate] Error completing existing assignments:", err)
    // Continue — failing to complete old assignments shouldn't block new generation
  }

  // 2. Build the AI generation request from the client profile + assessment
  const goals = deriveGoals(clientProfile)
  const sessionMinutes = deriveSessionMinutes(clientProfile)
  const sessionsPerWeek = deriveSessionsPerWeek(clientProfile)

  const generationRequest: AiGenerationRequest = {
    client_id: userId,
    goals,
    duration_weeks: 4, // Default 4-week program from assessment
    sessions_per_week: sessionsPerWeek,
    session_minutes: sessionMinutes,
    equipment_override: clientProfile.available_equipment.length > 0
      ? clientProfile.available_equipment
      : undefined,
    is_public: false,
  }

  // 3. Build assessment context for the orchestrator
  const assessmentContext: AssessmentContext = {
    assessmentResultId,
    computedLevels,
    maxDifficultyScore,
    generationTrigger,
  }

  // 4. Call the AI orchestrator (runs synchronously — the caller can wrap in background if needed)
  const result = await generateProgramSync(
    generationRequest,
    userId, // The client themselves triggered it via assessment
    assessmentContext
  )

  console.log(`[auto-generate] Program generated: ${result.program_id}, duration=${result.duration_ms}ms`)

  // 5. Create notification for the client
  try {
    await createNotification({
      user_id: userId,
      title: "Your personalized training program is ready!",
      message: `Based on your ${generationTrigger === "initial_assessment" ? "initial assessment" : "reassessment"} results, we've created a customized ${generationRequest.duration_weeks}-week training program tailored to your fitness level.`,
      type: "success",
      is_read: false,
      link: "/client/programs",
    })
    console.log(`[auto-generate] Notification created for user=${userId}`)
  } catch (err) {
    console.error("[auto-generate] Failed to create notification:", err)
    // Non-critical — don't fail the whole flow for a notification
  }

  return {
    programId: result.program_id,
    success: true,
  }
}
