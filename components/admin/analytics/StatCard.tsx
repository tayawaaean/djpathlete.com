import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string | number
  trend?: { current: number; previous: number }
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return null
  const isPositive = pct > 0

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-success" : "text-destructive"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {isPositive ? "+" : ""}
      {pct}%
    </span>
  )
}

export function StatCard({ icon, iconBg, label, value, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`flex size-9 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-primary">{value}</p>
        {trend && (
          <TrendIndicator current={trend.current} previous={trend.previous} />
        )}
      </div>
    </div>
  )
}
