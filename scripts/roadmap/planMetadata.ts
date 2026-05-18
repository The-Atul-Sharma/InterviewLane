import type { PrepPlan } from "../../src/lib/schema/roadmap";

/**
 * Each plan is a template: a per-day topic rotation + special-day markers
 * (mock interview, revision). `build.ts` fills in `question_slugs` per day
 * by sampling from the topic's question bucket, deterministically (seeded
 * by plan slug + day) so reloads are stable.
 */
interface DayTemplate {
  /** Topic slugs to pull questions from on this day, in order. */
  topics: string[];
  focus: string;
  goals: string[];
  isMock?: boolean;
  isRevision?: boolean;
}

export interface AuthoredPlan extends Omit<PrepPlan, "position"> {
  template: DayTemplate[];
}

// ---------------------------------------------------------------------------

const sevenDay: AuthoredPlan = {
  slug: "7-day",
  name: "7-Day Crash Plan",
  tagline: "Interview next week. Lock in the essentials.",
  description:
    "Seven days, four questions a day, across the highest-frequency interview surfaces — JavaScript, async, React, performance, system design. Built for engineers with a hard deadline who need maximum signal in minimum time.",
  days: 7,
  questionsPerDay: 4,
  revisionStrategy:
    "Re-skim yesterday's answers each morning before starting new questions. End each day by writing a one-sentence summary of each answer from memory.",
  milestoneCadence: [
    { day: 3, label: "Halfway check — confidence on JS + async" },
    { day: 6, label: "Mock interview — pick two unseen questions and time yourself" },
    { day: 7, label: "Final sweep — revisit anything still shaky" },
  ],
  focus: ["JavaScript", "React", "Performance", "System Design"],
  difficulty: "intermediate",
  template: [
    { topics: ["javascript-core", "javascript-core", "javascript-core", "javascript-core"], focus: "JavaScript core",  goals: ["Closures, scope, this", "Equality and types"] },
    { topics: ["async-javascript", "async-javascript", "async-javascript", "networking"], focus: "Async + networking", goals: ["Promises, microtasks", "AbortController patterns"] },
    { topics: ["react-basics", "react-basics", "react-basics", "react-basics"], focus: "React fundamentals", goals: ["Hooks mental model", "Forms + lists"] },
    { topics: ["react-internals", "react-internals", "react-performance", "react-performance"], focus: "React internals + perf", goals: ["Fiber, hydration", "Memo discipline"] },
    { topics: ["performance-optimization", "performance-optimization", "browser-rendering", "browser-rendering"], focus: "Performance + rendering", goals: ["CWV + bundle splits", "Reflow vs repaint"] },
    { topics: ["frontend-system-design", "frontend-system-design", "state-management", "security"], focus: "System design mock", goals: ["Scope a design out loud"], isMock: true },
    { topics: ["javascript-core", "react-basics", "react-performance", "frontend-system-design"], focus: "Revision sweep", goals: ["Re-derive answers from memory"], isRevision: true },
  ],
};

// ---------------------------------------------------------------------------

