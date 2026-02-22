import { createServiceRoleClient } from "@/lib/supabase"
import type { ExerciseProgress } from "@/types/database"

/** Service-role client bypasses RLS — these functions are only called from server-side routes. */
function getClient() {
  return createServiceRoleClient()
}

export async function getProgress(userId: string, exerciseId?: string) {
  const supabase = getClient()
  let query = supabase
    .from("exercise_progress")
    .select("*, exercises(*)")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
  if (exerciseId) {
    query = query.eq("exercise_id", exerciseId)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Batch-fetch latest progress entries for multiple exercises at once.
 * Returns a map of exerciseId → ExerciseProgress[] (newest first, up to `limit` per exercise).
 */
export async function getLatestProgressByExercises(
  userId: string,
  exerciseIds: string[],
  limit = 5
): Promise<Record<string, ExerciseProgress[]>> {
  if (exerciseIds.length === 0) return {}

  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("*")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)
    .order("completed_at", { ascending: false })

  if (error) throw error

  // Group by exercise_id and take latest N per exercise
  const grouped: Record<string, ExerciseProgress[]> = {}
  for (const row of (data ?? []) as ExerciseProgress[]) {
    const eid = row.exercise_id
    if (!grouped[eid]) grouped[eid] = []
    if (grouped[eid].length < limit) {
      grouped[eid].push(row)
    }
  }

  return grouped
}

/**
 * Calculate the current consecutive-day workout streak ending today (or yesterday).
 * Returns the number of consecutive days with at least one logged workout.
 */
export async function getWorkoutStreak(userId: string): Promise<number> {
  const supabase = getClient()

  // Fetch distinct dates with logged workouts, most recent first
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })

  if (error || !data || data.length === 0) return 0

  // Collect unique dates (YYYY-MM-DD in local time)
  const uniqueDates = new Set<string>()
  for (const row of data) {
    if (row.completed_at) {
      const d = new Date(row.completed_at)
      uniqueDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
    }
  }

  const sortedDates = Array.from(uniqueDates).sort().reverse()
  if (sortedDates.length === 0) return 0

  // Start counting from today or yesterday
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`

  let streak = 0
  let checkDate: Date

  if (sortedDates[0] === todayStr) {
    checkDate = today
  } else if (sortedDates[0] === yesterdayStr) {
    checkDate = yesterday
  } else {
    return 0 // Most recent workout is older than yesterday — streak broken
  }

  // Count consecutive days backwards
  for (let i = 0; i < 365; i++) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`
    if (uniqueDates.has(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export async function getAllProgress() {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("*, exercises(name)")
    .order("completed_at", { ascending: false })
  if (error) throw error
  return data as (ExerciseProgress & { exercises: { name: string } | null })[]
}

export async function logProgress(
  progress: Omit<ExerciseProgress, "id" | "created_at">
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercise_progress")
    .insert(progress)
    .select()
    .single()
  if (error) throw error
  return data as ExerciseProgress
}
