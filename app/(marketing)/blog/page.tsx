import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { JsonLd } from "@/components/shared/JsonLd"
import { FadeIn } from "@/components/shared/FadeIn"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on performance, coaching, recovery, and athletic development from Darren J Paul.",
  openGraph: {
    title: "Blog | DJP Athlete",
    description:
      "Insights on performance, coaching, recovery, and athletic development from Darren J Paul.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | DJP Athlete",
    description:
      "Insights on performance, coaching, recovery, and athletic development from Darren J Paul.",
  },
}

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "DJP Athlete Blog",
  description:
    "Insights on performance, coaching, recovery, and athletic development from Darren J Paul.",
  url: "https://djpathlete.com/blog",
  publisher: {
    "@type": "Organization",
    name: "DJP Athlete",
    url: "https://djpathlete.com",
  },
}

type Category = "Performance" | "Recovery" | "Coaching" | "Youth Development"

interface Post {
  id: string
  title: string
  excerpt: string
  category: Category
  date: string
  slug: string
}

const posts: Post[] = [
  {
    id: "1",
    title: "Why Most Training Programs Fail Serious Athletes",
    excerpt:
      "Generic programming ignores the most critical variable in performance development: context. Here's what actually drives adaptation.",
    category: "Performance",
    date: "2026-02-10",
    slug: "why-most-training-programs-fail",
  },
  {
    id: "2",
    title: "The Return-to-Performance Gap Nobody Talks About",
    excerpt:
      "Medical clearance and performance readiness are not the same thing. Understanding this distinction could save an athlete's career.",
    category: "Recovery",
    date: "2026-01-28",
    slug: "return-to-performance-gap",
  },
  {
    id: "3",
    title: "Systems Thinking in Athletic Development",
    excerpt:
      "Why the best coaches think in systems, not exercises. A framework for understanding how adaptation actually works.",
    category: "Coaching",
    date: "2026-01-15",
    slug: "systems-thinking-athletic-development",
  },
  {
    id: "4",
    title: "Load Management: Beyond the Numbers",
    excerpt:
      "Monitoring load is necessary but insufficient. What matters is how load interacts with readiness, capacity, and context.",
    category: "Performance",
    date: "2025-12-20",
    slug: "load-management-beyond-numbers",
  },
  {
    id: "5",
    title: "Building Resilient Youth Athletes",
    excerpt:
      "Long-term athletic development isn't about early specialization. It's about building robust, adaptable movement capacity.",
    category: "Youth Development",
    date: "2025-12-05",
    slug: "building-resilient-youth-athletes",
  },
  {
    id: "6",
    title: "The Role of Video Analysis in Modern Coaching",
    excerpt:
      "Frame-by-frame breakdown of movement isn't just for biomechanists. How video feedback transforms coaching outcomes.",
    category: "Coaching",
    date: "2025-11-18",
    slug: "video-analysis-modern-coaching",
  },
]

const categoryStyles: Record<Category, string> = {
  Performance: "bg-primary/10 text-primary",
  Recovery: "bg-success/10 text-success",
  Coaching: "bg-accent/10 text-accent",
  "Youth Development": "bg-warning/10 text-warning",
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function BlogPage() {
  return (
    <>
      <JsonLd data={blogSchema} />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-4 sm:px-8">
        <FadeIn>
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent" />
            <p className="text-sm font-medium text-accent uppercase tracking-widest">
              Blog
            </p>
            <div className="h-px w-8 bg-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-semibold text-primary tracking-tight mb-6">
            Insights on performance, coaching,
            <br className="hidden sm:block" /> and athletic development.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Practical perspectives from two decades of working with athletes at
            every level. No fluff, no fads — just what works.
          </p>
        </div>
        </FadeIn>
      </section>

      {/* Blog Grid */}
      <section className="py-16 lg:py-24 px-4 sm:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <FadeIn key={post.id} delay={i * 0.08}>
              <Link
                href={`/blog/${post.slug}`}
                className="group"
              >
                <article className="relative overflow-hidden bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  <span
                    className={`inline-block self-start rounded-full px-3 py-1 text-xs font-medium ${categoryStyles[post.category]}`}
                  >
                    {post.category}
                  </span>
                  <h3 className="font-heading font-semibold text-primary mt-3 mb-2 group-hover:text-primary/80 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <time
                      dateTime={post.date}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(post.date)}
                    </time>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:text-primary/80 transition-colors">
                      Read More
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </article>
              </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-8">
        <FadeIn>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent" />
            <p className="text-sm font-medium text-accent uppercase tracking-widest">
              Get Started
            </p>
            <div className="h-px w-8 bg-accent" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-primary tracking-tight mb-4">
            Want to work with us?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            If these ideas resonate, imagine what a personalized coaching
            relationship could do for your performance.
          </p>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-md"
          >
            Book Free Consultation
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        </FadeIn>
      </section>
    </>
  )
}
