export default function HomeLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="relative min-h-[70vh] flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 px-6">
          <div className="h-10 sm:h-14 w-72 sm:w-[500px] bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-64 sm:w-96 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="flex gap-3 justify-center pt-2">
            <div className="h-11 w-36 bg-muted animate-pulse rounded-full" />
            <div className="h-11 w-32 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md mx-auto" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="py-16 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 space-y-3">
                <div className="size-12 bg-muted animate-pulse rounded-lg" />
                <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-3/4 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
