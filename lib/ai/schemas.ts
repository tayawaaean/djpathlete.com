import { z } from "zod"
import { SPLIT_TYPES, PERIODIZATION_TYPES } from "@/lib/validators/program"
import { MOVEMENT_PATTERNS } from "@/lib/validators/exercise"

// ─── Agent 1: Profile Analysis Schema ────────────────────────────────────────

const volumeTargetSchema = z.object({
  muscle_group: z.string().min(1),
  sets_per_week: z.number().int().min(0).max(40),
  priority: z.enum(["high", "medium", "low"]),
})

const exerciseConstraintSchema = z.object({
  type: z.enum([
    "avoid_movement",
    "avoid_equipment",
    "avoid_muscle",
    "limit_load",
    "require_unilateral",
  ]),
  value: z.string().min(1),
  reason: z.string().min(1),
})

const sessionStructureSchema = z.object({
  warm_up_minutes: z.number().int().min(0).max(30),
  main_work_minutes: z.number().int().min(10).max(150),
  cool_down_minutes: z.number().int().min(0).max(30),
  total_exercises: z.number().int().min(1).max(12),
  compound_count: z.number().int().min(0).max(8),
  isolation_count: z.number().int().min(0).max(6),
})

export const profileAnalysisSchema = z.object({
  recommended_split: z.enum(SPLIT_TYPES),
  recommended_periodization: z.enum(PERIODIZATION_TYPES),
  volume_targets: z.array(volumeTargetSchema).min(1),
  exercise_constraints: z.array(exerciseConstraintSchema),
  session_structure: sessionStructureSchema,
  training_age_category: z.enum(["novice", "intermediate", "advanced", "elite"]),
  notes: z.string(),
})

// ─── Agent 2: Program Skeleton Schema ────────────────────────────────────────

const exerciseSlotSchema = z.object({
  slot_id: z.string().min(1),
  role: z.enum([
    "warm_up",
    "primary_compound",
    "secondary_compound",
    "accessory",
    "isolation",
    "cool_down",
  ]),
  movement_pattern: z.enum(MOVEMENT_PATTERNS),
  target_muscles: z.array(z.string().min(1)).min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1),
  rest_seconds: z.number().int().min(0).max(600),
  rpe_target: z.number().min(1).max(10).nullable(),
  tempo: z.string().nullable(),
  group_tag: z.string().nullable(),
  technique: z.enum([
    "straight_set",
    "superset",
    "dropset",
    "giant_set",
    "circuit",
    "rest_pause",
    "amrap",
  ]).default("straight_set"),
})

const programDaySchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  label: z.string().min(1),
  focus: z.string().min(1),
  slots: z.array(exerciseSlotSchema).min(1).max(12),
})

const programWeekSchema = z.object({
  week_number: z.number().int().min(1),
  phase: z.string().min(1),
  intensity_modifier: z.string().min(1),
  days: z.array(programDaySchema).min(1),
})

export const programSkeletonSchema = z.object({
  weeks: z.array(programWeekSchema).min(1),
  split_type: z.enum(SPLIT_TYPES),
  periodization: z.enum(PERIODIZATION_TYPES),
  total_sessions: z.number().int().min(1),
  notes: z.string(),
})

// ─── Agent 3: Exercise Assignment Schema ─────────────────────────────────────

// Use a relaxed UUID pattern (8-4-4-4-12 hex) instead of strict RFC 4122 v4
// because seed exercise IDs don't have valid version/variant bits.
const uuidLike = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID format"
)

const assignedExerciseSchema = z.object({
  slot_id: z.string().min(1),
  exercise_id: uuidLike,
  exercise_name: z.string().min(1),
  notes: z.string().nullable(),
})

export const exerciseAssignmentSchema = z.object({
  assignments: z.array(assignedExerciseSchema).min(1),
  substitution_notes: z.array(z.string()),
})

// ─── Agent 4: Validation Result Schema ───────────────────────────────────────

const validationIssueSchema = z.object({
  type: z.enum(["error", "warning"]),
  category: z.string().min(1),
  message: z.string().min(1),
  slot_ref: z.string().optional(),
})

export const validationResultSchema = z.object({
  pass: z.boolean(),
  issues: z.array(validationIssueSchema),
  summary: z.string(),
})
