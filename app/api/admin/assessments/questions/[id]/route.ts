import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  updateAssessmentQuestion,
  deleteAssessmentQuestion,
} from "@/lib/db/assessment-questions"

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

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (body.section !== undefined) updates.section = body.section
    if (body.question_text !== undefined) updates.question_text = body.question_text
    if (body.question_type !== undefined) updates.question_type = body.question_type
    if (body.movement_pattern !== undefined) updates.movement_pattern = body.movement_pattern
    if (body.options !== undefined) updates.options = body.options
    if (body.parent_question_id !== undefined) updates.parent_question_id = body.parent_question_id
    if (body.parent_answer !== undefined) updates.parent_answer = body.parent_answer
    if (body.level_impact !== undefined) updates.level_impact = body.level_impact
    if (body.order_index !== undefined) updates.order_index = body.order_index
    if (body.is_active !== undefined) updates.is_active = body.is_active

    const question = await updateAssessmentQuestion(id, updates)
    return NextResponse.json(question)
  } catch (error) {
    console.error("Admin assessment question PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update question" },
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
    await deleteAssessmentQuestion(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin assessment question DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    )
  }
}
