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
  { label: "In-Person", href: "/in-person" },
  { label: "Online", href: "/online" },
  { label: "Assessment", href: "/assessment" },
  { label: "Education", href: "/education" },
  { label: "Resources", href: "/resources" },
  { label: "Blog", href: "/blog" },
  { label: "Shop", href: "/programs" },
]

export const FOOTER_SECTIONS = [
  {
    title: "Services",
    links: [
      { label: "In-Person Coaching", href: "/in-person" },
      { label: "Online Coaching", href: "/online" },
      { label: "Assessment", href: "/assessment" },
      { label: "Education", href: "/education" },
      { label: "Shop", href: "/programs" },
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
