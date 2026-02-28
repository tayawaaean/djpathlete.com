"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  exerciseFormSchema,
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  MOVEMENT_PATTERNS,
  FORCE_TYPES,
  LATERALITY_OPTIONS,
  MUSCLE_OPTIONS,
  EQUIPMENT_OPTIONS,
  type ExerciseFormData,
} from "@/lib/validators/exercise"
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube"
import { ExerciseRelationships } from "@/components/admin/ExerciseRelationships"
import { useFormTour } from "@/hooks/use-form-tour"
import { FormTour } from "@/components/admin/FormTour"
import { TourButton } from "@/components/admin/TourButton"
import { getExerciseTourSteps } from "@/lib/tour-steps"
import type { Exercise } from "@/types/database"

// ─── Constants ──────────────────────────────────────────────────────────────

interface ExerciseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise?: Exercise | null
}

const STEPS = [
  { label: "Basics", number: 1 },
  { label: "Details", number: 2 },
  { label: "AI Metadata", number: 3 },
  { label: "Relationships", number: 4 },
] as const

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
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

const MOVEMENT_PATTERN_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  squat: "Squat",
  hinge: "Hinge",
  lunge: "Lunge",
  carry: "Carry",
  rotation: "Rotation",
  isometric: "Isometric",
  locomotion: "Locomotion",
}

const FORCE_TYPE_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  static: "Static",
  dynamic: "Dynamic",
}

const LATERALITY_LABELS: Record<string, string> = {
  bilateral: "Bilateral",
  unilateral: "Unilateral",
  alternating: "Alternating",
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  upper_back: "Upper Back",
  lats: "Lats",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Core",
  obliques: "Obliques",
  lower_back: "Lower Back",
  glutes: "Glutes",
  quadriceps: "Quadriceps",
  hamstrings: "Hamstrings",
  calves: "Calves",
  hip_flexors: "Hip Flexors",
  adductors: "Adductors",
  abductors: "Abductors",
  traps: "Traps",
  neck: "Neck",
}

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  cable_machine: "Cable Machine",
  smith_machine: "Smith Machine",
  resistance_band: "Resistance Band",
  pull_up_bar: "Pull-up Bar",
  bench: "Bench",
  squat_rack: "Squat Rack",
  leg_press: "Leg Press",
  leg_curl_machine: "Leg Curl Machine",
  lat_pulldown_machine: "Lat Pulldown Machine",
  rowing_machine: "Rowing Machine",
  treadmill: "Treadmill",
  bike: "Bike",
  box: "Box",
  plyo_box: "Plyo Box",
  medicine_ball: "Medicine Ball",
  stability_ball: "Stability Ball",
  foam_roller: "Foam Roller",
  trx: "TRX",
  landmine: "Landmine",
  sled: "Sled",
  battle_ropes: "Battle Ropes",
  agility_ladder: "Agility Ladder",
  cones: "Cones",
  yoga_mat: "Yoga Mat",
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const textareaClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"

// ─── Component ──────────────────────────────────────────────────────────────

