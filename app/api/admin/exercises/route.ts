import { NextResponse } from "next/server"
import { exerciseFormSchema } from "@/lib/validators/exercise"
import { createExercise } from "@/lib/db/exercises"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = exerciseFormSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const exercise = await createExercise({
      ...result.data,
      is_active: true,
      created_by: null,
      thumbnail_url: null,
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create exercise. Please try again." },
      { status: 500 }
    )
  }
}
