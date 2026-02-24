import { AssessmentForm } from "@/components/client/AssessmentForm"

export const metadata = { title: "Assessment | DJP Athlete" }

export default function AssessmentPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-primary font-heading">
          Fitness Assessment
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
          Complete this assessment so we can determine your ability levels and generate
          a personalized training program. About 5-10 minutes.
        </p>
      </div>
      <AssessmentForm />
    </div>
  )
}
