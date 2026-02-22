import { BarChart3, Brain, ClipboardCheck, CheckCircle } from "lucide-react"
import { getPrograms } from "@/lib/db/programs"
import { getAssignments, getAssignmentCountsByProgram } from "@/lib/db/assignments"
import { ProgramList } from "@/components/admin/ProgramList"
import type { Program, ProgramAssignment } from "@/types/database"

export const metadata = { title: "Programs" }

export default async function ProgramsPage() {
  const [programs, athleteCounts, assignments] = await Promise.all([
    getPrograms(),
    getAssignmentCountsByProgram(),
    getAssignments(),
  ])

  const progList = programs as Program[]
  const asgList = assignments as ProgramAssignment[]

  const totalPrograms = progList.length
  const aiGenerated = progList.filter((p) => p.is_ai_generated).length
  const activeAssignments = asgList.filter((a) => a.status === "active").length

  // Completion rate
  const completed = asgList.filter((a) => a.status === "completed").length
  const cancelled = asgList.filter((a) => a.status === "cancelled").length
  const completionRate =
    completed + cancelled > 0
      ? Math.round((completed / (completed + cancelled)) * 100)
      : 0

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Programs</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Programs</p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {totalPrograms}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">AI-Generated</p>
          </div>
          <p className="text-2xl font-semibold text-primary">{aiGenerated}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
              <ClipboardCheck className="size-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              Active Assignments
            </p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {activeAssignments}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {completionRate}%
          </p>
        </div>
      </div>

      <ProgramList programs={programs} athleteCounts={athleteCounts} />
    </div>
  )
}
