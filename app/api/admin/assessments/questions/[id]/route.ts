import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { assessmentQuestionSchema } from "@/lib/validators/assessment"
import { updateQuestion, deleteQuestion } from "@/lib/db/assessments"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const result = assessmentQuestionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const question = await updateQuestion(id, result.data)
    return NextResponse.json(question)
  } catch {
    return NextResponse.json(
      { error: "Failed to update assessment question. Please try again." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await deleteQuestion(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete assessment question. Please try again." },
      { status: 500 }
    )
  }
}
