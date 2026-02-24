export default function SettingsLoading() {
  return (
    <div>
      <div className="h-8 w-28 bg-muted animate-pulse rounded-md mb-6" />

      {/* Account Information */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
              <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-36 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
              <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Stripe Integration */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="size-2.5 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-44 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
              <div className="h-6 w-10 bg-muted animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
