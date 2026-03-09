import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getFormReviewsByClient } from "@/lib/db/form-reviews"
import { FormReviewCard } from "@/components/client/FormReviewCard"
import { EmptyState } from "@/components/ui/empty-state"
import { Video, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import Link from "next/link"

export const metadata = { title: "Form Reviews | DJP Athlete" }

export default async function FormReviewsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let reviews: Awaited<ReturnType<typeof getFormReviewsByClient>> = []

  try {
    reviews = await getFormReviewsByClient(session.user.id)
  } catch {
    // Tables may not exist yet
  }

  return (
    <div>
      <PageHeader
        title="Form Reviews"
        description="Submit exercise videos for your coach to review. Get feedback on your technique to train safer and more effectively."
      >
        <Link
          href="/client/form-reviews/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Request Review</span>
          <span className="sm:hidden">New</span>
        </Link>
      </PageHeader>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Video}
          heading="No form reviews yet"
          description="Upload a video of your exercise form and your coach will review it. Get feedback to improve your technique!"
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <FormReviewCard
              key={review.id}
              id={review.id}
              title={review.title}
              status={review.status as "pending" | "in_progress" | "reviewed"}
              createdAt={review.created_at}
            />
          ))}
        </div>
      )}
    </div>
  )
}
