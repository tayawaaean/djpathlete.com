import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAssignments } from "@/lib/db/assignments"
import { getProgramExercises } from "@/lib/db/program-exercises"
import { FormReviewUploadForm } from "@/components/client/FormReviewUploadForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "New Form Review | DJP Athlete" }

export default async function NewFormReviewPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  // Get active assignments and their exercises
  const assignments = await getAssignments(userId)
  const activeAssignments = assignments.filter((a) => a.status === "active")

  // Gather unique exercises from all active programs
  const exerciseOptions: { id: string; name: string; assignmentId: string | null }[] = []
  const seenExerciseIds = new Set<string>()

  for (const assignment of activeAssignments) {
    const programExercises = await getProgramExercises(assignment.program_id)
    for (const pe of programExercises) {
      const exercise = pe.exercises as { id: string; name: string } | null
      if (exercise && !seenExerciseIds.has(exercise.id)) {
        seenExerciseIds.add(exercise.id)
        exerciseOptions.push({
          id: exercise.id,
          name: exercise.name,
          assignmentId: assignment.id,
        })
      }
    }
  }

  // Sort alphabetically
  exerciseOptions.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <Link
        href="/client/form-reviews"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft className="size-3.5" />
        Back to Form Reviews
      </Link>

      <h1 className="text-xl sm:text-2xl font-semibold text-primary mb-5">
        Request Form Review
      </h1>

      <div className="bg-white rounded-xl border border-border p-4 sm:p-6">
        {exerciseOptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              You need an active program with exercises to submit a form review.
            </p>
            <Link
              href="/client/programs"
              className="inline-block mt-3 text-sm text-primary font-medium hover:underline"
            >
              Browse Programs
            </Link>
          </div>
        ) : (
          <FormReviewUploadForm exercises={exerciseOptions} userId={userId} />
        )}
      </div>
    </div>
  )
}
