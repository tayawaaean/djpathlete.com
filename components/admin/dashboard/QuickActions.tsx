import Link from "next/link"
import { Plus, UserPlus, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/admin/programs">
          <Plus className="size-3.5" />
          New Program
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/admin/clients">
          <UserPlus className="size-3.5" />
          Add Client
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/admin/programs">
          <Brain className="size-3.5" />
          AI Generate
        </Link>
      </Button>
    </div>
  )
}
