"use client"

import { useState } from "react"
import { AdminSidebar } from "./AdminSidebar"
import { AdminTopBar } from "./AdminTopBar"
import { AdminMobileSidebar } from "./AdminMobileSidebar"

interface AdminLayoutProps {
  children: React.ReactNode
  avatarUrl?: string | null
  initials?: string
}

export function AdminLayout({ children, avatarUrl, initials }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <AdminMobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} avatarUrl={avatarUrl} initials={initials} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
