"use client"

import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AssessmentQuestionBuilder } from "@/components/admin/AssessmentQuestionBuilder"
import { cn } from "@/lib/utils"
import type { AssessmentResult, AssessmentFeedback, AbilityLevel } from "@/types/database"

type ResultWithUser = AssessmentResult & {
  users: { first_name: string; last_name: string; email: string } | null
}

interface AssessmentPageClientProps {
  results: ResultWithUser[]
}

const LEVEL_COLORS: Record<AbilityLevel, string> = {
  beginner: "bg-warning/10 text-warning",
  intermediate: "bg-primary/10 text-primary",
  advanced: "bg-success/10 text-success",
  elite: "bg-accent/10 text-accent-foreground",
}

const TYPE_COLORS: Record<string, string> = {
  initial: "bg-primary/10 text-primary",
  reassessment: "bg-accent/10 text-accent-foreground",
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function AssessmentPageClient({ results }: AssessmentPageClientProps) {
  return (
    <Tabs defaultValue="questions">
      <TabsList className="mb-6">
        <TabsTrigger value="questions">Question Builder</TabsTrigger>
        <TabsTrigger value="results">
          Results Overview ({results.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="questions">
        <AssessmentQuestionBuilder />
      </TabsContent>

      <TabsContent value="results">
        {results.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No assessment results yet. Results will appear here once clients
            complete their assessments.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Overall Level
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Max Difficulty
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Feedback
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const overallLevel = result.computed_levels
                      .overall as AbilityLevel

                    return (
                      <tr
                        key={result.id}
                        className="border-b border-border last:border-b-0 hover:bg-surface/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {result.users ? (
                            <Link
                              href={`/admin/clients/${result.user_id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {result.users.first_name} {result.users.last_name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              Unknown
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cn(
                              "text-[10px]",
                              TYPE_COLORS[result.assessment_type] ??
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            {result.assessment_type === "initial"
                              ? "Initial"
                              : "Reassessment"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cn(
                              "text-[10px] capitalize",
                              LEVEL_COLORS[overallLevel] ??
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            {overallLevel}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-foreground font-medium">
                            {result.max_difficulty_score}
                          </span>
                          <span className="text-muted-foreground">/10</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {result.feedback ? (
                            <span className="capitalize text-muted-foreground">
                              {((result.feedback as unknown as AssessmentFeedback).overall_feeling ?? "").replace(
                                "_",
                                " "
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(result.completed_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/clients/${result.user_id}/assessments`}
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            View History
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
