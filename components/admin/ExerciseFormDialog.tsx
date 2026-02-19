"use client"

import { useState } from "react"
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
import {
  exerciseFormSchema,
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  type ExerciseFormData,
} from "@/lib/validators/exercise"
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube"
import type { Exercise } from "@/types/database"

interface ExerciseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise?: Exercise | null
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: "Strength",
  cardio: "Cardio",
  flexibility: "Flexibility",
  plyometric: "Plyometric",
  sport_specific: "Sport Specific",
  recovery: "Recovery",
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

export function ExerciseFormDialog({
  open,
  onOpenChange,
  exercise,
}: ExerciseFormDialogProps) {
  const router = useRouter()
  const isEditing = !!exercise
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseFormData, string[]>>>({})
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? "")

  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      muscle_group: formData.get("muscle_group") as string,
      difficulty: formData.get("difficulty") as string,
      equipment: formData.get("equipment") as string,
      video_url: formData.get("video_url") as string,
      instructions: formData.get("instructions") as string,
    }

    const result = exerciseFormSchema.safeParse(data)
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `/api/admin/exercises/${exercise.id}`
        : "/api/admin/exercises"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Request failed")
      }

      toast.success(isEditing ? "Exercise updated successfully" : "Exercise created successfully")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error(isEditing ? "Failed to update exercise" : "Failed to create exercise")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Exercise" : "Add Exercise"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the exercise details below."
              : "Fill in the details to create a new exercise."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={exercise?.name ?? ""}
              placeholder="e.g. Barbell Back Squat"
              required
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            )}
          </div>

          {/* Category & Difficulty */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                defaultValue={exercise?.category ?? ""}
                required
                disabled={isSubmitting}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select category</option>
                {EXERCISE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue={exercise?.difficulty ?? ""}
                required
                disabled={isSubmitting}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select difficulty</option>
                {EXERCISE_DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>{DIFFICULTY_LABELS[diff]}</option>
                ))}
              </select>
              {errors.difficulty && (
                <p className="text-xs text-destructive">{errors.difficulty[0]}</p>
              )}
            </div>
          </div>

          {/* Muscle Group & Equipment */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="muscle_group">Muscle Group</Label>
              <Input
                id="muscle_group"
                name="muscle_group"
                defaultValue={exercise?.muscle_group ?? ""}
                placeholder="e.g. Quadriceps, Glutes"
                disabled={isSubmitting}
              />
              {errors.muscle_group && (
                <p className="text-xs text-destructive">{errors.muscle_group[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input
                id="equipment"
                name="equipment"
                defaultValue={exercise?.equipment ?? ""}
                placeholder="e.g. Barbell, Squat Rack"
                disabled={isSubmitting}
              />
              {errors.equipment && (
                <p className="text-xs text-destructive">{errors.equipment[0]}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={exercise?.description ?? ""}
              placeholder="Brief description of the exercise..."
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description[0]}</p>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <textarea
              id="instructions"
              name="instructions"
              rows={4}
              defaultValue={exercise?.instructions ?? ""}
              placeholder="Step-by-step instructions..."
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            {errors.instructions && (
              <p className="text-xs text-destructive">{errors.instructions[0]}</p>
            )}
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={isSubmitting}
            />
            {errors.video_url && (
              <p className="text-xs text-destructive">{errors.video_url[0]}</p>
            )}
            {youtubeId && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(youtubeId)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video preview"
                />
              </div>
            )}
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
              {isSubmitting
                ? isEditing ? "Saving..." : "Creating..."
                : isEditing ? "Save Changes" : "Create Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
