import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createAssessmentResult,
  getLatestAssessmentResult,
} from "@/lib/db/assessment-questions"
import type { ComputedLevels, AbilityLevel } from "@/types/database"

const VALID_LEVELS: AbilityLevel[] = ["beginner", "intermediate", "advanced", "elite"]

function isValidComputedLevels(obj: unknown): obj is ComputedLevels {
  if (!obj || typeof obj !== "object") return false
  const levels = obj as Record<string, unknown>
  for (const key of ["overall", "squat", "push", "pull", "hinge"]) {
    if (!VALID_LEVELS.includes(levels[key] as AbilityLevel)) return false
  }
  return true
}

function levelToScore(level: AbilityLevel): number {
  const map: Record<AbilityLevel, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    elite: 4,
  }
  return map[level]
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const { answers, computed_levels } = body

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers are required" },
        { status: 400 }
      )
    }

    if (!isValidComputedLevels(computed_levels)) {
      return NextResponse.json(
        { error: "Invalid computed levels" },
        { status: 400 }
      )
    }

    // Determine assessment type based on whether they have a previous result
    const previous = await getLatestAssessmentResult(userId)
    const assessmentType = previous ? "reassessment" : "initial"

    // Calculate max difficulty score
    const maxDifficulty = Math.max(
      levelToScore(computed_levels.overall),
      levelToScore(computed_levels.squat),
      levelToScore(computed_levels.push),
      levelToScore(computed_levels.pull),
      levelToScore(computed_levels.hinge)
    )

    const result = await createAssessmentResult({
      user_id: userId,
      assessment_type: assessmentType,
      answers,
      computed_levels,
      max_difficulty: maxDifficulty,
      triggered_program_id: null,
    })

    return NextResponse.json({ result }, { status: 201 })
  } catch (error) {
    console.error("Assessment submit error:", error)
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    )
  }
}
