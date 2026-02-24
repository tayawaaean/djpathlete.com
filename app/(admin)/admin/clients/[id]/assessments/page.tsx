import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ClipboardCheck } from "lucide-react"
import { getUserById } from "@/lib/db/users"
import { getAssessmentResultsByUser } from "@/lib/db/assessments"
import { ClientAssessmentTimeline } from "@/components/admin/ClientAssessmentTimeline"
import type { AssessmentResult } from "@/types/database"

export const metadata = { title: "Assessment History | Admin" }

export default async function ClientAssessmentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let user
  try {
    user = await getUserById(id)
  } catch {
    notFound()
  }

  let results: AssessmentResult[] = []
  try {
    results = await getAssessmentResultsByUser(id)
  } catch {
    // Assessment tables may not exist yet
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/admin/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to Client
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <ClipboardCheck className="size-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-primary">
              Assessment History
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.first_name} {user.last_name} &mdash; {results.length}{" "}
              assessment{results.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <ClientAssessmentTimeline results={results} />
    </div>
  )
}
