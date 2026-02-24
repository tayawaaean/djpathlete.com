import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { JsonLd } from "@/components/shared/JsonLd"
import { FadeIn } from "@/components/shared/FadeIn"
import { getBlogPosts, getBlogPostBySlug } from "@/lib/ghl-blog"
import type { Category } from "@/lib/blog-data"

interface Props {
  params: Promise<{ slug: string }>
}

const categoryStyles: Record<Category, string> = {
  Performance: "bg-primary/10 text-primary",
  Recovery: "bg-success/10 text-success",
  Coaching: "bg-accent/10 text-accent",
  "Youth Development": "bg-warning/10 text-warning",
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return { title: "Post Not Found" }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | DJP Athlete`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | DJP Athlete`,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const blogPostSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: `https://djpathlete.com/blog/${post.slug}`,
    author: {
      "@type": "Person",
      name: "Darren J Paul",
      url: "https://djpathlete.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "DJP Athlete",
      url: "https://djpathlete.com",
    },
    articleSection: post.category,
  }

  return (
    <>
      <JsonLd data={blogPostSchema} />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-4 sm:px-8">
        <FadeIn>
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="size-4" />
              All Posts
            </Link>

            {/* Category + Date */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${categoryStyles[post.category]}`}
              >
                {post.category}
              </span>
              <time
                dateTime={post.date}
                className="text-sm text-muted-foreground"
              >
                {formatDate(post.date)}
              </time>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-semibold text-primary tracking-tight mb-6">
              {post.title}
            </h1>

            {/* Excerpt as lead */}
            <p className="text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Article Body */}
      <section className="py-16 lg:py-24 px-4 sm:px-8 bg-surface">
        <div className="max-w-3xl mx-auto">
          {post.htmlContent ? (
            <FadeIn>
              <div
                className="prose prose-lg max-w-none text-muted-foreground prose-headings:font-heading prose-headings:text-primary prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: post.htmlContent }}
              />
            </FadeIn>
          ) : (
            post.body.map((section, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className={i > 0 ? "mt-10" : ""}>
                  <h2 className="text-xl font-heading font-semibold text-primary mb-4">
                    {section.subheading}
                  </h2>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {section.text}
                  </p>
                </div>
              </FadeIn>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-8">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <p className="text-sm font-medium text-accent uppercase tracking-widest">
                Work With Us
              </p>
              <div className="h-px w-8 bg-accent" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-primary tracking-tight mb-4">
              Ready to take your performance seriously?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              If this resonated, imagine what a coaching relationship built
              around your specific needs could achieve.
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
