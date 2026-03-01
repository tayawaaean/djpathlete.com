export default function AiInsightsLoading() {
  return (
    <div>
      <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-6" />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-9 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="p-4">
              <div className="h-[200px] w-full bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
