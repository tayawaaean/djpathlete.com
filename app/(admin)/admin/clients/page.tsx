import { getUsers } from "@/lib/db/users"
import { ClientList } from "@/components/admin/ClientList"
import { ClientsPageHeader } from "./ClientsPageHeader"

export const metadata = { title: "Clients" }

export default async function ClientsPage() {
  const users = await getUsers()

  return (
    <div>
      <ClientsPageHeader />
      <ClientList users={users} />
    </div>
  )
}
