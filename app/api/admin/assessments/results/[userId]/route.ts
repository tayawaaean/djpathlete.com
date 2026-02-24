import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAssessmentResultsByUser } from "@/lib/db/assessments"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params
    const results = await getAssessmentResultsByUser(userId)
    return NextResponse.json(results)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assessment results." },
      { status: 500 }
    )
  }
}
