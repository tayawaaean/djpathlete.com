"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddClientDialog } from "@/components/admin/AddClientDialog"

export function ClientsPageHeader() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-primary">Clients</h1>
      <Button onClick={() => setDialogOpen(true)} size="sm">
        <Plus className="size-4 mr-1.5" />
        Add Client
      </Button>
      <AddClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
