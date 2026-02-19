export type NavLink = {
  label: string
  href: string
  description?: string
}

export type NavGroup = {
  label: string
  href?: string
  children?: NavLink[]
}

export const NAV_ITEMS: NavGroup[] = [
  {
    label: "Services",
    children: [
      { label: "In-Person Coaching", href: "/in-person", description: "Assessment-led, hands-on training" },
      { label: "Online Coaching", href: "/online", description: "Complete performance system, anywhere" },
      { label: "Assessment", href: "/assessment", description: "Return-to-performance testing" },
    ],
  },
  { label: "Programs", href: "/programs" },
  { label: "Education", href: "/education" },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog", description: "Articles & insights" },
      { label: "Performance Database", href: "/resources", description: "Data-driven benchmarks" },
      { label: "Comeback Code", href: "/resources", description: "Injury recovery protocols" },
    ],
  },
  { label: "Shop", href: "/shop" },
]

export const FOOTER_SECTIONS = [
  {
    title: "Services",
    links: [
      { label: "In-Person Coaching", href: "/in-person" },
      { label: "Online Coaching", href: "/online" },
      { label: "Assessment", href: "/assessment" },
      { label: "Education", href: "/education" },
      { label: "Shop", href: "/shop" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Performance Database", href: "/resources" },
      { label: "Comeback Code", href: "/resources" },
      { label: "Blog", href: "/blog" },
      { label: "Workshop Clinic", href: "/resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Testimonials", href: "/testimonials" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
]
