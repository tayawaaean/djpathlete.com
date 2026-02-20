import { z } from "zod"
import { EQUIPMENT_OPTIONS } from "@/lib/validators/exercise"

export const FITNESS_GOALS = [
  "weight_loss",
  "muscle_gain",
  "endurance",
  "flexibility",
  "sport_specific",
  "general_health",
] as const

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "elite",
] as const

export const SESSION_DURATIONS = [30, 45, 60, 75, 90] as const

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

export const TIME_EFFICIENCY_OPTIONS = [
  "supersets_circuits",
  "shorter_rest",
  "fewer_heavier",
  "extend_session",
] as const

export const TIME_EFFICIENCY_LABELS: Record<string, string> = {
  supersets_circuits: "Supersets & circuits",
  shorter_rest: "Shorter rest periods",
  fewer_heavier: "Fewer exercises, heavier",
  extend_session: "Extend the session",
}

export const TRAINING_TECHNIQUES = [
  "superset",
  "dropset",
  "circuit",
  "giant_set",
  "rest_pause",
  "amrap",
] as const

export const TECHNIQUE_LABELS: Record<string, string> = {
  superset: "Supersets",
  dropset: "Dropsets",
  circuit: "Circuits",
  giant_set: "Giant Sets",
  rest_pause: "Rest-Pause",
  amrap: "AMRAP",
}

export const TECHNIQUE_DESCRIPTIONS: Record<string, string> = {
  superset: "Two exercises back-to-back, no rest between",
  dropset: "Reduce weight and keep going to failure",
  circuit: "4+ exercises with minimal rest between",
  giant_set: "3 exercises back-to-back targeting same area",
  rest_pause: "Set to failure, rest 10-15s, continue",
  amrap: "As many reps as possible in a set time",
}

export const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  endurance: "Endurance",
  flexibility: "Flexibility",
  sport_specific: "Sport Specific",
  general_health: "General Health",
}

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  cable_machine: "Cable Machine",
  smith_machine: "Smith Machine",
  resistance_band: "Resistance Band",
  pull_up_bar: "Pull-up Bar",
  bench: "Bench",
  squat_rack: "Squat Rack",
  leg_press: "Leg Press",
  leg_curl_machine: "Leg Curl Machine",
  lat_pulldown_machine: "Lat Pulldown Machine",
  rowing_machine: "Rowing Machine",
  treadmill: "Treadmill",
  bike: "Bike",
  box: "Box",
  plyo_box: "Plyo Box",
  medicine_ball: "Medicine Ball",
  stability_ball: "Stability Ball",
  foam_roller: "Foam Roller",
  trx: "TRX",
  landmine: "Landmine",
  sled: "Sled",
  battle_ropes: "Battle Ropes",
  agility_ladder: "Agility Ladder",
  cones: "Cones",
  yoga_mat: "Yoga Mat",
}

export const EQUIPMENT_PRESETS: Record<string, readonly string[]> = {
  "Full Gym": EQUIPMENT_OPTIONS,
  "Home Gym": [
    "dumbbell",
    "kettlebell",
    "resistance_band",
    "pull_up_bar",
    "bench",
    "foam_roller",
    "yoga_mat",
  ],
  "Bodyweight Only": [],
}

// Step 1: Fitness Goals
export const step1Schema = z.object({
  goals: z
    .array(z.enum(FITNESS_GOALS))
    .min(1, "Please select at least one fitness goal"),
})

// Step 2: Current Fitness Level
export const step2Schema = z.object({
  experience_level: z.enum(EXPERIENCE_LEVELS, {
    message: "Please select your fitness level",
  }),
})

// Step 3: Training History
export const step3Schema = z.object({
  training_years: z
    .number({ message: "Please enter a number" })
    .min(0, "Training years cannot be negative")
    .max(60, "Training years seems too high")
    .nullable(),
  training_background: z
    .string()
    .max(2000, "Training background must be under 2000 characters")
    .optional()
    .default(""),
})

// Step 4: Injuries & Limitations
export const injuryDetailSchema = z.object({
  area: z.string().min(1, "Area is required"),
  side: z.string().optional().default(""),
  severity: z.string().optional().default(""),
  notes: z.string().optional().default(""),
})

export const step4Schema = z.object({
  injuries_text: z
    .string()
    .max(2000, "Injuries text must be under 2000 characters")
    .optional()
    .default(""),
  injury_details: z.array(injuryDetailSchema).optional().default([]),
})

// Step 5: Available Equipment
export const step5Schema = z.object({
  available_equipment: z.array(z.enum(EQUIPMENT_OPTIONS)).default([]),
})

// Step 6: Schedule
export const step6Schema = z.object({
  preferred_day_names: z
    .array(z.number().min(1).max(7))
    .min(1, "Select at least one training day"),
  preferred_session_minutes: z
    .number()
    .refine((v) => (SESSION_DURATIONS as readonly number[]).includes(v), {
      message: "Please select a valid session duration",
    }),
  time_efficiency_preference: z
    .enum(TIME_EFFICIENCY_OPTIONS)
    .nullable()
    .optional()
    .default(null),
})

// Step 7: Exercise Preferences
export const step7Schema = z.object({
  preferred_techniques: z.array(z.enum(TRAINING_TECHNIQUES)).optional().default([]),
  exercise_likes: z
    .string()
    .max(2000, "Must be under 2000 characters")
    .optional()
    .default(""),
  exercise_dislikes: z
    .string()
    .max(2000, "Must be under 2000 characters")
    .optional()
    .default(""),
  additional_notes: z
    .string()
    .max(2000, "Must be under 2000 characters")
    .optional()
    .default(""),
})

// Full combined schema for final submission
export const questionnaireSchema = z.object({
  // Step 1
  goals: z
    .array(z.enum(FITNESS_GOALS))
    .min(1, "Please select at least one fitness goal"),
  // Step 2
  experience_level: z.enum(EXPERIENCE_LEVELS, {
    message: "Please select your fitness level",
  }),
  // Step 3
  training_years: z
    .number()
    .min(0)
    .max(60)
    .nullable()
    .optional()
    .default(null),
  training_background: z.string().max(2000).optional().default(""),
  // Step 4
  injuries_text: z.string().max(2000).optional().default(""),
  injury_details: z.array(injuryDetailSchema).optional().default([]),
  // Step 5
  available_equipment: z.array(z.enum(EQUIPMENT_OPTIONS)).default([]),
  // Step 6
  preferred_day_names: z.array(z.number().min(1).max(7)).min(1),
  preferred_session_minutes: z
    .number()
    .refine((v) => (SESSION_DURATIONS as readonly number[]).includes(v)),
  time_efficiency_preference: z
    .enum(TIME_EFFICIENCY_OPTIONS)
    .nullable()
    .optional()
    .default(null),
  // Step 7
  preferred_techniques: z.array(z.enum(TRAINING_TECHNIQUES)).optional().default([]),
  exercise_likes: z.string().max(2000).optional().default(""),
  exercise_dislikes: z.string().max(2000).optional().default(""),
  additional_notes: z.string().max(2000).optional().default(""),
})

export type QuestionnaireData = z.infer<typeof questionnaireSchema>

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>
export type Step6Data = z.infer<typeof step6Schema>
export type Step7Data = z.infer<typeof step7Schema>
