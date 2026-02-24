export default function ResourcesLoading() {
  return (
    <div>
      <div className="bg-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="h-10 w-40 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3">
              <div className="h-40 bg-muted animate-pulse rounded-lg" />
              <div className="h-5 w-36 bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