function thirtyDayTemplate(): DayTemplate[] {
  const t: DayTemplate[] = [];
  // Week 1: foundations
  t.push({ topics: ["javascript-core", "javascript-core", "javascript-core", "javascript-core", "javascript-core"], focus: "JS core: closures, scope, this", goals: ["Read 5 questions deeply"] });
  t.push({ topics: ["javascript-core", "async-javascript", "async-javascript", "async-javascript", "async-javascript"], focus: "Async JS + event loop", goals: ["Trace microtask/macrotask"] });
  t.push({ topics: ["async-javascript", "browser-rendering", "browser-rendering", "browser-rendering", "browser-rendering"], focus: "Browser rendering pipeline", goals: ["Explain CRP end to end"] });
  t.push({ topics: ["dom", "dom", "dom", "dom", "dom"], focus: "DOM, events, storage", goals: ["Pick correct storage primitive"] });
  t.push({ topics: ["javascript-core", "async-javascript", "browser-rendering", "dom", "dom"], focus: "Foundations checkpoint", goals: ["Self-quiz on week 1"] });
  t.push({ topics: ["javascript-core", "async-javascript", "browser-rendering", "dom", "react-basics"], focus: "Week 1 mock", goals: ["Pick 5 cold questions, time yourself"], isMock: true });
  t.push({ topics: ["javascript-core", "async-javascript", "browser-rendering", "dom", "dom"], focus: "Week 1 revision", goals: ["Write answers from memory"], isRevision: true });
  // Week 2: react + state
  t.push({ topics: ["react-basics", "react-basics", "react-basics", "react-basics", "react-basics"], focus: "React fundamentals", goals: ["Hooks decision tree"] });
  t.push({ topics: ["react-basics", "react-basics", "react-internals", "react-internals", "react-internals"], focus: "React internals start", goals: ["Fiber + reconciliation"] });
  t.push({ topics: ["react-internals", "react-internals", "react-performance", "react-performance", "react-performance"], focus: "React performance", goals: ["When memo helps vs hurts"] });
  t.push({ topics: ["state-management", "state-management", "state-management", "state-management", "state-management"], focus: "State management", goals: ["Server vs client state"] });
  t.push({ topics: ["networking", "networking", "networking", "networking", "typescript"], focus: "Networking", goals: ["Cancellation + caching"] });
  t.push({ topics: ["react-basics", "react-internals", "react-performance", "state-management", "networking"], focus: "Week 2 mock", goals: ["React deep-dive mock"], isMock: true });
  t.push({ topics: ["react-basics", "react-internals", "react-performance", "state-management", "networking"], focus: "Week 2 revision", goals: ["Identify weak topics"], isRevision: true });
  // Week 3: depth — perf, security, testing, a11y, build
  t.push({ topics: ["performance-optimization", "performance-optimization", "performance-optimization", "performance-optimization", "performance-optimization"], focus: "Performance engineering", goals: ["CWV + bundle work"] });
  t.push({ topics: ["security", "security", "security", "security", "security"], focus: "Security", goals: ["XSS, CSRF, cookies"] });
  t.push({ topics: ["accessibility", "accessibility", "accessibility", "testing", "testing"], focus: "A11y + testing", goals: ["WCAG essentials"] });
  t.push({ topics: ["testing", "testing", "testing", "build-tools", "build-tools"], focus: "Testing strategy", goals: ["Unit vs integration vs E2E"] });
  t.push({ topics: ["build-tools", "build-tools", "build-tools", "typescript", "typescript"], focus: "Build tools + TS", goals: ["Tree shaking + types"] });
  t.push({ topics: ["performance-optimization", "security", "accessibility", "testing", "build-tools"], focus: "Week 3 mock", goals: ["Cross-topic mock"], isMock: true });
  t.push({ topics: ["performance-optimization", "security", "accessibility", "testing", "build-tools"], focus: "Week 3 revision", goals: ["Drill weak topics"], isRevision: true });
  // Week 4: architecture + system design
  t.push({ topics: ["frontend-architecture", "frontend-architecture", "frontend-architecture", "frontend-architecture", "frontend-architecture"], focus: "Architecture", goals: ["Monorepo, micro-FE, SDK"] });
  t.push({ topics: ["frontend-system-design", "frontend-system-design", "frontend-system-design", "frontend-system-design", "frontend-system-design"], focus: "System design start", goals: ["Scope-tradeoff-rollout frame"] });
  t.push({ topics: ["frontend-system-design", "frontend-system-design", "frontend-system-design", "frontend-system-design", "frontend-system-design"], focus: "System design depth", goals: ["Pick 5 designs, draft out loud"] });
  t.push({ topics: ["frontend-architecture", "frontend-system-design", "performance-optimization", "state-management", "react-internals"], focus: "Capstone mock", goals: ["Full senior loop simulation"], isMock: true });
  t.push({ topics: ["javascript-core", "react-internals", "react-performance", "performance-optimization", "frontend-system-design"], focus: "Final sweep", goals: ["Hit lowest confidence topics"] });
  t.push({ topics: ["frontend-system-design", "frontend-system-design", "frontend-architecture", "performance-optimization", "react-internals"], focus: "Mock #4", goals: ["System design timed"], isMock: true });
  t.push({ topics: ["javascript-core", "async-javascript", "react-basics", "react-internals", "performance-optimization"], focus: "Final revision", goals: ["Write summaries from memory"], isRevision: true });
  t.push({ topics: ["javascript-core", "react-internals", "react-performance", "frontend-architecture", "frontend-system-design"], focus: "Ship-day prep", goals: ["Light read, rest the brain"] });
  return t.slice(0, 30);
}

const thirtyDay: AuthoredPlan = {
  slug: "30-day",
  name: "30-Day Preparation Plan",
  tagline: "One structured month to senior-ready.",
  description:
    "Thirty days of theory and applied practice, organized into weekly themes — foundations, React, depth, architecture — with weekly mock interviews and revision days built in.",
  days: 30,
  questionsPerDay: 5,
  revisionStrategy:
    "Friday of each week is a revision day: write summaries from memory and drill the topics where you missed the most. Saturday is a timed mock with five unseen questions.",
  milestoneCadence: [
    { day: 7,  label: "Foundations complete" },
    { day: 14, label: "React + state complete" },
    { day: 21, label: "Depth (perf, security, testing, a11y) complete" },
    { day: 28, label: "Architecture + system design complete" },
    { day: 30, label: "Interview-ready signoff" },
  ],
  focus: ["Foundations", "React", "Performance", "Architecture", "System Design"],
  difficulty: "advanced",
  template: thirtyDayTemplate(),
};

