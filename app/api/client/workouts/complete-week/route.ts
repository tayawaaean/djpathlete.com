import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { advanceWeek, getAssignmentById } from "@/lib/db/assignments"
import { z } from "zod"

const completeWeekSchema = z.object({
  assignmentId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = completeWeekSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { assignmentId } = parsed.data

    // Verify ownership — the assignment must belong to the current user
    const assignment = await getAssignmentById(assignmentId)
    if (assignment.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (assignment.status !== "active") {
      return NextResponse.json(
        { error: "Assignment is not active" },
        { status: 400 }
      )
    }

    const result = await advanceWeek(assignmentId)

    return NextResponse.json({
      assignment: result,
      programCompleted: result.program_completed,
    })
  } catch (error) {
    console.error("Complete week POST error:", error)
    return NextResponse.json(
      { error: "Failed to advance week" },
      { status: 500 }
    )
  }
}
