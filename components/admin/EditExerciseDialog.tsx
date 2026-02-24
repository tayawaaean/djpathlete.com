"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { useFormTour } from "@/hooks/use-form-tour"
import { FormTour } from "@/components/admin/FormTour"
import { TourButton } from "@/components/admin/TourButton"
import { EDIT_EXERCISE_TOUR_STEPS } from "@/lib/tour-steps"
import type { Exercise, ExerciseCategory, ProgramExercise } from "@/types/database"
import { getCategoryFields } from "@/lib/exercise-fields"
import {
  TRAINING_TECHNIQUE_OPTIONS,
  GROUPED_TECHNIQUES,
  type TrainingTechniqueOption,
} from "@/lib/validators/program-exercise"

const FIELD_LABELS: Record<string, string> = {
  sets: "Sets",
  reps: "Reps",
  rest_seconds: "Rest",
  duration_seconds: "Duration",
  rpe_target: "RPE Target",
  intensity_pct: "Intensity",
  tempo: "Tempo",
  group_tag: "Superset Group",
  notes: "Notes",
}

const TECHNIQUE_CONFIG: Record<TrainingTechniqueOption, { label: string; description: string }> = {
  straight_set: { label: "Straight Sets", description: "Standard sets with rest between" },
  superset: { label: "Superset", description: "Two exercises back-to-back, no rest" },
  dropset: { label: "Drop Set", description: "Reduce weight, continue to failure" },
  giant_set: { label: "Giant Set", description: "3+ exercises back-to-back" },
  circuit: { label: "Circuit", description: "4+ exercises with minimal rest" },
  rest_pause: { label: "Rest-Pause", description: "Set to failure, rest 10-15s, continue" },
  amrap: { label: "AMRAP", description: "As many reps as possible" },
}

interface EditExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  programExercise: (ProgramExercise & { exercises: Exercise }) | null
  /** All exercises on the same day, used for group tag helper */
  dayExercises?: (ProgramExercise & { exercises: Exercise })[]
}

