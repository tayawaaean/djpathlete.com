"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Clock,
  Brain,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Target,
  ClipboardList,
  Info,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  SPLIT_TYPES,
  PERIODIZATION_TYPES,
} from "@/lib/validators/program"
import {
  FITNESS_GOALS,
  GOAL_LABELS,
  SESSION_DURATIONS,
  EQUIPMENT_LABELS,
  LEVEL_LABELS,
} from "@/lib/validators/questionnaire"
import {
  parseProfileSummary,
  type ProfileSummary,
} from "@/lib/profile-utils"
import type { User, ClientProfile } from "@/types/database"

// ─── Constants ───────────────────────────────────────────────────────────────

const SPLIT_TYPE_LABELS: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper/Lower",
  push_pull_legs: "Push/Pull/Legs",
  push_pull: "Push/Pull",
  body_part: "Body Part",
  movement_pattern: "Movement Pattern",
  custom: "Custom",
}

const PERIODIZATION_LABELS: Record<string, string> = {
  linear: "Linear",
  undulating: "Undulating",
  block: "Block",
  reverse_linear: "Reverse Linear",
  none: "None",
}

const PROGRESS_MESSAGES = [
  { stage: 0, message: "Analyzing client profile...", icon: Brain },
  { stage: 1, message: "Designing program structure...", icon: Sparkles },
  { stage: 2, message: "Selecting exercises...", icon: Zap },
  { stage: 3, message: "Validating program...", icon: CheckCircle2 },
]

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

/**
 * Make validation issue messages more human-readable:
 * - "w3d2s4" → "Week 3, Day 2, Exercise 4"
 * - "leg_curl_machine" → "Leg Curl Machine"
 */
