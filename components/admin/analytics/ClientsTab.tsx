"use client"

import { Users, UserPlus, UserCheck, ClipboardCheck } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ClientMetrics } from "@/types/analytics"
import { StatCard } from "./StatCard"
import { HorizontalBar } from "./HorizontalBar"

interface ClientsTabProps {
  data: ClientMetrics
}

export function ClientsTab({ data }: ClientsTabProps) {
  const chartData = data.clientsByMonth.map((m) => ({
    name: m.label,
    new: m.count,
    total: m.cumulative,
  }))

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Total Clients"
          value={data.totalClients}
        />
        <StatCard
          icon={<UserPlus className="size-4 text-success" />}
          iconBg="bg-success/10"
          label="New in Period"
          value={data.newClientsInRange}
        />
        <StatCard
          icon={<UserCheck className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Active (on program)"
          value={data.activeClients}
        />
        <StatCard
          icon={<ClipboardCheck className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Profile Completion"
          value={`${data.profileCompletionRate}%`}
        />
      </div>

      {/* Client Growth Chart */}
      <div className="bg-white rounded-xl border border-border shadow-sm mb-8">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Users className="size-4 text-primary" />
          <h2 className="text-lg font-semibold text-primary">Client Growth</h2>
        </div>
        <div className="p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  name="Total Clients"
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success))"
                  fillOpacity={0.2}
                  name="New Signups"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
              No client data in this period.
            </div>
          )}
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-primary">By Sport</h2>
          </div>
          <HorizontalBar
            items={data.clientsBySport}
            emptyMessage="No sport data available."
          />
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-primary">
              By Experience
            </h2>
          </div>
          <HorizontalBar
            items={data.clientsByExperience}
            colorClass="bg-accent"
            emptyMessage="No experience data available."
          />
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-primary">By Goals</h2>
          </div>
          <HorizontalBar
            items={data.clientsByGoal}
            colorClass="bg-success"
            emptyMessage="No goal data available."
          />
        </div>
      </div>
    </div>
  )
}
