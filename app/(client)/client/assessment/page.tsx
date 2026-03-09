import { AssessmentForm } from "@/components/client/AssessmentForm"
import { PageHeader } from "@/components/shared/PageHeader"

export const metadata = { title: "Assessment | DJP Athlete" }

export default function AssessmentPage() {
  return (
    <div className="container max-w-2xl py-8">
      <PageHeader
        title="Fitness Assessment"
        description="Complete this assessment so we can determine your ability levels and generate a personalized training program. About 5-10 minutes."
      />
      <AssessmentForm />
    </div>
  )
}
