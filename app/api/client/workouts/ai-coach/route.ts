import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { getProgress } from "@/lib/db/progress"
import { getExerciseById } from "@/lib/db/exercises"
import { getProfileByUserId } from "@/lib/db/client-profiles"
import { callAgent } from "@/lib/ai/anthropic"

const requestSchema = z.object({
  exercise_id: z.string().uuid(),
})

const aiCoachResponseSchema = z.object({
  recommendation: z.string(),
  plateau_detected: z.boolean(),
  suggested_weight_kg: z.number().nullable(),
  deload_recommended: z.boolean(),
  key_observations: z.array(z.string()),
})

export type AiCoachResponse = z.infer<typeof aiCoachResponseSchema>

const SYSTEM_PROMPT = `You are an expert strength & conditioning coach analyzing a client's exercise history.
You will receive the client's profile, exercise details, and their recent training log for a specific exercise.

Analyze the data and return a JSON object with exactly these fields:
- recommendation: A concise paragraph of personalized coaching advice (2-4 sentences)
- plateau_detected: boolean — true if the client has been stuck at the same weight/reps for 3+ sessions
- suggested_weight_kg: number or null — a specific weight recommendation for their next session (null for bodyweight exercises)
- deload_recommended: boolean — true if performance is declining or RPE has been consistently high (9-10)
- key_observations: string[] — 2-4 brief bullet points about their training patterns

Be encouraging but honest. Focus on actionable advice.
Return ONLY the JSON object, no other text.`

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

    const { exercise_id } = parsed.data
    const userId = session.user.id

    // Fetch data in parallel
    const [history, exercise, profile] = await Promise.all([
      getProgress(userId, exercise_id),
      getExerciseById(exercise_id),
      getProfileByUserId(userId),
    ])

    if (!history || history.length === 0) {
      return NextResponse.json(
        { error: "No training history found for this exercise. Log at least one session first." },
        { status: 400 }
      )
    }

    // Take last 20 sessions
    const recentHistory = history.slice(0, 20)

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
      client_profile: profile
        ? {
            experience_level: profile.experience_level,
            goals: profile.goals,
            weight_kg: profile.weight_kg,
            training_years: profile.training_years,
            injuries: profile.injuries,
          }
        : null,
      training_history: recentHistory.map((h) => ({
        date: h.completed_at,
        sets: h.sets_completed,
        reps: h.reps_completed,
        weight_kg: h.weight_kg,
        rpe: h.rpe,
        notes: h.notes,
      })),
    })

    const result = await callAgent(
      SYSTEM_PROMPT,
      userMessage,
      aiCoachResponseSchema,
      { maxTokens: 1024 }
    )

    return NextResponse.json(result.content)
  } catch (error) {
    console.error("AI Coach error:", error)
    return NextResponse.json(
      { error: "Failed to get AI coach analysis" },
      { status: 500 }
    )
  }
}
