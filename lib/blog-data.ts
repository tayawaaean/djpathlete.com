export type Category = "Performance" | "Recovery" | "Coaching" | "Youth Development"

export interface Post {
  id: string
  title: string
  excerpt: string
  category: Category
  date: string
  slug: string
  body: {
    subheading: string
    text: string
  }[]
  /** Raw HTML content from GHL — rendered directly on the detail page */
  htmlContent?: string
}

export const posts: Post[] = [
  {
    id: "1",
    title: "Why Most Training Programs Fail Serious Athletes",
    excerpt:
      "Generic programming ignores the most critical variable in performance development: context. Here's what actually drives adaptation.",
    category: "Performance",
    date: "2026-02-10",
    slug: "why-most-training-programs-fail",
    body: [
      {
        subheading: "The Template Trap",
        text: "Walk into any commercial gym and you will find athletes running programs built for nobody in particular. These templates — pulled from Instagram, borrowed from a teammate, or photocopied from a textbook — share a fatal flaw: they assume that the athlete standing in front of you is interchangeable with every other athlete at a similar level. They are not. Training is a biological conversation, and every athlete brings a different set of constraints, injury history, movement competencies, and competition demands to that conversation. A program that ignores these variables is not programming at all. It is guessing.",
      },
      {
        subheading: "Context Is the Variable That Matters",
        text: "Adaptation does not occur in a vacuum. It is shaped by the athlete's training age, tissue capacity, psychosocial stress, sleep architecture, nutritional status, and the competitive calendar bearing down on them. A well-designed program accounts for these factors not as afterthoughts but as primary inputs. When I assess an athlete, the first question is never 'what exercises should they do.' It is 'what is the current state of this system, and what stimulus will produce the response we need right now.' The exercise selection follows from the answer — not the other way around.",
      },
      {
        subheading: "Periodisation Without Dogma",
        text: "Effective programming is not about choosing the right periodisation model and applying it rigidly. It is about understanding principles of progressive overload, fatigue management, and specificity — then applying them with enough flexibility to respond to what the athlete's body is actually telling you. The best programs are living documents. They have a clear trajectory, but they breathe. They accommodate bad nights of sleep, unexpected competitions, and the reality that human biology does not follow a spreadsheet.",
      },
      {
        subheading: "What Drives Real Adaptation",
        text: "If you want a training program that actually works for a serious athlete, start with an honest assessment of where they are, not where you want them to be. Build capacity before you build intensity. Monitor readiness, not just output. And be willing to deviate from the plan when the data — objective or subjective — tells you to. The athletes who make the biggest gains are not the ones following the most sophisticated programs. They are the ones whose programs were built specifically for them, by someone paying close enough attention to adjust when it matters.",
      },
    ],
  },
  {
    id: "2",
    title: "The Return-to-Performance Gap Nobody Talks About",
    excerpt:
      "Medical clearance and performance readiness are not the same thing. Understanding this distinction could save an athlete's career.",
    category: "Recovery",
    date: "2026-01-28",
    slug: "return-to-performance-gap",
    body: [
      {
        subheading: "Cleared to Play Is Not Ready to Perform",
        text: "An athlete tears their ACL. They go through surgery, months of rehabilitation, and eventually get the green light from their surgeon. Cleared to play. But here is the problem: medical clearance tells you the tissue has healed. It tells you almost nothing about whether the athlete can tolerate the demands of their sport at the intensity required to perform and to stay healthy doing it. This gap — the space between medical clearance and genuine performance readiness — is where re-injuries happen, where confidence erodes, and where careers quietly unravel.",
      },
      {
        subheading: "The Missing Phase of Rehabilitation",
        text: "Traditional rehabilitation models move from acute care through to functional milestones: range of motion, strength benchmarks, hop tests. These are necessary but insufficient. What is almost always missing is a structured return-to-performance phase that bridges the gap between the clinic and the competitive environment. This phase should address high-velocity movement, reactive agility, sport-specific loading patterns, and — critically — the psychological readiness to trust the body under pressure. Without it, we are sending athletes back into environments their systems are not prepared for.",
      },
      {
        subheading: "Redefining What 'Ready' Means",
        text: "Performance readiness is multidimensional. It encompasses tissue tolerance under fatigue, the capacity to produce and absorb force at game speed, neuromuscular coordination in unpredictable situations, and the athlete's confidence to commit fully to movement without hesitation. A single-leg press at 90% of the contralateral limb is a checkpoint, not a finish line. We need to stop treating these benchmarks as binary gates and start treating them as one data point in a much richer picture of readiness.",
      },
      {
        subheading: "Bridging the Gap in Practice",
        text: "Closing the return-to-performance gap requires collaboration between medical and performance staff, a graduated exposure model that incrementally increases sport-specific demands, and ongoing monitoring that goes beyond physical metrics to include psychological markers and self-reported readiness. The goal is not to slow the process down — it is to make it more precise. Athletes who go through a robust return-to-performance protocol do not just reduce their re-injury risk. They come back with a level of body awareness and movement competency that often surpasses their pre-injury baseline.",
      },
    ],
  },
  {
    id: "3",
    title: "Systems Thinking in Athletic Development",
    excerpt:
      "Why the best coaches think in systems, not exercises. A framework for understanding how adaptation actually works.",
    category: "Coaching",
    date: "2026-01-15",
    slug: "systems-thinking-athletic-development",
    body: [
      {
        subheading: "The Exercise-Centred Fallacy",
        text: "Too many coaches build programs from the exercise up. They start with movements they like, arrange them into a weekly template, and call it a program. This approach treats training as a collection of isolated events rather than what it actually is: a series of interconnected stimuli acting on a complex biological system. An exercise is a tool. It has no value independent of the context in which it is applied. A barbell back squat might be the best choice for one athlete and entirely contraindicated for another — not because the exercise is good or bad, but because the system it is being applied to has different constraints and needs.",
      },
      {
        subheading: "Thinking in Systems, Not Parts",
        text: "A systems approach to athletic development starts with the understanding that the athlete is a whole organism, not a collection of muscle groups. Every training stimulus creates a cascade of responses — mechanical, metabolic, neurological, hormonal, psychological — and these responses interact with each other in ways that are not always linear or predictable. This is why a program that looks perfect on paper can fail in practice, and why a coach who understands the system will outperform a coach who only understands the exercises every time.",
      },
      {
        subheading: "Inputs, Outputs, and Feedback Loops",
        text: "In a systems framework, training is an input. Performance and health are outputs. And between the two sit a series of feedback loops — sleep, nutrition, stress, recovery modalities, psychological state — that amplify or attenuate the signal you are trying to send. The best coaches I have worked with spend as much time managing these feedback loops as they do designing the training itself. They understand that a perfectly designed session delivered to an under-recovered athlete is not a good session. It is a stress event with diminishing returns.",
      },
      {
        subheading: "Practical Application",
        text: "Adopting a systems lens does not require a PhD in complexity theory. It requires three things: first, a willingness to look beyond the session plan and consider the athlete's total stress load. Second, a monitoring framework — even a simple one — that captures readiness data over time. Third, the humility to adjust the plan when the system tells you that what you prescribed is not producing the response you expected. Coaching is not about delivering programs. It is about managing adaptive systems. The sooner you internalise that distinction, the more effective you become.",
      },
    ],
  },
  {
    id: "4",
    title: "Load Management: Beyond the Numbers",
    excerpt:
      "Monitoring load is necessary but insufficient. What matters is how load interacts with readiness, capacity, and context.",
    category: "Performance",
    date: "2025-12-20",
    slug: "load-management-beyond-numbers",
    body: [
      {
        subheading: "The Quantification Problem",
        text: "The rise of wearable technology and athlete monitoring systems has given coaches access to more data than ever before. Session RPE, GPS metrics, heart rate variability, acute-to-chronic workload ratios — the dashboard is full. But more data does not automatically mean better decisions. In fact, the biggest risk in modern load management is the temptation to reduce a complex, context-dependent process to a single number. An athlete's acute-to-chronic ratio might sit in the 'sweet spot,' but if that athlete slept four hours, is dealing with a personal crisis, and has a niggling hamstring, the number on the screen is lying to you.",
      },
      {
        subheading: "Internal Load vs External Load",
        text: "A fundamental distinction that is often overlooked in practice is the difference between what the athlete did (external load) and how the athlete responded to what they did (internal load). Two athletes can perform the identical session and experience vastly different internal responses based on their fitness, fatigue, health status, and psychological state. Effective load management requires monitoring both dimensions and, more importantly, understanding the relationship between them. When internal load starts rising relative to external load for a given athlete, that is your early warning signal — long before anything shows up on an MRI.",
      },
      {
        subheading: "The Role of Readiness",
        text: "Load prescription should never happen in isolation. It should always be filtered through the lens of readiness: is this athlete in a state to absorb and adapt to the stimulus I am about to deliver? Readiness is a moving target shaped by training history, accumulated fatigue, sleep quality, nutritional intake, and psychological factors. A robust monitoring protocol captures these variables — ideally through a combination of objective measures and athlete self-report — and uses them to modulate the day's plan. This is not weakness. It is precision.",
      },
      {
        subheading: "Context Over Algorithm",
        text: "The best load management systems are not the ones with the fanciest dashboards. They are the ones that give the coach enough information to make a good decision, combined with a coach who understands the athlete well enough to interpret that information correctly. Algorithms can flag risk. They cannot understand that the athlete is more motivated than usual because a scout is watching, or that the low HRV reading was caused by a late flight rather than overtraining. Context is the variable that turns data into insight. Never outsource that to a spreadsheet.",
      },
    ],
  },
  {
    id: "5",
    title: "Building Resilient Youth Athletes",
    excerpt:
      "Long-term athletic development isn't about early specialization. It's about building robust, adaptable movement capacity.",
    category: "Youth Development",
    date: "2025-12-05",
    slug: "building-resilient-youth-athletes",
    body: [
      {
        subheading: "The Early Specialisation Myth",
        text: "Parents and well-meaning coaches often push young athletes into single-sport specialisation at increasingly early ages, believing this is the path to elite performance. The evidence says otherwise. Early specialisation is consistently associated with higher rates of overuse injury, psychological burnout, and — perhaps counterintuitively — a lower likelihood of reaching the elite level in most sports. The athletes who thrive long-term are overwhelmingly those who developed broad movement competency across multiple activities before narrowing their focus. The rush to specialise is not just ineffective. It is actively harmful.",
      },
      {
        subheading: "Movement Literacy Before Sport Specificity",
        text: "Before a young athlete needs sport-specific skill, they need movement literacy: the ability to run, jump, land, change direction, throw, catch, balance, and coordinate their body in space with competence and confidence. These fundamental movement skills are the foundation upon which all sport-specific abilities are built. When we skip this phase — or assume it will develop organically — we create athletes who can perform their sport's narrow movement vocabulary but lack the underlying capacity to tolerate new demands, recover from perturbation, or adapt when the game changes.",
      },
      {
        subheading: "Building Physical Resilience",
        text: "Resilience in a youth development context means more than injury prevention, though that is a significant component. It means building an athlete who has the tissue capacity, neuromuscular coordination, and movement variability to handle the unpredictable demands of sport and growth. This requires progressive exposure to a variety of physical challenges: different surfaces, different speeds, different movement patterns, different levels of fatigue. It requires loading that respects growth and maturation timelines. And it requires patience — the understanding that building a robust physical system takes years, not weeks.",
      },
      {
        subheading: "The Long Game",
        text: "The most important thing any youth development programme can do is keep the athlete in the game long enough for their talent to mature. That means prioritising enjoyment, physical literacy, and gradual exposure over winning and performance metrics. It means educating parents about the difference between short-term success and long-term development. And it means creating environments where young athletes are free to explore movement, make mistakes, and build the kind of deep, adaptable physical capacity that will serve them for decades — whether they become professional athletes or simply healthy, capable adults.",
      },
    ],
  },
  {
    id: "6",
    title: "The Role of Video Analysis in Modern Coaching",
    excerpt:
      "Frame-by-frame breakdown of movement isn't just for biomechanists. How video feedback transforms coaching outcomes.",
    category: "Coaching",
    date: "2025-11-18",
    slug: "video-analysis-modern-coaching",
    body: [
      {
        subheading: "Seeing What the Eye Misses",
        text: "The human eye processes movement in real time, and real time is often not enough. A sprint takes seconds. A change of direction happens in milliseconds. A landing pattern that increases ACL risk is invisible at full speed. Video analysis strips away the limitation of temporal resolution and allows the coach to see what is actually happening — not what they think they see. This is not about replacing the coach's eye. It is about augmenting it with a tool that reveals the details the naked eye cannot capture, no matter how experienced the observer.",
      },
      {
        subheading: "Beyond Biomechanics",
        text: "Video analysis in a coaching context is not limited to joint angles and force vectors, though these matter. It extends to tactical patterns, decision-making under pressure, positional awareness, and the subtle compensatory strategies athletes adopt when they are fatiguing or protecting an injury. A well-timed video review can reveal that an athlete's recurring hamstring tightness is not a flexibility problem but a compensation for poor pelvic control during acceleration. That distinction changes the entire intervention strategy — and you cannot make it without the footage.",
      },
      {
        subheading: "Feedback That Accelerates Learning",
        text: "One of the most powerful applications of video analysis is as a feedback mechanism for the athlete. Research on motor learning consistently demonstrates that visual feedback accelerates skill acquisition and movement correction when delivered appropriately. The key is timing and dosage. Showing an athlete what they are doing versus what you want them to do — in a clear, focused, non-overwhelming way — creates an internal model that verbal cueing alone cannot achieve. The athlete stops relying solely on the coach's description and starts developing their own proprioceptive awareness of the target pattern.",
      },
      {
        subheading: "Integrating Video Into Daily Practice",
        text: "You do not need a biomechanics laboratory to use video effectively. A phone on a tripod, a basic slow-motion app, and a clear understanding of what you are looking for is enough to transform your coaching. The critical factor is not the technology — it is the systematic use of visual data to inform training decisions and athlete education. Film key movements regularly. Build a library of each athlete's patterns over time. Use side-by-side comparisons to show progress. Make video review a normal part of the training culture, not a special event. When you do, you will wonder how you ever coached without it.",
      },
    ],
  },
]
