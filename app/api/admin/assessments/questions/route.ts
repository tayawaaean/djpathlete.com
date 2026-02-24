import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { assessmentQuestionSchema } from "@/lib/validators/assessment"
import { getAllQuestions, createQuestion } from "@/lib/db/assessments"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = assessmentQuestionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const question = await createQuestion(result.data)
    return NextResponse.json(question, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create assessment question. Please try again." },
      { status: 500 }
    )
  }
}
