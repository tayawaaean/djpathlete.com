import { getExercises } from "@/lib/db/exercises"
import { ExerciseList } from "@/components/admin/ExerciseList"

export const metadata = { title: "Exercises" }

export default async function ExercisesPage() {
  const exercises = await getExercises()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Exercises</h1>
      <ExerciseList exercises={exercises} />
    </div>
  )
}
