export default function ClientAssessmentsLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="size-9 bg-muted animate-pulse rounded-lg" />
        <div className="h-7 w-52 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="h-4 w-72 bg-muted animate-pulse rounded-md mb-6" />

      {/* Timeline items */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-border p-5 flex items-start gap-4"
          >
            <div className="size-10 bg-muted animate-pulse rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
