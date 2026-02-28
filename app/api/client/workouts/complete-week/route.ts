import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { advanceWeek, getAssignmentById } from "@/lib/db/assignments"
import { getProgramById } from "@/lib/db/programs"
import { getUserById } from "@/lib/db/users"
import { sendCoachProgramCompletedNotification } from "@/lib/email"
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

    // Notify coach when the program is fully completed
    if (result.program_completed) {
      try {
        const [client, program] = await Promise.all([
          getUserById(session.user.id),
          getProgramById(assignment.program_id),
        ])

        const coachEmail = process.env.COACH_EMAIL ?? "admin@djpathlete.com"
        const coachFirstName = process.env.COACH_FIRST_NAME ?? "Coach"

        await sendCoachProgramCompletedNotification({
          coachEmail,
          coachFirstName,
          clientName: `${client.first_name} ${client.last_name}`.trim(),
          clientId: session.user.id,
          programName: program?.name ?? "Unknown Program",
        })
      } catch {
        // Coach notification failure should not affect the client response
      }
    }

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
