export default function AiAssistantLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="size-9 bg-muted animate-pulse rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-5 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-3 w-48 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? "items-end" : "items-start"}`}>
              <div className={`h-4 ${i % 2 === 0 ? "w-48" : "w-64"} bg-muted animate-pulse rounded-md`} />
              <div className={`h-4 ${i % 2 === 0 ? "w-32" : "w-56"} bg-muted animate-pulse rounded-md`} />
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  )
}
