import { z } from "zod"
import { SPLIT_TYPES, PERIODIZATION_TYPES } from "@/lib/validators/program"
import { MOVEMENT_PATTERNS } from "@/lib/validators/exercise"

// ─── Anthropic Structured Output Compatibility Notes ─────────────────────────
// The Vercel AI SDK passes Zod-generated JSON Schema directly to Anthropic's
// output_format WITHOUT stripping unsupported features. We must avoid:
//   - minimum/maximum on numbers        (already removed)
//   - minLength/maxLength on strings     → use z.string() without .min()
//   - minItems > 1 or any maxItems       → use z.array() with only .min(1) at most
// Supported: enum, default, nullable, pattern (basic regex), minItems 0 or 1
// Range/length constraints are enforced by the system prompts instead.

// ─── Agent 1: Profile Analysis Schema ────────────────────────────────────────

const volumeTargetSchema = z.object({
  muscle_group: z.string(),
  sets_per_week: z.number().int(),
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
  value: z.string(),
  reason: z.string(),
})

const sessionStructureSchema = z.object({
  warm_up_minutes: z.number().int(),
  main_work_minutes: z.number().int(),
  cool_down_minutes: z.number().int(),
  total_exercises: z.number().int(),
  compound_count: z.number().int(),
  isolation_count: z.number().int(),
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
  slot_id: z.string(),
  role: z.enum([
    "warm_up",
    "primary_compound",
    "secondary_compound",
    "accessory",
    "isolation",
    "cool_down",
  ]),
  movement_pattern: z.enum(MOVEMENT_PATTERNS),
  target_muscles: z.array(z.string()).min(1),
  sets: z.number().int(),
  reps: z.string(),
  rest_seconds: z.number().int(),
  rpe_target: z.number().nullable(),
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
  day_of_week: z.number().int(),
  label: z.string(),
  focus: z.string(),
  slots: z.array(exerciseSlotSchema).min(1),
})

const programWeekSchema = z.object({
  week_number: z.number().int(),
  phase: z.string(),
  intensity_modifier: z.string(),
  days: z.array(programDaySchema).min(1),
})

export const programSkeletonSchema = z.object({
  weeks: z.array(programWeekSchema).min(1),
  split_type: z.enum(SPLIT_TYPES),
  periodization: z.enum(PERIODIZATION_TYPES),
  total_sessions: z.number().int(),
  notes: z.string(),
})

// ─── Agent 3: Exercise Assignment Schema ─────────────────────────────────────

const assignedExerciseSchema = z.object({
  slot_id: z.string(),
  exercise_id: z.string(),
  exercise_name: z.string(),
  notes: z.string().nullable(),
})

export const exerciseAssignmentSchema = z.object({
  assignments: z.array(assignedExerciseSchema).min(1),
  substitution_notes: z.array(z.string()),
})

// ─── Agent 4: Validation Result Schema ───────────────────────────────────────

const validationIssueSchema = z.object({
  type: z.enum(["error", "warning"]),
  category: z.string(),
  message: z.string(),
  slot_ref: z.string().optional(),
})

export const validationResultSchema = z.object({
  pass: z.boolean(),
  issues: z.array(validationIssueSchema),
  summary: z.string(),
})
