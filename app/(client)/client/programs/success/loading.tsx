export default function ProgramSuccessLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md space-y-4">
        <div className="size-16 bg-muted animate-pulse rounded-full mx-auto" />
        <div className="h-7 w-48 bg-muted animate-pulse rounded-md mx-auto" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded-md mx-auto" />
        <div className="h-10 w-40 bg-muted animate-pulse rounded-md mx-auto" />
      </div>
    </div>
  )
}
