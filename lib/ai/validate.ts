import type {
  ProfileAnalysis,
  ProgramSkeleton,
  ExerciseAssignment,
  ValidationResult,
  ValidationIssue,
} from "@/lib/ai/types"
import type { CompressedExercise } from "@/lib/ai/exercise-context"

/**
 * Code-based program validation — replaces the AI Agent 4.
 * Checks equipment violations, injury conflicts, duplicates,
 * muscle balance, difficulty mismatches, and movement pattern coverage.
 * Runs in <1ms with zero token cost.
 */
export function validateProgram(
  skeleton: ProgramSkeleton,
  assignment: ExerciseAssignment,
  analysis: ProfileAnalysis,
  exercises: CompressedExercise[],
  availableEquipment: string[],
  clientDifficulty: string
): ValidationResult {
  const issues: ValidationIssue[] = []

  // Build lookups
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

  const slotMap = new Map<
    string,
    { week: number; day: number; role: string; movement: string; muscles: string[] }
  >()
  for (const week of skeleton.weeks) {
    for (const day of week.days) {
      for (const slot of day.slots) {
        slotMap.set(slot.slot_id, {
          week: week.week_number,
          day: day.day_of_week,
          role: slot.role,
          movement: slot.movement_pattern,
          muscles: slot.target_muscles,
        })
      }
    }
  }

  // Constraint lookups
  const avoidedMovements = new Set(
    analysis.exercise_constraints
      .filter((c) => c.type === "avoid_movement")
      .map((c) => c.value.toLowerCase())
  )
  const avoidedEquipment = new Set(
    analysis.exercise_constraints
      .filter((c) => c.type === "avoid_equipment")
      .map((c) => c.value.toLowerCase())
  )
  const avoidedMuscles = new Set(
    analysis.exercise_constraints
      .filter((c) => c.type === "avoid_muscle")
      .map((c) => c.value.toLowerCase())
  )
  const equipmentSet = new Set(availableEquipment.map((e) => e.toLowerCase()))

  // Track per-day exercise usage and per-week patterns
  const dayExercises = new Map<string, string[]>() // "w1d1" -> [exerciseId, ...]
  const weekMovements = new Map<number, Set<string>>() // week -> set of movement patterns
  const weekPush = new Map<number, number>()
  const weekPull = new Map<number, number>()

  for (const assigned of assignment.assignments) {
    const exercise = exerciseMap.get(assigned.exercise_id)
    const slot = slotMap.get(assigned.slot_id)

    if (!exercise) {
      issues.push({
        type: "error",
        category: "missing_exercise",
        message: `Exercise ID ${assigned.exercise_id} (${assigned.exercise_name}) not found in library`,
        slot_ref: assigned.slot_id,
      })
      continue
    }

    if (!slot) continue

    const dayKey = `w${slot.week}d${slot.day}`

    // ── ERROR: Equipment violations ──
    if (exercise.equipment_required.length > 0 && !exercise.is_bodyweight) {
      for (const eq of exercise.equipment_required) {
        if (!equipmentSet.has(eq.toLowerCase())) {
          issues.push({
            type: "error",
            category: "equipment_violation",
            message: `${exercise.name} requires "${eq}" which is not available`,
            slot_ref: assigned.slot_id,
          })
        }
      }
    }

    // Also check avoided equipment
    for (const eq of exercise.equipment_required) {
      if (avoidedEquipment.has(eq.toLowerCase())) {
        issues.push({
          type: "error",
          category: "equipment_violation",
          message: `${exercise.name} uses "${eq}" which is in the avoided equipment list`,
          slot_ref: assigned.slot_id,
        })
      }
    }

    // ── ERROR: Injury / movement conflicts ──
    if (exercise.movement_pattern && avoidedMovements.has(exercise.movement_pattern.toLowerCase())) {
      issues.push({
        type: "error",
        category: "injury_conflict",
        message: `${exercise.name} uses avoided movement pattern "${exercise.movement_pattern}"`,
        slot_ref: assigned.slot_id,
      })
    }

    // Check if primary muscles hit an avoided muscle
    for (const muscle of exercise.primary_muscles) {
      if (avoidedMuscles.has(muscle.toLowerCase())) {
        issues.push({
          type: "error",
          category: "injury_conflict",
          message: `${exercise.name} targets avoided muscle "${muscle}"`,
          slot_ref: assigned.slot_id,
        })
      }
    }

    // ── ERROR: Duplicate exercises on same day ──
    const existing = dayExercises.get(dayKey) ?? []
    if (existing.includes(assigned.exercise_id)) {
      issues.push({
        type: "error",
        category: "duplicate_exercise",
        message: `${exercise.name} appears more than once on week ${slot.week} day ${slot.day}`,
        slot_ref: assigned.slot_id,
      })
    }
    dayExercises.set(dayKey, [...existing, assigned.exercise_id])

    // Track movement patterns per week
    if (exercise.movement_pattern) {
      const patterns = weekMovements.get(slot.week) ?? new Set()
      patterns.add(exercise.movement_pattern)
      weekMovements.set(slot.week, patterns)
    }

    // Track push/pull balance per week
    if (exercise.force_type === "push") {
      weekPush.set(slot.week, (weekPush.get(slot.week) ?? 0) + 1)
    } else if (exercise.force_type === "pull") {
      weekPull.set(slot.week, (weekPull.get(slot.week) ?? 0) + 1)
    }

    // ── WARNING: Difficulty mismatch ──
    const difficultyOrder = ["beginner", "intermediate", "advanced"]
    const clientIdx = difficultyOrder.indexOf(clientDifficulty)
    const exerciseIdx = difficultyOrder.indexOf(exercise.difficulty)
    if (clientIdx >= 0 && exerciseIdx >= 0 && exerciseIdx > clientIdx + 1) {
      issues.push({
        type: "warning",
        category: "difficulty_mismatch",
        message: `${exercise.name} (${exercise.difficulty}) may be too advanced for a ${clientDifficulty} client`,
        slot_ref: assigned.slot_id,
      })
    }
  }

  // ── WARNING: Missing fundamental movement patterns per week ──
  const fundamentalPatterns = ["push", "pull", "squat", "hinge"]
  for (const [week, patterns] of weekMovements) {
    for (const fp of fundamentalPatterns) {
      if (!patterns.has(fp)) {
        issues.push({
          type: "warning",
          category: "missing_movement_pattern",
          message: `Week ${week} is missing the "${fp}" movement pattern`,
        })
      }
    }
  }

  // ── WARNING: Push/pull imbalance ──
  for (const week of weekPush.keys()) {
    const pushCount = weekPush.get(week) ?? 0
    const pullCount = weekPull.get(week) ?? 0
    const total = pushCount + pullCount
    if (total >= 4) {
      const ratio = Math.min(pushCount, pullCount) / Math.max(pushCount, pullCount)
      if (ratio < 0.5) {
        const dominant = pushCount > pullCount ? "push" : "pull"
        issues.push({
          type: "warning",
          category: "muscle_imbalance",
          message: `Week ${week} has a ${dominant}-dominant imbalance (${pushCount} push vs ${pullCount} pull exercises)`,
        })
      }
    }
  }

  const errorCount = issues.filter((i) => i.type === "error").length
  const warningCount = issues.filter((i) => i.type === "warning").length
  const pass = errorCount === 0

  return {
    pass,
    issues,
    summary: pass
      ? warningCount > 0
        ? `Program passed validation with ${warningCount} warning(s).`
        : "Program passed all validation checks."
      : `Program has ${errorCount} error(s) and ${warningCount} warning(s) that need attention.`,
  }
}
