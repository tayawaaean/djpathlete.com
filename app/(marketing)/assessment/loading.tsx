export default function AssessmentLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-16 px-6">
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-6 space-y-3">
              <div className="size-10 bg-muted animate-pulse rounded-lg" />
              <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>

        {/* Form placeholder */}
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-border p-8 space-y-4">
          <div className="h-7 w-40 bg-muted animate-pulse rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
              <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            </div>
          ))}
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  )
}
