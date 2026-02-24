import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAssessmentQuestions } from "@/lib/db/assessment-questions"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const questions = await getAssessmentQuestions(true) // active only
    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Assessment questions GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch assessment questions" },
      { status: 500 }
    )
  }
}
