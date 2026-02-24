export default function PaymentsLoading() {
  return (
    <div>
      <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-6" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-9 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border p-3 flex gap-4">
          {["w-28", "w-36", "w-36", "w-20", "w-20", "w-24"].map((w, i) => (
            <div key={i} className={`h-4 ${w} bg-muted animate-pulse rounded-md`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border p-3 flex items-center gap-4">
            <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
