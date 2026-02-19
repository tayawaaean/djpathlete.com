import { NextResponse } from "next/server"
import { programExerciseUpdateSchema } from "@/lib/validators/program-exercise"
import { updateProgramExercise, removeExerciseFromProgram } from "@/lib/db/program-exercises"

type Params = { params: Promise<{ id: string; exerciseId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { exerciseId } = await params
    const body = await request.json()
    const result = programExerciseUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await updateProgramExercise(exerciseId, result.data)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: "Failed to update exercise. Please try again." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { exerciseId } = await params
    await removeExerciseFromProgram(exerciseId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to remove exercise. Please try again." },
      { status: 500 }
    )
  }
}
