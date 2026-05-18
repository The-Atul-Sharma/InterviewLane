import type { RoadmapStage } from "../../src/lib/schema/roadmap";

export const STAGES: RoadmapStage[] = [
  {
    slug: "foundations",
    name: "Foundations",
    description:
      "The language and the platform. JavaScript core, the DOM, and how the browser actually renders. Every interview at every level builds on this floor.",
    position: 1,
    skills: ["JavaScript core", "DOM & events", "Browser rendering", "HTTP basics"],
    estHours: 35,
    readinessLevel: "Junior screen ready",
    difficultyBand: "easy → medium",
  },
  {
    slug: "intermediate",
    name: "Intermediate",
    description:
      "Async JavaScript, React fundamentals, and the daily UI surfaces — forms, lists, networking. The bar for mid-level coding rounds at most product companies.",
    position: 2,
    skills: ["Async JS & promises", "React basics", "State patterns", "Networking", "TypeScript"],
    estHours: 50,
    readinessLevel: "Mid-level coding round ready",
    difficultyBand: "medium",
  },
  {
    slug: "advanced",
    name: "Advanced",
    description:
      "How React actually works under the hood, performance engineering, testing strategy, and the security posture interviewers expect you to bring up unprompted.",
    position: 3,
    skills: ["React internals", "Performance optimization", "Testing", "Security", "Accessibility"],
    estHours: 55,
    readinessLevel: "Senior-leaning IC round ready",
    difficultyBand: "medium → hard",
  },
  {
    slug: "senior",
    name: "Senior",
    description:
      "Frontend architecture, build tooling, and component-level system design. The point where interviews stop being about syntax and start being about tradeoffs.",
    position: 4,
    skills: [
      "Frontend architecture",
      "Build tools & bundling",
      "React performance at scale",
      "Component system design",
    ],
    estHours: 60,
    readinessLevel: "Senior IC ready",
    difficultyBand: "medium → hard",
  },
  {
    slug: "staff",
    name: "Staff Level",
    description:
      "Multi-team frontend system design, platform thinking, and the cross-cutting concerns — observability, rollout safety, design systems at scale — that staff loops drill into.",
    position: 5,
    skills: ["Frontend system design", "Design systems at scale", "Platform & DX", "Rollout & observability"],
    estHours: 70,
    readinessLevel: "Staff loop ready",
    difficultyBand: "hard",
  },
];
