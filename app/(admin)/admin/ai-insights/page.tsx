import { requireAdmin } from "@/lib/auth-helpers"
import { AiInsightsDashboard } from "@/components/admin/AiInsightsDashboard"

export const metadata = { title: "AI Insights | Admin | DJP Athlete" }

export default async function AiInsightsPage() {
  await requireAdmin()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">AI Insights</h1>
      <AiInsightsDashboard />
    </div>
  )
}