export function ExerciseFormDialog({
  open,
  onOpenChange,
  exercise: initialExercise,
}: ExerciseFormDialogProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [exercise, setExercise] = useState(initialExercise)
  const isEditing = !!exercise

  // Wizard state
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseFormData, string[]>>>({})

  // Step 0: Basics
  const [name, setName] = useState(exercise?.name ?? "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(exercise?.category ?? [])
  const [difficulty, setDifficulty] = useState(exercise?.difficulty ?? "")
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscle_group ?? "")
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "")

  // Step 1: Details
  const [description, setDescription] = useState(exercise?.description ?? "")
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "")
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? "")
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null

  // Step 2: AI Metadata
  const [movementPattern, setMovementPattern] = useState(exercise?.movement_pattern ?? "")
  const [forceType, setForceType] = useState(exercise?.force_type ?? "")
  const [laterality, setLaterality] = useState(exercise?.laterality ?? "")
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>(exercise?.primary_muscles ?? [])
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(exercise?.secondary_muscles ?? [])
  const [equipmentRequired, setEquipmentRequired] = useState<string[]>(exercise?.equipment_required ?? [])
  const [isBodyweight, setIsBodyweight] = useState(exercise?.is_bodyweight ?? false)
  const [isCompound, setIsCompound] = useState(exercise?.is_compound ?? true)
  const [difficultyScore, setDifficultyScore] = useState<number>(exercise?.difficulty_score ?? 5)
  const [progressionOrder, setProgressionOrder] = useState(exercise?.progression_order?.toString() ?? "")
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [autoFillApplied, setAutoFillApplied] = useState(false)

  // Sync state when exercise prop changes
  useEffect(() => {
    setExercise(initialExercise)
    setName(initialExercise?.name ?? "")
    setSelectedCategories(initialExercise?.category ?? [])
    setDifficulty(initialExercise?.difficulty ?? "")
    setMuscleGroup(initialExercise?.muscle_group ?? "")
    setEquipment(initialExercise?.equipment ?? "")
    setDescription(initialExercise?.description ?? "")
    setInstructions(initialExercise?.instructions ?? "")
    setVideoUrl(initialExercise?.video_url ?? "")
    setMovementPattern(initialExercise?.movement_pattern ?? "")
    setForceType(initialExercise?.force_type ?? "")
    setLaterality(initialExercise?.laterality ?? "")
    setPrimaryMuscles(initialExercise?.primary_muscles ?? [])
    setSecondaryMuscles(initialExercise?.secondary_muscles ?? [])
    setEquipmentRequired(initialExercise?.equipment_required ?? [])
    setIsBodyweight(initialExercise?.is_bodyweight ?? false)
    setIsCompound(initialExercise?.is_compound ?? true)
    setDifficultyScore(initialExercise?.difficulty_score ?? 5)
    setProgressionOrder(initialExercise?.progression_order?.toString() ?? "")
    setStep(0)
    setDirection(1)
    setAutoFillApplied(false)
    setIframeLoaded(false)
  }, [initialExercise, open])

  // How many steps are visible
  const hasExercise = !!(exercise as Exercise | null)?.id
  const maxStep = (isEditing || hasExercise) ? 3 : 2
  const visibleSteps = STEPS.slice(0, maxStep + 1)
  const submitStep = 2 // Submit happens on AI Metadata step

  // ─── Tour ───────────────────────────────────────────────────────────────

  const stepRef = useRef(step)
  stepRef.current = step

  const tourGoToStep = useCallback((target: number) => {
    setDirection(target > stepRef.current ? 1 : -1)
    setStep(target)
  }, [])

  const tourSteps = useMemo(() => getExerciseTourSteps(tourGoToStep), [tourGoToStep])

  const tour = useFormTour({
    steps: tourSteps,
    scrollContainerRef: dialogRef,
  })

  // ─── Navigation ─────────────────────────────────────────────────────────

  function toggleItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])
  }

  function scrollToTop() {
    dialogRef.current?.scrollTo({ top: 0 })
  }

  function validateStep(s: number): boolean {
    if (s === 0) {
      if (!name.trim()) { toast.error("Name is required"); return false }
      if (selectedCategories.length === 0) { toast.error("Select at least one category"); return false }
      if (!difficulty) { toast.error("Difficulty is required"); return false }
    }
    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    setDirection(1)
    setStep((s) => Math.min(s + 1, maxStep))
    scrollToTop()
  }

  function handleBack() {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
    scrollToTop()
  }

  function goToStep(target: number) {
    if (target >= step) return
    setDirection(-1)
    setStep(target)
    scrollToTop()
  }

  function handleDialogClose() {
    if (isSubmitting) return
    tour.close()
    onOpenChange(false)
  }

  // ─── AI Auto-fill ───────────────────────────────────────────────────────

  async function handleAutoFill(force = false) {
    if (!name.trim()) { toast.error("Enter an exercise name first"); return }
    if (selectedCategories.length === 0) { toast.error("Select at least one category first"); return }

    setIsAutoFilling(true)
    try {
      const response = await fetch("/api/admin/exercises/ai-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: selectedCategories,
          difficulty: difficulty || undefined,
          description: description.trim() || undefined,
          equipment: equipment.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "AI auto-fill failed")
      }

      const p = await response.json()

      if (p.movement_pattern && (force || !movementPattern)) setMovementPattern(p.movement_pattern)
      if (p.force_type && (force || !forceType)) setForceType(p.force_type)
      if (p.laterality && (force || !laterality)) setLaterality(p.laterality)
      if (p.primary_muscles?.length > 0 && (force || primaryMuscles.length === 0)) setPrimaryMuscles(p.primary_muscles)
      if (p.secondary_muscles?.length > 0 && (force || secondaryMuscles.length === 0)) setSecondaryMuscles(p.secondary_muscles)
      if (p.equipment_required?.length > 0 && (force || equipmentRequired.length === 0)) setEquipmentRequired(p.equipment_required)
      if (p.is_bodyweight !== undefined && (force || !autoFillApplied)) setIsBodyweight(p.is_bodyweight)
      if (p.is_compound !== undefined && (force || !autoFillApplied)) setIsCompound(p.is_compound)
      if (p.difficulty_score && (force || difficultyScore === 5)) setDifficultyScore(p.difficulty_score)

      setAutoFillApplied(true)
      toast.success("AI metadata applied — review and adjust as needed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI auto-fill failed")
    } finally {
      setIsAutoFilling(false)
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setErrors({})

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      category: selectedCategories,
      muscle_group: muscleGroup.trim() || null,
      difficulty,
      equipment: equipment.trim() || null,
      video_url: videoUrl.trim() || null,
      instructions: instructions.trim() || null,
      movement_pattern: movementPattern || null,
      force_type: forceType || null,
      laterality: laterality || null,
      primary_muscles: primaryMuscles,
      secondary_muscles: secondaryMuscles,
      equipment_required: equipmentRequired,
      is_bodyweight: isBodyweight,
      is_compound: isCompound,
      difficulty_score: difficultyScore,
      progression_order: progressionOrder ? parseInt(progressionOrder) : null,
    }

    const result = exerciseFormSchema.safeParse(data)
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      const fieldErrors = result.error.flatten().fieldErrors
      const firstError = Object.values(fieldErrors).flat()[0]
      if (firstError) toast.error(firstError)
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

      const responseData = await response.json()

      if (isEditing) {
        toast.success("Exercise updated successfully")
        onOpenChange(false)
      } else {
        toast.success("Exercise created — add alternative exercises below, or close when done")
        setExercise(responseData)
        setDirection(1)
        setStep(3)
        scrollToTop()
      }
      router.refresh()
    } catch {
      toast.error(isEditing ? "Failed to update exercise" : "Failed to create exercise")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDialogClose(); else onOpenChange(o) }}>
      <DialogContent
        ref={dialogRef}
        className={cn("sm:max-w-lg max-h-[90vh] overflow-y-auto", tour.isActive && "pb-48")}
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <DialogTitle className="text-lg font-heading font-semibold text-foreground">
              {isEditing ? "Edit Exercise" : "Add Exercise"}
            </DialogTitle>
            <TourButton onClick={tour.start} />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {visibleSteps.map((s, idx) => (
              <button
                key={s.label}
                type="button"
                onClick={() => goToStep(idx)}
                disabled={idx > step}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  idx === step
                    ? "bg-primary text-primary-foreground"
                    : idx < step
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-muted text-muted-foreground cursor-default"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center size-4 rounded-full text-[10px] font-bold",
                  idx === step
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : idx < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {idx < step ? "\u2713" : s.number}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {step === 0 && (
                <StepBasics
                  name={name}
                  setName={setName}
                  selectedCategories={selectedCategories}
                  toggleCategory={(cat) => toggleItem(selectedCategories, cat, setSelectedCategories)}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  muscleGroup={muscleGroup}
                  setMuscleGroup={setMuscleGroup}
                  equipment={equipment}
                  setEquipment={setEquipment}
                  errors={errors}
                  disabled={isSubmitting}
                />
              )}
              {step === 1 && (
                <StepDetails
                  description={description}
                  setDescription={setDescription}
                  instructions={instructions}
                  setInstructions={setInstructions}
                  videoUrl={videoUrl}
                  setVideoUrl={(url) => { setVideoUrl(url); setIframeLoaded(false) }}
                  youtubeId={youtubeId}
                  iframeLoaded={iframeLoaded}
                  onIframeLoad={() => setIframeLoaded(true)}
                  errors={errors}
                  disabled={isSubmitting}
                />
              )}
              {step === 2 && (
                <StepAiMetadata
                  movementPattern={movementPattern}
                  setMovementPattern={setMovementPattern}
                  forceType={forceType}
                  setForceType={setForceType}
                  laterality={laterality}
                  setLaterality={setLaterality}
                  primaryMuscles={primaryMuscles}
                  togglePrimary={(m) => toggleItem(primaryMuscles, m, setPrimaryMuscles)}
                  secondaryMuscles={secondaryMuscles}
                  toggleSecondary={(m) => toggleItem(secondaryMuscles, m, setSecondaryMuscles)}
                  equipmentRequired={equipmentRequired}
                  toggleEquipment={(eq) => toggleItem(equipmentRequired, eq, setEquipmentRequired)}
                  isBodyweight={isBodyweight}
                  setIsBodyweight={setIsBodyweight}
                  isCompound={isCompound}
                  setIsCompound={setIsCompound}
                  difficultyScore={difficultyScore}
                  setDifficultyScore={setDifficultyScore}
                  progressionOrder={progressionOrder}
                  setProgressionOrder={setProgressionOrder}
                  isAutoFilling={isAutoFilling}
                  autoFillApplied={autoFillApplied}
                  onAutoFill={handleAutoFill}
                  disabled={isSubmitting}
                />
              )}
              {step === 3 && exercise?.id && (
                <StepRelationships
                  exerciseId={exercise.id}
                  exerciseName={exercise.name}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <FormTour {...tour} />

        {/* Footer */}
        <DialogFooter>
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>
              Cancel
            </Button>
          )}

          {step < submitStep ? (
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : step === submitStep ? (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? isEditing ? "Saving..." : "Creating..."
                : isEditing ? "Save Changes" : "Create Exercise"}
            </Button>
          ) : (
            <Button type="button" onClick={handleDialogClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Step 0: Basics ─────────────────────────────────────────────────────────

function StepBasics({
  name, setName,
  selectedCategories, toggleCategory,
  difficulty, setDifficulty,
  muscleGroup, setMuscleGroup,
  equipment, setEquipment,
  errors, disabled,
}: {
  name: string; setName: (v: string) => void
  selectedCategories: string[]; toggleCategory: (cat: string) => void
  difficulty: string; setDifficulty: (v: string) => void
  muscleGroup: string; setMuscleGroup: (v: string) => void
  equipment: string; setEquipment: (v: string) => void
  errors: Partial<Record<string, string[]>>
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Barbell Back Squat"
          disabled={disabled}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label>Category *</Label>
        <div id="category" className="flex flex-wrap gap-1.5">
          {EXERCISE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              disabled={disabled}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full border transition-colors",
                selectedCategories.includes(cat)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-destructive">{errors.category[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty *</Label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          <option value="" disabled>Select difficulty</option>
          {EXERCISE_DIFFICULTIES.map((diff) => (
            <option key={diff} value={diff}>{DIFFICULTY_LABELS[diff]}</option>
          ))}
        </select>
        {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty[0]}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="muscle_group">Muscle Group</Label>
          <Input
            id="muscle_group"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            placeholder="e.g. Quadriceps, Glutes"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">Quick label for cards and lists</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment">Equipment</Label>
          <Input
            id="equipment"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="e.g. Barbell, Squat Rack"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Details ────────────────────────────────────────────────────────

function StepDetails({
  description, setDescription,
  instructions, setInstructions,
  videoUrl, setVideoUrl,
  youtubeId, iframeLoaded, onIframeLoad,
  errors, disabled,
}: {
  description: string; setDescription: (v: string) => void
  instructions: string; setInstructions: (v: string) => void
  videoUrl: string; setVideoUrl: (v: string) => void
  youtubeId: string | null; iframeLoaded: boolean; onIframeLoad: () => void
  errors: Partial<Record<string, string[]>>
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the exercise..."
          disabled={disabled}
          className={textareaClass}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          placeholder="Step-by-step instructions..."
          disabled={disabled}
          className={textareaClass}
        />
        {errors.instructions && <p className="text-xs text-destructive">{errors.instructions[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="video_url">Video URL</Label>
        <Input
          id="video_url"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          disabled={disabled}
        />
        {errors.video_url && <p className="text-xs text-destructive">{errors.video_url[0]}</p>}
        {youtubeId && (
          <div className="max-w-sm">
            <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
              {!iframeLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
              <iframe
                key={youtubeId}
                src={getYouTubeEmbedUrl(youtubeId)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video preview"
                onLoad={onIframeLoad}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 2: AI Metadata ────────────────────────────────────────────────────

function StepAiMetadata({
  movementPattern, setMovementPattern,
  forceType, setForceType,
  laterality, setLaterality,
  primaryMuscles, togglePrimary,
  secondaryMuscles, toggleSecondary,
  equipmentRequired, toggleEquipment,
  isBodyweight, setIsBodyweight,
  isCompound, setIsCompound,
  difficultyScore, setDifficultyScore,
  progressionOrder, setProgressionOrder,
  isAutoFilling, autoFillApplied, onAutoFill,
  disabled,
}: {
  movementPattern: string; setMovementPattern: (v: string) => void
  forceType: string; setForceType: (v: string) => void
  laterality: string; setLaterality: (v: string) => void
  primaryMuscles: string[]; togglePrimary: (m: string) => void
  secondaryMuscles: string[]; toggleSecondary: (m: string) => void
  equipmentRequired: string[]; toggleEquipment: (eq: string) => void
  isBodyweight: boolean; setIsBodyweight: (v: boolean) => void
  isCompound: boolean; setIsCompound: (v: boolean) => void
  difficultyScore: number; setDifficultyScore: (v: number) => void
  progressionOrder: string; setProgressionOrder: (v: string) => void
  isAutoFilling: boolean; autoFillApplied: boolean; onAutoFill: (force?: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      {/* AI Auto-fill banner */}
      <div id="ai-autofill-btn" className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">AI Auto-fill</p>
              <p className="text-xs text-muted-foreground">Predict metadata from exercise name and category</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onAutoFill(autoFillApplied)}
            disabled={disabled || isAutoFilling}
            className="shrink-0"
          >
            {isAutoFilling ? (
              <><Loader2 className="size-3.5 animate-spin" /> Predicting...</>
            ) : autoFillApplied ? (
              <><RefreshCw className="size-3.5" /> Re-fill</>
            ) : (
              <><Sparkles className="size-3.5" /> Auto-fill</>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">These fields help the AI generate better programs and find suitable alternatives.</p>

      {/* Movement Pattern & Force Type */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="movement_pattern">Movement Pattern</Label>
          <select
            id="movement_pattern"
            value={movementPattern}
            onChange={(e) => setMovementPattern(e.target.value)}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">None</option>
            {MOVEMENT_PATTERNS.map((mp) => (
              <option key={mp} value={mp}>{MOVEMENT_PATTERN_LABELS[mp]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="force_type">Force Type</Label>
          <select
            id="force_type"
            value={forceType}
            onChange={(e) => setForceType(e.target.value)}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">None</option>
            {FORCE_TYPES.map((ft) => (
              <option key={ft} value={ft}>{FORCE_TYPE_LABELS[ft]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Laterality */}
      <div className="space-y-2">
        <Label htmlFor="laterality">Laterality</Label>
        <select
          id="laterality"
          value={laterality}
          onChange={(e) => setLaterality(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">None</option>
          {LATERALITY_OPTIONS.map((lat) => (
            <option key={lat} value={lat}>{LATERALITY_LABELS[lat]}</option>
          ))}
        </select>
      </div>

      {/* Primary Muscles */}
      <div className="space-y-2">
        <Label>Primary Muscles</Label>
        <p className="text-xs text-muted-foreground">Used by AI for exercise matching and program balancing</p>
        <div id="primary_muscles" className="flex flex-wrap gap-1.5">
          {MUSCLE_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => togglePrimary(m)}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs rounded-full border transition-colors",
                primaryMuscles.includes(m)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Muscles */}
      <div className="space-y-2">
        <Label>Secondary Muscles</Label>
        <p className="text-xs text-muted-foreground">Muscles that assist in the movement</p>
        <div id="secondary_muscles" className="flex flex-wrap gap-1.5">
          {MUSCLE_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleSecondary(m)}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs rounded-full border transition-colors",
                secondaryMuscles.includes(m)
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background border-border text-muted-foreground hover:border-accent/50"
              )}
            >
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Required */}
      <div className="space-y-2">
        <Label>Equipment Required</Label>
        <div id="equipment_required" className="flex flex-wrap gap-1.5">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggleEquipment(eq)}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs rounded-full border transition-colors",
                equipmentRequired.includes(eq)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>
      </div>

      {/* Bodyweight & Compound */}
      <div id="bodyweight_compound" className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isBodyweight}
            onChange={(e) => setIsBodyweight(e.target.checked)}
            disabled={disabled}
            className="rounded border-border"
          />
          Bodyweight
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isCompound}
            onChange={(e) => setIsCompound(e.target.checked)}
            disabled={disabled}
            className="rounded border-border"
          />
          Compound
        </label>
      </div>

      {/* Difficulty Score */}
      <div className="space-y-2">
        <Label htmlFor="difficulty_score">Difficulty Score (1-10)</Label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            id="difficulty_score"
            min={1}
            max={10}
            value={difficultyScore}
            onChange={(e) => setDifficultyScore(Number(e.target.value))}
            disabled={disabled}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-medium w-6 text-center">{difficultyScore}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          1-2: Foundational &middot; 3-4: Beginner &middot; 5-6: Intermediate &middot; 7-8: Advanced &middot; 9-10: Elite
        </p>
      </div>

      {/* Progression Order */}
      <div className="space-y-2">
        <Label htmlFor="progression_order">Progression Order</Label>
        <Input
          id="progression_order"
          type="number"
          min={1}
          value={progressionOrder}
          onChange={(e) => setProgressionOrder(e.target.value)}
          placeholder="e.g. 1, 2, 3 within same movement pattern"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">Order within the same movement pattern (lower = easier progression)</p>
      </div>
    </div>
  )
}

// ─── Step 3: Relationships ──────────────────────────────────────────────────

function StepRelationships({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string
  exerciseName: string
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Link alternative exercises that clients can swap to during workouts. You can also define progression and regression relationships.
      </p>
      <div id="exercise-alternatives">
        <ExerciseRelationships
          exerciseId={exerciseId}
          exerciseName={exerciseName}
        />
      </div>
    </div>
  )
}
