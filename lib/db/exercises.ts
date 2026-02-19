import { createServiceRoleClient } from "@/lib/supabase"
import type { Exercise, MovementPattern, ExerciseDifficulty } from "@/types/database"

/** Service-role client bypasses RLS — these functions are only called from server-side admin routes. */
function getClient() {
  return createServiceRoleClient()
}

export async function getExercises() {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
  if (error) throw error
  return data as Exercise[]
}

export async function getExerciseById(id: string) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data as Exercise
}

export async function createExercise(
  exercise: Omit<Exercise, "id" | "created_at" | "updated_at">
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercises")
    .insert(exercise)
    .select()
    .single()
  if (error) throw error
  return data as Exercise
}

export async function updateExercise(
  id: string,
  updates: Partial<Omit<Exercise, "id" | "created_at">>
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercises")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Exercise
}

export async function deleteExercise(id: string) {
  const supabase = getClient()
  const { error } = await supabase
    .from("exercises")
    .update({ is_active: false })
    .eq("id", id)
  if (error) throw error
}

export async function createExercisesBulk(
  exercises: Omit<Exercise, "id" | "created_at" | "updated_at">[]
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercises")
    .insert(exercises)
    .select()
  if (error) throw error
  return data as Exercise[]
}

export async function bulkUpdateExercises(
  ids: string[],
  updates: Partial<Omit<Exercise, "id" | "created_at">>
) {
  const supabase = getClient()
  const { error } = await supabase
    .from("exercises")
    .update(updates)
    .in("id", ids)
  if (error) throw error
}

export async function bulkDeleteExercises(ids: string[]) {
  const supabase = getClient()
  const { error } = await supabase
    .from("exercises")
    .update({ is_active: false })
    .in("id", ids)
  if (error) throw error
}

export interface ExerciseAIFilters {
  movement_pattern?: MovementPattern
  primary_muscles?: string[]
  equipment?: string[]
  difficulty?: ExerciseDifficulty
  is_bodyweight?: boolean
  is_compound?: boolean
}

export async function getExercisesForAI(filters?: ExerciseAIFilters) {
  const supabase = getClient()
  let query = supabase
    .from("exercises")
    .select("*")
    .eq("is_active", true)

  if (filters?.movement_pattern) {
    query = query.eq("movement_pattern", filters.movement_pattern)
  }
  if (filters?.primary_muscles && filters.primary_muscles.length > 0) {
    query = query.overlaps("primary_muscles", filters.primary_muscles)
  }
  if (filters?.equipment && filters.equipment.length > 0) {
    query = query.overlaps("equipment_required", filters.equipment)
  }
  if (filters?.difficulty) {
    query = query.eq("difficulty", filters.difficulty)
  }
  if (filters?.is_bodyweight !== undefined) {
    query = query.eq("is_bodyweight", filters.is_bodyweight)
  }
  if (filters?.is_compound !== undefined) {
    query = query.eq("is_compound", filters.is_compound)
  }

  const { data, error } = await query.order("name", { ascending: true })
  if (error) throw error
  return data as Exercise[]
}
