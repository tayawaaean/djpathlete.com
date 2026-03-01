import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { getProgress, getRelatedProgressByPattern } from "@/lib/db/progress"
import { getExerciseById } from "@/lib/db/exercises"
import { getProfileByUserId } from "@/lib/db/client-profiles"
import { getLatestAssessmentResult } from "@/lib/db/assessments"
import { streamChat, callAgent, MODEL_HAIKU } from "@/lib/ai/anthropic"
import { saveConversationBatch } from "@/lib/db/ai-conversations"
import { createOutcomeTracking } from "@/lib/db/ai-outcomes"
import { retrieveSimilarContext, formatRagContext, buildRagAugmentedPrompt, embedConversationMessage } from "@/lib/ai/rag"

export const maxDuration = 30

const requestSchema = z.object({
  exercise_id: z.string().min(1),
  current_session: z.array(z.object({
    set_number: z.number(),
    weight_kg: z.number().nullable(),
    reps: z.number(),
    rpe: z.number().nullable(),
  })).optional(),
  program_context: z.object({
    programName: z.string(),
    difficulty: z.string(),
    category: z.union([z.string(), z.array(z.string())]),
    periodization: z.string().nullable(),
    splitType: z.string().nullable(),
    currentWeek: z.number(),
    totalWeeks: z.number(),
    prescription: z.object({
      sets: z.number().nullable(),
      reps: z.string().nullable(),
      rpe_target: z.number().nullable(),
      intensity_pct: z.number().nullable(),
      tempo: z.string().nullable(),
      rest_seconds: z.number().nullable(),
      notes: z.string().nullable(),
      technique: z.string(),
      group_tag: z.string().nullable(),
    }),
  }).optional(),
})

// ─── Streaming prompt: coaching advice only (no JSON) ────────────────────────

const COACHING_PROMPT = `You are an expert strength & conditioning coach analyzing a client's exercise data.
You will receive the client's profile, exercise details, and their training context.

## Context Fields You May Receive

- **client_profile**: Demographics, experience level, goals, injuries, movement confidence, lifestyle factors
- **assessment_context**: Movement-pattern ability levels from their latest assessment (e.g., squat: intermediate, push: beginner). The "relevant_level" is the ability level specifically for the current exercise's movement pattern.
- **program**: The training program they're on, including week number, periodization type, and prescribed sets/reps/RPE/tempo targets
- **training_history**: Past sessions for THIS specific exercise (newest first)
- **related_exercise_history**: Recent sessions on similar exercises (same movement pattern). Use this to infer baseline strength when no history exists for the current exercise.
- **current_session**: Sets completed SO FAR in today's workout (the client is mid-workout NOW)

## Coaching Scenarios

### First-Ever Session (no training_history)
When no history exists for this exercise:
- Use assessment_context.relevant_level to gauge their ability for this movement pattern
- Use related_exercise_history to estimate appropriate starting weights (e.g., if they squat 60kg, they can likely leg press higher)
- Reference the program prescription (target sets/reps/RPE) and suggest starting conservatively
- Emphasize form, breathing, and finding their working weight
- If movement_confidence is "learning" or "comfortable", provide extra cues on setup and execution
- Suggest starting at 50-60% of what they might handle and ramping up across sets

### Mid-Workout (current_session provided)
The client is between sets RIGHT NOW:
- Provide immediate, actionable advice for their next set
- Adjust weight/rep suggestions based on how today's session is going
- Flag if RPE is climbing too fast or reps are dropping off
- Reference target RPE from program prescription if available
- Be concise — they need quick guidance

### Ongoing Training (training_history available)
When set-level data is available (set_details array), analyze per-set patterns including:
- RPE drift across sets
- Rep drop-off patterns
- Weight ramping patterns
- Intra-session consistency
- Whether they're hitting the program's prescribed RPE/rep targets

## Program Awareness
When program context is available:
- Frame advice relative to the program phase (e.g., "Week 2 of 8 — still building your base")
- Respect the periodization model: linear = steady progression, undulating = varied intensity, block = phase-specific focus
- Compare actual performance to prescribed targets
- If tempo is prescribed, remind them of it

## Cross-Exercise Intelligence
When related_exercise_history is available and no direct history exists:
- Use performance on related exercises to estimate appropriate starting points
- Note the relationship explicitly (e.g., "Based on your squat performance...")
- Be conservative — similar movement patterns don't mean identical strength

## Injury Awareness
If injury_details are present, proactively mention relevant modifications when the exercise could aggravate the listed areas.

If the client might benefit from an exercise substitution (e.g., plateau for 3+ sessions, or the exercise seems mismatched for their experience level), suggest 1-2 specific alternative exercises.

Write a personalized coaching recommendation (2-4 sentences). Be encouraging but honest. Focus on actionable advice.

IMPORTANT: Write ONLY the coaching text. No JSON, no metadata, no separators, no bullet lists of observations. Just the coaching recommendation as natural sentences.`

// ─── Structured analysis schema ──────────────────────────────────────────────

