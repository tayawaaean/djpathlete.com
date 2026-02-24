export default function ProgramsLoading() {
  return (
    <div>
      <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-6" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-9 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
        <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Program Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="h-5 w-44 bg-muted animate-pulse rounded-md" />
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-3/4 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
