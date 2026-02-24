import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Activity,
  Calendar,
  BarChart3,
  Target,
  ClipboardList,
} from "lucide-react"
import { getUserById } from "@/lib/db/users"
import { Badge } from "@/components/ui/badge"
import type { AbilityLevel, AssessmentResult, ComputedLevels } from "@/types/database"

export const metadata = { title: "Client Assessments" }

const LEVEL_COLORS: Record<AbilityLevel, string> = {
  beginner: "bg-warning/10 text-warning border-warning/20",
  intermediate: "bg-primary/10 text-primary border-primary/20",
  advanced: "bg-success/10 text-success border-success/20",
  elite: "bg-purple-100 text-purple-700 border-purple-200",
}

const LEVEL_LABELS: Record<AbilityLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function LevelBadge({ level }: { level: AbilityLevel }) {
  return (
    <Badge className={`text-[10px] ${LEVEL_COLORS[level]}`} variant="outline">
      {LEVEL_LABELS[level]}
    </Badge>
  )
}

function LevelsGrid({ levels }: { levels: ComputedLevels }) {
  const patterns = [
    { key: "overall" as const, label: "Overall" },
    { key: "squat" as const, label: "Squat" },
    { key: "push" as const, label: "Push" },
    { key: "pull" as const, label: "Pull" },
    { key: "hinge" as const, label: "Hinge" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {patterns.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}:</span>
          <LevelBadge level={levels[key]} />
        </div>
      ))}
    </div>
  )
}

export default async function ClientAssessmentsPage({
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

  // Fetch assessment results
  let results: AssessmentResult[] = []
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/assessments/results/${id}`,
      { cache: "no-store" }
    )
    if (res.ok) {
      const data = await res.json()
      results = data.results ?? data ?? []
    }
  } catch {
    // API may not exist yet
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/admin/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to {user.first_name} {user.last_name}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Assessment History
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.first_name} {user.last_name}
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <Activity className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No assessment results for this client yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-xl border border-border p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(result.created_at)}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      result.assessment_type === "initial"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }
                  >
                    {result.assessment_type === "initial" ? "Initial" : "Reassessment"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Max Difficulty: {result.max_difficulty}
                    </span>
                  </div>
                  {result.triggered_program_id && (
                    <Link
                      href={`/admin/programs/${result.triggered_program_id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ClipboardList className="size-3.5" />
                      View Program
                    </Link>
                  )}
                </div>
              </div>

              {/* Computed levels */}
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Computed Levels
                </p>
                <LevelsGrid levels={result.computed_levels} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
