"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare,
  Star,
  Target,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InsightsData {
  overview: {
    total_conversations: number
    total_feedback: number
    avg_accuracy: number | null
    avg_relevance: number | null
    avg_helpfulness: number | null
    thumbs_up_count: number
    thumbs_down_count: number
  }
  feedback_trends: {
    week: string
    avg_accuracy: number | null
    avg_relevance: number | null
    avg_helpfulness: number | null
    count: number
  }[]
  outcomes: {
    total_predictions: number
    resolved_count: number
    avg_accuracy: number | null
    positive_count: number
    negative_count: number
  }
  weight_accuracy: {
    total: number
    resolved: number
    avg_accuracy: number | null
    within_5pct: number
    within_10pct: number
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtitle?: string
  iconColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center",
            iconColor ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-4" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function RatingBar({
  label,
  value,
  maxValue = 5,
}: {
  label: string
  value: number | null
  maxValue?: number
}) {
  const pct = value ? (value / maxValue) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2">
        <div
          className="bg-accent rounded-full h-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">
        {value ? value.toFixed(1) : "—"}/5
      </span>
    </div>
  )
}

export function AiInsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/ai/insights")
      if (!res.ok) throw new Error("Failed to fetch insights")
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading && !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading AI insights...
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="text-center py-12 text-error">
        {error}
        <Button variant="outline" size="sm" className="ml-3" onClick={fetchData}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const thumbsTotal = data.overview.thumbs_up_count + data.overview.thumbs_down_count
  const thumbsUpPct = thumbsTotal > 0 ? Math.round((data.overview.thumbs_up_count / thumbsTotal) * 100) : 0

  const outcomePct = data.outcomes.resolved_count > 0
    ? Math.round((data.outcomes.positive_count / data.outcomes.resolved_count) * 100)
    : null

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total Conversations"
          value={data.overview.total_conversations.toLocaleString()}
          subtitle="Across all AI features"
        />
        <StatCard
          icon={Star}
          label="Feedback Received"
          value={data.overview.total_feedback.toLocaleString()}
          subtitle={thumbsTotal > 0 ? `${thumbsUpPct}% positive (thumbs)` : "No thumbs ratings yet"}
          iconColor="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={Target}
          label="Predictions Made"
          value={data.outcomes.total_predictions.toLocaleString()}
          subtitle={`${data.outcomes.resolved_count} resolved`}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Outcome Accuracy"
          value={data.outcomes.avg_accuracy ? `${(data.outcomes.avg_accuracy * 100).toFixed(0)}%` : "—"}
          subtitle={outcomePct ? `${outcomePct}% positive outcomes` : "No resolved outcomes yet"}
          iconColor="bg-green-100 text-green-600"
        />
      </div>

      {/* Feedback Ratings + Weight Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Average Ratings */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Average Feedback Ratings</h3>
          </div>
          <div className="p-4 space-y-3">
            <RatingBar label="Accuracy" value={data.overview.avg_accuracy} />
            <RatingBar label="Relevance" value={data.overview.avg_relevance} />
            <RatingBar label="Helpfulness" value={data.overview.avg_helpfulness} />

            {thumbsTotal > 0 && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground w-28">Client Thumbs</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <ThumbsUp className="size-3.5" />
                    {data.overview.thumbs_up_count}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-red-500">
                    <ThumbsDown className="size-3.5" />
                    {data.overview.thumbs_down_count}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weight Prediction Accuracy */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Weight Prediction Accuracy</h3>
          </div>
          <div className="p-4">
            {data.weight_accuracy.total === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No weight predictions yet. Use the AI Coach to start tracking.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-semibold">
                      {data.weight_accuracy.avg_accuracy
                        ? `${(data.weight_accuracy.avg_accuracy * 100).toFixed(0)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {data.weight_accuracy.resolved > 0
                        ? `${Math.round((data.weight_accuracy.within_5pct / data.weight_accuracy.resolved) * 100)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Within 5%</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {data.weight_accuracy.resolved > 0
                        ? `${Math.round((data.weight_accuracy.within_10pct / data.weight_accuracy.resolved) * 100)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Within 10%</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {data.weight_accuracy.total} total predictions, {data.weight_accuracy.resolved} resolved
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Trends */}
      {data.feedback_trends.length > 0 && (
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Feedback Trends (Weekly)</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Week</th>
                  <th className="pb-2 font-medium">Accuracy</th>
                  <th className="pb-2 font-medium">Relevance</th>
                  <th className="pb-2 font-medium">Helpfulness</th>
                  <th className="pb-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.feedback_trends.map((row) => (
                  <tr key={row.week} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{row.week}</td>
                    <td className="py-2">{row.avg_accuracy?.toFixed(1) ?? "—"}</td>
                    <td className="py-2">{row.avg_relevance?.toFixed(1) ?? "—"}</td>
                    <td className="py-2">{row.avg_helpfulness?.toFixed(1) ?? "—"}</td>
                    <td className="py-2">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
