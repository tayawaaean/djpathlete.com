import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAssessmentResults } from "@/lib/db/assessment-questions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const results = await getAssessmentResults(userId)
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Admin assessment results GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch assessment results" },
      { status: 500 }
    )
  }
}
