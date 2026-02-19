# DJP Athlete — Implementation Roadmap

This document combines the client's content requirements, website layout wireframes (from WEBSITE LAYOUT.pdf), and platform vision into a phased plan.

---

## Client Overview

**Darren J Paul** — Performance strategist, coach, researcher, and advisor with 20+ years in high-performance environments and a PhD. Works with professional athletes (WTA tennis, professional pickleball, elite youth). Approach: systems-based, diagnostic-driven, capacity-focused — not generic programming.

### Brand Voice
- Authoritative, precise, no-fluff
- "I think in systems, not exercises."
- "Precision beats volume. Capacity beats fatigue. Systems beat workouts."
- Selective by design — limited capacity, high standards

### Key Testimonials
- **Abigail Rencheli** (WTA) — "What sets him apart is how much he genuinely cares about you as a person first. The Online Program is so easy to navigate."
- **Ganna Poznikhierenko** (WTA) — "He's truly the best coach I've ever worked with. The Online Program helps me stay connected."
- **Tina Pisnik** (Pro Pickleball) — "Darren understands performance & injury prevention at a very high level. The Online program is seamless."
- **Collin Johns** (Pro Pickleball) — (quote pending)
- **Alana Smith** (WTA) — (quote pending)

---

## Site Structure (from WEBSITE LAYOUT.pdf)

The client wants **8 top-level pages** as the primary navigation:

### Navigation: `Home | In-Person | Online | Assessment | Education | Resources | Blog | Shop`

### Page 1: HOMEPAGE (`/`)
**Layout (top to bottom):**
1. Hero — Photo of Darren with fade gradient + "Elite Performance is Not Trained. It Is Engineered."
2. Services section — three pillars: TRAINING - TESTING - COACHING (links to In-Person, Assessment, Online)
3. About Me section — Darren's bio copy
4. Testimonials — athlete quotes with names/sports
5. Newsletter signup — email capture at bottom

### Page 2: IN-PERSON (`/in-person`)
**Layout:**
1. Hero with **faded background video** + headline "High Performance Development. Delivered Precisely."
2. Who This Is For (2.B) — Athlete types defined + 4-step process
3. Benefits **carousel with dot navigation** — slide-across images
4. The Difference (2.C) — "Most Training Chases Fatigue. We Build Capacity."
5. Apply CTA — application/intake form

**Content:**
- Who: Competitive athletes, elite youth, return-to-performance, high-performing professionals
- Process: Assessment → Blueprint → Development → Optimization
- Differentiator: Precision > volume, capacity > fatigue, systems > workouts, 20yr experience, PhD

### Page 3: ONLINE (`/online`)
**Layout:**
1. Hero — "More Than Remote. Complete Performance System."
2. Why Most Online Programs Fail (3.B) — content section
3. This Is Not Self Service (3.C) — positioning
4. **Video embed** of performance support
5. Core Components — **carousel slides** (individualized programming, video feedback, testing, wellness monitoring, direct access)
6. Typeform-style flow: "You Are Ready To Go" → Program Builder → Book a Call
7. FAQ section

### Page 4: ASSESSMENT (`/assessment`)
**Layout:**
1. Hero — "The Missing Middle" / "The Gap Between Clearance and True Readiness"
2. Authority (4.B) — "Clearance Is Not Readiness" + credential backing
3. What This Assessment Is (4.C) — and is not (not rehab/diagnosis)
4. How The System Integrates (4.D) — connects to in-person/online coaching
5. **Equipment images** gallery/grid
6. The Outcome (4.E) — clear performance profile, risk gaps, progression strategy
7. "Book an Appointment" CTA

### Page 5: EDUCATION (`/education`)
**Layout:**
1. Hero — "A New Standard for Performance"
2. Body — "Built for the moments that destabilize careers, teams, and identities. Not another course. A structured system for operating when certainty disappears."
3. Audience — "Designed for high-performance sport environments, teams, and competitive leaders navigating instability."
4. "Get Early Notification" CTA — email waitlist signup (coming soon product)

### Page 6: RESOURCES (`/resources`)
**Layout:**
- Grid of resource cards (3-col top row, 2-col bottom):
  - Performance Database
  - Comeback Code
  - Workshop Clinic
  - Rotational Reboot
  - Youth Athlete Transition
- Each card links to its resource detail (placeholder for now)

### Page 7: BLOG (`/blog`)
**Layout:**
- Grid of small box cards (article previews)
- No "time ago" relative dates — use actual dates
- DJP brand color theme
- (Content managed via admin or markdown — TBD)

### Page 8: SHOP (`/shop` or `/programs`)
- Already built as `/programs` — the program store
- Needs brand color theme alignment (already using DJP theme)

---

## Phase 3: Site Restructure & Content Pages (CURRENT)

### Step 3.1 — Navigation Restructure
- [x] Update `lib/constants.ts` — new NAV_ITEMS matching 8-page structure
- [x] Update `SiteNavbar.tsx` — flat nav links (no mega-menu dropdowns needed)
- [x] Update `Footer.tsx` constants — updated footer sections
- [x] Update sitemap to include new routes

