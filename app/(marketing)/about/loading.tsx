export default function AboutLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="h-10 w-56 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-80 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>

      {/* Bio */}
      <div className="max-w-5xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
          <div className="space-y-4">
            <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-muted/20 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-7 w-40 bg-muted animate-pulse rounded-md mx-auto mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-4 text-center space-y-2">
                <div className="size-10 bg-muted animate-pulse rounded-full mx-auto" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
