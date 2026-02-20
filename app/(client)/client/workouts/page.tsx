import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAssignments } from "@/lib/db/assignments"
import { getProgramExercises } from "@/lib/db/program-exercises"
import { getLatestProgressByExercises } from "@/lib/db/progress"
import { getWeightRecommendation } from "@/lib/weight-recommendation"
import { EmptyState } from "@/components/ui/empty-state"
import { WorkoutDay } from "@/components/client/WorkoutDay"
import { Dumbbell } from "lucide-react"
import type { Program, ProgramAssignment, Exercise, ProgramExercise } from "@/types/database"

export const metadata = { title: "My Workouts | DJP Athlete" }

type AssignmentWithProgram = ProgramAssignment & {
  programs: Program | null
}

type ProgramExerciseWithExercise = ProgramExercise & {
  exercises: Exercise | null
}

const dayLabels: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
}

export default async function ClientWorkoutsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  let activeAssignments: AssignmentWithProgram[] = []
  let programExercises: { assignment: AssignmentWithProgram; exercises: ProgramExerciseWithExercise[] }[] = []

  try {
    const assignments = (await getAssignments(userId)) as AssignmentWithProgram[]
    activeAssignments = assignments.filter((a) => a.status === "active")

    programExercises = await Promise.all(
      activeAssignments.map(async (assignment) => {
        if (!assignment.programs) return { assignment, exercises: [] }
        const exercises = (await getProgramExercises(
          assignment.program_id
        )) as ProgramExerciseWithExercise[]
        return { assignment, exercises }
      })
    )
  } catch {
    // DB tables may not exist yet — render gracefully with empty data
  }

  // Collect all unique exercise IDs across all programs
  const allExerciseIds = [
    ...new Set(
      programExercises.flatMap(({ exercises }) =>
        exercises
          .map((pe) => pe.exercise_id)
          .filter(Boolean)
      )
    ),
  ]

  // Batch-fetch progress history for all exercises
  let progressByExercise: Record<string, import("@/types/database").ExerciseProgress[]> = {}
  try {
    if (allExerciseIds.length > 0) {
      progressByExercise = await getLatestProgressByExercises(userId, allExerciseIds, 5)
    }
  } catch {
    // Progress table may not exist yet
  }

  // Check if an exercise was logged today
  const todayStr = new Date().toISOString().slice(0, 10)
  function wasLoggedToday(exerciseId: string): boolean {
    const history = progressByExercise[exerciseId]
    if (!history || history.length === 0) return false
    return history[0].completed_at.slice(0, 10) === todayStr
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">My Workouts</h1>

      {activeAssignments.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          heading="No active programs"
          description="You don't have any active workout programs. Once a program is assigned to you, your exercises will appear here."
        />
      ) : (
        <div className="space-y-8">
          {programExercises.map(({ assignment, exercises }) => {
            const program = assignment.programs
            if (!program) return null

            // Group exercises by day_of_week
            const exercisesByDay = exercises.reduce<
              Record<number, ProgramExerciseWithExercise[]>
            >((acc, ex) => {
              const day = ex.day_of_week
              if (!acc[day]) acc[day] = []
              acc[day].push(ex)
              return acc
            }, {})

            const sortedDays = Object.keys(exercisesByDay)
              .map(Number)
              .sort((a, b) => a - b)

            return (
              <div key={assignment.id}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {program.name}
                  </h2>
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium capitalize">
                    {program.category.replace("_", " ")}
                  </span>
                </div>

                {exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-white rounded-xl border border-border p-6">
                    No exercises have been added to this program yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sortedDays.map((day) => {
                      const dayExercises = exercisesByDay[day]
                        .filter((pe) => pe.exercises)
                        .map((pe) => {
                          const exercise = pe.exercises!
                          const history = progressByExercise[exercise.id] ?? []
                          const recommendation = getWeightRecommendation(
                            history,
                            exercise,
                            pe
                          )
                          return {
                            programExercise: pe as ProgramExercise,
                            exercise,
                            recommendation,
                            loggedToday: wasLoggedToday(exercise.id),
                          }
                        })

                      return (
                        <WorkoutDay
                          key={day}
                          day={day}
                          dayLabel={dayLabels[day] ?? `Day ${day}`}
                          exercises={dayExercises}
                          assignmentId={assignment.id}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
