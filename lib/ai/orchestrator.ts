import type { AiGenerationRequest } from "@/lib/validators/ai-generation"
import type {
  AgentCallResult,
  ExerciseSlot,
  ProfileAnalysis,
  ProgramSkeleton,
  ExerciseAssignment,
  ValidationResult,
  OrchestrationResult,
} from "@/lib/ai/types"
import type { ProgramCategory, ProgramDifficulty } from "@/types/database"
import { callAgent, MODEL_HAIKU } from "@/lib/ai/anthropic"
import { scoreAndFilterExercises, semanticFilterExercises } from "@/lib/ai/exercise-filter"
import { estimateTokens } from "@/lib/ai/token-utils"
import {
  profileAnalysisSchema,
  programSkeletonSchema,
  exerciseAssignmentSchema,
} from "@/lib/ai/schemas"
import {
  PROFILE_ANALYZER_PROMPT,
  PROGRAM_ARCHITECT_PROMPT,
  EXERCISE_SELECTOR_PROMPT,
} from "@/lib/ai/prompts"
import { validateProgram } from "@/lib/ai/validate"
import { compressExercises, formatExerciseLibrary } from "@/lib/ai/exercise-context"
import type { CompressedExercise } from "@/lib/ai/exercise-context"
import { getProfileByUserId } from "@/lib/db/client-profiles"
import { getExercisesForAI } from "@/lib/db/exercises"
import { createProgram, getProgramById } from "@/lib/db/programs"
import { addExerciseToProgram } from "@/lib/db/program-exercises"
import {
  createGenerationLog,
  updateGenerationLog,
  getGenerationLogById,
} from "@/lib/db/ai-generation-log"
import { getUserById } from "@/lib/db/users"
import { createAssignment } from "@/lib/db/assignments"
import { sendProgramReadyEmail } from "@/lib/email"

const MAX_RETRIES = 2

// ─── Helpers ────────────────────────────────────────────────────────────────

function deriveProgramCategory(goals: string[]): ProgramCategory {
  const goalSet = new Set(goals.map((g) => g.toLowerCase()))

  if (goalSet.has("muscle_gain") && goalSet.has("endurance")) return "hybrid"
  if (goalSet.has("muscle_gain") || goalSet.has("weight_loss")) return "strength"
  if (goalSet.has("endurance")) return "conditioning"
  if (goalSet.has("sport_specific")) return "sport_specific"
  if (goalSet.has("flexibility")) return "recovery"
  if (goalSet.has("general_health")) return "hybrid"

  return "strength"
}

function mapDifficulty(experienceLevel: string | null): ProgramDifficulty {
  switch (experienceLevel) {
    case "beginner":
      return "beginner"
    case "intermediate":
      return "intermediate"
    case "advanced":
      return "advanced"
    case "elite":
      return "elite"
    default:
      return "beginner"
  }
}

// ─── Step 1: Profile Analysis + Exercise Fetch ──────────────────────────────

