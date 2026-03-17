"use client"

import { Copy, Plus, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WeekSelectorProps {
  totalWeeks: number
  selectedWeek: number
  onSelectWeek: (week: number) => void
  onDuplicateWeek: () => void
  onAddWeek: () => void
  isAddingWeek?: boolean
  onDeleteWeek: () => void
  isDeletingWeek?: boolean
  onGenerateWeek?: () => void
  canGenerateWeek?: boolean
}

export function WeekSelector({
  totalWeeks,
  selectedWeek,
  onSelectWeek,
  onDuplicateWeek,
  onAddWeek,
  isAddingWeek = false,
  onDeleteWeek,
  isDeletingWeek = false,
  onGenerateWeek,
  canGenerateWeek = false,
}: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
        <Button
          key={week}
          variant={week === selectedWeek ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectWeek(week)}
        >
          Week {week}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAddWeek}
        disabled={isAddingWeek}
        title="Add a new blank week"
      >
        <Plus className="size-3.5" />
        {isAddingWeek ? "Adding..." : "Add Week"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDuplicateWeek}
        title="Duplicate this week"
      >
        <Copy className="size-3.5" />
        Duplicate Week
      </Button>
      {totalWeeks > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteWeek}
          disabled={isDeletingWeek}
          title="Remove this week and all its exercises"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" />
          {isDeletingWeek ? "Removing..." : "Remove Week"}
        </Button>
      )}
      {canGenerateWeek && onGenerateWeek && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateWeek}
          title="AI generate the next week based on client performance"
          className="text-accent border-accent/30 hover:bg-accent/10"
        >
          <Sparkles className="size-3.5" />
          AI Generate Week
        </Button>
      )}
    </div>
  )
}