const coachAnalysisSchema = z.object({
  plateau_detected: z.boolean(),
  suggested_weight_kg: z.number().nullable(),
  deload_recommended: z.boolean(),
  key_observations: z.array(z.string()),
})

const ANALYSIS_PROMPT = `You are a data analyst for a strength & conditioning coach. Given a client's exercise data and profile, output a structured assessment.

Rules:
- plateau_detected: true ONLY if the client has been stuck at the same weight/reps for 3+ consecutive sessions. For first-ever sessions (no training_history), always false.
- suggested_weight_kg: a specific weight for their next session (null for bodyweight exercises). Base this on their recent trends, RPE, and progressive overload principles. For first sessions, estimate based on assessment levels, related exercise history, and client profile (body weight, gender, experience).
- deload_recommended: true ONLY if performance is clearly declining across sessions OR RPE has been consistently 9-10. For first-ever sessions, always false.
- key_observations: 2-4 brief bullet points about their training patterns. For first sessions, focus on readiness indicators from profile/assessment (e.g., "Intermediate-level squatter", "First time with this exercise").`

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { exercise_id, current_session, program_context } = parsed.data
    const userId = session.user.id

    // Fetch core data in parallel
    const [history, exercise, profile, assessment] = await Promise.all([
      getProgress(userId, exercise_id),
      getExerciseById(exercise_id),
      getProfileByUserId(userId),
      getLatestAssessmentResult(userId).catch(() => null),
    ])

    const isFirstSession = (!history || history.length === 0) && !current_session

    // For first sessions, fetch cross-exercise data by movement pattern
    let relatedHistory: Array<{ exercise_name: string; date: unknown; weight_kg: unknown; reps: unknown; rpe: unknown; sets: unknown }> = []
    if (isFirstSession && exercise.movement_pattern) {
      try {
        const related = await getRelatedProgressByPattern(
          userId,
          exercise.movement_pattern,
          exercise_id
        )
        relatedHistory = related.map((h) => ({
          exercise_name: h.exercises.name,
          date: h.completed_at,
          weight_kg: h.weight_kg,
          reps: h.reps_completed,
          rpe: h.rpe,
          sets: h.sets_completed,
        }))
      } catch {
        // Non-fatal — proceed without cross-exercise data
      }
    }

    // Take last 20 sessions
    const recentHistory = (history ?? []).slice(0, 20)

    // Build enriched client profile (skip empty values to save tokens)
    const clientProfile = profile
      ? {
          experience_level: profile.experience_level,
          goals: profile.goals,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm || undefined,
          gender: profile.gender || undefined,
          training_years: profile.training_years,
          injuries: profile.injuries || undefined,
          injury_details: profile.injury_details?.length ? profile.injury_details : undefined,
          movement_confidence: profile.movement_confidence || undefined,
          sleep_hours: profile.sleep_hours || undefined,
          stress_level: profile.stress_level || undefined,
          occupation_activity_level: profile.occupation_activity_level || undefined,
          available_equipment: profile.available_equipment?.length ? profile.available_equipment : undefined,
          training_background: profile.training_background ? profile.training_background.slice(0, 200) : undefined,
          exercise_likes: profile.exercise_likes ? profile.exercise_likes.slice(0, 200) : undefined,
          exercise_dislikes: profile.exercise_dislikes ? profile.exercise_dislikes.slice(0, 200) : undefined,
        }
      : null

    // Build assessment context
    const assessmentContext = assessment
      ? {
          computed_levels: assessment.computed_levels,
          relevant_level: exercise.movement_pattern
            ? assessment.computed_levels[exercise.movement_pattern] ?? assessment.computed_levels.overall
            : assessment.computed_levels.overall,
          overall_feeling: (assessment.feedback as Record<string, unknown> | null)?.overall_feeling ?? null,
          max_difficulty_score: assessment.max_difficulty_score,
        }
      : null

    // Build program context for the AI
    const programData = program_context
      ? {
          name: program_context.programName,
          difficulty: program_context.difficulty,
          periodization: program_context.periodization || undefined,
          week: `${program_context.currentWeek}/${program_context.totalWeeks}`,
          split_type: program_context.splitType || undefined,
          prescription: {
            target_sets: program_context.prescription.sets,
            target_reps: program_context.prescription.reps,
            target_rpe: program_context.prescription.rpe_target,
            intensity_pct: program_context.prescription.intensity_pct || undefined,
            tempo: program_context.prescription.tempo || undefined,
            rest_seconds: program_context.prescription.rest_seconds || undefined,
            technique: program_context.prescription.technique !== "standard"
              ? program_context.prescription.technique : undefined,
            coach_notes: program_context.prescription.notes || undefined,
          },
        }
      : undefined

    const userMessage = JSON.stringify({
      exercise: {
        name: exercise.name,
        category: exercise.category,
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment,
        is_bodyweight: exercise.is_bodyweight,
        is_compound: exercise.is_compound,
        movement_pattern: exercise.movement_pattern,
      },
      client_profile: clientProfile,
      ...(assessmentContext ? { assessment_context: assessmentContext } : {}),
      ...(programData ? { program: programData } : {}),
      training_history: recentHistory.map((h: Record<string, unknown>) => ({
        date: h.completed_at,
        sets: h.sets_completed,
        reps: h.reps_completed,
        weight_kg: h.weight_kg,
        rpe: h.rpe,
        notes: h.notes,
        ...(h.set_details ? { set_details: h.set_details } : {}),
      })),
      ...(relatedHistory.length > 0 ? { related_exercise_history: relatedHistory } : {}),
      ...(current_session ? { current_session } : {}),
    })

    // RAG: retrieve similar past coaching for this exercise type
    const exerciseSummary = `${exercise.name} ${exercise.movement_pattern ?? ""} ${exercise.muscle_group ?? ""}`
    const ragResults = await retrieveSimilarContext(
      exerciseSummary,
      "ai_coach",
      { threshold: 0.4, limit: 3 }
    )
    const ragContext = formatRagContext(ragResults)
    const augmentedPrompt = ragContext
      ? buildRagAugmentedPrompt(COACHING_PROMPT, ragContext)
      : COACHING_PROMPT

    // 1) Stream coaching text
    const streamResult = streamChat({
      system: augmentedPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 512,
    })

    const encoder = new TextEncoder()
    const capturedUserId = userId
    const coachSessionId = `coach-${userId}-${exercise_id}-${Date.now()}`

    const readable = new ReadableStream({
      async start(controller) {
        let accumulatedText = ""
        let analysisData: Record<string, unknown> | null = null
        try {
          // Stream coaching text deltas
          for await (const text of streamResult.textStream) {
            accumulatedText += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", text })}\n\n`)
            )
          }

          // 2) After stream completes, get structured analysis via generateObject
          //    Uses Haiku for speed + cost, with p-retry built in
          try {
            const analysisResult = await callAgent(
              ANALYSIS_PROMPT,
              userMessage,
              coachAnalysisSchema,
              { model: MODEL_HAIKU, maxTokens: 512, cacheSystemPrompt: true }
            )
            analysisData = analysisResult.content as unknown as Record<string, unknown>

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "analysis", data: analysisResult.content })}\n\n`
              )
            )
            // Track weight suggestion outcome (fire-and-forget)
            if (analysisResult.content.suggested_weight_kg != null) {
              createOutcomeTracking({
                conversation_message_id: null, // will be linked after save
                generation_log_id: null,
                user_id: capturedUserId,
                exercise_id: exercise_id,
                program_id: null,
                recommendation_type: "weight_suggestion",
                predicted_value: {
                  weight_kg: analysisResult.content.suggested_weight_kg,
                },
                actual_value: null,
                accuracy_score: null,
                outcome_positive: null,
                measured_at: null,
              }).catch(() => {})
            }

            // Track deload/plateau detection (fire-and-forget)
            if (analysisResult.content.deload_recommended) {
              createOutcomeTracking({
                conversation_message_id: null,
                generation_log_id: null,
                user_id: capturedUserId,
                exercise_id: exercise_id,
                program_id: null,
                recommendation_type: "deload_recommendation",
                predicted_value: { recommended: true },
                actual_value: null,
                accuracy_score: null,
                outcome_positive: null,
                measured_at: null,
              }).catch(() => {})
            }
          } catch (analysisErr) {
            // Analysis failure is non-fatal — coaching text already delivered
            console.warn(
              "[Coach DJP] Analysis generation failed:",
              analysisErr instanceof Error ? analysisErr.message : analysisErr
            )
          }

          // Save conversation history
          try {
            const saved = await saveConversationBatch([
              {
                user_id: capturedUserId,
                feature: "ai_coach" as const,
                session_id: coachSessionId,
                role: "user" as const,
                content: userMessage,
                metadata: {
                  exercise_id,
                  exercise_name: exercise.name,
                },
                tokens_input: null,
                tokens_output: null,
                model_used: null,
              },
              {
                user_id: capturedUserId,
                feature: "ai_coach" as const,
                session_id: coachSessionId,
                role: "assistant" as const,
                content: accumulatedText,
                metadata: {
                  exercise_id,
                  exercise_name: exercise.name,
                  ...(analysisData ? { analysis: analysisData } : {}),
                },
                tokens_input: null,
                tokens_output: null,
                model_used: MODEL_HAIKU,
              },
            ])
            const assistantMsg = saved.find((m) => m.role === "assistant")
            if (assistantMsg) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "message_id", id: assistantMsg.id })}\n\n`
                )
              )
              embedConversationMessage(assistantMsg.id).catch(() => {})
            }
          } catch {
            // Conversation save failure is non-fatal
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
          controller.close()
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Stream error"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message })}\n\n`
            )
          )
          controller.close()
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
    console.error("[Coach DJP] Error:", error)
    return NextResponse.json(
      { error: "Failed to get Coach DJP analysis" },
      { status: 500 }
    )
  }
}
