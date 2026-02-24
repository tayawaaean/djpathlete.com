import type {
  AssessmentQuestion,
  AssessmentResult,
  ComputedLevels,
  AbilityLevel,
  AssessmentFeedback,
} from "@/types/database"

/**
 * Map a numeric score to an ability level.
 */
export function scoreToLevel(score: number): AbilityLevel {
  if (score >= 9) return "elite"
  if (score >= 6) return "advanced"
  if (score >= 3) return "intermediate"
  return "beginner"
}

/**
 * Map an ability level to a max exercise difficulty score (1-10).
 */
export function levelToMaxDifficulty(level: AbilityLevel): number {
  switch (level) {
    case "elite":
      return 10
    case "advanced":
      return 9
    case "intermediate":
      return 7
    case "beginner":
      return 4
  }
}

/**
 * Compute ability levels from assessment answers and questions.
 * Only processes movement_screen questions with level_impact.
 */
export function computeLevels(
  answers: Record<string, string | string[] | number>,
  questions: AssessmentQuestion[]
): { computedLevels: ComputedLevels; maxDifficultyScore: number } {
  // Accumulate scores per movement pattern
  const patternScores: Record<string, number> = {}

  for (const question of questions) {
    if (question.section !== "movement_screen") continue
    if (!question.level_impact) continue
    if (!question.movement_pattern) continue

    const answer = answers[question.id]
    if (answer === undefined || answer === null) continue

    const answerStr = String(answer)
    const impact = question.level_impact[answerStr] ?? 0

    if (!patternScores[question.movement_pattern]) {
      patternScores[question.movement_pattern] = 0
    }
    patternScores[question.movement_pattern] += impact
  }

  // Convert scores to levels
  const computedLevels: ComputedLevels = { overall: "beginner" }
  let totalScore = 0
  let patternCount = 0

  for (const [pattern, score] of Object.entries(patternScores)) {
    computedLevels[pattern] = scoreToLevel(score)
    totalScore += score
    patternCount++
  }

  // Overall level is the average across all patterns
  if (patternCount > 0) {
    const avgScore = totalScore / patternCount
    computedLevels.overall = scoreToLevel(avgScore)
  }

  const maxDifficultyScore = levelToMaxDifficulty(computedLevels.overall)

  return { computedLevels, maxDifficultyScore }
}

/**
 * Compute difficulty adjustment for a reassessment.
 * Combines three signals:
 * 1. Client feedback (subjective)
 * 2. RPE data from logged workouts (objective)
 * 3. Movement re-screen improvements (assessment)
 */
export function computeReassessmentAdjustment(params: {
  feedback: AssessmentFeedback
  averageRpe: number | null
  previousResult: AssessmentResult
  newMovementScores: Record<string, number> // pattern → new score from re-screen
  questions: AssessmentQuestion[]
}): {
  newComputedLevels: ComputedLevels
  newMaxDifficultyScore: number
  adjustment: number
} {
  const { feedback, averageRpe, previousResult, newMovementScores, questions } = params

  let adjustment = 0

  // Signal 1: Client feedback
  if (feedback.overall_feeling === "too_easy") {
    adjustment += 1
  } else if (feedback.overall_feeling === "too_hard") {
    adjustment -= 1
  }

  // Signal 2: RPE data
  if (averageRpe !== null) {
    if (averageRpe < 6) {
      adjustment += 1 // Workouts were too light
    } else if (averageRpe > 9) {
      adjustment -= 1 // Workouts were too heavy
    }
  }

  // Signal 3: Movement re-screen improvements
  const previousLevels = previousResult.computed_levels
  let movementImproved = false

  for (const [pattern, newScore] of Object.entries(newMovementScores)) {
    const previousLevel = previousLevels[pattern] as AbilityLevel | undefined
    const newLevel = scoreToLevel(newScore)
    if (previousLevel && levelOrder(newLevel) > levelOrder(previousLevel)) {
      movementImproved = true
    }
  }

  if (movementImproved) {
    adjustment += 1
  }

  // Clamp the new max difficulty score
  const newMaxDifficultyScore = clamp(
    previousResult.max_difficulty_score + adjustment,
    1,
    10
  )

  // Recompute levels based on previous + new movement scores
  const newComputedLevels: ComputedLevels = {
    ...previousResult.computed_levels,
    overall: previousResult.computed_levels.overall,
  }

  // Update patterns that were re-screened
  for (const [pattern, score] of Object.entries(newMovementScores)) {
    newComputedLevels[pattern] = scoreToLevel(score)
  }

  // Recompute overall from all patterns
  const patternKeys = Object.keys(newComputedLevels).filter(
    (k) => k !== "overall"
  )
  if (patternKeys.length > 0) {
    const avgOrder =
      patternKeys.reduce(
        (sum, k) => sum + levelOrder(newComputedLevels[k]),
        0
      ) / patternKeys.length

    if (avgOrder >= 3.5) newComputedLevels.overall = "elite"
    else if (avgOrder >= 2.5) newComputedLevels.overall = "advanced"
    else if (avgOrder >= 1.5) newComputedLevels.overall = "intermediate"
    else newComputedLevels.overall = "beginner"
  }

  // Apply the overall adjustment to the overall level
  const overallOrder = levelOrder(newComputedLevels.overall)
  const adjustedOrder = clamp(overallOrder + (adjustment > 0 ? 0.5 : adjustment < 0 ? -0.5 : 0), 0, 4)
  if (adjustedOrder >= 3.5) newComputedLevels.overall = "elite"
  else if (adjustedOrder >= 2.5) newComputedLevels.overall = "advanced"
  else if (adjustedOrder >= 1.5) newComputedLevels.overall = "intermediate"
  else newComputedLevels.overall = "beginner"

  return {
    newComputedLevels,
    newMaxDifficultyScore,
    adjustment,
  }
}

/**
 * Compute movement screen scores from re-assessment answers.
 * Only considers answered questions for movement_screen section.
 */
export function computeMovementScoresFromAnswers(
  answers: Record<string, string | string[] | number>,
  questions: AssessmentQuestion[]
): Record<string, number> {
  const patternScores: Record<string, number> = {}

  for (const question of questions) {
    if (question.section !== "movement_screen") continue
    if (!question.level_impact) continue
    if (!question.movement_pattern) continue

    const answer = answers[question.id]
    if (answer === undefined || answer === null) continue

    const answerStr = String(answer)
    const impact = question.level_impact[answerStr] ?? 0

    if (!patternScores[question.movement_pattern]) {
      patternScores[question.movement_pattern] = 0
    }
    patternScores[question.movement_pattern] += impact
  }

  return patternScores
}

// ── Helpers ───────────────────────────────────────────────────────────

function levelOrder(level: AbilityLevel): number {
  switch (level) {
    case "beginner":
      return 1
    case "intermediate":
      return 2
    case "advanced":
      return 3
    case "elite":
      return 4
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
