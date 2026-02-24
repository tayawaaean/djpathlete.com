"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ClipboardCheck,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AssessmentResult, AbilityLevel, ComputedLevels } from "@/types/database"

interface ClientAssessmentTimelineProps {
  results: AssessmentResult[]
}

const LEVEL_COLORS: Record<AbilityLevel, string> = {
  beginner: "bg-warning/10 text-warning",
  intermediate: "bg-primary/10 text-primary",
  advanced: "bg-success/10 text-success",
  elite: "bg-accent/10 text-accent-foreground",
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getDifficultyChange(
  current: number,
  previous: AssessmentResult | undefined
): { text: string; icon: typeof TrendingUp; color: string } | null {
  if (!previous) return null
  const diff = current - previous.max_difficulty_score
  if (diff > 0)
    return {
      text: `+${diff} from previous`,
      icon: TrendingUp,
      color: "text-success",
    }
  if (diff < 0)
    return {
      text: `${diff} from previous`,
      icon: TrendingDown,
      color: "text-destructive",
    }
  return { text: "No change", icon: Minus, color: "text-muted-foreground" }
}

function LevelBadges({ levels }: { levels: ComputedLevels }) {
  const entries = Object.entries(levels).filter(([key]) => key !== "overall")

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Overall badge first */}
      <Badge
        className={cn(
          "text-[10px]",
          LEVEL_COLORS[levels.overall] ?? "bg-muted text-muted-foreground"
        )}
      >
        Overall: {levels.overall}
      </Badge>

      {entries.map(([pattern, level]) => (
        <Badge
          key={pattern}
          variant="outline"
          className="text-[10px] capitalize"
        >
          {pattern}: {level as string}
        </Badge>
      ))}
    </div>
  )
}

export function ClientAssessmentTimeline({
  results,
}: ClientAssessmentTimelineProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10 mx-auto mb-4">
          <ClipboardCheck className="size-7 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-primary mb-2">
          No Assessments Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          This client has not completed any assessments. They will appear here
          once the client takes their initial assessment.
        </p>
      </div>
    )
  }

  // Sort by date, newest first (should already be sorted, but just in case)
  const sorted = [...results].sort(
    (a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border hidden sm:block" />

      <div className="space-y-6">
        {sorted.map((result, index) => {
          const isInitial = result.assessment_type === "initial"
          const previousResult = sorted[index + 1] // Previous chronologically (next in array since sorted newest first)
          const change = getDifficultyChange(
            result.max_difficulty_score,
            previousResult
          )
          const Icon = isInitial ? ClipboardCheck : RefreshCw

          return (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="flex gap-4 sm:gap-6"
            >
              {/* Date badge (left side) */}
              <div className="shrink-0 w-[56px] sm:w-[64px] text-right pt-1 hidden sm:block">
                <p className="text-xs font-medium text-foreground leading-tight">
                  {formatDate(result.completed_at)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatTime(result.completed_at)}
                </p>
              </div>

              {/* Timeline dot */}
              <div className="relative shrink-0 hidden sm:flex items-start pt-1">
                <div
                  className={cn(
                    "size-4 rounded-full border-2 bg-white z-10",
                    isInitial
                      ? "border-primary"
                      : "border-accent"
                  )}
                />
              </div>

              {/* Card (right side) */}
              <div className="flex-1 bg-white rounded-xl border border-border p-4 sm:p-5">
                {/* Mobile date */}
                <p className="text-[10px] text-muted-foreground mb-2 sm:hidden">
                  {formatDate(result.completed_at)} at{" "}
                  {formatTime(result.completed_at)}
                </p>

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "flex items-center justify-center size-8 rounded-lg",
                      isInitial ? "bg-primary/10" : "bg-accent/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        isInitial ? "text-primary" : "text-accent-foreground"
                      )}
                      strokeWidth={1.5}
                    />
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px]",
                      isInitial
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent-foreground"
                    )}
                  >
                    {isInitial ? "Initial Assessment" : "Reassessment"}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Max Difficulty: {result.max_difficulty_score}/10
                  </span>
                </div>

                {/* Computed Levels */}
                <div className="mb-3">
                  <LevelBadges levels={result.computed_levels} />
                </div>

                {/* Difficulty Change (for reassessments) */}
                {change && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs mb-3",
                      change.color
                    )}
                  >
                    <change.icon className="size-3.5" />
                    <span>{change.text}</span>
                  </div>
                )}

                {/* Feedback Summary (for reassessments) */}
                {result.feedback && (
                  <div className="bg-surface/50 rounded-lg p-3 mb-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1.5">
                      Feedback
                    </p>
                    <div className="space-y-1 text-xs text-foreground">
                      <p>
                        <span className="text-muted-foreground">
                          Overall feeling:
                        </span>{" "}
                        <span className="capitalize">
                          {result.feedback.overall_feeling.replace("_", " ")}
                        </span>
                      </p>
                      {result.feedback.exercises_too_easy.length > 0 && (
                        <p>
                          <span className="text-muted-foreground">
                            Too easy:
                          </span>{" "}
                          {result.feedback.exercises_too_easy.length} exercise
                          {result.feedback.exercises_too_easy.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      )}
                      {result.feedback.exercises_too_hard.length > 0 && (
                        <p>
                          <span className="text-muted-foreground">
                            Too hard:
                          </span>{" "}
                          {result.feedback.exercises_too_hard.length} exercise
                          {result.feedback.exercises_too_hard.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      )}
                      {result.feedback.rpe_average !== undefined && (
                        <p>
                          <span className="text-muted-foreground">
                            Avg RPE:
                          </span>{" "}
                          {result.feedback.rpe_average}
                        </p>
                      )}
                      {result.feedback.new_injuries && (
                        <p>
                          <span className="text-muted-foreground">
                            New injuries:
                          </span>{" "}
                          {result.feedback.new_injuries}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Triggered Program Link */}
                {result.triggered_program_id && (
                  <Link
                    href={`/admin/programs?id=${result.triggered_program_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View Generated Program
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
