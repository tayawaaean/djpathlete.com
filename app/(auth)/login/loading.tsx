export default function LoginLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-56 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-12 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
      </div>
      <div className="h-4 w-48 bg-muted animate-pulse rounded-md mx-auto" />
    </div>
  )
}
