"use client"

import { useState, useEffect, useCallback } from "react"
import { Sparkles, Loader2, AlertTriangle, TrendingDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AiCoachResponse {
  recommendation: string
  plateau_detected: boolean
  suggested_weight_kg: number | null
  deload_recommended: boolean
  key_observations: string[]
}

interface AiCoachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseId: string
  exerciseName: string
}

export function AiCoachDialog({
  open,
  onOpenChange,
  exerciseId,
  exerciseName,
}: AiCoachDialogProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiCoachResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/client/workouts/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_id: exerciseId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to get analysis")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [exerciseId])

  useEffect(() => {
    if (open && !result && !loading) {
      fetchAnalysis()
    }
  }, [open, result, loading, fetchAnalysis])

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setResult(null)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-accent" />
            AI Coach
          </DialogTitle>
          <DialogDescription>{exerciseName}</DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-6 text-primary animate-pulse" />
              </div>
              <Loader2 className="size-18 text-primary/30 animate-spin absolute -top-2 -left-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzing your training history...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">
              Analysis Failed
            </p>
            <p className="text-xs text-destructive/80">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAnalysis}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {result.plateau_detected && (
                <Badge variant="outline" className="gap-1 border-warning/30 text-warning">
                  <AlertTriangle className="size-3" />
                  Plateau Detected
                </Badge>
              )}
              {result.deload_recommended && (
                <Badge variant="outline" className="gap-1 border-error/30 text-error">
                  <TrendingDown className="size-3" />
                  Deload Recommended
                </Badge>
              )}
              {result.suggested_weight_kg != null && (
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                  Suggested: {result.suggested_weight_kg}kg
                </Badge>
              )}
            </div>

            {/* Recommendation */}
            <div className="rounded-lg bg-surface/50 border border-border p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {result.recommendation}
              </p>
            </div>

            {/* Key observations */}
            {result.key_observations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Key Observations
                </h4>
                <ul className="space-y-1.5">
                  {result.key_observations.map((obs, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <span className="text-primary mt-1 shrink-0">&#8226;</span>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
