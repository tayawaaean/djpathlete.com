"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Activity,
  Target,
  Settings2,
  Heart,
  Loader2,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  AssessmentQuestion,
  AssessmentSection,
  AssessmentQuestionType,
} from "@/types/database"

/* ─── Constants ──────────────────────────────────────────────────── */

const SECTION_INFO: Record<AssessmentSection, { label: string; icon: typeof Activity }> = {
  background: { label: "Background", icon: Target },
  movement_screen: { label: "Movement Screen", icon: Activity },
  context: { label: "Context", icon: Settings2 },
  preferences: { label: "Preferences", icon: Heart },
}

const SECTION_ORDER: AssessmentSection[] = [
  "background",
  "movement_screen",
  "context",
  "preferences",
]

const QUESTION_TYPE_LABELS: Record<AssessmentQuestionType, string> = {
  yes_no: "Yes/No",
  single_select: "Single Select",
  multi_select: "Multi Select",
  number: "Number",
  text: "Text",
}

const QUESTION_TYPE_COLORS: Record<AssessmentQuestionType, string> = {
  yes_no: "bg-success/10 text-success",
  single_select: "bg-primary/10 text-primary",
  multi_select: "bg-warning/10 text-warning",
  number: "bg-purple-100 text-purple-700",
  text: "bg-muted text-muted-foreground",
}

const MOVEMENT_PATTERNS = ["squat", "push", "pull", "hinge"] as const

/* ─── Empty form state ───────────────────────────────────────────── */

interface QuestionFormData {
  section: AssessmentSection
  question_text: string
  question_type: AssessmentQuestionType
  movement_pattern: string
  options_json: string
  parent_question_id: string
  parent_answer: string
  level_impact_json: string
  order_index: number
  is_active: boolean
}

function emptyFormData(): QuestionFormData {
  return {
    section: "background",
    question_text: "",
    question_type: "text",
    movement_pattern: "",
    options_json: "",
    parent_question_id: "",
    parent_answer: "",
    level_impact_json: "",
    order_index: 0,
    is_active: true,
  }
}

/* ─── Component ──────────────────────────────────────────────────── */

interface AssessmentQuestionBuilderProps {
  questions: AssessmentQuestion[]
}