export function EditExerciseDialog({
  open,
  onOpenChange,
  programId,
  programExercise,
  dayExercises = [],
}: EditExerciseDialogProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [technique, setTechnique] = useState<TrainingTechniqueOption>("straight_set")
  const [groupTag, setGroupTag] = useState("")
  const tour = useFormTour({ steps: EDIT_EXERCISE_TOUR_STEPS, scrollContainerRef: dialogRef })

  const needsGroupTag = GROUPED_TECHNIQUES.includes(technique)

  // Sync state when dialog opens with a new exercise
  useEffect(() => {
    if (programExercise) {
      setTechnique((programExercise.technique as TrainingTechniqueOption) || "straight_set")
      setGroupTag(programExercise.group_tag || "")
    }
  }, [programExercise])

  // Find exercises already in the same group (excluding current exercise)
  const groupPeers = groupTag
    ? dayExercises.filter(
        (pe) =>
          pe.id !== programExercise?.id &&
          pe.group_tag &&
          pe.group_tag.charAt(0).toUpperCase() === groupTag.charAt(0).toUpperCase()
      )
    : []

  if (!programExercise) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!programExercise) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      technique,
      sets: formData.get("sets") || null,
      reps: formData.get("reps") || null,
      rest_seconds: formData.get("rest_seconds") || null,
      duration_seconds: formData.get("duration_seconds") || null,
      notes: formData.get("notes") || null,
      rpe_target: formData.get("rpe_target") || null,
      intensity_pct: formData.get("intensity_pct") || null,
      tempo: formData.get("tempo") || null,
      group_tag: needsGroupTag ? (groupTag || null) : null,
    }

    try {
      const response = await fetch(
        `/api/admin/programs/${programId}/exercises/${programExercise.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        if (data.details) {
          const errorMessages = Object.entries(data.details)
            .filter(([, v]) => Array.isArray(v) && (v as string[]).length > 0)
            .map(([field, msgs]) => `${FIELD_LABELS[field] ?? field}: ${(msgs as string[])[0]}`)
          if (errorMessages.length > 0) {
            toast.error(errorMessages.join(". "))
            return
          }
        }
        throw new Error(data.error || "Failed to update")
      }

      toast.success("Exercise updated")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update exercise")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) tour.close(); onOpenChange(o) }}>
      <DialogContent ref={dialogRef} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Edit Exercise Parameters</DialogTitle>
            <TourButton onClick={tour.start} />
          </div>
          <DialogDescription>
            Update parameters for {programExercise.exercises.name}.
          </DialogDescription>
        </DialogHeader>

        {(() => {
          const catFields = getCategoryFields(programExercise.exercises.category as ExerciseCategory[])
          return (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sets">Sets *</Label>
                  <Input
                    id="edit-sets"
                    name="sets"
                    type="number"
                    min={1}
                    defaultValue={programExercise.sets ?? ""}
                    placeholder="e.g. 3"
                  />
                </div>
                {catFields.showReps && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-reps">Reps *</Label>
                    <Input
                      id="edit-reps"
                      name="reps"
                      defaultValue={programExercise.reps ?? ""}
                      placeholder="e.g. 8-12"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {catFields.showRest && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-rest">Rest (seconds)</Label>
                    <Input
                      id="edit-rest"
                      name="rest_seconds"
                      type="number"
                      min={0}
                      defaultValue={programExercise.rest_seconds ?? ""}
                      placeholder="e.g. 60"
                    />
                  </div>
                )}
                {catFields.showDuration && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">
                      Duration (seconds){catFields.showDuration === "prominent" ? " *" : ""}
                    </Label>
                    <Input
                      id="edit-duration"
                      name="duration_seconds"
                      type="number"
                      min={0}
                      defaultValue={programExercise.duration_seconds ?? ""}
                      placeholder="e.g. 30"
                    />
                  </div>
                )}
              </div>

              {/* Intensity fields — only for categories that use them */}
              {(catFields.showRpe || catFields.showIntensity) && (
                <div className="grid grid-cols-2 gap-4">
                  {catFields.showRpe && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-rpe">RPE Target</Label>
                      <Input
                        id="edit-rpe"
                        name="rpe_target"
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        defaultValue={programExercise.rpe_target ?? ""}
                        placeholder="e.g. 7"
                      />
                    </div>
                  )}
                  {catFields.showIntensity && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-intensity">Intensity (%1RM)</Label>
                      <Input
                        id="edit-intensity"
                        name="intensity_pct"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={programExercise.intensity_pct ?? ""}
                        placeholder="e.g. 75"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Technique picker */}
              <div className="space-y-2">
                <Label>Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAINING_TECHNIQUE_OPTIONS.map((t) => {
                    const config = TECHNIQUE_CONFIG[t]
                    const isSelected = technique === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTechnique(t)
                          if (GROUPED_TECHNIQUES.includes(t) && !groupTag) {
                            setGroupTag(programExercise.group_tag || "A1")
                          }
                          if (!GROUPED_TECHNIQUES.includes(t)) {
                            setGroupTag("")
                          }
                        }}
                        className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-surface/50"
                        }`}
                      >
                        <span className="text-sm font-medium">{config.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{config.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Group tag — only shown for grouped techniques */}
              {needsGroupTag && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Label htmlFor="edit-group-tag">Group Tag</Label>
                  <Input
                    id="edit-group-tag"
                    value={groupTag}
                    onChange={(e) => setGroupTag(e.target.value.toUpperCase())}
                    placeholder="e.g. A1"
                    className="max-w-[100px]"
                  />
                  {groupPeers.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Grouped with: {groupPeers.map((pe) => `${pe.exercises.name} (${pe.group_tag})`).join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use the same letter for exercises done together (A1 + A2 = {TECHNIQUE_CONFIG[technique].label.toLowerCase()}).
                    </p>
                  )}
                </div>
              )}

              {catFields.showTempo && (
                <div className="space-y-2">
                  <Label htmlFor="edit-tempo">Tempo</Label>
                  <Input
                    id="edit-tempo"
                    name="tempo"
                    defaultValue={programExercise.tempo ?? ""}
                    placeholder="e.g. 3-1-2-0"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  rows={2}
                  defaultValue={programExercise.notes ?? ""}
                  placeholder="Any specific instructions..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )
        })()}
        <FormTour {...tour} />
      </DialogContent>
    </Dialog>
  )
}
