import type { CompressedExercise } from "./types.js"

/**
 * Filter compressed exercises by max difficulty score.
 */
export function filterByDifficultyScore(
  exercises: CompressedExercise[],
  maxDifficultyScore?: number
): CompressedExercise[] {
  if (maxDifficultyScore === undefined) return exercises
  return exercises.filter((ex) => {
    if (ex.difficulty_score === null || ex.difficulty_score === undefined) return false
    return ex.difficulty_score <= maxDifficultyScore
  })
}

/**
 * Format compressed exercises as compact JSON for inclusion in AI prompts.
 */
export function formatExerciseLibrary(exercises: CompressedExercise[]): string {
  return JSON.stringify(exercises, null, 0)
}
