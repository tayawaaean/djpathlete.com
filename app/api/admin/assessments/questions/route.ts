import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getAssessmentQuestions,
  createAssessmentQuestion,
} from "@/lib/db/assessment-questions"
import type { AssessmentSection, AssessmentQuestionType } from "@/types/database"

const VALID_SECTIONS: AssessmentSection[] = [
  "background",
  "movement_screen",
  "context",
  "preferences",
]

const VALID_TYPES: AssessmentQuestionType[] = [
  "yes_no",
  "single_select",
  "multi_select",
  "number",
  "text",
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const questions = await getAssessmentQuestions()
    return NextResponse.json(questions)
  } catch (error) {
    console.error("Admin assessment questions GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch assessment questions" },
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

    // Validate required fields
    if (!body.question_text?.trim()) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      )
    }

    if (!VALID_SECTIONS.includes(body.section)) {
      return NextResponse.json(
        { error: "Invalid section" },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(body.question_type)) {
      return NextResponse.json(
        { error: "Invalid question type" },
        { status: 400 }
      )
    }

    const question = await createAssessmentQuestion({
      section: body.section,
      question_text: body.question_text.trim(),
      question_type: body.question_type,
      movement_pattern: body.movement_pattern || null,
      options: body.options || null,
      parent_question_id: body.parent_question_id || null,
      parent_answer: body.parent_answer || null,
      level_impact: body.level_impact || null,
      order_index: body.order_index ?? 0,
      is_active: body.is_active ?? true,
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error("Admin assessment question POST error:", error)
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    )
  }
}
