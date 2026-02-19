import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Dumbbell,
  Activity,
  Monitor,
  ImageIcon,
  Quote,
  Mail,
  User,
} from "lucide-react"
import { JsonLd } from "@/components/shared/JsonLd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "DJP Athlete | Elite Performance Coaching",
  description:
    "Elite performance coaching by Darren J Paul. In-person training, online coaching, and return-to-performance assessment for serious athletes.",
  openGraph: {
    title: "DJP Athlete | Elite Performance Coaching",
    description:
      "Elite performance coaching by Darren J Paul. In-person training, online coaching, and return-to-performance assessment for serious athletes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DJP Athlete | Elite Performance Coaching",
    description:
      "Elite performance coaching by Darren J Paul. In-person training, online coaching, and return-to-performance assessment for serious athletes.",
  },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DJP Athlete",
  url: "https://djpathlete.com",
  logo: "https://djpathlete.com/og-image.png",
  description:
    "DJP Athlete provides elite performance coaching by Darren J Paul. In-person training, online coaching, and return-to-performance assessment for serious athletes.",
  sameAs: [
    "https://twitter.com/djpathlete",
    "https://facebook.com/djpathlete",
    "https://instagram.com/djpathlete",
  ],
}

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DJP Athlete",
  url: "https://djpathlete.com",
}

const services = [
  {
    icon: Dumbbell,
    title: "Training",
    subtitle: "In-Person Performance Coaching",
    description:
      "Advanced assessment-led coaching with individualized programming. Every decision is diagnostic-driven. Every session has intent.",
    href: "/in-person",
  },
  {
    icon: Activity,
    title: "Testing",
    subtitle: "Return-to-Performance Testing",
    description:
      "A structured rebuild process for athletes beyond rehab. Restore capacity. Reintegrate speed and power. Return to dominance with confidence.",
    href: "/assessment",
  },
  {
    icon: Monitor,
    title: "Coaching",
    subtitle: "Online Performance Coaching",
    description:
      "High-touch performance support built on individualized data, structured progressions, and ongoing oversight. No templates. No generic plans.",
    href: "/online",
  },
]

const testimonials = [
  {
    name: "Abigail Rencheli",
    title: "WTA Professional Tennis Player",
    quote:
      "What sets him apart is how much he genuinely cares about you as a person first. The Online Program is so easy to navigate and thoroughly explains how to perform the exercises.",
  },
  {
    name: "Ganna Poznikhierenko",
    title: "WTA Professional Tennis Player",
    quote:
      "He's truly the best coach I've ever worked with. The Online Program helps me stay connected even though I am training independently.",
  },
  {
    name: "Tina Pisnik",
    title: "Professional Pickleball Player",
    quote:
      "Darren understands performance & injury prevention at a very high level. The Online program is seamless and allows me to train from anywhere.",
  },
]

const aboutParagraphs = [
  "I'm Darren J Paul. I am a performance strategist. A coach. A researcher. An advisor.",
  "I've spent over two decades working inside high-performance environments, studying how athletes adapt, how they break down, and why most systems fail them at critical moments.",
  "I think in systems, not exercises. I look for patterns, not shortcuts. I question assumptions that are widely accepted but rarely examined. I use lateral thinking to connect the dots between performance, injury, behaviour, load, movement, and context.",
  "This is why my approach doesn't look like conventional training. And why athletes come to me when generic programs stop working.",
  "I don't chase fatigue. I don't chase trends. I don't sell certainty where none exists. I build structure. I manage risk. I help athletes develop capacity they can trust.",
  "That's the work. Everything else is just delivery.",
]

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={webSiteSchema} />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center bg-primary overflow-hidden">
        {/* Photo placeholder area */}
        <div className="absolute inset-0 flex">
          {/* Left: image placeholder */}
          <div className="relative w-full lg:w-1/2 h-full">
            <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="size-20 text-primary-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-primary-foreground/40 font-body tracking-wide">
                  Photo
                </p>
              </div>
            </div>
            {/* Fade gradient overlay from image to text */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-primary" />
          </div>
          {/* Right: solid primary bg */}
          <div className="hidden lg:block w-1/2 h-full bg-primary" />
        </div>

        {/* Overlay to ensure readability */}
        <div className="absolute inset-0 bg-primary/40" />

        {/* Content */}
        <div className="relative z-10 w-full px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="lg:ml-auto lg:w-3/5 lg:pl-12">
              <p className="text-sm font-medium text-accent uppercase tracking-widest mb-6">
                DJP Athlete
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-primary-foreground tracking-tight leading-[1.1] mb-8">
                Elite Performance
                <br />
                is Not Trained.
                <br />
                <span className="text-accent">It Is Engineered.</span>
              </h1>
              <p className="text-lg sm:text-xl text-primary-foreground/80 leading-relaxed max-w-xl mb-10">
                Performance strategist. Coach. Researcher.
                <br className="hidden sm:block" />
                Two decades of elite-level experience.
              </p>
              <Link
                href="/in-person"
                className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-8 py-4 rounded-full text-sm font-semibold hover:bg-accent/90 transition-all hover:shadow-lg group"
              >
                Explore Services
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade for transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ─── Services Section ─── */}
      <section className="py-20 lg:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">
              What We Do
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-semibold text-primary tracking-tight">
              Training &mdash; Testing &mdash; Coaching
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group bg-white rounded-2xl border border-border p-8 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 mb-6 group-hover:bg-accent/15 transition-colors">
                    <Icon className="size-7 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-2">
                    {service.title}
                  </p>
                  <h3 className="text-xl font-heading font-semibold text-primary mb-3">
                    {service.subtitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:text-accent transition-colors">
                    Learn more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── About Me Section ─── */}
      <section className="py-20 lg:py-32 px-4 sm:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Photo placeholder */}
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="aspect-[3/4] rounded-2xl bg-primary/5 border border-border overflow-hidden flex items-center justify-center">
                  <div className="text-center">
                    <div className="size-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                      <User className="size-12 text-primary/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Coach Photo
                    </p>
                  </div>
                </div>
                {/* Decorative accent block */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent/20 rounded-2xl -z-10" />
              </div>
            </div>

            {/* Bio copy */}
            <div className="lg:col-span-3">
              <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">
                About Me
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-primary tracking-tight mb-8">
                Darren J Paul
              </h2>

              <div className="space-y-5">
                {aboutParagraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed ${
                      i === 0 || i === aboutParagraphs.length - 1
                        ? "text-lg text-foreground font-medium"
                        : "text-base text-muted-foreground"
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-primary hover:text-accent transition-colors group"
              >
                Learn More
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-20 lg:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-primary tracking-tight">
              Trusted by elite athletes.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl border border-border p-8 flex flex-col"
              >
                {/* Quote icon */}
                <Quote className="size-8 text-accent/30 mb-4" />

                {/* Quote text */}
                <blockquote className="flex-1 mb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Newsletter Section ─── */}
      <section className="py-20 lg:py-32 px-4 sm:px-8 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="size-10 text-accent mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-primary-foreground tracking-tight mb-4">
            Stay in the loop.
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed mb-8">
            Get insights on performance, training philosophy, and program
            updates. No spam. No fluff. Just the work.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            action="#"
          >
            <Input
              type="email"
              placeholder="Your email address"
              className="h-12 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:border-accent focus-visible:ring-accent/30"
              required
            />
            <Button
              type="submit"
              className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 rounded-md font-semibold shrink-0"
            >
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-primary-foreground/40 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </>
  )
}
