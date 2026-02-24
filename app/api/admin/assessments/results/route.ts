import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAllAssessmentResults } from "@/lib/db/assessments"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const results = await getAllAssessmentResults()
    return NextResponse.json(results)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assessment results." },
      { status: 500 }
    )
  }
}
