import { z } from "zod"

export const TRAINING_TECHNIQUE_OPTIONS = [
  "straight_set",
  "superset",
  "dropset",
  "giant_set",
  "circuit",
  "rest_pause",
  "amrap",
] as const

export type TrainingTechniqueOption = (typeof TRAINING_TECHNIQUE_OPTIONS)[number]

/** Techniques that require a group_tag to pair exercises together */
export const GROUPED_TECHNIQUES: TrainingTechniqueOption[] = ["superset", "giant_set", "circuit"]

export const programExerciseSchema = z.object({
  exercise_id: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid exercise ID"
  ),
  day_of_week: z.coerce.number().int().min(1).max(7),
  week_number: z.coerce.number().int().min(1),
  order_index: z.coerce.number().int().min(0),
  technique: z.enum(TRAINING_TECHNIQUE_OPTIONS).optional().default("straight_set"),
  sets: z.coerce.number().int().positive().nullable().optional().transform((v) => v ?? null),
  reps: z.string().max(50).nullable().optional().transform((v) => v || null),
  rest_seconds: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  duration_seconds: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  notes: z.string().max(500).nullable().optional().transform((v) => v || null),
  rpe_target: z.coerce.number().min(1).max(10).nullable().optional().transform((v) => v ?? null),
  intensity_pct: z.coerce.number().min(0).max(100).nullable().optional().transform((v) => v ?? null),
  tempo: z.string().max(20).nullable().optional().transform((v) => v || null),
  group_tag: z.string().max(10).nullable().optional().transform((v) => v || null),
})

export const programExerciseUpdateSchema = programExerciseSchema.partial().omit({ exercise_id: true })

export type ProgramExerciseFormData = z.infer<typeof programExerciseSchema>
