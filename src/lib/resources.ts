import {
  BookOpen,
  Boxes,
  Braces,
  Brain,
  Code2,
  Component,
  Gauge,
  Layers,
  ListChecks,
  MessageSquare,
  Network,
  Puzzle,
  Rocket,
  Shapes,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type ResourceKind =
  | "course"
  | "docs"
  | "questions"
  | "article"
  | "video"
  | "practice"
  | "cheatsheet";

export type Resource = {
  title: string;
  url: string;
  kind: ResourceKind;
  description?: string;
  free?: boolean;
  recommended?: boolean;
};

export type ResourceSection = {
  slug: string;
  name: string;
  blurb: string;
  icon: LucideIcon;
  accent: string;
  resources: Resource[];
};

export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    slug: "dsa",
    name: "DSA & Algorithms",
    blurb:
      "Pattern-first problem solving tuned for frontend interviews. Track curated by us — start here.",
    icon: Brain,
    accent: "from-violet-500/15 to-fuchsia-500/10",
    resources: [
      {
        title: "DSA for Frontend — 75 questions",
        url: "/categories/dsa-algorithms-75",
        kind: "practice",
        description:
          "75 hand-picked, priority-ranked problems covering arrays, graphs, trees, DP, and more — tuned for frontend interviews.",
        free: true,
        recommended: true,
      },
    ],
  },
  {
    slug: "javascript",
    name: "JavaScript",
    blurb:
      "Lock down the language fundamentals: event loop, closures, prototypes, promises, modules, and the DOM. Then stress-test with tricky snippets.",
    icon: Braces,
    accent: "from-amber-500/15 to-orange-500/10",
    resources: [
      {
        title: "javascript.info",
        url: "https://javascript.info/",
        kind: "course",
        description:
          "The deepest free JS course — Promises, classes, DOM events, cookies, storage.",
        free: true,
        recommended: true,
      },
      {
        title: "100 JS interview questions",
        url: "https://javascriptinterviewquestions.com/2020/04/100-javascript-interview-questions-to-crack-any-javascript-inteview.html",
        kind: "questions",
        description: "Classic curated bank covering the most-asked JavaScript concepts.",
        free: true,
      },
      {
        title: "100 JS questions (archived mirror)",
        url: "https://web.archive.org/web/20220620105236/https://javascriptinterviewquestions.com/2020/04/100-javascript-interview-questions-to-crack-any-javascript-inteview.html",
        kind: "questions",
        description: "Wayback mirror in case the original is down.",
        free: true,
      },
      {
        title: "Tricky ES6/7/8/9 code snippets",
        url: "https://www.codinn.dev/tricky-javascript/es6789-code-snippets-interview-questions",
        kind: "questions",
        description: "Predict-the-output drills across modern ES features.",
        free: true,
      },
      {
        title: "1000+ JS interview questions",
        url: "https://github.com/sudheerj/javascript-interview-questions",
        kind: "questions",
        description: "Encyclopedic GitHub repo — great for spaced review.",
        free: true,
      },
      {
        title: "GreatFrontEnd: top JS interview questions",
        url: "https://github.com/greatfrontend/top-javascript-interview-questions",
        kind: "questions",
        description: "High-signal subset curated by frontend interviewers.",
        free: true,
        recommended: true,
      },
      {
        title: "JS interview Q&A — ChatGPT thread",
        url: "https://chatgpt.com/share/68bd6255-1500-800f-9b94-e349d942388e",
        kind: "questions",
        description: "Curated ChatGPT walkthrough of common JavaScript interview questions.",
        free: true,
      },
    ],
  },
  {
    slug: "performance",
    name: "Performance",
    blurb:
      "Frontend perf is a frequent senior interview surface — Core Web Vitals, rendering pipeline, network, bundle, and runtime.",
    icon: Gauge,
    accent: "from-emerald-500/15 to-teal-500/10",
    resources: [
      {
        title: "Frontend performance interview questions",
        url: "https://www.clientside.dev/blog/frontend-performance-interview-questions",
        kind: "questions",
        description: "Common perf questions with answer scaffolds.",
        free: true,
        recommended: true,
      },
      {
        title: "3perf — performance training",
        url: "https://3perf.com/",
        kind: "course",
        description: "Optional deep-dive courses on rendering, JS, and network performance.",
      },
    ],
  },
  {
    slug: "react",
    name: "React",
    blurb:
      "Rules of React, hooks, reconciliation, suspense, and server components. Pair docs with question banks for full coverage.",
    icon: Component,
    accent: "from-sky-500/15 to-cyan-500/10",
    resources: [
      {
        title: "Rules of React (official)",
        url: "https://react.dev/reference/rules",
        kind: "docs",
        description: "Canonical reference for purity, hooks, and component rules.",
        free: true,
        recommended: true,
      },
      {
        title: "React interview questions",
        url: "https://github.com/sudheerj/reactjs-interview-questions",
        kind: "questions",
        description: "Long-form question bank covering everything from basics to internals.",
        free: true,
      },
    ],
  },
  {
    slug: "nextjs",
    name: "Next.js",
    blurb: "App Router, server components, caching, route handlers, and rendering strategies.",
    icon: Rocket,
    accent: "from-zinc-500/15 to-slate-500/10",
    resources: [
      {
        title: "Next.js documentation",
        url: "https://nextjs.org/docs",
        kind: "docs",
        description: "Read end-to-end at least once; revisit caching and data fetching.",
        free: true,
        recommended: true,
      },
    ],
  },
  {
    slug: "redux",
    name: "Redux & State",
    blurb:
      "Classic Redux, Redux Toolkit, RTK Query, and where modern alternatives (Zustand, Jotai) fit.",
    icon: Layers,
    accent: "from-purple-500/15 to-indigo-500/10",
    resources: [
      {
        title: "Redux interview questions",
        url: "https://www.finalroundai.com/blog/redux-interview-questions",
        kind: "questions",
        description: "Common Redux questions with answer outlines.",
        free: true,
      },
      {
        title: "Redux Q&A — ChatGPT thread",
        url: "https://chatgpt.com/share/687f8554-4fd0-800f-87ee-96a616994936",
        kind: "questions",
        description:
          "Curated ChatGPT walkthrough of Redux concepts and common interview questions.",
        free: true,
      },
    ],
  },
  {
    slug: "typescript",
    name: "TypeScript",
    blurb:
      "Optional but increasingly expected. Get comfortable with generics, narrowing, and utility types.",
    icon: Code2,
    accent: "from-blue-500/15 to-indigo-500/10",
    resources: [
      {
        title: "Learn TypeScript — beginner's guide",
        url: "https://www.freecodecamp.org/news/learn-typescript-beginners-guide/",
        kind: "course",
        description: "Fast on-ramp covering the parts that show up in interviews.",
        free: true,
      },
    ],
  },
  {
    slug: "system-design",
    name: "Frontend System Design",
    blurb:
      "Frame design rounds: requirements → API → data model → component tree → rendering, perf, a11y, and edge cases.",
    icon: Network,
    accent: "from-rose-500/15 to-pink-500/10",
    resources: [
      {
        title: "Frontend system design cheat sheet",
        url: "https://frontendgeek.com/blogs/best-frontend-system-design-interview-cheat-sheet",
        kind: "cheatsheet",
        description: "Compact framework for structuring answers under time pressure.",
        free: true,
        recommended: true,
      },
      {
        title: "What to expect in a frontend system design round",
        url: "https://learnersbucket.com/examples/frontend-system-design/what-to-expect-in-frontend-system-design/",
        kind: "article",
        description: "Format, rubric, and common pitfalls from a real interviewer.",
        free: true,
      },
      {
        title: "GFE: design an autocomplete",
        url: "https://www.greatfrontend.com/questions/system-design/autocomplete?utm_source=frontendinterviewhandbook&utm_medium=referral&gnrs=frontendinterviewhandbook",
        kind: "practice",
        description: "Walkthrough of one of the most-asked frontend design problems.",
      },
      {
        title: "GFE: design a Facebook news feed",
        url: "https://www.greatfrontend.com/questions/system-design/news-feed-facebook?utm_source=frontendinterviewhandbook&utm_medium=referral&gnrs=frontendinterviewhandbook",
        kind: "practice",
        description: "Pagination, caching, optimistic updates, and feed ranking.",
      },
      {
        title: "GFE — System Design Playbook",
        url: "https://www.greatfrontend.com/front-end-system-design-playbook/introduction",
        kind: "course",
        description: "Structured playbook with a repeatable interview framework.",
        recommended: true,
      },
    ],
  },
  {
    slug: "patterns",
    name: "JS Design Patterns",
    blurb:
      "Patterns show up in design rounds and code reviews. Know singleton, observer, factory, module, and modern variants.",
    icon: Shapes,
    accent: "from-lime-500/15 to-emerald-500/10",
    resources: [
      {
        title: "JavaScript design patterns — freeCodeCamp",
        url: "https://www.freecodecamp.org/news/javascript-design-patterns-explained/",
        kind: "article",
        description: "Plain-English tour of the classic GoF patterns in JS.",
        free: true,
      },
      {
        title: "patterns.dev — vanilla patterns",
        url: "https://www.patterns.dev/vanilla/",
        kind: "docs",
        description: "Beautiful, illustrated reference for modern web patterns.",
        free: true,
        recommended: true,
      },
    ],
  },
  {
    slug: "live-coding",
    name: "Live Coding (Machine Round)",
    blurb:
      "The components that show up over and over. Build each from scratch at least twice; the second pass is what unlocks speed.",
    icon: Puzzle,
    accent: "from-orange-500/15 to-red-500/10",
    resources: [
      {
        title: "Autocomplete / Typeahead",
        url: "https://www.greatfrontend.com/questions/system-design/autocomplete",
        kind: "practice",
        description: "Debounced fetch, race conditions, keyboard nav, a11y.",
      },
      {
        title: "Folder tree",
        url: "https://www.greatfrontend.com/questions/user-interface/file-explorer",
        kind: "practice",
        description: "Recursive rendering, lazy expansion, state lifting.",
      },
      {
        title: "Accordion component",
        url: "https://www.greatfrontend.com/questions/user-interface/accordion",
        kind: "practice",
        description: "Controlled/uncontrolled, multi-open vs single-open, a11y.",
      },
      {
        title: "Progress bar",
        url: "https://www.greatfrontend.com/questions/user-interface/progress-bar",
        kind: "practice",
        description: "Animated transitions, indeterminate state, ARIA.",
      },
      {
        title: "Infinite scroll",
        url: "https://www.greatfrontend.com/questions/user-interface/infinite-scroll",
        kind: "practice",
        description: "IntersectionObserver, cursor pagination, virtualization.",
      },
      {
        title: "Event emitter / pub-sub",
        url: "https://www.greatfrontend.com/questions/javascript/event-emitter",
        kind: "practice",
        description: "Subscribe/unsubscribe semantics and memory leaks.",
      },
      {
        title: "Trello / Kanban board",
        url: "https://www.greatfrontend.com/questions/user-interface/kanban-board",
        kind: "practice",
        description: "Drag-and-drop, optimistic updates, normalized state.",
      },
      {
        title: "Virtualized list",
        url: "https://www.greatfrontend.com/questions/user-interface/virtualized-list",
        kind: "practice",
        description: "Windowing math, variable-height rows, scroll restoration.",
      },
      {
        title: "Custom hooks (useInterval, usePrevious, useLocalStorage, useAsync)",
        url: "https://usehooks.com/",
        kind: "practice",
        description: "Build them yourself before peeking at the reference.",
      },
      {
        title: "Calendar / date picker",
        url: "https://www.greatfrontend.com/questions/user-interface/date-picker",
        kind: "practice",
        description: "Date math, keyboard nav, locale handling.",
      },
      {
        title: "Stopwatch",
        url: "https://www.greatfrontend.com/questions/user-interface/stopwatch",
        kind: "practice",
        description: "requestAnimationFrame, drift correction, pause/resume.",
      },
    ],
  },
  {
    slug: "behavioral",
    name: "Behavioral & Management",
    blurb:
      "STAR-formatted stories for ownership, conflict, ambiguity, and impact. Prepare 6–8 stories that you can remap to most prompts.",
    icon: MessageSquare,
    accent: "from-teal-500/15 to-cyan-500/10",
    resources: [
      {
        title: "The STAR interview method",
        url: "https://www.betterup.com/blog/star-interview-method",
        kind: "article",
        description: "27+ STAR questions and answers for 2025.",
        free: true,
        recommended: true,
      },
      {
        title: "STAR interview questions",
        url: "https://novoresume.com/career-blog/star-interview-questions",
        kind: "questions",
        description: "Question prompts with example answers.",
        free: true,
      },
    ],
  },
  {
    slug: "platforms",
    name: "Mock & Practice Platforms",
    blurb: "End-to-end interview playbooks, mock interviews, and curated 75-question lists.",
    icon: Sparkles,
    accent: "from-yellow-500/15 to-amber-500/10",
    resources: [
      {
        title: "GreatFrontEnd — Front-End Interview Playbook",
        url: "https://www.greatfrontend.com/front-end-interview-playbook",
        kind: "course",
        description: "Full playbook spanning JS, React, system design, and behavioral.",
        recommended: true,
      },
      {
        title: "GreatFrontEnd 75",
        url: "https://www.greatfrontend.com/interviews/gfe75",
        kind: "practice",
        description: "Curated 75-question track tuned for frontend roles.",
      },
      {
        title: "GFE — System Design Playbook",
        url: "https://www.greatfrontend.com/front-end-system-design-playbook",
        kind: "course",
        description: "Companion playbook for the design round.",
      },
      {
        title: "FrontPrep",
        url: "https://www.frontprep.com",
        kind: "practice",
        description: "Frontend interview practice platform.",
      },
    ],
  },
];

export const KIND_LABEL: Record<ResourceKind, string> = {
  course: "Course",
  docs: "Docs",
  questions: "Q&A bank",
  article: "Article",
  video: "Video",
  practice: "Practice",
  cheatsheet: "Cheatsheet",
};

export const STUDY_TRACK = [
  { week: "Week 1", focus: "JavaScript foundations + DOM/events", sections: ["javascript"] },
  { week: "Weeks 2–4", focus: "DSA & Algorithms", sections: ["dsa"] },
  { week: "Week 5", focus: "Performance + design patterns", sections: ["performance", "patterns"] },
  { week: "Week 6", focus: "Live coding components", sections: ["live-coding"] },
  { week: "Week 7", focus: "Frontend system design", sections: ["system-design"] },
  { week: "Week 8", focus: "Next.js + Redux/state", sections: ["nextjs", "redux"] },
  { week: "Extra", focus: "Behavioral stories + mocks", sections: ["behavioral", "platforms"] },
] as const;

export const RESOURCE_ICONS = {
  list: ListChecks,
  bookOpen: BookOpen,
  boxes: Boxes,
  workflow: Workflow,
};
