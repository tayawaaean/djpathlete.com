import { z } from "zod"

export const EXERCISE_CATEGORIES = [
  "strength",
  "cardio",
  "flexibility",
  "plyometric",
  "sport_specific",
  "recovery",
] as const

export const EXERCISE_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const

export const exerciseFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .nullable()
    .transform((v) => v || null),
  category: z.enum(EXERCISE_CATEGORIES, {
    message: "Category is required",
  }),
  muscle_group: z
    .string()
    .max(100, "Muscle group must be under 100 characters")
    .nullable()
    .transform((v) => v || null),
  difficulty: z.enum(EXERCISE_DIFFICULTIES, {
    message: "Difficulty is required",
  }),
  equipment: z
    .string()
    .max(200, "Equipment must be under 200 characters")
    .nullable()
    .transform((v) => v || null),
  video_url: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal(""))
    .nullable()
    .transform((v) => v || null),
  instructions: z
    .string()
    .max(5000, "Instructions must be under 5000 characters")
    .nullable()
    .transform((v) => v || null),
})

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>
