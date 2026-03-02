import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBlogPostById, updateBlogPost } from "@/lib/db/blog-posts"
import { ghlTriggerWebhook } from "@/lib/ghl"

const GHL_BLOG_WEBHOOK_URL =
  process.env.GHL_BLOG_PUBLISHED_WEBHOOK_URL ?? ""

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const post = await getBlogPostById(id)

    const updated = await updateBlogPost(id, {
      status: "published",
      published_at: post.published_at ?? new Date().toISOString(),
    })

    // Fire-and-forget GHL webhook for newsletter
    if (GHL_BLOG_WEBHOOK_URL) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://djpathlete.com"
      ghlTriggerWebhook(GHL_BLOG_WEBHOOK_URL, {
        type: "blog_published",
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt,
        url: `${baseUrl}/blog/${updated.slug}`,
        category: updated.category,
        published_at: updated.published_at,
      }).catch((err) =>
        console.error("[Blog] GHL webhook failed:", err)
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Blog publish error:", error)
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    )
  }
}
