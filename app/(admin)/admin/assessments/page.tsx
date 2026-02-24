import { Activity } from "lucide-react"
import { AssessmentQuestionBuilder } from "@/components/admin/AssessmentQuestionBuilder"
import { getAssessmentQuestions } from "@/lib/db/assessment-questions"
import type { AssessmentQuestion } from "@/types/database"

export const metadata = { title: "Assessments" }

export default async function AssessmentsPage() {
  let questions: AssessmentQuestion[] = []
  try {
    questions = await getAssessmentQuestions()
  } catch {
    // If the table doesn't exist yet, just show empty
  }

  const activeCount = questions.filter((q) => q.is_active).length
  const movementScreenCount = questions.filter((q) => q.section === "movement_screen").length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">
        Assessment Questions
      </h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Questions</p>
          </div>
          <p className="text-2xl font-semibold text-primary">{questions.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
              <Activity className="size-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Active Questions</p>
          </div>
          <p className="text-2xl font-semibold text-primary">{activeCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Movement Screen</p>
          </div>
          <p className="text-2xl font-semibold text-primary">{movementScreenCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6">
        <AssessmentQuestionBuilder questions={questions} />
      </div>
    </div>
  )
}
