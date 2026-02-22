import { Dumbbell, Layers, Zap, Weight } from "lucide-react"
import { getExercises } from "@/lib/db/exercises"
import { ExerciseList } from "@/components/admin/ExerciseList"
import type { Exercise } from "@/types/database"

export const metadata = { title: "Exercises" }

export default async function ExercisesPage() {
  const exercises = await getExercises()
  const exList = exercises as Exercise[]

  const totalExercises = exList.length
  const bodyweightCount = exList.filter((e) => e.is_bodyweight).length
  const compoundCount = exList.filter((e) => e.is_compound).length

  // Count unique equipment types
  const equipmentSet = new Set<string>()
  for (const e of exList) {
    for (const eq of e.equipment_required) {
      equipmentSet.add(eq)
    }
  }
  const equipmentTypes = equipmentSet.size

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Exercises</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Dumbbell className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Exercises</p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {totalExercises}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
              <Layers className="size-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Compound</p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {compoundCount}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Bodyweight</p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {bodyweightCount}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Weight className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Equipment Types</p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {equipmentTypes}
          </p>
        </div>
      </div>

      <ExerciseList exercises={exercises} />
    </div>
  )
}
