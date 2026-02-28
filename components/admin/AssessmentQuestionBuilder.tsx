"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  CornerDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import type { AssessmentQuestion, AssessmentQuestionSection, AssessmentQuestionType } from "@/types/database"

const SECTIONS: { value: AssessmentQuestionSection; label: string }[] = [
  { value: "movement_screen", label: "Movement Screen" },
  { value: "background", label: "Background" },
  { value: "context", label: "Context" },
  { value: "preferences", label: "Preferences" },
]

const QUESTION_TYPES: { value: AssessmentQuestionType; label: string }[] = [
  { value: "yes_no", label: "Yes / No" },
  { value: "single_select", label: "Single Select" },
  { value: "multi_select", label: "Multi Select" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
]

const MOVEMENT_PATTERNS = [
  "push",
  "pull",
  "squat",
  "hinge",
  "lunge",
  "carry",
  "rotation",
  "isometric",
  "locomotion",
]

const TYPE_COLORS: Record<string, string> = {
  yes_no: "bg-success/10 text-success",
  single_select: "bg-primary/10 text-primary",
  multi_select: "bg-accent/15 text-accent",
  number: "bg-warning/10 text-warning",
  text: "bg-muted text-muted-foreground",
}

interface QuestionFormData {
  section: AssessmentQuestionSection
  question_text: string
  question_type: AssessmentQuestionType
  movement_pattern: string
  options: { value: string; label: string }[]
  parent_question_id: string
  parent_answer: string
  level_impact: string
  order_index: number
}

const DEFAULT_FORM: QuestionFormData = {
  section: "movement_screen",
  question_text: "",
  question_type: "yes_no",
  movement_pattern: "",
  options: [],
  parent_question_id: "",
  parent_answer: "",
  level_impact: '{"yes": 2, "no": 0}',
  order_index: 0,
}

export function AssessmentQuestionBuilder() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<QuestionFormData>(DEFAULT_FORM)
  const [activeSection, setActiveSection] = useState<AssessmentQuestionSection>("movement_screen")

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/assessments/questions")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setQuestions(data)
    } catch {
      toast.error("Failed to load assessment questions.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const sectionQuestions = questions.filter(
    (q) => q.section === activeSection && q.is_active
  )

  // Build parent-child tree
  const rootQuestions = sectionQuestions.filter((q) => !q.parent_question_id)
  const childrenOf = (parentId: string) =>
    sectionQuestions.filter((q) => q.parent_question_id === parentId)

  const openAddDialog = () => {
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, section: activeSection })
    setDialogOpen(true)
  }

  const openEditDialog = (question: AssessmentQuestion) => {
    setEditingId(question.id)
    setForm({
      section: question.section,
      question_text: question.question_text,
      question_type: question.question_type,
      movement_pattern: question.movement_pattern ?? "",
      options: question.options ?? [],
      parent_question_id: question.parent_question_id ?? "",
      parent_answer: question.parent_answer ?? "",
      level_impact: question.level_impact
        ? JSON.stringify(question.level_impact, null, 2)
        : '{"yes": 2, "no": 0}',
      order_index: question.order_index,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.question_text.trim()) {
      toast.error("Question text is required.")
      return
    }

    let parsedLevelImpact = null
    if (form.level_impact.trim()) {
      try {
        parsedLevelImpact = JSON.parse(form.level_impact)
      } catch {
        toast.error("Level impact must be valid JSON.")
        return
      }
    }

    setSaving(true)
    try {
      const body = {
        section: form.section,
        question_text: form.question_text,
        question_type: form.question_type,
        movement_pattern: form.movement_pattern || null,
        options: form.options.length > 0 ? form.options : null,
        parent_question_id: form.parent_question_id || null,
        parent_answer: form.parent_answer || null,
        level_impact: parsedLevelImpact,
        order_index: form.order_index,
      }

      const url = editingId
        ? `/api/admin/assessments/questions/${editingId}`
        : "/api/admin/assessments/questions"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success(editingId ? "Question updated." : "Question created.")
      setDialogOpen(false)
      fetchQuestions()
    } catch {
      toast.error("Failed to save question.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this question?")) return

    try {
      const res = await fetch(`/api/admin/assessments/questions/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Question deactivated.")
      fetchQuestions()
    } catch {
      toast.error("Failed to delete question.")
    }
  }

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const question = questions.find((q) => q.id === id)
    if (!question) return

    const newOrder = direction === "up" ? question.order_index - 1 : question.order_index + 1
    if (newOrder < 0) return

    try {
      const res = await fetch(`/api/admin/assessments/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_index: newOrder }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
      fetchQuestions()
    } catch {
      toast.error("Failed to reorder question.")
    }
  }

  const addOptionRow = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { value: "", label: "" }],
    }))
  }

  const removeOptionRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const updateOption = (index: number, field: "value" | "label", val: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: val } : opt
      ),
    }))
  }

  function QuestionRow({
    question,
    isChild = false,
  }: {
    question: AssessmentQuestion
    isChild?: boolean
  }) {
    const children = childrenOf(question.id)

    return (
      <>
        <div
          className={cn(
            "flex items-center gap-3 py-3 px-4 rounded-lg border border-border bg-white hover:bg-surface/30 transition-colors",
            isChild && "ml-8 border-l-2 border-l-primary/30"
          )}
        >
          {isChild && (
            <CornerDownRight className="size-4 text-muted-foreground shrink-0" />
          )}

          <span className="text-xs text-muted-foreground font-mono shrink-0 w-6">
            #{question.order_index}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {question.question_text}
            </p>
            {question.parent_answer && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Shows when parent answers: &quot;{question.parent_answer}&quot;
              </p>
            )}
          </div>

          <Badge
            className={cn(
              "shrink-0 text-[10px]",
              TYPE_COLORS[question.question_type] ?? "bg-muted text-muted-foreground"
            )}
          >
            {question.question_type.replace("_", " ")}
          </Badge>

          {question.movement_pattern && (
            <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
              {question.movement_pattern}
            </Badge>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleMoveOrder(question.id, "up")}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Move up"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              onClick={() => handleMoveOrder(question.id, "down")}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Move down"
            >
              <ChevronDown className="size-4" />
            </button>
            <button
              onClick={() => openEditDialog(question)}
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
              title="Edit"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => handleDelete(question.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Deactivate"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {children.map((child) => (
          <QuestionRow key={child.id} question={child} isChild />
        ))}
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {questions.filter((q) => q.is_active).length} active questions
        </p>
        <Button onClick={openAddDialog} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add Question
        </Button>
      </div>

      <Tabs
        value={activeSection}
        onValueChange={(v) => setActiveSection(v as AssessmentQuestionSection)}
      >
        <TabsList className="mb-4">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((s) => (
          <TabsContent key={s.value} value={s.value}>
            {rootQuestions.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No questions in this section yet. Click &quot;Add Question&quot; to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {rootQuestions.map((q) => (
                  <QuestionRow key={q.id} question={q} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the assessment question details."
                : "Create a new assessment question."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Section */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Section</Label>
              <Select
                value={form.section}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    section: v as AssessmentQuestionSection,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Text */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Question Text
              </Label>
              <Textarea
                value={form.question_text}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    question_text: e.target.value,
                  }))
                }
                placeholder="Enter the question text..."
                rows={2}
              />
            </div>

            {/* Question Type */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Question Type
              </Label>
              <Select
                value={form.question_type}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    question_type: v as AssessmentQuestionType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Movement Pattern (only for movement_screen) */}
            {form.section === "movement_screen" && (
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Movement Pattern
                </Label>
                <Select
                  value={form.movement_pattern || "none"}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      movement_pattern: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern..." />
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

            {/* Options Builder (for select types) */}
            {(form.question_type === "single_select" ||
              form.question_type === "multi_select") && (
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Options
                </Label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt.value}
                        onChange={(e) =>
                          updateOption(i, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Input
                        value={opt.label}
                        onChange={(e) =>
                          updateOption(i, "label", e.target.value)
                        }
                        placeholder="Label"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOptionRow(i)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOptionRow}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Parent Question (branching) */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Parent Question (for branching)
              </Label>
              <Select
                value={form.parent_question_id || "none"}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    parent_question_id: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root question)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root question)</SelectItem>
                  {sectionQuestions
                    .filter((q) => q.id !== editingId)
                    .map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.question_text.substring(0, 60)}
                        {q.question_text.length > 60 ? "..." : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Answer */}
            {form.parent_question_id && (
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Show when parent answers
                </Label>
                <Input
                  value={form.parent_answer}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      parent_answer: e.target.value,
                    }))
                  }
                  placeholder='e.g., "yes" or "no"'
                />
              </div>
            )}

            {/* Level Impact (JSON) */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Level Impact (JSON)
              </Label>
              <Textarea
                value={form.level_impact}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    level_impact: e.target.value,
                  }))
                }
                placeholder='{"yes": 2, "no": 0}'
                rows={3}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Maps answer values to numeric scores for ability level computation.
              </p>
            </div>

            {/* Order Index */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Order Index
              </Label>
              <Input
                type="number"
                value={form.order_index}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    order_index: parseInt(e.target.value, 10) || 0,
                  }))
                }
                min={0}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Update Question"
              ) : (
                "Create Question"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
