export default function PhilosophyLoading() {
  return (
    <div>
      <div className="bg-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-40 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
