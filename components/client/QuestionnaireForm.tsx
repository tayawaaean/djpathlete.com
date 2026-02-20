"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import {
  Target,
  Activity,
  History,
  AlertTriangle,
  Dumbbell,
  CalendarDays,
  ThumbsUp,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FITNESS_GOALS,
  EXPERIENCE_LEVELS,
  SESSION_DURATIONS,
  DAY_NAMES,
  TIME_EFFICIENCY_OPTIONS,
  TIME_EFFICIENCY_LABELS,
  TRAINING_TECHNIQUES,
  TECHNIQUE_LABELS,
  TECHNIQUE_DESCRIPTIONS,
  GOAL_LABELS,
  LEVEL_LABELS,
  EQUIPMENT_LABELS,
  EQUIPMENT_PRESETS,
} from "@/lib/validators/questionnaire"
import { EQUIPMENT_OPTIONS } from "@/lib/validators/exercise"
import type { ClientProfile, InjuryDetail } from "@/types/database"

const TOTAL_STEPS = 8

const STEP_INFO = [
  { label: "Fitness Goals", icon: Target },
  { label: "Fitness Level", icon: Activity },
  { label: "Training History", icon: History },
  { label: "Injuries", icon: AlertTriangle },
  { label: "Equipment", icon: Dumbbell },
  { label: "Schedule", icon: CalendarDays },
  { label: "Preferences", icon: ThumbsUp },
  { label: "Review", icon: ClipboardCheck },
] as const

interface FormData {
  goals: string[]
  experience_level: string
  training_years: number | null
  training_background: string
  injuries_text: string
  injury_details: InjuryDetail[]
  available_equipment: string[]
  preferred_day_names: number[]
  preferred_session_minutes: number
  time_efficiency_preference: string | null
  preferred_techniques: string[]
  exercise_likes: string
  exercise_dislikes: string
  additional_notes: string
}

function parseGoalsFromProfile(goalsString: string | null): string[] {
  if (!goalsString) return []
  // Extract goals from the format "Goals: weight_loss, muscle_gain | ..."
  const goalsMatch = goalsString.match(/^Goals:\s*(.+?)(?:\s*\||$)/)
  if (goalsMatch) {
    return goalsMatch[1]
      .split(",")
      .map((g) => g.trim())
      .filter((g) =>
        (FITNESS_GOALS as readonly string[]).includes(g)
      )
  }
  return []
}

function parseFieldFromProfile(
  goalsString: string | null,
  prefix: string
): string {
  if (!goalsString) return ""
  const regex = new RegExp(`${prefix}:\\s*(.+?)(?:\\s*\\||$)`)
  const match = goalsString.match(regex)
  return match ? match[1].trim() : ""
}

function buildInitialData(profile: ClientProfile | null): FormData {
  if (!profile) {
    return {
      goals: [],
      experience_level: "",
      training_years: null,
      training_background: "",
      injuries_text: "",
      injury_details: [],
      available_equipment: [],
      preferred_day_names: [1, 3, 5], // Mon/Wed/Fri default
      preferred_session_minutes: 60,
      time_efficiency_preference: null,
      preferred_techniques: [],
      exercise_likes: "",
      exercise_dislikes: "",
      additional_notes: "",
    }
  }

  return {
    goals: parseGoalsFromProfile(profile.goals),
    experience_level: profile.experience_level ?? "",
    training_years: profile.training_years,
    training_background: parseFieldFromProfile(
      profile.goals,
      "Training background"
    ),
    injuries_text: profile.injuries ?? "",
    injury_details: profile.injury_details ?? [],
    available_equipment: profile.available_equipment ?? [],
    preferred_day_names:
      profile.preferred_day_names?.length > 0
        ? profile.preferred_day_names
        : [1, 3, 5],
    preferred_session_minutes: profile.preferred_session_minutes ?? 60,
    time_efficiency_preference: profile.time_efficiency_preference ?? null,
    preferred_techniques: profile.preferred_techniques ?? [],
    exercise_likes: parseFieldFromProfile(profile.goals, "Likes"),
    exercise_dislikes: parseFieldFromProfile(profile.goals, "Dislikes"),
    additional_notes: parseFieldFromProfile(profile.goals, "Notes"),
  }
}

