# DJP Athlete — Implementation Roadmap

This document combines the client's content requirements and platform vision into a phased plan for remaining implementation work.

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

## Service Pages to Build

The client has defined 4 distinct service offerings, each needing its own dedicated page with the content below.

### Page 1: In-Person Coaching (`/services/in-person`)

**Hero:** "High Performance Development. Delivered Precisely."

**Who This Is For:**
- Competitive athletes (HS, collegiate, semi-pro, professional)
- Elite youth athletes needing long-term development
- Return-to-performance athletes (post-injury, medically cleared)
- High-performing professionals who train with intent

**Process:**
1. Comprehensive Performance Assessment — movement, capacity, history, sport demands
2. Strategic Performance Blueprint — plan aligned with sport, timeline, goals
3. Structured Development — progressive, targeted training
4. Continuous Evaluation and Optimization — ongoing assessment

**The Difference:** "Most Training Chases Fatigue. We Build Capacity."
- Precision beats volume
- Capacity beats fatigue
- Systems beat workouts

**CTA:** Application form (selective intake)

### Page 2: Online Coaching (`/services/online`)

**Hero:** "More than Training. Complete Performance System."

The Online Performance System is a fully personalized, data-informed, coach-led environment for serious athletes who want elite-level structure without being physically onsite.

**Core Components:**
- Individualized Programming (no templates)
- Video Feedback and Technical Coaching
- Advanced Performance Testing (remote diagnostics)
- Wellness and Load Monitoring (real-time)
- Direct Access to Expertise

**Why Most Online Programs Fail:**
- Generic programming ignores context
- No detailed movement assessment
- No objective monitoring
- No adjustment for fatigue, travel, competition, injury history
- No meaningful coaching feedback

**Positioning:** "This Is Not Self-Serve Training." — Standards high, capacity limited, entry selective.

**CTA:** "Book a Meeting"

### Page 3: Return to Performance (`/services/return-to-perform`)

**Hero:** "The Gap Between Clearance and True Readiness"

Medical clearance ≠ performance readiness. This service bridges the gap from rehab discharge to full competitive performance.

**Authority Section:** "Clearance Is Not Readiness."
- Traditional assessments focus on isolated metrics (strength without context, movement screens without load, speed without braking, power without control)
- This assessment uses a detailed Performance Framework

**What This Is (and Is Not):**
- Not rehabilitation, diagnosis, or injury management
- Performance-based assessment: movement strategy, force characteristics, load tolerance, decision-making under stress
- Collaborates with: physiotherapists, surgeons, S&C coaches, team staff

**Integration:**
- Informs structured return-to-performance programs
- Guides in-person or online coaching
- Identifies readiness gaps before competition
- Reduces reinjury risk

**Outcome:** Clear performance profile, asymmetry identification, defined risk gaps, targeted progression strategy, competitive reintegration confidence.

### Page 4: Coaching Philosophy (`/services/coaching` or `/philosophy`)

**Topic:** "The Grey Zone" — Five Pillar Framework

**Status:** Content still being developed by client. Sections defined:
- The Problem
- The Core Idea
- Five Pillar Framework
- (Details TBD)

### Page 5: Resources (`/resources`)

**Status:** Content TBD. Placeholder page needed.

---

## Phase 3: Content Pages & Service Expansion

### Step 3.1 — Dedicated Service Pages
- [ ] `/services/in-person` — full content page with application form
- [ ] `/services/online` — full content page with booking CTA
- [ ] `/services/return-to-perform` — full content page with assessment inquiry
- [ ] Update `/services` index to link to sub-pages instead of generic cards
- [ ] Application/inquiry form component (shared across service pages)

### Step 3.2 — Homepage Content Refresh
- [ ] Update hero: "Elite Performance is Not Trained. It is Engineered."
- [ ] Update services section with the 3 core offerings (in-person, online, RTP)
- [ ] Update about section with client's actual copy
- [ ] Update testimonials with real athlete quotes and titles
- [ ] Add athlete logos/badges if available

### Step 3.3 — Testimonials Enhancement
- [ ] Populate testimonials DB with real athlete data
- [ ] Add athlete sport/title badges (WTA, Pro Pickleball, etc.)
- [ ] Add featured testimonial carousel on homepage
- [ ] Individual testimonial display with full quotes

### Step 3.4 — Coaching Philosophy / Five Pillar Framework
- [ ] `/philosophy` or `/coaching` page (pending client content)
- [ ] Visual framework diagram
- [ ] Integration with service pages

### Step 3.5 — Resources Section
- [ ] `/resources` page structure
- [ ] Blog/article support (if desired)
- [ ] Content TBD from client

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

### Step 4.3 — Video Analysis Integration
- [ ] File upload infrastructure (Vercel Blob or S3)
- [ ] Exercise instruction videos (admin uploads)
- [ ] Client video submission for form checks
- [ ] Video playback in workout views

### Step 4.4 — Application/Intake Forms
- [ ] Selective application form for in-person coaching
- [ ] Online coaching inquiry form
- [ ] RTP assessment inquiry form
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

---

## Phase 5: Launch Preparation

### Step 5.1 — Production Setup
- [ ] Correct Stripe keys (sk_test → sk_live when ready)
- [ ] Domain and DNS configuration
- [ ] Environment variables for production
- [ ] Error monitoring (Sentry or similar)

### Step 5.2 — SEO & Performance
- [ ] All service pages have proper metadata and JSON-LD
- [ ] Image optimization (athlete photos, branding)
- [ ] Sitemap includes all new pages
- [ ] Core Web Vitals optimization

### Step 5.3 — Content Population
- [ ] All testimonials entered in DB
- [ ] Programs created with pricing
- [ ] Exercise library populated
- [ ] About page uses final client copy

### Step 5.4 — Testing
- [ ] End-to-end: register → purchase → client dashboard flow
- [ ] Stripe test mode checkout verification
- [ ] Mobile responsive testing all pages
- [ ] Cross-browser testing

---

## Current Status (Post Phase 2)

| Feature | Status |
|---------|--------|
| Marketing site (landing, services, about, contact) | Done |
| Public program store + Stripe checkout | Done |
| Registration + login | Done |
| Client dashboard (5 pages) | Done |
| Admin dashboard + analytics | Done |
| Admin exercises CRUD | Done |
| Admin programs CRUD | Done |
| Admin payments table | Done |
| Admin reviews management | Done |
| Admin client detail view | Done |
| Admin settings | Done |
| All DAL files (service role client) | Done |
| Database schema + migrations | Done |
| Dedicated service pages | Phase 3 |
| Homepage content refresh | Phase 3 |
| Email integration | Phase 4 |
| Program exercise scheduling UI | Phase 4 |
| Video analysis | Phase 4 |
| Application/intake forms | Phase 4 |
| Production deployment | Phase 5 |
