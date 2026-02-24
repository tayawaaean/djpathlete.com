import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getAllQuestions,
  createQuestion,
} from "@/lib/db/assessments"
import type { AssessmentQuestion } from "@/types/database"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const questions = await getAllQuestions()
    return NextResponse.json(questions)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assessment questions." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const question = await createQuestion({
      section: body.section,
      movement_pattern: body.movement_pattern || null,
      question_text: body.question_text,
      question_type: body.question_type,
      options: body.options || null,
      parent_question_id: body.parent_question_id || null,
      parent_answer: body.parent_answer || null,
      level_impact: body.level_impact || null,
      order_index: body.order_index ?? 0,
      is_active: true,
    } as Omit<AssessmentQuestion, "id" | "created_at">)

    return NextResponse.json(question, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create assessment question." },
      { status: 500 }
    )
  }
}
