import { z } from "zod"

export const workoutLogSchema = z.object({
  exercise_id: z.string().uuid(),
  assignment_id: z.string().uuid().nullable().optional().transform((v) => v ?? null),
  sets_completed: z.number().int().min(1).max(20),
  reps_completed: z.string().min(1).max(50),
  weight_kg: z.number().min(0).nullable().optional().transform((v) => v ?? null),
  rpe: z.number().int().min(1).max(10).nullable().optional().transform((v) => v ?? null),
  duration_seconds: z.number().int().min(0).nullable().optional().transform((v) => v ?? null),
  notes: z.string().max(500).nullable().optional().transform((v) => v || null),
})

export type WorkoutLogFormData = z.infer<typeof workoutLogSchema>
