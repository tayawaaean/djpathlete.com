export default function InPersonLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="h-10 w-56 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-80 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-11 w-36 bg-muted animate-pulse rounded-full mx-auto mt-4" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-16 px-6">
        {/* Service details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-4">
            <div className="h-7 w-44 bg-muted animate-pulse rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-muted animate-pulse rounded-md" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>

        {/* Form */}
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-border p-8 space-y-4">
          <div className="h-7 w-36 bg-muted animate-pulse rounded-md" />
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
