export default function AssessmentLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Heading */}
      <div className="h-7 sm:h-8 w-48 bg-muted animate-pulse rounded-md mb-2" />
      <div className="h-4 w-72 bg-muted animate-pulse rounded-md mb-6" />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
          <div className="h-3 w-12 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
      </div>

      {/* Form fields */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div className="h-5 w-56 bg-muted animate-pulse rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          </div>
        ))}
        <div className="flex justify-between pt-4">
          <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  )
}
