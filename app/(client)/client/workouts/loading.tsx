export default function WorkoutsLoading() {
  return (
    <div>
      {/* Page heading */}
      <div className="h-8 w-40 bg-muted animate-pulse rounded-md mb-6" />

      {/* Program sections */}
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, programIdx) => (
          <div key={programIdx}>
            {/* Program name and badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            </div>

            {/* Day sections */}
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="bg-white rounded-xl border border-border overflow-hidden"
                >
                  {/* Day header */}
                  <div className="bg-surface px-4 py-3 border-b border-border">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                  </div>

                  {/* Exercise rows */}
                  <div className="divide-y divide-border">
                    {Array.from({ length: programIdx === 0 ? 4 : 3 }).map(
                      (_, exerciseIdx) => (
                        <div
                          key={exerciseIdx}
                          className="px-4 py-3 flex items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-14 bg-muted animate-pulse rounded-md" />
                              <div className="h-3 w-14 bg-muted animate-pulse rounded-md" />
                              <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
                            </div>
                          </div>
                          <div className="h-3 w-16 bg-muted animate-pulse rounded-md" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
