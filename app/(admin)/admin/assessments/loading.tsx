export default function AssessmentsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 bg-muted animate-pulse rounded-lg" />
            <div className="h-7 w-36 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md ml-12" />
        </div>
        <div className="h-9 w-36 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        ))}
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="size-8 bg-muted animate-pulse rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="size-8 bg-muted animate-pulse rounded-md" />
              <div className="size-8 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
