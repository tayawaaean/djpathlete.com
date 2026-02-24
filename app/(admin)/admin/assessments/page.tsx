import { ClipboardCheck } from "lucide-react"
import { getAllAssessmentResults } from "@/lib/db/assessments"
import { AssessmentPageClient } from "./AssessmentPageClient"
import type { AssessmentResult } from "@/types/database"

export const metadata = { title: "Assessments | Admin" }

type ResultWithUser = AssessmentResult & {
  users: { first_name: string; last_name: string; email: string } | null
}

export default async function AdminAssessmentsPage() {
  let results: ResultWithUser[] = []
  try {
    results = (await getAllAssessmentResults()) as ResultWithUser[]
  } catch {
    // Table may not exist yet
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="size-5 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold text-primary">Assessments</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Manage assessment questions and view client results.
          </p>
        </div>
      </div>

      <AssessmentPageClient results={results} />
    </div>
  )
}
