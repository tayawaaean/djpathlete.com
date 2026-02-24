import { createServiceRoleClient } from "@/lib/supabase"
import type { AssessmentQuestion, AssessmentResult } from "@/types/database"

/** Service-role client bypasses RLS — these functions are only called from server-side routes. */
function getClient() {
  return createServiceRoleClient()
}

// ── Assessment Questions ──────────────────────────────────────────────

export async function getActiveQuestions(section?: string) {
  const supabase = getClient()
  let query = supabase
    .from("assessment_questions")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (section) {
    query = query.eq("section", section)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AssessmentQuestion[]
}

export async function getAllQuestions() {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .order("section")
    .order("order_index", { ascending: true })
  if (error) throw error
  return data as AssessmentQuestion[]
}

export async function getQuestionById(id: string) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data as AssessmentQuestion
}

export async function createQuestion(
  question: Omit<AssessmentQuestion, "id" | "created_at">
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_questions")
    .insert(question)
    .select()
    .single()
  if (error) throw error
  return data as AssessmentQuestion
}

export async function updateQuestion(
  id: string,
  updates: Partial<Omit<AssessmentQuestion, "id" | "created_at">>
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as AssessmentQuestion
}

export async function deleteQuestion(id: string) {
  const supabase = getClient()
  // Soft delete by setting is_active = false
  const { error } = await supabase
    .from("assessment_questions")
    .update({ is_active: false })
    .eq("id", id)
  if (error) throw error
}

// ── Assessment Results ────────────────────────────────────────────────

export async function getAssessmentResults(userId: string) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
  if (error) throw error
  return data as AssessmentResult[]
}

export async function getLatestAssessmentResult(userId: string) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as AssessmentResult | null
}

export async function getAssessmentResultById(id: string) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data as AssessmentResult
}

export async function createAssessmentResult(
  result: Omit<AssessmentResult, "id" | "created_at">
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_results")
    .insert(result)
    .select()
    .single()
  if (error) throw error
  return data as AssessmentResult
}

export async function getAllAssessmentResults() {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*, users(first_name, last_name, email)")
    .order("completed_at", { ascending: false })
  if (error) throw error
  return data as (AssessmentResult & {
    users: { first_name: string; last_name: string; email: string } | null
  })[]
}

export async function getAverageRpeForAssignment(
  userId: string,
  assignmentId: string
): Promise<number | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("rpe")
    .eq("user_id", userId)
    .eq("assignment_id", assignmentId)
    .not("rpe", "is", null)
  if (error) throw error
  if (!data || data.length === 0) return null
  const sum = data.reduce((acc, row) => acc + (row.rpe ?? 0), 0)
  return Math.round((sum / data.length) * 10) / 10
}