export function QuestionnaireForm({
  initialProfile,
}: {
  initialProfile: ClientProfile | null
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(() =>
    buildInitialData(initialProfile)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const validateCurrentStep = (): string | null => {
    switch (currentStep) {
      case 1:
        if (formData.goals.length === 0)
          return "Please select at least one fitness goal."
        return null
      case 2:
        if (!formData.experience_level)
          return "Please select your fitness level."
        return null
      case 6:
        if (formData.preferred_day_names.length === 0)
          return "Please select at least one training day."
        if (
          !(SESSION_DURATIONS as readonly number[]).includes(
            formData.preferred_session_minutes
          )
        )
          return "Please select a valid session duration."
        return null
      default:
        return null
    }
  }

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }

  const handleNext = () => {
    const error = validateCurrentStep()
    if (error) {
      toast.error(error)
      return
    }
    setDirection(1)
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }

  const handleBack = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save questionnaire")
      }

      toast.success("Assessment saved! Now find a program that fits your goals.")
      router.push("/programs")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressValue = (currentStep / TOTAL_STEPS) * 100

  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
          <div className="flex items-center gap-2">
            {STEP_INFO[currentStep - 1] && (
              <>
                {(() => {
                  const StepIcon = STEP_INFO[currentStep - 1].icon
                  return (
                    <StepIcon className="size-4 text-primary" />
                  )
                })()}
                <span className="text-sm font-medium text-primary">
                  {STEP_INFO[currentStep - 1].label}
                </span>
              </>
            )}
          </div>
        </div>
        <Progress value={progressValue} className="h-2" />

        {/* Step dots */}
        <div className="flex items-center justify-between mt-4 gap-1">
          {STEP_INFO.map((step, index) => {
            const stepNum = index + 1
            const isComplete = stepNum < currentStep
            const isCurrent = stepNum === currentStep
            return (
              <button
                key={step.label}
                onClick={() => goToStep(stepNum)}
                className={`flex items-center justify-center size-8 rounded-full text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
                title={step.label}
              >
                {isComplete ? <Check className="size-3.5" /> : stepNum}
              </button>
            )
          })}
        </div>
      </div>

      {/* Form content */}
      <div className="bg-white rounded-xl border border-border p-6 min-h-[400px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
              <Step1Goals formData={formData} updateField={updateField} />
            )}
            {currentStep === 2 && (
              <Step2Level formData={formData} updateField={updateField} />
            )}
            {currentStep === 3 && (
              <Step3History formData={formData} updateField={updateField} />
            )}
            {currentStep === 4 && (
              <Step4Injuries formData={formData} updateField={updateField} />
            )}
            {currentStep === 5 && (
              <Step5Equipment formData={formData} updateField={updateField} />
            )}
            {currentStep === 6 && (
              <Step6Schedule formData={formData} updateField={updateField} />
            )}
            {currentStep === 7 && (
              <Step7Preferences formData={formData} updateField={updateField} />
            )}
            {currentStep === 8 && (
              <Step8Review formData={formData} onGoToStep={goToStep} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Submit Questionnaire
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ─── Step Components ──────────────────────────────────────────────── */

interface StepProps {
  formData: FormData
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

function Step1Goals({ formData, updateField }: StepProps) {
  const toggleGoal = (goal: string) => {
    const current = formData.goals
    if (current.includes(goal)) {
      updateField(
        "goals",
        current.filter((g) => g !== goal)
      )
    } else {
      updateField("goals", [...current, goal])
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        What are your fitness goals?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select all that apply. This helps us tailor your training program.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FITNESS_GOALS.map((goal) => {
          const selected = formData.goals.includes(goal)
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 hover:bg-surface/50"
              }`}
            >
              <div
                className={`flex items-center justify-center size-5 rounded border transition-colors ${
                  selected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {selected && <Check className="size-3" />}
              </div>
              <span className="text-sm font-medium text-foreground">
                {GOAL_LABELS[goal] ?? goal}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step2Level({ formData, updateField }: StepProps) {
  const LEVEL_DESCRIPTIONS: Record<string, string> = {
    beginner:
      "New to structured training, less than 6 months of consistent exercise.",
    intermediate:
      "Regular training for 6 months to 2 years with good form on basic exercises.",
    advanced:
      "2+ years of consistent, structured training with strong exercise proficiency.",
    elite:
      "Competitive athlete or 5+ years of dedicated training at a high level.",
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        What is your current fitness level?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Be honest — this helps us set the right starting point for your program.
      </p>
      <div className="space-y-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const selected = formData.experience_level === level
          return (
            <button
              key={level}
              type="button"
              onClick={() => updateField("experience_level", level)}
              className={`flex flex-col w-full rounded-lg border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 hover:bg-surface/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center size-5 rounded-full border-2 transition-colors ${
                    selected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {selected && (
                    <div className="size-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {LEVEL_LABELS[level] ?? level}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 ml-8">
                {LEVEL_DESCRIPTIONS[level]}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step3History({ formData, updateField }: StepProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        Tell us about your training history
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Understanding your background helps us build on your strengths.
      </p>
      <div className="space-y-6">
        <div>
          <Label htmlFor="training-years">Years of training experience</Label>
          <Input
            id="training-years"
            type="number"
            min={0}
            max={60}
            placeholder="e.g. 3"
            value={formData.training_years ?? ""}
            onChange={(e) =>
              updateField(
                "training_years",
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="mt-1.5 max-w-[200px]"
          />
        </div>
        <div>
          <Label htmlFor="training-background">
            Training background (optional)
          </Label>
          <Textarea
            id="training-background"
            placeholder="Tell us about your training background — sports played, programs followed, certifications, etc."
            value={formData.training_background}
            onChange={(e) => updateField("training_background", e.target.value)}
            className="mt-1.5"
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.training_background.length}/2000 characters
          </p>
        </div>
      </div>
    </div>
  )
}

function Step4Injuries({ formData, updateField }: StepProps) {
  const addInjury = () => {
    updateField("injury_details", [
      ...formData.injury_details,
      { area: "", side: "", severity: "", notes: "" },
    ])
  }

  const removeInjury = (index: number) => {
    updateField(
      "injury_details",
      formData.injury_details.filter((_, i) => i !== index)
    )
  }

  const updateInjury = (
    index: number,
    field: keyof InjuryDetail,
    value: string
  ) => {
    const updated = formData.injury_details.map((injury, i) =>
      i === index ? { ...injury, [field]: value } : injury
    )
    updateField("injury_details", updated)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        Injuries & limitations
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Let us know about any current or past injuries so we can program safely
        around them.
      </p>
      <div className="space-y-6">
        <div>
          <Label htmlFor="injuries-text">
            General notes about injuries or limitations (optional)
          </Label>
          <Textarea
            id="injuries-text"
            placeholder="e.g. I have a recurring lower back issue that flares up with heavy deadlifts..."
            value={formData.injuries_text}
            onChange={(e) => updateField("injuries_text", e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Specific injuries</Label>
            <Button type="button" variant="outline" size="sm" onClick={addInjury}>
              <Plus className="size-3.5" />
              Add injury
            </Button>
          </div>

          {formData.injury_details.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
              No specific injuries added. Click &quot;Add injury&quot; if you
              have any to report.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.injury_details.map((injury, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-3 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeInjury(index)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`injury-area-${index}`}>
                        Body area
                      </Label>
                      <Input
                        id={`injury-area-${index}`}
                        placeholder="e.g. Knee"
                        value={injury.area}
                        onChange={(e) =>
                          updateInjury(index, "area", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`injury-side-${index}`}>Side</Label>
                      <Select
                        value={injury.side ?? ""}
                        onValueChange={(v) => updateInjury(index, "side", v)}
                      >
                        <SelectTrigger
                          id={`injury-side-${index}`}
                          className="mt-1 w-full"
                        >
                          <SelectValue placeholder="Select side" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                          <SelectItem value="n/a">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`injury-severity-${index}`}>
                        Severity
                      </Label>
                      <Select
                        value={injury.severity ?? ""}
                        onValueChange={(v) =>
                          updateInjury(index, "severity", v)
                        }
                      >
                        <SelectTrigger
                          id={`injury-severity-${index}`}
                          className="mt-1 w-full"
                        >
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                          <SelectItem value="recovering">Recovering</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`injury-notes-${index}`}>Notes</Label>
                    <Input
                      id={`injury-notes-${index}`}
                      placeholder="Additional details..."
                      value={injury.notes ?? ""}
                      onChange={(e) =>
                        updateInjury(index, "notes", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Step5Equipment({ formData, updateField }: StepProps) {
  const toggleEquipment = (equipment: string) => {
    const current = formData.available_equipment
    if (current.includes(equipment)) {
      updateField(
        "available_equipment",
        current.filter((e) => e !== equipment)
      )
    } else {
      updateField("available_equipment", [...current, equipment])
    }
  }

  const applyPreset = (presetItems: readonly string[]) => {
    updateField("available_equipment", [...presetItems])
  }

  // Determine which preset is currently active (exact match)
  const activePreset = Object.entries(EQUIPMENT_PRESETS).find(
    ([, items]) =>
      items.length === formData.available_equipment.length &&
      items.every((item) => formData.available_equipment.includes(item))
  )?.[0]

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        What equipment do you have access to?
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Pick a preset or select individual items below.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {Object.entries(EQUIPMENT_PRESETS).map(([name, items]) => {
          const isActive = activePreset === name
          return (
            <Button
              key={name}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(items)}
            >
              {name}
            </Button>
          )
        })}
        <span className="text-xs text-muted-foreground ml-auto">
          {formData.available_equipment.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EQUIPMENT_OPTIONS.map((eq) => {
          const selected = formData.available_equipment.includes(eq)
          return (
            <label
              key={eq}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={() => toggleEquipment(eq)}
              />
              <span className="text-sm text-foreground">
                {EQUIPMENT_LABELS[eq] ?? eq}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function Step6Schedule({ formData, updateField }: StepProps) {
  const toggleDay = (day: number) => {
    const current = formData.preferred_day_names
    if (current.includes(day)) {
      updateField(
        "preferred_day_names",
        current.filter((d) => d !== day)
      )
    } else {
      updateField(
        "preferred_day_names",
        [...current, day].sort((a, b) => a - b)
      )
    }
  }

  const selectedDayLabels = formData.preferred_day_names
    .map((d) => DAY_NAMES[d - 1])
    .join(", ")

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        Your training schedule
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Pick the days you can train and how long each session should be.
      </p>
      <div className="space-y-8">
        {/* Day picker */}
        <div>
          <Label>Which days can you train?</Label>
          <div className="grid grid-cols-7 gap-2 mt-3">
            {DAY_NAMES.map((name, idx) => {
              const dayNum = idx + 1
              const selected = formData.preferred_day_names.includes(dayNum)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDay(dayNum)}
                  className={`rounded-lg border py-3 text-center transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary text-primary font-semibold"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  <span className="text-sm font-medium">{name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Session duration */}
        <div>
          <Label>Session duration</Label>
          <div className="grid grid-cols-5 gap-2 mt-3">
            {SESSION_DURATIONS.map((duration) => {
              const selected = formData.preferred_session_minutes === duration
              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() =>
                    updateField("preferred_session_minutes", duration)
                  }
                  className={`rounded-lg border py-3 text-center transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary text-primary font-semibold"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  <span className="text-lg font-medium">{duration}</span>
                  <span className="block text-xs text-muted-foreground">
                    min
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time efficiency preference — show when session is 45 min or less */}
        {formData.preferred_session_minutes <= 45 && (
          <div>
            <Label>When short on time, how do you prefer to train?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {TIME_EFFICIENCY_OPTIONS.map((opt) => {
                const selected = formData.time_efficiency_preference === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      updateField(
                        "time_efficiency_preference",
                        selected ? null : opt
                      )
                    }
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center size-5 rounded-full border-2 transition-colors ${
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selected && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {TIME_EFFICIENCY_LABELS[opt]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-surface/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Summary:</strong> You plan to
            train{" "}
            <strong className="text-primary">
              {selectedDayLabels || "no days selected"}
            </strong>{" "}
            ({formData.preferred_day_names.length} days/week) for{" "}
            <strong className="text-primary">
              {formData.preferred_session_minutes} minutes
            </strong>{" "}
            per session.
          </p>
        </div>
      </div>
    </div>
  )
}

function Step7Preferences({ formData, updateField }: StepProps) {
  const toggleTechnique = (technique: string) => {
    const current = formData.preferred_techniques
    if (current.includes(technique)) {
      updateField(
        "preferred_techniques",
        current.filter((t) => t !== technique)
      )
    } else {
      updateField("preferred_techniques", [...current, technique])
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        Exercise preferences
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Share what you enjoy and what you would rather avoid. This helps us keep
        you motivated.
      </p>
      <div className="space-y-6">
        {/* Training techniques */}
        <div>
          <Label>Training techniques you enjoy (optional)</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            Select any techniques you want included in your program.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TRAINING_TECHNIQUES.map((tech) => {
              const selected = formData.preferred_techniques.includes(tech)
              return (
                <label
                  key={tech}
                  className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggleTechnique(tech)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {TECHNIQUE_LABELS[tech]}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {TECHNIQUE_DESCRIPTIONS[tech]}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="exercise-likes">
            Exercises or activities you enjoy (optional)
          </Label>
          <Textarea
            id="exercise-likes"
            placeholder="e.g. I love heavy squats, pull-ups, and swimming..."
            value={formData.exercise_likes}
            onChange={(e) => updateField("exercise_likes", e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="exercise-dislikes">
            Exercises or activities you dislike (optional)
          </Label>
          <Textarea
            id="exercise-dislikes"
            placeholder="e.g. I'm not a fan of long-distance running or burpees..."
            value={formData.exercise_dislikes}
            onChange={(e) => updateField("exercise_dislikes", e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="additional-notes">
            Any additional notes or preferences (optional)
          </Label>
          <Textarea
            id="additional-notes"
            placeholder="e.g. I prefer morning workouts, I have a time constraint on Wednesdays, etc."
            value={formData.additional_notes}
            onChange={(e) => updateField("additional_notes", e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

function Step8Review({
  formData,
  onGoToStep,
}: {
  formData: FormData
  onGoToStep: (step: number) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-primary mb-2">
        Review your answers
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Make sure everything looks good before submitting. Click any section
        header to make changes.
      </p>
      <div className="space-y-4">
        {/* Goals */}
        <ReviewCard
          title="Fitness Goals"
          stepNumber={1}
          onEdit={onGoToStep}
        >
          {formData.goals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.goals.map((goal) => (
                <Badge key={goal} variant="secondary">
                  {GOAL_LABELS[goal] ?? goal}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No goals selected</p>
          )}
        </ReviewCard>

        {/* Fitness Level */}
        <ReviewCard
          title="Fitness Level"
          stepNumber={2}
          onEdit={onGoToStep}
        >
          <p className="text-sm text-foreground">
            {formData.experience_level
              ? LEVEL_LABELS[formData.experience_level] ??
                formData.experience_level
              : "Not selected"}
          </p>
        </ReviewCard>

        {/* Training History */}
        <ReviewCard
          title="Training History"
          stepNumber={3}
          onEdit={onGoToStep}
        >
          <div className="space-y-1">
            {formData.training_years !== null && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Years:</span>{" "}
                {formData.training_years}
              </p>
            )}
            {formData.training_background && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Background:</span>{" "}
                {formData.training_background}
              </p>
            )}
            {!formData.training_years && !formData.training_background && (
              <p className="text-sm text-muted-foreground">
                No training history provided
              </p>
            )}
          </div>
        </ReviewCard>

        {/* Injuries */}
        <ReviewCard
          title="Injuries & Limitations"
          stepNumber={4}
          onEdit={onGoToStep}
        >
          <div className="space-y-2">
            {formData.injuries_text && (
              <p className="text-sm text-foreground">{formData.injuries_text}</p>
            )}
            {formData.injury_details.length > 0 && (
              <div className="space-y-1.5">
                {formData.injury_details.map((injury, i) => (
                  <div
                    key={i}
                    className="text-sm text-foreground bg-surface/50 rounded px-3 py-1.5"
                  >
                    <span className="font-medium">{injury.area}</span>
                    {injury.side && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({injury.side})
                      </span>
                    )}
                    {injury.severity && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {injury.severity}
                      </span>
                    )}
                    {injury.notes && (
                      <span className="text-muted-foreground">
                        : {injury.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!formData.injuries_text &&
              formData.injury_details.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No injuries reported
                </p>
              )}
          </div>
        </ReviewCard>

        {/* Equipment */}
        <ReviewCard
          title="Available Equipment"
          stepNumber={5}
          onEdit={onGoToStep}
        >
          {formData.available_equipment.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {formData.available_equipment.map((eq) => (
                <Badge key={eq} variant="outline" className="text-xs">
                  {EQUIPMENT_LABELS[eq] ?? eq}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No equipment selected
            </p>
          )}
        </ReviewCard>

        {/* Schedule */}
        <ReviewCard title="Schedule" stepNumber={6} onEdit={onGoToStep}>
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Days:</span>{" "}
              {formData.preferred_day_names
                .map((d) => DAY_NAMES[d - 1])
                .join(", ") || "None selected"}{" "}
              ({formData.preferred_day_names.length} days/week)
            </p>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Duration:</span>{" "}
              {formData.preferred_session_minutes} minutes per session
            </p>
            {formData.time_efficiency_preference && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Time strategy:</span>{" "}
                {TIME_EFFICIENCY_LABELS[formData.time_efficiency_preference]}
              </p>
            )}
          </div>
        </ReviewCard>

        {/* Preferences */}
        <ReviewCard
          title="Exercise Preferences"
          stepNumber={7}
          onEdit={onGoToStep}
        >
          <div className="space-y-1">
            {formData.preferred_techniques.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {formData.preferred_techniques.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {TECHNIQUE_LABELS[t] ?? t}
                  </Badge>
                ))}
              </div>
            )}
            {formData.exercise_likes && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Likes:</span>{" "}
                {formData.exercise_likes}
              </p>
            )}
            {formData.exercise_dislikes && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Dislikes:</span>{" "}
                {formData.exercise_dislikes}
              </p>
            )}
            {formData.additional_notes && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Notes:</span>{" "}
                {formData.additional_notes}
              </p>
            )}
            {!formData.exercise_likes &&
              !formData.exercise_dislikes &&
              !formData.additional_notes &&
              formData.preferred_techniques.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No preferences provided
                </p>
              )}
          </div>
        </ReviewCard>
      </div>
    </div>
  )
}

function ReviewCard({
  title,
  stepNumber,
  onEdit,
  children,
}: {
  title: string
  stepNumber: number
  onEdit: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(stepNumber)}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}
