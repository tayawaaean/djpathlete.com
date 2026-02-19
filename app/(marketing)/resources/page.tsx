import type { Metadata } from "next"
import {
  Database,
  Shield,
  GraduationCap,
  RotateCcw,
  Users,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { JsonLd } from "@/components/shared/JsonLd"

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Performance resources from DJP Athlete — databases, frameworks, workshops, and development programs for serious athletes and coaches.",
  openGraph: {
    title: "Resources | DJP Athlete",
    description:
      "Performance resources from DJP Athlete — databases, frameworks, workshops, and development programs for serious athletes and coaches.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources | DJP Athlete",
    description:
      "Performance resources from DJP Athlete — databases, frameworks, workshops, and development programs for serious athletes and coaches.",
  },
}

const resourcesSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Resources",
  description:
    "Performance resources from DJP Athlete — databases, frameworks, workshops, and development programs for serious athletes and coaches.",
  url: "https://djpathlete.com/resources",
  provider: {
    "@type": "Organization",
    name: "DJP Athlete",
    url: "https://djpathlete.com",
  },
}

const resources = [
  {
    icon: Database,
    title: "Performance Database",
    description:
      "A comprehensive collection of performance metrics, benchmarks, and testing protocols.",
    status: "coming-soon" as const,
  },
  {
    icon: Shield,
    title: "Comeback Code",
    description:
      "A structured framework for athletes returning from injury to full competitive readiness.",
    status: "coming-soon" as const,
  },
  {
    icon: GraduationCap,
    title: "Workshop Clinic",
    description:
      "Hands-on clinical workshops for coaches, practitioners, and performance staff.",
    status: "coming-soon" as const,
  },
  {
    icon: RotateCcw,
    title: "Rotational Reboot",
    description:
      "A specialized program addressing rotational power development for racket and throwing sports.",
    status: "coming-soon" as const,
  },
  {
    icon: Users,
    title: "Youth Athlete Transition",
    description:
      "Evidence-based developmental pathways for young athletes progressing through competitive stages.",
    status: "coming-soon" as const,
  },
]

export default function ResourcesPage() {
  return (
    <>
      <JsonLd data={resourcesSchema} />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-medium text-accent uppercase tracking-wide mb-3">
            Resources
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-semibold text-primary tracking-tight mb-6">
            Tools, frameworks, and programs
            <br className="hidden sm:block" /> built from two decades of
            high-performance experience.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Each resource has been developed through years of working with elite
            athletes and coaches. Explore what is available and what is on the
            way.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16 lg:py-24 px-4 sm:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          {/* Row 1: 3 columns */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {resources.slice(0, 3).map((resource) => (
              <ResourceCard key={resource.title} resource={resource} />
            ))}
          </div>

          {/* Row 2: 2 columns, centered */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {resources.slice(3).map((resource) => (
              <ResourceCard key={resource.title} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-primary tracking-tight mb-4">
            Want early access?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get in touch to be notified when new resources launch, or to discuss
            how these frameworks can support your athletes.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-md"
          >
            Get in Touch
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  )
}

function ResourceCard({
  resource,
}: {
  resource: (typeof resources)[number]
}) {
  const Icon = resource.icon

  return (
    <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-6 text-primary" />
        </div>
        {resource.status === "coming-soon" ? (
          <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            Coming Soon
          </span>
        ) : (
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Learn More
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      <h3 className="text-lg font-heading font-semibold text-primary mb-2">
        {resource.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {resource.description}
      </p>
    </div>
  )
}
