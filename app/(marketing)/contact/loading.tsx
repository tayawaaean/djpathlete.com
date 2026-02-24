export default function ContactLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="h-10 w-44 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-16 px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Form */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
              <div className={`${i === 3 ? "h-28" : "h-10"} w-full bg-muted animate-pulse rounded-md`} />
            </div>
          ))}
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <div className="h-6 w-36 bg-muted animate-pulse rounded-md" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="size-10 bg-muted animate-pulse rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-44 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
