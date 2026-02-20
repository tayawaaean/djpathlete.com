import { requireAdmin } from "@/lib/auth-helpers"
import { AiUsageDashboard } from "@/components/admin/AiUsageDashboard"

export const metadata = { title: "AI Usage | Admin | DJP Athlete" }

export default async function AiUsagePage() {
  await requireAdmin()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">AI Usage</h1>
      <AiUsageDashboard />
    </div>
  )
}
