import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getLatestAssessmentResult,
  getActiveQuestions,
  createAssessmentResult,
  getAverageRpeForAssignment,
} from "@/lib/db/assessments"
import { getAssignments } from "@/lib/db/assignments"
import {
  computeReassessmentAdjustment,
  computeMovementScoresFromAnswers,
} from "@/lib/assessment-scoring"
import type { AssessmentFeedback, ProgramAssignment } from "@/types/database"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const {
      answers,
      feedback,
    }: {
      answers: Record<string, string | string[] | number>
      feedback: AssessmentFeedback
    } = body

    if (!answers || !feedback || !feedback.overall_feeling) {
      return NextResponse.json(
        { error: "Missing required fields: answers, feedback" },
        { status: 400 }
      )
    }

    // Get previous assessment result
    const previousResult = await getLatestAssessmentResult(userId)
    if (!previousResult) {
      return NextResponse.json(
        { error: "No previous assessment found. Complete an initial assessment first." },
        { status: 400 }
      )
    }

    // Get movement screen questions for scoring
    const questions = await getActiveQuestions("movement_screen")

    // Compute new movement scores from re-tested answers
    const newMovementScores = computeMovementScoresFromAnswers(answers, questions)

    // Get the most recently completed assignment for RPE data
    const allAssignments = await getAssignments(userId)
    const completedAssignment = (allAssignments as ProgramAssignment[]).find(
      (a) => a.status === "completed"
    )

    let averageRpe: number | null = null
    if (completedAssignment) {
      averageRpe = await getAverageRpeForAssignment(userId, completedAssignment.id)
    }

    // Compute the reassessment adjustment
    const { newComputedLevels, newMaxDifficultyScore, adjustment } =
      computeReassessmentAdjustment({
        feedback,
        averageRpe,
        previousResult,
        newMovementScores,
        questions,
      })

    // Create the new assessment result
    const newResult = await createAssessmentResult({
      user_id: userId,
      assessment_type: "reassessment",
      answers,
      computed_levels: newComputedLevels,
      max_difficulty_score: newMaxDifficultyScore,
      triggered_program_id: null, // Will be set when AI generates the program
      previous_assessment_id: previousResult.id,
      feedback: {
        ...feedback,
        rpe_average: averageRpe ?? undefined,
      },
      completed_at: new Date().toISOString(),
    })

    // TODO: Trigger AI program generation from Phase 3C
    // await triggerProgramGeneration(userId, newResult)

    return NextResponse.json({
      result: newResult,
      adjustment,
      previousMaxDifficulty: previousResult.max_difficulty_score,
      newMaxDifficulty: newMaxDifficultyScore,
    })
  } catch (error) {
    console.error("Reassessment error:", error)
    return NextResponse.json(
      { error: "Failed to process reassessment. Please try again." },
      { status: 500 }
    )
  }
}
