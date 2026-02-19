import { z } from "zod"

export const programExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  day_of_week: z.coerce.number().int().min(1).max(7),
  week_number: z.coerce.number().int().min(1),
  order_index: z.coerce.number().int().min(0),
  sets: z.coerce.number().int().positive().nullable().optional().transform((v) => v ?? null),
  reps: z.string().max(50).nullable().optional().transform((v) => v || null),
  rest_seconds: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  duration_seconds: z.coerce.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  notes: z.string().max(500).nullable().optional().transform((v) => v || null),
})

export const programExerciseUpdateSchema = programExerciseSchema.partial().omit({ exercise_id: true })

export type ProgramExerciseFormData = z.infer<typeof programExerciseSchema>
