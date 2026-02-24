export default function ProgramBuilderLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />

      {/* Program header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-muted animate-pulse rounded-md" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
          <div className="h-3 w-2/3 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-muted animate-pulse rounded-md" />
        ))}
        <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, d) => (
          <div key={d} className="bg-white rounded-xl border border-border p-4 space-y-3">
            <div className="h-5 w-24 bg-muted animate-pulse rounded-md" />
            {Array.from({ length: 3 }).map((_, e) => (
              <div key={e} className="border border-border rounded-lg p-3 space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="flex gap-3">
                  <div className="h-3 w-12 bg-muted animate-pulse rounded-md" />
                  <div className="h-3 w-12 bg-muted animate-pulse rounded-md" />
                  <div className="h-3 w-12 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