// ---------------------------------------------------------------------------

function sixtyDayTemplate(): DayTemplate[] {
  // Take the 30-day template and double each day to slow the pace and add
  // extra depth days for the harder topics.
  const base = thirtyDayTemplate();
  const out: DayTemplate[] = [];
  for (const d of base) {
    out.push(d);
    out.push({
      topics: d.topics,
      focus: `${d.focus} — depth day`,
      goals: ["Practice from memory", "Write code, don't just read"],
    });
  }
  return out.slice(0, 60);
}

const sixtyDay: AuthoredPlan = {
  slug: "60-day",
  name: "60-Day Deep Preparation Plan",
  tagline: "Two months for the slow, deep build.",
  description:
    "The same shape as the 30-day plan, paced over two months with paired depth days. Built for engineers who want to internalize the material, not just review it.",
  days: 60,
  questionsPerDay: 4,
  revisionStrategy:
    "Each topic gets two consecutive days: a learning day and a depth day where you reproduce the answer from memory and write code by hand. Mock + revision pairs anchor each week.",
  milestoneCadence: [
    { day: 14, label: "Foundations + async fully internalized" },
    { day: 28, label: "React + state + networking complete" },
    { day: 42, label: "Depth (perf, security, testing, a11y, build) complete" },
    { day: 56, label: "Architecture + system design complete" },
    { day: 60, label: "Interview-ready signoff" },
  ],
  focus: ["Foundations", "React", "Performance", "Architecture", "System Design"],
  difficulty: "advanced",
  template: sixtyDayTemplate(),
};

// ---------------------------------------------------------------------------

function ninetyDayTemplate(): DayTemplate[] {
  const out: DayTemplate[] = [];
  const pacing: Array<[string, number]> = [
    ["javascript-core", 8],
    ["async-javascript", 6],
    ["browser-rendering", 5],
    ["dom", 5],
    ["react-basics", 8],
    ["react-internals", 6],
    ["react-performance", 6],
    ["state-management", 5],
    ["networking", 5],
    ["typescript", 4],
    ["performance-optimization", 7],
    ["security", 5],
    ["accessibility", 4],
    ["testing", 4],
    ["build-tools", 4],
    ["frontend-architecture", 6],
    ["frontend-system-design", 12],
  ];
  let dayIdx = 0;
  for (const [topic, count] of pacing) {
    for (let i = 0; i < count; i++) {
      dayIdx++;
      const isMock = dayIdx % 14 === 0;
      const isRevision = dayIdx % 14 === 7;
      out.push({
        topics: [topic, topic, topic],
        focus: `${topic.replace(/-/g, " ")} day ${i + 1}/${count}`,
        goals: i === 0 ? ["Read deeply, take notes"] : ["Reproduce answers from memory"],
        ...(isMock && { isMock: true }),
        ...(isRevision && { isRevision: true }),
      });
    }
  }
  // Pad to 90 with system design + cross-topic mocks
  while (out.length < 90) {
    const dayIdx2 = out.length + 1;
    out.push({
      topics: ["frontend-system-design", "performance-optimization", "react-internals"],
      focus: "Capstone mock + retro",
      goals: ["Time a full design", "Identify gaps for tomorrow"],
      isMock: dayIdx2 % 3 === 0,
    });
  }
  return out.slice(0, 90);
}

const ninetyDay: AuthoredPlan = {
  slug: "90-day",
  name: "90-Day Senior Frontend Interview Plan",
  tagline: "From zero to staff-loop ready.",
  description:
    "Three months covering every topic in the roadmap, paced so each surface gets time to settle. Built for engineers targeting senior or staff loops at top product companies, with weekly mocks and a system-design capstone.",
  days: 90,
  questionsPerDay: 3,
  revisionStrategy:
    "Every 7th day is a revision day; every 14th day is a timed mock. Track which topics you scored lowest on and add an extra revision pass in week 12.",
  milestoneCadence: [
    { day: 21,  label: "Foundations + async + browser locked in" },
    { day: 42,  label: "React + state + networking + TS locked in" },
    { day: 63,  label: "Depth (perf, security, a11y, testing, build) locked in" },
    { day: 80,  label: "Architecture + design fluency" },
    { day: 90,  label: "Staff-loop ready" },
  ],
  focus: ["Foundations", "Senior engineering", "Performance", "System Design"],
  difficulty: "comprehensive",
  template: ninetyDayTemplate(),
};

// ---------------------------------------------------------------------------

export const PLANS: AuthoredPlan[] = [sevenDay, thirtyDay, sixtyDay, ninetyDay];
