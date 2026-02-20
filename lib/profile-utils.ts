import type { ClientProfile } from "@/types/database"

/**
 * Parse the goals list from the composite goals string.
 * Format: "Goals: weight_loss, muscle_gain | Training background: ..."
 */
export function parseGoalsFromProfile(goalsString: string): string[] {
  const goalsMatch = goalsString.match(/^Goals:\s*(.+?)(?:\s*\||$)/)
  if (goalsMatch) {
    return goalsMatch[1].split(",").map((g) => g.trim())
  }
  return []
}

/**
 * Parse a named field value from the composite goals string.
 * e.g. parseFieldFromProfile(str, "Training background") → "5 years lifting"
 */
export function parseFieldFromProfile(
  goalsString: string,
  prefix: string
): string {
  const regex = new RegExp(`${prefix}:\\s*(.+?)(?:\\s*\\||$)`)
  const match = goalsString.match(regex)
  return match ? match[1].trim() : ""
}

export interface ProfileSummary {
  goals: string[]
  experienceLevel: string | null
  trainingYears: number | null
  preferredTrainingDays: number | null
  preferredSessionMinutes: number | null
  availableEquipment: string[]
  injuries: string | null
  injuryDetails: ClientProfile["injury_details"]
  trainingBackground: string
  likes: string
  dislikes: string
  notes: string
  sport: string | null
  position: string | null
}

/**
 * Parse a full structured summary from a ClientProfile.
 */
export function parseProfileSummary(profile: ClientProfile): ProfileSummary {
  const goalsString = profile.goals ?? ""
  return {
    goals: parseGoalsFromProfile(goalsString),
    experienceLevel: profile.experience_level,
    trainingYears: profile.training_years,
    preferredTrainingDays: profile.preferred_training_days,
    preferredSessionMinutes: profile.preferred_session_minutes,
    availableEquipment: profile.available_equipment,
    injuries: profile.injuries,
    injuryDetails: profile.injury_details,
    trainingBackground: parseFieldFromProfile(goalsString, "Training background"),
    likes: parseFieldFromProfile(goalsString, "Likes"),
    dislikes: parseFieldFromProfile(goalsString, "Dislikes"),
    notes: parseFieldFromProfile(goalsString, "Notes"),
    sport: profile.sport,
    position: profile.position,
  }
}

/**
 * Check whether a profile has meaningful questionnaire data filled in.
 */
export function hasQuestionnaireData(profile: ClientProfile): boolean {
  const goalsList = parseGoalsFromProfile(profile.goals ?? "")
  return (
    goalsList.length > 0 ||
    !!profile.experience_level ||
    profile.training_years !== null ||
    profile.available_equipment.length > 0 ||
    profile.preferred_training_days !== null ||
    profile.preferred_session_minutes !== null
  )
}
