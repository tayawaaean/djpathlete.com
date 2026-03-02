"use client"

import { useState, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CheckCircle2, Dumbbell } from "lucide-react"

export interface WorkoutCalendarDay {
  date: Date
  exerciseCount: number
  completedCount: number
  programName: string
  dayOfWeek: number
  weekNumber: number
}

interface WorkoutCalendarProps {
  workoutDays: WorkoutCalendarDay[]
}

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function WorkoutCalendar({ workoutDays }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  // Group workout days by date string for quick lookup
  const daysByDate = useMemo(() => {
    const map = new Map<string, WorkoutCalendarDay[]>()
    for (const wd of workoutDays) {
      const key = wd.date.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(wd)
    }
    return map
  }, [workoutDays])

  // Compute modifier date arrays
  const { completedDates, partialDates, scheduledDates } = useMemo(() => {
    const completed: Date[] = []
    const partial: Date[] = []
    const scheduled: Date[] = []

    for (const [, days] of daysByDate) {
      const totalExercises = days.reduce((s, d) => s + d.exerciseCount, 0)
      const totalCompleted = days.reduce((s, d) => s + d.completedCount, 0)
      const date = days[0].date

      if (totalCompleted >= totalExercises && totalExercises > 0) {
        completed.push(date)
      } else if (totalCompleted > 0) {
        partial.push(date)
      } else {
        scheduled.push(date)
      }
    }

    return { completedDates: completed, partialDates: partial, scheduledDates: scheduled }
  }, [daysByDate])

  // Find data for the selected day
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null
    const key = selectedDate.toISOString().slice(0, 10)
    return daysByDate.get(key) ?? null
  }, [selectedDate, daysByDate])

  return (
    <div>
      <div className="bg-white rounded-xl border border-border p-2 sm:p-4 w-fit mx-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            scheduled: scheduledDates,
            completed: completedDates,
            partial: partialDates,
          }}
          modifiersClassNames={{
            scheduled: "bg-primary/10 font-semibold text-primary",
            completed: "bg-green-100 font-semibold text-green-700",
            partial: "bg-amber-100 font-semibold text-amber-700",
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary/30" /> Scheduled
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-amber-400" /> In Progress
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-green-500" /> Complete
        </span>
      </div>

      {/* Selected day detail */}
      {selectedDayData ? (
        <div className="mt-4 space-y-2">
          {selectedDayData.map((day) => {
            const allDone =
              day.completedCount >= day.exerciseCount && day.exerciseCount > 0
            return (
              <div
                key={`${day.programName}-${day.weekNumber}-${day.dayOfWeek}`}
                className="bg-white rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="size-4 text-primary" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-foreground">
                      {day.programName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                      allDone
                        ? "bg-green-100 text-green-700"
                        : day.completedCount > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {allDone && <CheckCircle2 className="size-3" />}
                    {day.completedCount}/{day.exerciseCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Week {day.weekNumber} &middot;{" "}
                  {DAY_LABELS[day.dayOfWeek] ?? `Day ${day.dayOfWeek}`}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Select a day to view workout details.
        </p>
      )}
    </div>
  )
}
