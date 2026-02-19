"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search, ArrowLeft } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { extractYouTubeId, getYouTubeThumbnailUrl } from "@/lib/youtube"
import type { Exercise } from "@/types/database"

interface AddExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  weekNumber: number
  dayOfWeek: number
  exercises: Exercise[]
  existingCount: number
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: "Strength",
  cardio: "Cardio",
  flexibility: "Flexibility",
  plyometric: "Plyometric",
  sport_specific: "Sport Specific",
  recovery: "Recovery",
}

export function AddExerciseDialog({
  open,
  onOpenChange,
  programId,
  weekNumber,
  dayOfWeek,
  exercises,
  existingCount,
}: AddExerciseDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetAndClose(openState: boolean) {
    if (!openState) {
      setStep(1)
      setSelectedExercise(null)
      setSearch("")
      setCategoryFilter("all")
    }
    onOpenChange(openState)
  }

  const filtered = exercises.filter((ex) => {
    const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  function handleSelectExercise(exercise: Exercise) {
    setSelectedExercise(exercise)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedExercise) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const body = {
      exercise_id: selectedExercise.id,
      week_number: weekNumber,
      day_of_week: dayOfWeek,
      order_index: existingCount,
      sets: formData.get("sets") || null,
      reps: formData.get("reps") || null,
      rest_seconds: formData.get("rest_seconds") || null,
      duration_seconds: formData.get("duration_seconds") || null,
      notes: formData.get("notes") || null,
      rpe_target: formData.get("rpe_target") || null,
      intensity_pct: formData.get("intensity_pct") || null,
      tempo: formData.get("tempo") || null,
      group_tag: formData.get("group_tag") || null,
    }

    try {
      const response = await fetch(`/api/admin/programs/${programId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add exercise")
      }

      toast.success("Exercise added")
      resetAndClose(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add exercise")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Select Exercise" : "Configure Exercise"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Search and select an exercise from the library."
              : `Set parameters for ${selectedExercise?.name}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-3">
            {/* Search & filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground"
              >
                <option value="all">All</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Exercise list */}
            <div className="max-h-[350px] overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No exercises found.
                </p>
              ) : (
                filtered.map((ex) => {
                  const ytId = ex.video_url ? extractYouTubeId(ex.video_url) : null
                  const thumb = ytId ? getYouTubeThumbnailUrl(ytId) : null
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      className="w-full flex items-center gap-3 rounded-lg border border-border p-2 text-left hover:bg-surface/50 transition-colors"
                      onClick={() => handleSelectExercise(ex)}
                    >
                      {thumb && (
                        <Image
                          src={thumb}
                          alt={ex.name}
                          width={48}
                          height={36}
                          className="rounded object-cover"
                          unoptimized
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{ex.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {CATEGORY_LABELS[ex.category] ?? ex.category}
                          {ex.muscle_group && ` · ${ex.muscle_group}`}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="mb-2"
            >
              <ArrowLeft className="size-3.5" />
              Back to selection
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sets">Sets</Label>
                <Input id="sets" name="sets" type="number" min={1} placeholder="e.g. 3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input id="reps" name="reps" placeholder="e.g. 8-12" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rest_seconds">Rest (seconds)</Label>
                <Input id="rest_seconds" name="rest_seconds" type="number" min={0} placeholder="e.g. 60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_seconds">Duration (seconds)</Label>
                <Input id="duration_seconds" name="duration_seconds" type="number" min={0} placeholder="e.g. 30" />
              </div>
            </div>

            {/* Intensity fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rpe_target">RPE Target</Label>
                <Input id="rpe_target" name="rpe_target" type="number" min={1} max={10} step={0.5} placeholder="e.g. 7" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intensity_pct">Intensity (%1RM)</Label>
                <Input id="intensity_pct" name="intensity_pct" type="number" min={0} max={100} placeholder="e.g. 75" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempo">Tempo</Label>
                <Input id="tempo" name="tempo" placeholder="e.g. 3-1-2-0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group_tag">Group Tag</Label>
                <Input id="group_tag" name="group_tag" placeholder="e.g. A1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Any specific instructions..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetAndClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Exercise"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
