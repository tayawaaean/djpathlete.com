export default function ReviewsLoading() {
  return (
    <div>
      <div className="h-8 w-28 bg-muted animate-pulse rounded-md mb-6" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-muted animate-pulse rounded-lg" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-7 w-12 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md" />
        ))}
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 flex items-start gap-4">
            <div className="size-10 bg-muted animate-pulse rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <div key={s} className="size-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
              <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
