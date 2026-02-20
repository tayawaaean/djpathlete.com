export default function DashboardLoading() {
  return (
    <div>
      {/* Welcome heading */}
      <div className="h-8 w-64 bg-muted animate-pulse rounded-md mb-6" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
          >
            <div className="size-10 bg-muted animate-pulse rounded-full" />
            <div className="space-y-2">
              <div className="h-7 w-12 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Active Programs heading */}
      <div className="h-6 w-36 bg-muted animate-pulse rounded-md mb-4" />

      {/* Program cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-border p-6 space-y-4"
          >
            {/* Title and badges */}
            <div className="flex items-start justify-between">
              <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
