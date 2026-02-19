import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getProgramById } from "@/lib/db/programs"
import { getProgramExercises } from "@/lib/db/program-exercises"
import { getExercises } from "@/lib/db/exercises"
import { getClients } from "@/lib/db/users"
import { ProgramHeader } from "@/components/admin/ProgramHeader"
import { ProgramBuilder } from "@/components/admin/ProgramBuilder"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const program = await getProgramById(id)
    return { title: `${program.name} - Program Builder` }
  } catch {
    return { title: "Program Not Found" }
  }
}

export default async function ProgramBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let program
  try {
    program = await getProgramById(id)
  } catch {
    notFound()
  }

  const [programExercises, exercises, clients] = await Promise.all([
    getProgramExercises(id),
    getExercises(),
    getClients(),
  ])

  return (
    <div className="space-y-6">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Programs
      </Link>

      <ProgramHeader program={program} clients={clients} />

      <ProgramBuilder
        programId={program.id}
        totalWeeks={program.duration_weeks}
        programExercises={programExercises}
        exercises={exercises}
      />
    </div>
  )
}
