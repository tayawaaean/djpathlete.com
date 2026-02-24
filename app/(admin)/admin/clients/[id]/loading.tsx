export default function ClientDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />

      {/* Client header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="size-16 bg-muted animate-pulse rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-52 bg-muted animate-pulse rounded-md" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-md" />
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3">
            <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
