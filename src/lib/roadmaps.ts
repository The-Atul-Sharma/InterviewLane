export interface RoadmapTopic {
  slug: string;
  name: string;
  description: string;
  itemCount: number;
}

export interface Roadmap {
  slug: string;
  name: string;
  description: string;
  estimatedHours: number;
  status: "active" | "coming-soon";
  topics: RoadmapTopic[];
}

export const ROADMAPS: Roadmap[] = [
  {
    slug: "frontend-foundations",
    name: "Frontend Foundations",
    description:
      "JavaScript, browser internals, React core, CSS layout. The minimum competence bar before tackling system design or DSA.",
    estimatedHours: 40,
    status: "active",
    topics: [
      { slug: "javascript", name: "JavaScript", description: "Closures, async, prototypes.", itemCount: 0 },
      { slug: "browser-internals", name: "Browser Internals", description: "Event loop, memory, V8.", itemCount: 0 },
      { slug: "react", name: "React Core", description: "Hooks, Fiber, hydration.", itemCount: 0 },
      { slug: "css", name: "CSS", description: "Layout, specificity, modern features.", itemCount: 0 },
    ],
  },
  {
    slug: "senior-frontend",
    name: "Senior Frontend",
    description:
      "Architecture, performance engineering, security, system design — the bar for senior+ roles.",
    estimatedHours: 60,
    status: "active",
    topics: [
      { slug: "performance", name: "Performance", description: "Bundle, CWV, virtualization.", itemCount: 0 },
      { slug: "system-design", name: "System Design", description: "Scaling, modular apps, micro-frontends.", itemCount: 0 },
      { slug: "security", name: "Security", description: "XSS, CSRF, cookies, auth flows.", itemCount: 0 },
      { slug: "architecture", name: "Architecture", description: "Design systems, monorepos, state strategy.", itemCount: 0 },
    ],
  },
];

export const PREP_PLANS = [
  {
    slug: "7-day",
    name: "7-day refresher",
    description:
      "Triage interview tomorrow? This plan hits the highest-frequency questions across React, JS, performance, and system design.",
    days: 7,
    questionsPerDay: 4,
  },
  {
    slug: "30-day",
    name: "30-day deep prep",
    description:
      "One month to senior-ready. Daily mix of theory + applied questions, weekly project deep-dive practice.",
    days: 30,
    questionsPerDay: 3,
  },
  {
    slug: "90-day",
    name: "90-day mastery",
    description:
      "Three months covering everything: foundations → senior → DSA → behavioral. Built for staff-level prep.",
    days: 90,
    questionsPerDay: 2,
  },
];