export function AssessmentQuestionBuilder({ questions: initialQuestions }: AssessmentQuestionBuilderProps) {
  const router = useRouter()
  const [questions] = useState<AssessmentQuestion[]>(initialQuestions)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<QuestionFormData>(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AssessmentQuestion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group questions by section
  const questionsBySection: Record<AssessmentSection, AssessmentQuestion[]> = {
    background: [],
    movement_screen: [],
    context: [],
    preferences: [],
  }
  for (const q of questions) {
    if (questionsBySection[q.section]) {
      questionsBySection[q.section].push(q)
    }
  }
  for (const key of SECTION_ORDER) {
    questionsBySection[key].sort((a, b) => a.order_index - b.order_index)
  }

  // Get root questions for parent selection
  const rootQuestions = questions.filter((q) => !q.parent_question_id)

  // Open add dialog
  const handleAdd = useCallback((section: AssessmentSection) => {
    const sectionQuestions = questionsBySection[section]
    const maxOrder = sectionQuestions.length > 0
      ? Math.max(...sectionQuestions.map((q) => q.order_index))
      : -1
    setFormData({
      ...emptyFormData(),
      section,
      order_index: maxOrder + 1,
    })
    setEditingId(null)
    setDialogOpen(true)
  }, [questionsBySection])

  // Open edit dialog
  const handleEdit = useCallback((question: AssessmentQuestion) => {
    setFormData({
      section: question.section,
      question_text: question.question_text,
      question_type: question.question_type,
      movement_pattern: question.movement_pattern ?? "",
      options_json: question.options ? JSON.stringify(question.options, null, 2) : "",
      parent_question_id: question.parent_question_id ?? "",
      parent_answer: question.parent_answer ?? "",
      level_impact_json: question.level_impact ? JSON.stringify(question.level_impact, null, 2) : "",
      order_index: question.order_index,
      is_active: question.is_active,
    })
    setEditingId(question.id)
    setDialogOpen(true)
  }, [])

  // Save question (create or update)
  const handleSave = async () => {
    if (!formData.question_text.trim()) {
      toast.error("Question text is required")
      return
    }

    // Parse options JSON
    let options = null
    if (formData.options_json.trim()) {
      try {
        options = JSON.parse(formData.options_json)
      } catch {
        toast.error("Invalid options JSON format")
        return
      }
    }

    // Parse level_impact JSON
    let level_impact = null
    if (formData.level_impact_json.trim()) {
      try {
        level_impact = JSON.parse(formData.level_impact_json)
      } catch {
        toast.error("Invalid level impact JSON format")
        return
      }
    }

    const payload = {
      section: formData.section,
      question_text: formData.question_text.trim(),
      question_type: formData.question_type,
      movement_pattern: formData.movement_pattern || null,
      options,
      parent_question_id: formData.parent_question_id || null,
      parent_answer: formData.parent_answer || null,
      level_impact,
      order_index: formData.order_index,
      is_active: formData.is_active,
    }

    setIsSaving(true)
    try {
      const url = editingId
        ? `/api/admin/assessments/questions/${editingId}`
        : "/api/admin/assessments/questions"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save question")
      }

      toast.success(editingId ? "Question updated" : "Question created")
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  // Delete question
  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/assessments/questions/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete question")
      }
      toast.success("Question deleted")
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  // Move question up/down
  const handleMove = async (question: AssessmentQuestion, dir: "up" | "down") => {
    const sectionQuestions = questionsBySection[question.section]
    const index = sectionQuestions.findIndex((q) => q.id === question.id)
    const swapIndex = dir === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sectionQuestions.length) return

    const other = sectionQuestions[swapIndex]
    try {
      await Promise.all([
        fetch(`/api/admin/assessments/questions/${question.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: other.order_index }),
        }),
        fetch(`/api/admin/assessments/questions/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_index: question.order_index }),
        }),
      ])
      router.refresh()
    } catch {
      toast.error("Failed to reorder question")
    }
  }

  return (
    <div>
      <Tabs defaultValue="background">
        <TabsList className="mb-6 w-full sm:w-auto">
          {SECTION_ORDER.map((section) => {
            const info = SECTION_INFO[section]
            const Icon = info.icon
            return (
              <TabsTrigger key={section} value={section} className="gap-1.5">
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{info.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {SECTION_ORDER.map((section) => {
          const sectionQuestions = questionsBySection[section]
          return (
            <TabsContent key={section} value={section}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {SECTION_INFO[section].label} Questions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {sectionQuestions.length} question{sectionQuestions.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleAdd(section)} className="gap-1.5">
                  <Plus className="size-3.5" />
                  Add Question
                </Button>
              </div>

              {sectionQuestions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No questions in this section yet. Click &quot;Add Question&quot; to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sectionQuestions.map((q, index) => {
                    const isChild = !!q.parent_question_id
                    const parentQ = isChild
                      ? questions.find((pq) => pq.id === q.parent_question_id)
                      : null

                    return (
                      <div
                        key={q.id}
                        className={`bg-white rounded-lg border border-border p-4 ${
                          isChild ? "ml-6 border-l-2 border-l-primary/30" : ""
                        } ${!q.is_active ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Move buttons */}
                          <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                            <button
                              onClick={() => handleMove(q, "up")}
                              disabled={index === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              title="Move up"
                            >
                              <ChevronUp className="size-4" />
                            </button>
                            <button
                              onClick={() => handleMove(q, "down")}
                              disabled={index === sectionQuestions.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              title="Move down"
                            >
                              <ChevronDown className="size-4" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">
                                {q.question_text}
                              </p>
                              {!q.is_active && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <Badge
                                className={`text-[10px] ${QUESTION_TYPE_COLORS[q.question_type]}`}
                                variant="outline"
                              >
                                {QUESTION_TYPE_LABELS[q.question_type]}
                              </Badge>
                              {q.movement_pattern && (
                                <Badge variant="outline" className="text-[10px]">
                                  {q.movement_pattern}
                                </Badge>
                              )}
                              {isChild && parentQ && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <GitBranch className="size-3" />
                                  When parent = &quot;{q.parent_answer}&quot;
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                Order: {q.order_index}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(q)}
                              className="h-8 w-8 p-0"
                              title="Edit question"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(q)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Delete question"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the question details below."
                : "Fill in the question details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Section */}
            <div>
              <Label className="text-sm">Section</Label>
              <Select
                value={formData.section}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, section: v as AssessmentSection }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SECTION_INFO[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question text */}
            <div>
              <Label className="text-sm">Question Text</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData((prev) => ({ ...prev, question_text: e.target.value }))}
                className="mt-1"
                rows={2}
                placeholder="Enter the question..."
              />
            </div>

            {/* Question type */}
            <div>
              <Label className="text-sm">Question Type</Label>
              <Select
                value={formData.question_type}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, question_type: v as AssessmentQuestionType }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(QUESTION_TYPE_LABELS) as AssessmentQuestionType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Movement pattern (only for movement_screen section) */}
            {formData.section === "movement_screen" && (
              <div>
                <Label className="text-sm">Movement Pattern</Label>
                <Select
                  value={formData.movement_pattern || "none"}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, movement_pattern: v === "none" ? "" : v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {MOVEMENT_PATTERNS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Options JSON */}
            {(formData.question_type === "single_select" || formData.question_type === "multi_select") && (
              <div>
                <Label className="text-sm">Options (JSON array)</Label>
                <Textarea
                  value={formData.options_json}
                  onChange={(e) => setFormData((prev) => ({ ...prev, options_json: e.target.value }))}
                  className="mt-1 font-mono text-xs"
                  rows={4}
                  placeholder={`[{"value":"opt1","label":"Option 1"},{"value":"opt2","label":"Option 2"}]`}
                />
              </div>
            )}

            {/* Parent question (for branching) */}
            <div>
              <Label className="text-sm">Parent Question (for branching)</Label>
              <Select
                value={formData.parent_question_id || "none"}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, parent_question_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None (root question)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root question)</SelectItem>
                  {rootQuestions.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.question_text.slice(0, 60)}{q.question_text.length > 60 ? "..." : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent answer */}
            {formData.parent_question_id && (
              <div>
                <Label className="text-sm">Show when parent answer equals</Label>
                <Input
                  value={formData.parent_answer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parent_answer: e.target.value }))}
                  className="mt-1"
                  placeholder="e.g. yes, no, or an option value"
                />
              </div>
            )}

            {/* Level impact JSON */}
            {formData.section === "movement_screen" && (
              <div>
                <Label className="text-sm">Level Impact (JSON object)</Label>
                <Textarea
                  value={formData.level_impact_json}
                  onChange={(e) => setFormData((prev) => ({ ...prev, level_impact_json: e.target.value }))}
                  className="mt-1 font-mono text-xs"
                  rows={3}
                  placeholder={`{"yes": 3, "no": 1}`}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Maps answer values to numeric scores. Higher = more advanced.
                </p>
              </div>
            )}

            {/* Order index */}
            <div>
              <Label className="text-sm">Order Index</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData((prev) => ({ ...prev, order_index: Number(e.target.value) }))}
                className="mt-1 max-w-32"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="is_active" className="text-sm">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-foreground bg-surface rounded-lg p-3">
              &quot;{deleteTarget.question_text}&quot;
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
