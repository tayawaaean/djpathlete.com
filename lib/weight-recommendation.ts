import type { Exercise, ExerciseProgress, ProgramExercise } from "@/types/database"

// ─── Types ──────────────────────────────────────────────────────────────────

export type Trend = "increasing" | "decreasing" | "stable" | "insufficient_data"
export type Confidence = "high" | "medium" | "low" | "none"

export interface WeightRecommendation {
  recommended_kg: number | null
  reasoning: string
  confidence: Confidence
  estimated_1rm: number | null
  last_weight_kg: number | null
  last_rpe: number | null
  trend: Trend
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Epley formula: estimate 1RM from weight and reps */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return weightKg
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

/** Derive working weight from a 1RM and intensity percentage */
export function weightFromIntensity(oneRepMax: number, intensityPct: number): number {
  return Math.round((oneRepMax * intensityPct) / 100 * 2) / 2 // round to nearest 0.5
}

/** Parse reps string like "8" or "8-12" into a single number (uses the lower end) */
function parseReps(reps: string | null): number | null {
  if (!reps) return null
  const match = reps.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Get the weight increment based on exercise characteristics.
 * Upper-body / isolation → 2.5kg, lower-body compound → 5kg
 */
function getIncrement(exercise: Pick<Exercise, "movement_pattern" | "is_compound">): number {
  const lowerPatterns = ["squat", "hinge", "lunge", "carry"]
  const isLower = exercise.movement_pattern
    ? lowerPatterns.includes(exercise.movement_pattern)
    : false
  return isLower && exercise.is_compound ? 5 : 2.5
}

/** Determine weight trend from recent history (newest first) */
function computeTrend(history: ExerciseProgress[]): Trend {
  const weights = history
    .filter((h) => h.weight_kg != null)
    .map((h) => h.weight_kg!)
  if (weights.length < 2) return "insufficient_data"

  // Compare most recent 3 entries (or whatever is available)
  const recent = weights.slice(0, Math.min(3, weights.length))
  const allIncreasing = recent.every((w, i) => i === 0 || w <= recent[i - 1])
  const allDecreasing = recent.every((w, i) => i === 0 || w >= recent[i - 1])

  if (allIncreasing && recent[0] > recent[recent.length - 1]) return "increasing"
  if (allDecreasing && recent[0] < recent[recent.length - 1]) return "decreasing"
  return "stable"
}

// ─── Main Recommendation ────────────────────────────────────────────────────

export function getWeightRecommendation(
  history: ExerciseProgress[],
  exercise: Pick<Exercise, "is_bodyweight" | "is_compound" | "movement_pattern" | "name">,
  prescription?: Pick<ProgramExercise, "sets" | "reps" | "intensity_pct" | "rpe_target"> | null
): WeightRecommendation {
  // Bodyweight exercise — no weight recommendation
  if (exercise.is_bodyweight) {
    return {
      recommended_kg: null,
      reasoning: "Focus on reps and form",
      confidence: "high",
      estimated_1rm: null,
      last_weight_kg: null,
      last_rpe: null,
      trend: "stable",
    }
  }

  // No history — start light
  if (history.length === 0) {
    return {
      recommended_kg: null,
      reasoning: "Start light, find your working weight",
      confidence: "none",
      estimated_1rm: null,
      last_weight_kg: null,
      last_rpe: null,
      trend: "insufficient_data",
    }
  }

  // Latest entry (history is sorted newest-first)
  const latest = history[0]
  const lastWeight = latest.weight_kg
  const lastRpe = latest.rpe
  const trend = computeTrend(history)

  // Estimate 1RM from last entry if weight and reps available
  const lastReps = parseReps(latest.reps_completed)
  const estimated1rm =
    lastWeight && lastReps ? Math.round(estimate1RM(lastWeight, lastReps)) : null

  // If prescription has intensity_pct and we have an estimated 1RM, use that
  if (prescription?.intensity_pct && estimated1rm) {
    const computed = weightFromIntensity(estimated1rm, prescription.intensity_pct)
    return {
      recommended_kg: computed,
      reasoning: `Based on estimated 1RM of ${estimated1rm}kg at ${prescription.intensity_pct}% intensity`,
      confidence: "high",
      estimated_1rm: estimated1rm,
      last_weight_kg: lastWeight,
      last_rpe: lastRpe,
      trend,
    }
  }

  // No weight logged previously
  if (lastWeight == null) {
    return {
      recommended_kg: null,
      reasoning: "Start light, find your working weight",
      confidence: "none",
      estimated_1rm: null,
      last_weight_kg: null,
      last_rpe: lastRpe,
      trend: "insufficient_data",
    }
  }

  const increment = getIncrement(exercise)

  // No RPE recorded — keep same weight, prompt for RPE
  if (lastRpe == null) {
    return {
      recommended_kg: lastWeight,
      reasoning: "Same as last session — log RPE to get better recommendations",
      confidence: "low",
      estimated_1rm: estimated1rm,
      last_weight_kg: lastWeight,
      last_rpe: null,
      trend,
    }
  }

  // RPE-based progression
  if (lastRpe <= 7) {
    return {
      recommended_kg: lastWeight + increment,
      reasoning: `Last session felt easy (RPE ${lastRpe}) — increase by ${increment}kg`,
      confidence: "high",
      estimated_1rm: estimated1rm,
      last_weight_kg: lastWeight,
      last_rpe: lastRpe,
      trend,
    }
  }

  if (lastRpe === 8) {
    return {
      recommended_kg: lastWeight,
      reasoning: `Right on target (RPE ${lastRpe}) — maintain weight`,
      confidence: "high",
      estimated_1rm: estimated1rm,
      last_weight_kg: lastWeight,
      last_rpe: lastRpe,
      trend,
    }
  }

  if (lastRpe === 9) {
    return {
      recommended_kg: lastWeight,
      reasoning: `Hard effort (RPE ${lastRpe}) — maintain weight, focus on reps`,
      confidence: "medium",
      estimated_1rm: estimated1rm,
      last_weight_kg: lastWeight,
      last_rpe: lastRpe,
      trend,
    }
  }

  // RPE 10 — decrease
  return {
    recommended_kg: Math.max(0, lastWeight - increment),
    reasoning: `Max effort last session (RPE ${lastRpe}) — reduce by ${increment}kg`,
    confidence: "medium",
    estimated_1rm: estimated1rm,
    last_weight_kg: lastWeight,
    last_rpe: lastRpe,
    trend,
  }
}
