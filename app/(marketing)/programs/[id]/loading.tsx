export default function ProgramDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Back link */}
      <div className="h-4 w-28 bg-muted animate-pulse rounded-md mb-6" />

      {/* Program header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, s) => (
              <div key={s} className="size-5 bg-muted animate-pulse rounded" />
            ))}
            <div className="h-4 w-16 bg-muted animate-pulse rounded-md ml-2" />
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-11 w-36 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* Week overview */}
      <div className="space-y-4 mb-10">
        <div className="h-6 w-40 bg-muted animate-pulse rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <div className="h-5 w-24 bg-muted animate-pulse rounded-md mb-2" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-28 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <div className="h-6 w-28 bg-muted animate-pulse rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 space-y-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <div key={s} className="size-4 bg-muted animate-pulse rounded" />
              ))}
            </div>
            <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-3 w-2/3 bg-muted animate-pulse rounded-md" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
