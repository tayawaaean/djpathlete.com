import { NextResponse } from "next/server"
import { assignmentSchema } from "@/lib/validators/assignment"
import { createAssignment, getAssignmentByUserAndProgram } from "@/lib/db/assignments"
import { getProgramById } from "@/lib/db/programs"
import { getUserById } from "@/lib/db/users"
import { sendProgramReadyEmail } from "@/lib/email"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = assignmentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await getAssignmentByUserAndProgram(result.data.user_id, id)
    if (existing && existing.status === "active") {
      return NextResponse.json(
        { error: "This client already has an active assignment for this program." },
        { status: 409 }
      )
    }

    // Fetch program to get duration_weeks for total_weeks tracking
    const programData = await getProgramById(id)

    const assignment = await createAssignment({
      program_id: id,
      user_id: result.data.user_id,
      start_date: result.data.start_date,
      notes: result.data.notes ?? null,
      assigned_by: null,
      end_date: null,
      status: "active",
      current_week: 1,
      total_weeks: programData.duration_weeks ?? null,
    })

    // Send email notification
    try {
      const [client, program] = await Promise.all([
        getUserById(result.data.user_id),
        getProgramById(id),
      ])
      await sendProgramReadyEmail(client.email, client.first_name, program.name)
    } catch (emailError) {
      console.error("[assign] Failed to send email:", emailError)
    }

    return NextResponse.json(assignment, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to assign program. Please try again." },
      { status: 500 }
    )
  }
}