export async function runStep1(logId: string): Promise<void> {
  console.log(`[orchestrator:step1] Starting for logId=${logId}`)
  const stepStart = Date.now()

  await updateGenerationLog(logId, { status: "step_1", current_step: 1 })

  const log = await getGenerationLogById(logId)
  const request = log.input_params as unknown as AiGenerationRequest
  const requestedBy = log.requested_by

  // Fetch client profile
  const profile = await getProfileByUserId(request.client_id)
  let clientName = "Client"
  try {
    const user = await getUserById(request.client_id)
    clientName = `${user.first_name} ${user.last_name}`.trim()
  } catch {
    // Fall back to "Client"
  }

  let age: number | null = null
  if (profile?.date_of_birth) {
    const birthYear = parseInt(profile.date_of_birth, 10)
    if (!isNaN(birthYear)) {
      age = new Date().getFullYear() - birthYear
    }
  }

  const profileContext = profile
    ? JSON.stringify({
        goals: profile.goals,
        sport: profile.sport,
        gender: profile.gender,
        age,
        date_of_birth: profile.date_of_birth,
        experience_level: profile.experience_level,
        movement_confidence: profile.movement_confidence,
        sleep_hours: profile.sleep_hours,
        stress_level: profile.stress_level,
        occupation_activity_level: profile.occupation_activity_level,
        training_years: profile.training_years,
        injuries: profile.injuries,
        injury_details: profile.injury_details,
        available_equipment: profile.available_equipment,
        preferred_session_minutes: profile.preferred_session_minutes,
        preferred_training_days: profile.preferred_training_days,
        preferred_day_names: profile.preferred_day_names,
        preferred_techniques: profile.preferred_techniques,
        time_efficiency_preference: profile.time_efficiency_preference,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        exercise_likes: profile.exercise_likes,
        exercise_dislikes: profile.exercise_dislikes,
        training_background: profile.training_background,
        additional_notes: profile.additional_notes,
      })
    : JSON.stringify({ note: "No profile found — use defaults for a general fitness client." })

  const agent1UserMessage = `Client Profile:
${profileContext}

Training Request:
- Goals: ${request.goals.join(", ")}
- Duration: ${request.duration_weeks} weeks
- Sessions per week: ${request.sessions_per_week}
- Session length: ${request.session_minutes ?? 60} minutes
${request.split_type ? `- Requested split type: ${request.split_type}` : ""}
${request.periodization ? `- Requested periodization: ${request.periodization}` : ""}
${request.equipment_override ? `- Equipment override: ${request.equipment_override.join(", ")}` : ""}
${request.additional_instructions ? `- Additional instructions: ${request.additional_instructions}` : ""}
${profile?.preferred_day_names?.length ? `- Preferred training days: ${profile.preferred_day_names.map((d: number) => ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')}` : ''}
${profile?.time_efficiency_preference ? `- Time efficiency preference: ${profile.time_efficiency_preference}` : ''}
${profile?.preferred_techniques?.length ? `- Preferred techniques: ${profile.preferred_techniques.join(', ')}` : ''}
${age ? `- Client age: ${age}` : ''}
${profile?.sleep_hours ? `- Sleep: ${profile.sleep_hours}` : ''}
${profile?.stress_level ? `- Stress level: ${profile.stress_level}` : ''}
${profile?.occupation_activity_level ? `- Occupation activity: ${profile.occupation_activity_level}` : ''}
${profile?.movement_confidence ? `- Movement confidence: ${profile.movement_confidence}` : ''}
${profile?.exercise_likes ? `- Exercise likes: ${profile.exercise_likes}` : ''}
${profile?.exercise_dislikes ? `- Exercise dislikes: ${profile.exercise_dislikes}` : ''}
${profile?.training_background ? `- Training background: ${profile.training_background}` : ''}
${profile?.additional_notes ? `- Additional notes: ${profile.additional_notes}` : ''}`

  // Run Agent 1 and exercise library fetch concurrently (no rate limit issue)
  const [agent1Result, allExercises] = await Promise.all([
    callAgent<ProfileAnalysis>(
      PROFILE_ANALYZER_PROMPT,
      agent1UserMessage,
      profileAnalysisSchema,
      { model: MODEL_HAIKU, cacheSystemPrompt: true }
    ),
    getExercisesForAI(),
  ])

  const analysis = agent1Result.content
  const compressed = compressExercises(allExercises)
  console.log(`[orchestrator:step1] Agent 1 done in ${Date.now() - stepStart}ms (${agent1Result.tokens_used} tokens), ${compressed.length} exercises`)

  // Apply overrides
  if (request.split_type) {
    analysis.recommended_split = request.split_type
  }
  if (request.periodization) {
    analysis.recommended_periodization = request.periodization
  }

  // Save intermediate data to log
  await updateGenerationLog(logId, {
    output_summary: {
      step1: {
        analysis,
        compressed,
        client_name: clientName,
        experience_level: profile?.experience_level ?? "beginner",
        available_equipment: request.equipment_override ?? profile?.available_equipment ?? [],
        agent1_tokens: agent1Result.tokens_used,
      },
    },
    tokens_used: agent1Result.tokens_used,
  })

  console.log(`[orchestrator:step1] Complete in ${Date.now() - stepStart}ms`)
}

// ─── Step 2: Program Architect (Sonnet) ─────────────────────────────────────

export async function runStep2(logId: string): Promise<void> {
  console.log(`[orchestrator:step2] Starting for logId=${logId}`)
  const stepStart = Date.now()

  await updateGenerationLog(logId, { status: "step_2", current_step: 2 })

  const log = await getGenerationLogById(logId)
  const request = log.input_params as unknown as AiGenerationRequest
  const step1Data = (log.output_summary as Record<string, unknown>)?.step1 as {
    analysis: ProfileAnalysis
    compressed: CompressedExercise[]
    client_name: string
    experience_level: string
    available_equipment: string[]
    agent1_tokens: number
  }

  if (!step1Data) {
    throw new Error("Step 1 data not found in generation log")
  }

  const { analysis } = step1Data

  // Agent 2 — Program Architect (Sonnet — this is the slow one)
  const agent2UserMessage = `Profile Analysis:
${JSON.stringify(analysis)}

Training Parameters:
- Duration: ${request.duration_weeks} weeks
- Sessions per week: ${request.sessions_per_week}
- Session length: ${request.session_minutes ?? 60} minutes
- Split type: ${analysis.recommended_split}
- Periodization: ${analysis.recommended_periodization}
- Goals: ${request.goals.join(", ")}
${request.additional_instructions ? `- Additional instructions: ${request.additional_instructions}` : ""}`

  const agent2Result = await callAgent<ProgramSkeleton>(
    PROGRAM_ARCHITECT_PROMPT,
    agent2UserMessage,
    programSkeletonSchema,
    { maxTokens: 16384, cacheSystemPrompt: true }
  )

  const skeleton = agent2Result.content
  console.log(`[orchestrator:step2] Agent 2 done in ${Date.now() - stepStart}ms (${agent2Result.tokens_used} tokens)`)

  // Save skeleton to log
  const prevTokens = log.tokens_used ?? 0
  await updateGenerationLog(logId, {
    output_summary: {
      ...log.output_summary,
      step2: {
        skeleton,
        agent2_tokens: agent2Result.tokens_used,
      },
    },
    tokens_used: prevTokens + agent2Result.tokens_used,
  })

  console.log(`[orchestrator:step2] Complete in ${Date.now() - stepStart}ms`)
}

// ─── Step 3: Exercise Selection + Validation + DB + Email ───────────────────

export async function runStep3(logId: string): Promise<void> {
  console.log(`[orchestrator:step3] Starting for logId=${logId}`)
  const stepStart = Date.now()

  await updateGenerationLog(logId, { status: "step_3", current_step: 3 })

  const log = await getGenerationLogById(logId)
  const request = log.input_params as unknown as AiGenerationRequest
  const requestedBy = log.requested_by

  const outputSummary = log.output_summary as Record<string, unknown>
  const step1Data = outputSummary?.step1 as {
    analysis: ProfileAnalysis
    compressed: CompressedExercise[]
    client_name: string
    experience_level: string
    available_equipment: string[]
    agent1_tokens: number
  }
  const step2Data = outputSummary?.step2 as {
    skeleton: ProgramSkeleton
    agent2_tokens: number
  }

  if (!step1Data || !step2Data) {
    throw new Error("Step 1 or Step 2 data not found in generation log")
  }

  const { analysis, compressed, client_name: clientName, experience_level: clientDifficulty, available_equipment: availableEquipment } = step1Data
  const { skeleton } = step2Data

  const constraintsContext = JSON.stringify({
    exercise_constraints: analysis.exercise_constraints,
    available_equipment: availableEquipment,
    client_difficulty: clientDifficulty,
  })

  // Pre-filter exercises
  let filtered: CompressedExercise[]
  try {
    filtered = await semanticFilterExercises(compressed, skeleton, availableEquipment, analysis)
    console.log(`[orchestrator:step3] ${compressed.length} → ${filtered.length} exercises (semantic)`)
  } catch {
    filtered = scoreAndFilterExercises(compressed, skeleton, availableEquipment, analysis)
    console.log(`[orchestrator:step3] ${compressed.length} → ${filtered.length} exercises (heuristic)`)
  }
  const exerciseLibrary = formatExerciseLibrary(filtered)

  const agent3SystemTokens = estimateTokens(EXERCISE_SELECTOR_PROMPT)
  const agent3UserTokens = estimateTokens(exerciseLibrary) + estimateTokens(constraintsContext) + estimateTokens(JSON.stringify(skeleton))
  console.log(`[orchestrator:step3] Agent 3 token budget: ~${agent3SystemTokens + agent3UserTokens} input tokens`)

  // Agent 3 — Exercise Selector with validation retry loop
  let assignment: ExerciseAssignment | null = null
  let validation: ValidationResult | null = null
  let retries = 0
  let agent3TotalTokens = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[orchestrator:step3] Agent 3 attempt ${attempt + 1}/${MAX_RETRIES + 1}...`)
    const agent3Start = Date.now()

    let feedbackSection = ""
    if (attempt > 0 && validation !== null) {
      const errorIssues = validation.issues.filter((i) => i.type === "error")
      feedbackSection = `\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Issues to fix:\n${JSON.stringify(errorIssues)}\n\nPlease fix ALL errors and try again.`
    }

    const agent3UserMessage = `Program Skeleton:
${JSON.stringify(skeleton)}

Constraints:
${constraintsContext}

Exercise Library (${filtered.length} exercises, pre-filtered for relevance):
${exerciseLibrary}${feedbackSection}`

    try {
      const agent3Result: AgentCallResult<ExerciseAssignment> = await callAgent<ExerciseAssignment>(
        EXERCISE_SELECTOR_PROMPT,
        agent3UserMessage,
        exerciseAssignmentSchema,
        { maxTokens: 16384, cacheSystemPrompt: true }
      )
      agent3TotalTokens += agent3Result.tokens_used
      assignment = agent3Result.content
      console.log(`[orchestrator:step3] Agent 3 done in ${Date.now() - agent3Start}ms (${agent3Result.tokens_used} tokens, ${assignment.assignments.length} exercises)`)

      // Code-based validation
      validation = validateProgram(
        skeleton,
        assignment,
        analysis,
        compressed,
        availableEquipment,
        clientDifficulty
      )
      console.log(`[orchestrator:step3] Validation: pass=${validation.pass}, issues=${validation.issues.length}`)

      if (validation.pass) break

      const hasErrors = validation.issues.some((i) => i.type === "error")
      if (!hasErrors) break

      console.log(`[orchestrator:step3] Validation errors, retrying...`)
      retries++
    } catch (agentError) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Exercise selection failed after ${MAX_RETRIES + 1} attempts: ${agentError instanceof Error ? agentError.message : "Unknown error"}`
        )
      }
      retries++
    }
  }

  if (!assignment || !validation) {
    throw new Error("Failed to generate exercise assignments")
  }

  // Create program in database
  const programCategory = deriveProgramCategory(request.goals)
  const programDifficulty = mapDifficulty(clientDifficulty)

  const goalsLabel = request.goals
    .map((g) => g.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" & ")
  const splitLabel = skeleton.split_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const tokenUsage = {
    agent1: step1Data.agent1_tokens,
    agent2: step2Data.agent2_tokens,
    agent3: agent3TotalTokens,
    agent4: 0,
    total: step1Data.agent1_tokens + step2Data.agent2_tokens + agent3TotalTokens,
  }

  const program = await createProgram({
    name: `${clientName}'s ${request.duration_weeks}-Week ${goalsLabel} Program`,
    description: `A ${request.duration_weeks}-week ${splitLabel.toLowerCase()} program designed for ${goalsLabel.toLowerCase()}, training ${request.sessions_per_week}x per week. ${skeleton.notes}`,
    category: [programCategory],
    difficulty: programDifficulty,
    duration_weeks: request.duration_weeks,
    sessions_per_week: request.sessions_per_week,
    split_type: skeleton.split_type,
    periodization: skeleton.periodization,
    is_public: request.is_public ?? false,
    is_ai_generated: true,
    ai_generation_params: {
      request,
      analysis_summary: {
        split: analysis.recommended_split,
        periodization: analysis.recommended_periodization,
        training_age: analysis.training_age_category,
        constraints_count: analysis.exercise_constraints.length,
      },
      validation: {
        pass: validation.pass,
        warnings: validation.issues.filter((i) => i.type === "warning").length,
        errors: validation.issues.filter((i) => i.type === "error").length,
      },
      token_usage: tokenUsage,
    },
    is_active: true,
    created_by: requestedBy,
    price_cents: null,
    target_user_id: null,
  })

  console.log(`[orchestrator:step3] Program created: ${program.id}`)

  // Insert exercises
  const slotLookup = new Map<string, { week_number: number; day_of_week: number; order_index: number }>()
  const slotDetailsLookup = new Map<string, {
    sets: number; reps: string; rest_seconds: number; rpe_target: number | null
    tempo: string | null; group_tag: string | null; technique: ExerciseSlot["technique"]
  }>()

  for (const week of skeleton.weeks) {
    for (const day of week.days) {
      day.slots.forEach((slot, idx) => {
        slotLookup.set(slot.slot_id, {
          week_number: week.week_number,
          day_of_week: day.day_of_week,
          order_index: idx,
        })
        slotDetailsLookup.set(slot.slot_id, {
          sets: slot.sets,
          reps: slot.reps,
          rest_seconds: slot.rest_seconds,
          rpe_target: slot.rpe_target,
          tempo: slot.tempo,
          group_tag: slot.group_tag,
          technique: slot.technique ?? "straight_set",
        })
      })
    }
  }

  const insertPromises = assignment.assignments.map((assigned) => {
    const location = slotLookup.get(assigned.slot_id)
    const details = slotDetailsLookup.get(assigned.slot_id)
    if (!location || !details) {
      console.warn(`Slot ${assigned.slot_id} not found — skipping`)
      return Promise.resolve(null)
    }
    return addExerciseToProgram({
      program_id: program.id,
      exercise_id: assigned.exercise_id,
      day_of_week: location.day_of_week,
      week_number: location.week_number,
      order_index: location.order_index,
      sets: details.sets,
      reps: details.reps,
      duration_seconds: null,
      rest_seconds: details.rest_seconds,
      notes: assigned.notes,
      rpe_target: details.rpe_target,
      intensity_pct: null,
      tempo: details.tempo,
      group_tag: details.group_tag,
      technique: details.technique ?? "straight_set",
    })
  })

  await Promise.all(insertPromises)
  console.log(`[orchestrator:step3] ${assignment.assignments.length} exercises inserted`)

  // Auto-assign program to client
  try {
    await createAssignment({
      program_id: program.id,
      user_id: request.client_id,
      assigned_by: requestedBy,
      start_date: new Date().toISOString().split("T")[0],
      end_date: null,
      status: "active",
      notes: "Auto-assigned from AI program generation",
    })
    console.log(`[orchestrator:step3] Program auto-assigned to client ${request.client_id}`)
  } catch (assignError) {
    console.error("[orchestrator:step3] Failed to auto-assign:", assignError)
  }

  // Send email notification
  try {
    const [client, programData] = await Promise.all([
      getUserById(request.client_id),
      getProgramById(program.id),
    ])
    await sendProgramReadyEmail(client.email, client.first_name, programData.name)
    console.log(`[orchestrator:step3] Email sent to ${client.email}`)
  } catch (emailError) {
    console.error("[orchestrator:step3] Failed to send email:", emailError)
  }

  // Update generation log to completed
  const totalDurationMs = Date.now() - new Date(log.created_at).getTime()

  await updateGenerationLog(logId, {
    program_id: program.id,
    status: "completed",
    current_step: 3,
    tokens_used: tokenUsage.total,
    duration_ms: totalDurationMs,
    completed_at: new Date().toISOString(),
    output_summary: {
      program_id: program.id,
      program_name: program.name,
      exercises_assigned: assignment.assignments.length,
      validation_pass: validation.pass,
      validation,
      token_usage: tokenUsage,
      warnings: validation.issues.filter((i) => i.type === "warning").length,
      retries,
    },
  })

  console.log(`[orchestrator:step3] Complete in ${Date.now() - stepStart}ms (total pipeline: ${totalDurationMs}ms)`)
}