function formatIssueMessage(message: string): string {
  // Replace slot references like "w3d2s4" or "slot w3d2s4"
  let formatted = message.replace(
    /\b(?:slot\s+)?w(\d+)d(\d+)s(\d+)\b/gi,
    (_match, week, day, slot) => `Week ${week}, Day ${day}, Exercise ${slot}`
  )
  // Replace snake_case equipment/exercise names (only sequences of word_word)
  formatted = formatted.replace(
    /\b(?:requires\s+)(\w+(?:_\w+)+)\b/g,
    (_match, name: string) =>
      `requires ${name
        .split("_")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}`
  )
  return formatted
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AiGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GenerationResult {
  program_id: string
  validation: {
    pass: boolean
    issues: Array<{ type: string; category: string; message: string }>
    summary: string
  }
  token_usage: {
    agent1: number
    agent2: number
    agent3: number
    agent4: number
    total: number
  }
  duration_ms: number
  retries: number
}

export function AiGenerateDialog({ open, onOpenChange }: AiGenerateDialogProps) {
  const router = useRouter()
  const [clients, setClients] = useState<User[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  // Form state
  const [clientId, setClientId] = useState("")
  const [goals, setGoals] = useState<string[]>([])
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [sessionMinutes, setSessionMinutes] = useState(60)
  const [splitType, setSplitType] = useState("")
  const [periodization, setPeriodization] = useState("")
  const [additionalInstructions, setAdditionalInstructions] = useState("")

  // Profile state
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null)
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle")
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressStage, setProgressStage] = useState(0)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients when dialog opens
  const fetchClients = useCallback(async () => {
    setLoadingClients(true)
    try {
      // Use the existing server-rendered data approach - fetch users with client role
      const response = await fetch("/api/admin/users?role=client")
      if (response.ok) {
        const data = await response.json()
        setClients(data.users ?? data ?? [])
      }
    } catch {
      // Silently fail — clients list will be empty
    } finally {
      setLoadingClients(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchClients()
    }
  }, [open, fetchClients])

  // Fetch profile when client is selected
  useEffect(() => {
    if (!clientId) {
      setProfileSummary(null)
      setProfileStatus("idle")
      setSummaryExpanded(false)
      return
    }

    let cancelled = false

    async function fetchProfile() {
      setProfileStatus("loading")
      setProfileSummary(null)
      try {
        const response = await fetch(`/api/admin/questionnaires/${clientId}`)
        if (cancelled) return

        if (!response.ok) {
          setProfileStatus("not_found")
          return
        }

        const data = await response.json() as { profile: ClientProfile }
        if (cancelled) return

        const summary = parseProfileSummary(data.profile)

        // Check if there's meaningful questionnaire data
        const hasData =
          summary.goals.length > 0 ||
          summary.preferredTrainingDays !== null ||
          summary.preferredSessionMinutes !== null

        if (!hasData) {
          setProfileStatus("not_found")
          setProfileSummary(summary)
          return
        }

        setProfileSummary(summary)
        setProfileStatus("found")
        setSummaryExpanded(true)

        // Auto-populate form fields from questionnaire
        if (summary.goals.length > 0) {
          setGoals(summary.goals)
        }
        if (summary.preferredTrainingDays !== null) {
          setSessionsPerWeek(summary.preferredTrainingDays)
        }
        if (summary.preferredSessionMinutes !== null) {
          setSessionMinutes(summary.preferredSessionMinutes)
        }
      } catch {
        if (!cancelled) {
          setProfileStatus("not_found")
        }
      }
    }

    fetchProfile()
    return () => { cancelled = true }
  }, [clientId])

  function resetForm() {
    setClientId("")
    setGoals([])
    setDurationWeeks(4)
    setSessionsPerWeek(3)
    setSessionMinutes(60)
    setSplitType("")
    setPeriodization("")
    setAdditionalInstructions("")
    setProfileSummary(null)
    setProfileStatus("idle")
    setSummaryExpanded(false)
    setResult(null)
    setError(null)
    setIsGenerating(false)
    setProgressStage(0)
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && !isGenerating) {
      resetForm()
    }
    if (!isGenerating) {
      onOpenChange(newOpen)
    }
  }

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!clientId) {
      toast.error("Please select a client")
      return
    }
    if (goals.length === 0) {
      toast.error("Please select at least one goal")
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)
    setProgressStage(0)

    // Simulate progress stages over time
    const progressInterval = setInterval(() => {
      setProgressStage((prev) => {
        if (prev < PROGRESS_MESSAGES.length - 1) return prev + 1
        return prev
      })
    }, 12000) // Advance stage every 12 seconds

    try {
      const body: Record<string, unknown> = {
        client_id: clientId,
        goals,
        duration_weeks: durationWeeks,
        sessions_per_week: sessionsPerWeek,
        session_minutes: sessionMinutes,
      }

      if (splitType) body.split_type = splitType
      if (periodization) body.periodization = periodization
      if (additionalInstructions.trim()) {
        body.additional_instructions = additionalInstructions.trim()
      }
      // Pass equipment from questionnaire so the orchestrator can constrain exercise selection
      if (profileSummary && profileSummary.availableEquipment.length > 0) {
        body.equipment_override = profileSummary.availableEquipment
      }

      const response = await fetch("/api/admin/programs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate program")
      }

      setResult(data as GenerationResult)
      toast.success("Program generated successfully!")
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred"
      setError(message)
      toast.error("Program generation failed")
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
    }
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  // Success result view
  if (result) {
    const warningCount = result.validation.issues.filter(
      (i) => i.type === "warning"
    ).length
    const errorCount = result.validation.issues.filter(
      (i) => i.type === "error"
    ).length

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success" />
              Program Generated
            </DialogTitle>
            <DialogDescription>{result.validation.summary}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Validation status */}
            <div className="flex items-center gap-2 flex-wrap">
              {result.validation.pass ? (
                <Badge className="bg-success/10 text-success border-success/20">
                  Validation Passed
                </Badge>
              ) : (
                <Badge variant="destructive">Validation Failed</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="size-3" />
                  {warningCount} warning{warningCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3" />
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Warnings list */}
            {result.validation.issues.length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-2 max-h-40 overflow-y-auto">
                {result.validation.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {issue.type === "error" ? (
                      <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                    )}
                    <span className="text-muted-foreground">{formatIssueMessage(issue.message)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <div className="text-xs text-muted-foreground">Tokens Used</div>
                <div className="text-sm font-medium font-heading">
                  {result.token_usage.total.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="text-sm font-medium font-heading">
                  {Math.round(result.duration_ms / 1000)}s
                </div>
              </div>
              <div className="rounded-lg bg-surface/50 border border-border p-3">
                <div className="text-xs text-muted-foreground">Retries</div>
                <div className="text-sm font-medium font-heading">
                  {result.retries}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            <Link href={`/admin/programs/${result.program_id}`}>
              <Button>
                View Program
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Loading / generating view
  if (isGenerating) {
    const currentProgress = PROGRESS_MESSAGES[progressStage]
    const ProgressIcon = currentProgress?.icon ?? Loader2

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ProgressIcon className="size-8 text-primary animate-pulse" />
              </div>
              <Loader2 className="size-20 text-primary/30 animate-spin absolute -top-2 -left-2" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-heading font-semibold text-foreground">
                Generating Program
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentProgress?.message ?? "Processing..."}
              </p>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-2">
              {PROGRESS_MESSAGES.map((msg, idx) => (
                <div
                  key={idx}
                  className={`size-2 rounded-full transition-colors ${
                    idx <= progressStage
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              This typically takes 30-90 seconds
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Form view
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-accent" />
            AI Program Generator
          </DialogTitle>
          <DialogDescription>
            Generate a complete training program using AI. Select a client and
            configure the program parameters below.
          </DialogDescription>
        </DialogHeader>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
            <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Generation Failed
              </p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client select */}
          <div className="space-y-2">
            <Label htmlFor="ai-client">Client *</Label>
            <select
              id="ai-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={loadingClients}
              className={selectClass}
            >
              <option value="" disabled>
                {loadingClients ? "Loading clients..." : "Select a client"}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Profile status banners */}
          {profileStatus === "loading" && (
            <div className="rounded-lg bg-surface/50 border border-border p-3 flex items-center gap-2">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading questionnaire data...
              </p>
            </div>
          )}

          {profileStatus === "not_found" && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 flex items-start gap-2">
              <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">
                  No questionnaire data
                </p>
                <p className="text-xs text-warning/80">
                  This client hasn&apos;t completed their questionnaire. You&apos;ll need to configure all fields manually.
                </p>
              </div>
            </div>
          )}

          {/* Questionnaire summary panel */}
          {profileStatus === "found" && profileSummary && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
              <button
                type="button"
                onClick={() => setSummaryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="size-4" />
                  Questionnaire Summary
                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary/30 text-primary">
                    Auto-filled
                  </Badge>
                </span>
                {summaryExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>

              {summaryExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-primary/10">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                    {profileSummary.experienceLevel && (
                      <div>
                        <p className="text-xs text-muted-foreground">Experience Level</p>
                        <p className="text-sm font-medium">
                          {LEVEL_LABELS[profileSummary.experienceLevel] ?? profileSummary.experienceLevel}
                        </p>
                      </div>
                    )}
                    {profileSummary.trainingYears !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Training Years</p>
                        <p className="text-sm font-medium">
                          {profileSummary.trainingYears} year{profileSummary.trainingYears !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                    {profileSummary.sport && (
                      <div>
                        <p className="text-xs text-muted-foreground">Sport</p>
                        <p className="text-sm font-medium">{profileSummary.sport}</p>
                      </div>
                    )}
                    {profileSummary.position && (
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="text-sm font-medium">{profileSummary.position}</p>
                      </div>
                    )}
                  </div>

                  {/* Injuries */}
                  {(profileSummary.injuries || profileSummary.injuryDetails.length > 0) && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <AlertTriangle className="size-3" />
                        Injuries & Limitations
                      </p>
                      {profileSummary.injuries && (
                        <p className="text-sm">{profileSummary.injuries}</p>
                      )}
                      {profileSummary.injuryDetails.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profileSummary.injuryDetails.map((injury, i) => (
                            <Badge key={i} variant="outline" className="text-xs gap-1 border-warning/30 text-warning">
                              {injury.area}
                              {injury.side ? ` (${injury.side})` : ""}
                              {injury.severity ? ` - ${injury.severity}` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Equipment */}
                  {profileSummary.availableEquipment.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Dumbbell className="size-3" />
                        Available Equipment
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {profileSummary.availableEquipment.map((eq) => (
                          <Badge key={eq} variant="outline" className="text-xs border-border">
                            {EQUIPMENT_LABELS[eq] ?? eq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Training background */}
                  {profileSummary.trainingBackground && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Training Background</p>
                      <p className="text-sm">{profileSummary.trainingBackground}</p>
                    </div>
                  )}

                  {/* Exercise preferences */}
                  {(profileSummary.likes || profileSummary.dislikes) && (
                    <div className="space-y-1">
                      {profileSummary.likes && (
                        <p className="text-sm">
                          <span className="text-muted-foreground text-xs font-medium">Likes:</span>{" "}
                          {profileSummary.likes}
                        </p>
                      )}
                      {profileSummary.dislikes && (
                        <p className="text-sm">
                          <span className="text-muted-foreground text-xs font-medium">Dislikes:</span>{" "}
                          {profileSummary.dislikes}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t border-primary/10">
                    <Info className="size-3" />
                    Goals, sessions/week, and session length were auto-filled. You can override any value below.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Goals */}
          <div className="space-y-2">
            <Label>
              Goals *
              {profileStatus === "found" && profileSummary && profileSummary.goals.length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 border-primary/30 text-primary font-normal">
                  from questionnaire
                </Badge>
              )}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {FITNESS_GOALS.map((goalValue) => (
                <label
                  key={goalValue}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-surface/50 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30"
                >
                  <Checkbox
                    checked={goals.includes(goalValue)}
                    onCheckedChange={() => toggleGoal(goalValue)}
                  />
                  <span>{GOAL_LABELS[goalValue] ?? goalValue}</span>
                </label>
              ))}
            </div>
            {goals.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least one goal
              </p>
            )}
          </div>

          {/* Duration & Sessions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-duration">Duration (weeks) *</Label>
              <Input
                id="ai-duration"
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-sessions">
                Sessions/Week *
                {profileStatus === "found" && profileSummary?.preferredTrainingDays !== null && (
                  <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 border-primary/30 text-primary font-normal">
                    from questionnaire
                  </Badge>
                )}
              </Label>
              <Input
                id="ai-sessions"
                type="number"
                min={1}
                max={7}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Session minutes */}
          <div className="space-y-2">
            <Label htmlFor="ai-minutes">
              Session Length
              {profileStatus === "found" && profileSummary?.preferredSessionMinutes !== null && (
                <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 border-primary/30 text-primary font-normal">
                  from questionnaire
                </Badge>
              )}
            </Label>
            <select
              id="ai-minutes"
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className={selectClass}
            >
              {SESSION_DURATIONS.map((mins) => (
                <option key={mins} value={mins}>
                  {mins} minutes
                </option>
              ))}
            </select>
          </div>

          {/* Split Type & Periodization */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-split">Split Type</Label>
              <select
                id="ai-split"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                className={selectClass}
              >
                <option value="">Auto (AI decides)</option>
                {SPLIT_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {SPLIT_TYPE_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-periodization">Periodization</Label>
              <select
                id="ai-periodization"
                value={periodization}
                onChange={(e) => setPeriodization(e.target.value)}
                className={selectClass}
              >
                <option value="">Auto (AI decides)</option>
                {PERIODIZATION_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {PERIODIZATION_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="ai-instructions">
              Additional Instructions
              <span className="text-muted-foreground font-normal ml-1">
                (optional)
              </span>
            </Label>
            <Textarea
              id="ai-instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="e.g. Focus on posterior chain, include sprint work on lower body days..."
              rows={3}
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={goals.length === 0 || !clientId}>
              <Sparkles className="size-4" />
              Generate Program
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
