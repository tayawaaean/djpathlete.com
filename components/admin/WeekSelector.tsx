"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WeekSelectorProps {
  totalWeeks: number
  selectedWeek: number
  onSelectWeek: (week: number) => void
  onDuplicateWeek: () => void
}

export function WeekSelector({
  totalWeeks,
  selectedWeek,
  onSelectWeek,
  onDuplicateWeek,
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
        onClick={onDuplicateWeek}
        title="Duplicate this week"
      >
        <Copy className="size-3.5" />
        Duplicate Week
      </Button>
    </div>
  )
}
