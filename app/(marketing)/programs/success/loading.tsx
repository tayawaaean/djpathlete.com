export default function PurchaseSuccessLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md space-y-4">
        <div className="size-16 bg-muted animate-pulse rounded-full mx-auto" />
        <div className="h-8 w-56 bg-muted animate-pulse rounded-md mx-auto" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded-md mx-auto" />
        <div className="h-11 w-40 bg-muted animate-pulse rounded-full mx-auto" />
      </div>
    </div>
  )
}