// ─── Full Synchronous Pipeline (for dev mode) ──────────────────────────────

export async function generateProgramSync(
  request: AiGenerationRequest,
  requestedBy: string
): Promise<OrchestrationResult> {
  const startTime = Date.now()
  const tokenUsage = { agent1: 0, agent2: 0, agent3: 0, agent4: 0, total: 0 }
  let retries = 0

  const log = await createGenerationLog({
    program_id: null,
    client_id: request.client_id,
    requested_by: requestedBy,
    status: "generating",
    input_params: request as unknown as Record<string, unknown>,
    output_summary: null,
    error_message: null,
    model_used: "haiku+sonnet-mixed",
    tokens_used: null,
    duration_ms: null,
    completed_at: null,
    current_step: 0,
    total_steps: 3,
  })

  try {
    // Fetch client profile
    const profile = await getProfileByUserId(request.client_id)
    let clientName = "Client"
    try {
      const user = await getUserById(request.client_id)
      clientName = `${user.first_name} ${user.last_name}`.trim()
    } catch {
      // Fall back
    }

    let age: number | null = null
    if (profile?.date_of_birth) {
      const birthYear = parseInt(profile.date_of_birth, 10)
      if (!isNaN(birthYear)) {
        age = new Date().getFullYear() - birthYear
      }
    }

    const profileContext = profile
      ? JSON.stringify({
          goals: profile.goals,
          sport: profile.sport,
          gender: profile.gender,
          age,
          date_of_birth: profile.date_of_birth,
          experience_level: profile.experience_level,
          movement_confidence: profile.movement_confidence,
          sleep_hours: profile.sleep_hours,
          stress_level: profile.stress_level,
          occupation_activity_level: profile.occupation_activity_level,
          training_years: profile.training_years,
          injuries: profile.injuries,
          injury_details: profile.injury_details,
          available_equipment: profile.available_equipment,
          preferred_session_minutes: profile.preferred_session_minutes,
          preferred_training_days: profile.preferred_training_days,
          preferred_day_names: profile.preferred_day_names,
          preferred_techniques: profile.preferred_techniques,
          time_efficiency_preference: profile.time_efficiency_preference,
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg,
          exercise_likes: profile.exercise_likes,
          exercise_dislikes: profile.exercise_dislikes,
          training_background: profile.training_background,
          additional_notes: profile.additional_notes,
        })
      : JSON.stringify({ note: "No profile found — use defaults for a general fitness client." })

    const agent1UserMessage = `Client Profile:
${profileContext}

Training Request:
- Goals: ${request.goals.join(", ")}
- Duration: ${request.duration_weeks} weeks
- Sessions per week: ${request.sessions_per_week}
- Session length: ${request.session_minutes ?? 60} minutes
${request.split_type ? `- Requested split type: ${request.split_type}` : ""}
${request.periodization ? `- Requested periodization: ${request.periodization}` : ""}
${request.equipment_override ? `- Equipment override: ${request.equipment_override.join(", ")}` : ""}
${request.additional_instructions ? `- Additional instructions: ${request.additional_instructions}` : ""}
${profile?.preferred_day_names?.length ? `- Preferred training days: ${profile.preferred_day_names.map((d: number) => ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')}` : ''}
${profile?.time_efficiency_preference ? `- Time efficiency preference: ${profile.time_efficiency_preference}` : ''}
${profile?.preferred_techniques?.length ? `- Preferred techniques: ${profile.preferred_techniques.join(', ')}` : ''}
${age ? `- Client age: ${age}` : ''}
${profile?.sleep_hours ? `- Sleep: ${profile.sleep_hours}` : ''}
${profile?.stress_level ? `- Stress level: ${profile.stress_level}` : ''}
${profile?.occupation_activity_level ? `- Occupation activity: ${profile.occupation_activity_level}` : ''}
${profile?.movement_confidence ? `- Movement confidence: ${profile.movement_confidence}` : ''}
${profile?.exercise_likes ? `- Exercise likes: ${profile.exercise_likes}` : ''}
${profile?.exercise_dislikes ? `- Exercise dislikes: ${profile.exercise_dislikes}` : ''}
${profile?.training_background ? `- Training background: ${profile.training_background}` : ''}
${profile?.additional_notes ? `- Additional notes: ${profile.additional_notes}` : ''}`

    // Agent 1 + exercise fetch in parallel
    const [agent1Result, allExercises] = await Promise.all([
      callAgent<ProfileAnalysis>(
        PROFILE_ANALYZER_PROMPT,
        agent1UserMessage,
        profileAnalysisSchema,
        { model: MODEL_HAIKU, cacheSystemPrompt: true }
      ),
      getExercisesForAI(),
    ])
    tokenUsage.agent1 = agent1Result.tokens_used

    const analysis = agent1Result.content
    const compressed = compressExercises(allExercises)

    if (request.split_type) analysis.recommended_split = request.split_type
    if (request.periodization) analysis.recommended_periodization = request.periodization

    // Agent 2
    const agent2UserMessage = `Profile Analysis:
${JSON.stringify(analysis)}

Training Parameters:
- Duration: ${request.duration_weeks} weeks
- Sessions per week: ${request.sessions_per_week}
- Session length: ${request.session_minutes ?? 60} minutes
- Split type: ${analysis.recommended_split}
- Periodization: ${analysis.recommended_periodization}
- Goals: ${request.goals.join(", ")}
${request.additional_instructions ? `- Additional instructions: ${request.additional_instructions}` : ""}`

    const agent2Result = await callAgent<ProgramSkeleton>(
      PROGRAM_ARCHITECT_PROMPT,
      agent2UserMessage,
      programSkeletonSchema,
      { maxTokens: 16384, cacheSystemPrompt: true }
    )
    tokenUsage.agent2 = agent2Result.tokens_used
    const skeleton = agent2Result.content

    // Pre-filter exercises
    const availableEquipment = request.equipment_override ?? profile?.available_equipment ?? []
    const constraintsContext = JSON.stringify({
      exercise_constraints: analysis.exercise_constraints,
      available_equipment: availableEquipment,
      client_difficulty: profile?.experience_level ?? "beginner",
    })

    let filtered: typeof compressed
    try {
      filtered = await semanticFilterExercises(compressed, skeleton, availableEquipment, analysis)
    } catch {
      filtered = scoreAndFilterExercises(compressed, skeleton, availableEquipment, analysis)
    }
    const exerciseLibrary = formatExerciseLibrary(filtered)

    // Agent 3 with validation retry loop
    let assignment: ExerciseAssignment | null = null
    let validation: ValidationResult | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let feedbackSection = ""
      if (attempt > 0 && validation !== null) {
        const errorIssues = validation.issues.filter((i) => i.type === "error")
        feedbackSection = `\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Issues to fix:\n${JSON.stringify(errorIssues)}\n\nPlease fix ALL errors and try again.`
      }

      const agent3UserMessage = `Program Skeleton:
${JSON.stringify(skeleton)}

Constraints:
${constraintsContext}

Exercise Library (${filtered.length} exercises, pre-filtered for relevance):
${exerciseLibrary}${feedbackSection}`

      try {
        const agent3Result: AgentCallResult<ExerciseAssignment> = await callAgent<ExerciseAssignment>(
          EXERCISE_SELECTOR_PROMPT,
          agent3UserMessage,
          exerciseAssignmentSchema,
          { maxTokens: 16384, cacheSystemPrompt: true }
        )
        tokenUsage.agent3 += agent3Result.tokens_used
        assignment = agent3Result.content

        validation = validateProgram(skeleton, assignment, analysis, compressed, availableEquipment, profile?.experience_level ?? "beginner")

        if (validation.pass || !validation.issues.some((i) => i.type === "error")) break
        retries++
      } catch (agentError) {
        if (attempt === MAX_RETRIES) {
          throw new Error(`Exercise selection failed after ${MAX_RETRIES + 1} attempts: ${agentError instanceof Error ? agentError.message : "Unknown error"}`)
        }
        retries++
      }
    }

    if (!assignment || !validation) throw new Error("Failed to generate exercise assignments")

    // Create program
    const programCategory = deriveProgramCategory(request.goals)
    const programDifficulty = mapDifficulty(profile?.experience_level ?? null)
    const goalsLabel = request.goals.map((g) => g.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" & ")
    const splitLabel = skeleton.split_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

    const program = await createProgram({
      name: `${clientName}'s ${request.duration_weeks}-Week ${goalsLabel} Program`,
      description: `A ${request.duration_weeks}-week ${splitLabel.toLowerCase()} program designed for ${goalsLabel.toLowerCase()}, training ${request.sessions_per_week}x per week. ${skeleton.notes}`,
      category: [programCategory],
      difficulty: programDifficulty,
      duration_weeks: request.duration_weeks,
      sessions_per_week: request.sessions_per_week,
      split_type: skeleton.split_type,
      periodization: skeleton.periodization,
      is_public: request.is_public ?? false,
      is_ai_generated: true,
      ai_generation_params: { request, analysis_summary: { split: analysis.recommended_split, periodization: analysis.recommended_periodization, training_age: analysis.training_age_category, constraints_count: analysis.exercise_constraints.length }, validation: { pass: validation.pass, warnings: validation.issues.filter((i) => i.type === "warning").length, errors: validation.issues.filter((i) => i.type === "error").length }, token_usage: tokenUsage },
      is_active: true,
      created_by: requestedBy,
      price_cents: null,
      target_user_id: null,
    })

    // Insert exercises
    const slotLookup = new Map<string, { week_number: number; day_of_week: number; order_index: number }>()
    const slotDetailsLookup = new Map<string, { sets: number; reps: string; rest_seconds: number; rpe_target: number | null; tempo: string | null; group_tag: string | null; technique: ExerciseSlot["technique"] }>()

    for (const week of skeleton.weeks) {
      for (const day of week.days) {
        day.slots.forEach((slot, idx) => {
          slotLookup.set(slot.slot_id, { week_number: week.week_number, day_of_week: day.day_of_week, order_index: idx })
          slotDetailsLookup.set(slot.slot_id, { sets: slot.sets, reps: slot.reps, rest_seconds: slot.rest_seconds, rpe_target: slot.rpe_target, tempo: slot.tempo, group_tag: slot.group_tag, technique: slot.technique ?? "straight_set" })
        })
      }
    }

    const insertPromises = assignment.assignments.map((assigned) => {
      const location = slotLookup.get(assigned.slot_id)
      const details = slotDetailsLookup.get(assigned.slot_id)
      if (!location || !details) return Promise.resolve(null)
      return addExerciseToProgram({ program_id: program.id, exercise_id: assigned.exercise_id, day_of_week: location.day_of_week, week_number: location.week_number, order_index: location.order_index, sets: details.sets, reps: details.reps, duration_seconds: null, rest_seconds: details.rest_seconds, notes: assigned.notes, rpe_target: details.rpe_target, intensity_pct: null, tempo: details.tempo, group_tag: details.group_tag, technique: details.technique ?? "straight_set" })
    })

    await Promise.all(insertPromises)

    // Auto-assign
    try {
      await createAssignment({ program_id: program.id, user_id: request.client_id, assigned_by: requestedBy, start_date: new Date().toISOString().split("T")[0], end_date: null, status: "active", notes: "Auto-assigned from AI program generation" })
    } catch (assignError) {
      console.error("[generate] Failed to auto-assign:", assignError)
    }

    // Email notification
    try {
      const [client, programData] = await Promise.all([getUserById(request.client_id), getProgramById(program.id)])
      await sendProgramReadyEmail(client.email, client.first_name, programData.name)
    } catch (emailError) {
      console.error("[generate] Failed to send email:", emailError)
    }

    // Update log
    const durationMs = Date.now() - startTime
    tokenUsage.total = tokenUsage.agent1 + tokenUsage.agent2 + tokenUsage.agent3 + tokenUsage.agent4

    await updateGenerationLog(log.id, {
      program_id: program.id,
      status: "completed",
      tokens_used: tokenUsage.total,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
      output_summary: { program_id: program.id, program_name: program.name, exercises_assigned: assignment.assignments.length, validation_pass: validation.pass, warnings: validation.issues.filter((i) => i.type === "warning").length, retries },
    })

    return { program_id: program.id, validation, token_usage: tokenUsage, duration_ms: durationMs, retries }
  } catch (error) {
    const durationMs = Date.now() - startTime
    tokenUsage.total = tokenUsage.agent1 + tokenUsage.agent2 + tokenUsage.agent3 + tokenUsage.agent4
    const errorMessage = error instanceof Error ? error.message : "Unknown error during program generation"

    await updateGenerationLog(log.id, {
      status: "failed",
      error_message: errorMessage,
      tokens_used: tokenUsage.total,
      duration_ms: durationMs,
    }).catch((logError) => {
      console.error("Failed to update generation log:", logError)
    })

    throw error
  }
}