### Step 3.2 — Homepage Rebuild
- [x] Hero: photo placeholder + fade + "Elite Performance is Not Trained. It Is Engineered."
- [x] Services: 3 pillars (Training / Testing / Coaching) linking to /in-person, /assessment, /online
- [x] About Me: Darren's actual bio copy
- [x] Testimonials: real athlete quotes
- [x] Newsletter signup section

### Step 3.3 — In-Person Page (`/in-person`)
- [x] Video hero section with fade overlay (placeholder video bg)
- [x] Who This Is For + Process steps
- [x] Benefits carousel with dots
- [x] The Difference section
- [x] Apply CTA

### Step 3.4 — Online Page (`/online`)
- [x] Hero "More Than Remote"
- [x] Why Most Online Programs Fail
- [x] Not Self Service positioning
- [x] Video embed placeholder
- [x] Core Components carousel
- [x] Intake flow CTA (Book a Call)
- [x] FAQ section

### Step 3.5 — Assessment Page (`/assessment`)
- [x] Hero "The Missing Middle"
- [x] Authority section
- [x] What This Assessment Is / Is Not
- [x] System Integration
- [x] Equipment images placeholder grid
- [x] Outcome section
- [x] Book Appointment CTA

### Step 3.6 — Education Page (`/education`)
- [x] Coming soon / waitlist page
- [x] "A New Standard for Performance" hero
- [x] Email notification signup

### Step 3.7 — Resources Page (`/resources`)
- [x] Card grid for 5 resources
- [x] Placeholder content per resource

### Step 3.8 — Blog Page (`/blog`)
- [x] Blog listing with small box cards
- [x] Placeholder posts or empty state
- [x] No relative time, brand colors

---

## Phase 4: Platform Polish & Advanced Features

### Step 4.1 — Email Integration
- [ ] Install Resend or SendGrid
- [ ] Contact form sends actual emails
- [ ] Registration confirmation emails
- [ ] Payment receipt emails
- [ ] Program assignment notification emails

### Step 4.2 — Program Exercise Scheduling UI
- [ ] Admin UI to assign exercises to programs (week/day grid)
- [ ] Drag-and-drop or form-based exercise ordering
- [ ] Client workouts page shows real scheduled exercises

### Step 4.3 — Video Integration
- [ ] File upload infrastructure (Vercel Blob or S3)
- [ ] Exercise instruction videos (admin uploads)
- [ ] Background video for in-person page (real video)
- [ ] Video playback in workout views

### Step 4.4 — Application/Intake Forms
- [ ] In-person coaching application form
- [ ] Online coaching inquiry / Book a Call form
- [ ] Assessment booking form
- [ ] Education waitlist email capture
- [ ] Admin view of applications/inquiries

### Step 4.5 — Notifications System UI
- [ ] Client notification bell/dropdown
- [ ] Mark as read functionality
- [ ] Real-time updates (optional: SSE or polling)

### Step 4.6 — Advanced Client Dashboard
- [ ] Workout logging (log sets, reps, weight, RPE)
- [ ] Progress charts (weight over time, volume trends)
- [ ] Streak tracking
- [ ] Calendar view of scheduled workouts

### Step 4.7 — Blog CMS
- [ ] Admin blog post editor (markdown or rich text)
- [ ] Blog post detail pages
- [ ] Categories/tags
- [ ] SEO per post

---

## Phase 5: Launch Preparation

### Step 5.1 — Production Setup
- [ ] Correct Stripe keys (sk_test → sk_live when ready)
- [ ] Domain and DNS configuration
- [ ] Environment variables for production
- [ ] Error monitoring (Sentry or similar)

### Step 5.2 — SEO & Performance
- [ ] All pages have proper metadata and JSON-LD
- [ ] Image optimization (athlete photos, branding)
- [ ] Sitemap includes all new pages
- [ ] Core Web Vitals optimization

### Step 5.3 — Content Population
- [ ] All testimonials entered in DB
- [ ] Programs created with pricing
- [ ] Exercise library populated
- [ ] Real photos/videos from client
- [ ] Blog posts if ready

### Step 5.4 — Testing
- [ ] End-to-end: register → purchase → client dashboard flow
- [ ] Stripe test mode checkout verification
- [ ] Mobile responsive testing all pages
- [ ] Cross-browser testing

---

## Current Status

| Feature | Status |
|---------|--------|
| Database schema + migrations | Done |
| Auth (login + registration) | Done |
| Admin panel (all pages) | Done |
| Client dashboard (5 pages) | Done |
| Program store + Stripe checkout | Done |
| All DAL files (service role) | Done |
| **Navigation restructure** | **Phase 3** |
| **Homepage rebuild** | **Phase 3** |
| **In-Person page** | **Phase 3** |
| **Online page** | **Phase 3** |
| **Assessment page** | **Phase 3** |
| **Education page** | **Phase 3** |
| **Resources page** | **Phase 3** |
| **Blog page** | **Phase 3** |
| Email integration | Phase 4 |
| Application/intake forms | Phase 4 |
| Video infrastructure | Phase 4 |
| Blog CMS | Phase 4 |
| Production deployment | Phase 5 |
