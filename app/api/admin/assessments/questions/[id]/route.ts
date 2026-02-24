import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateQuestion, deleteQuestion } from "@/lib/db/assessments"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const question = await updateQuestion(id, {
      section: body.section,
      movement_pattern: body.movement_pattern ?? undefined,
      question_text: body.question_text,
      question_type: body.question_type,
      options: body.options ?? undefined,
      parent_question_id: body.parent_question_id ?? undefined,
      parent_answer: body.parent_answer ?? undefined,
      level_impact: body.level_impact ?? undefined,
      order_index: body.order_index ?? undefined,
      is_active: body.is_active ?? undefined,
    })

    return NextResponse.json(question)
  } catch {
    return NextResponse.json(
      { error: "Failed to update assessment question." },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await deleteQuestion(id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete assessment question." },
      { status: 500 }
    )
  }
}
