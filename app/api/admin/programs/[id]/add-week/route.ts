import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getProgramById, updateProgram } from "@/lib/db/programs"
import { getFirstActiveAssignmentForProgram, updateAssignment } from "@/lib/db/assignments"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await params
    const program = await getProgramById(id)
    const newDuration = (program.duration_weeks ?? 1) + 1

    await updateProgram(id, { duration_weeks: newDuration })

    // Also update the active assignment's total_weeks if one exists
    const activeAssignment = await getFirstActiveAssignmentForProgram(id)
    if (activeAssignment) {
      await updateAssignment(activeAssignment.id, { total_weeks: newDuration })
    }

    return NextResponse.json(
      { new_week_number: newDuration },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: "Failed to add week. Please try again." },
      { status: 500 }
    )
  }
}
