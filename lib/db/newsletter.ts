import { createServiceRoleClient } from "@/lib/supabase"

function getClient() {
  return createServiceRoleClient()
}

export async function addSubscriber(email: string, source = "website"): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email: email.toLowerCase().trim(), source, unsubscribed_at: null },
      { onConflict: "email" }
    )
  if (error) throw error
}

export async function removeSubscriber(email: string): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email.toLowerCase().trim())
  if (error) throw error
}

export async function getActiveSubscribers(): Promise<{ email: string }[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email")
    .is("unsubscribed_at", null)
    .order("subscribed_at", { ascending: true })
  if (error) throw error
  return data ?? []
}
