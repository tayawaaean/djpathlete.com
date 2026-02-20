import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logProgress } from "@/lib/db/progress"
import { workoutLogSchema } from "@/lib/validators/workout-log"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = workoutLogSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Workout log validation failed:", parsed.error.flatten())
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const record = await logProgress({
      user_id: session.user.id,
      exercise_id: parsed.data.exercise_id,
      assignment_id: parsed.data.assignment_id,
      sets_completed: parsed.data.sets_completed,
      reps_completed: parsed.data.reps_completed,
      weight_kg: parsed.data.weight_kg,
      rpe: parsed.data.rpe,
      duration_seconds: parsed.data.duration_seconds,
      notes: parsed.data.notes,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Workout log POST error:", error)
    return NextResponse.json(
      { error: "Failed to log workout" },
      { status: 500 }
    )
  }
}
