import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getProfileByUserId } from "@/lib/db/client-profiles"
import { QuestionnaireForm } from "@/components/client/QuestionnaireForm"
import { PageHeader } from "@/components/shared/PageHeader"
import type { ClientProfile } from "@/types/database"

export const metadata = { title: "Questionnaire | DJP Athlete" }

export default async function QuestionnairePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let initialProfile: ClientProfile | null = null
  try {
    initialProfile = await getProfileByUserId(session.user.id)
  } catch {
    // No profile yet — that's fine, we'll start fresh
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Athlete Questionnaire"
        description="Help us understand your goals and preferences to create your personalized program. About 5 minutes."
      />
      <QuestionnaireForm initialProfile={initialProfile} />
    </div>
  )
}
