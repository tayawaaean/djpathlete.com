export default function ProgressLoading() {
  return (
    <div>
      {/* Page heading */}
      <div className="h-8 w-36 bg-muted animate-pulse rounded-md mb-6" />

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
          >
            <div className="size-10 bg-muted animate-pulse rounded-full" />
            <div className="space-y-2">
              <div className="h-7 w-12 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity heading */}
      <div className="h-6 w-36 bg-muted animate-pulse rounded-md mb-4" />

      {/* Activity rows */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
