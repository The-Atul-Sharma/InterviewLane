interface RoadmapTopic {
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
      "JavaScript, browser internals, React core, and CSS layout. The essential competence bar every frontend engineer needs before advancing to system design or DSA.",
    estimatedHours: 40,
    status: "active",
    topics: [
      {
        slug: "javascript",
        name: "JavaScript",
        description: "Closures, async, prototypes, event loop.",
        itemCount: 24,
      },
      {
        slug: "browser-internals",
        name: "Browser Internals",
        description: "Rendering pipeline, memory, V8.",
        itemCount: 16,
      },
      {
        slug: "react",
        name: "React Core",
        description: "Hooks, Fiber, reconciliation, hydration.",
        itemCount: 28,
      },
      {
        slug: "css",
        name: "CSS & Layout",
        description: "Flexbox, grid, specificity, animations.",
        itemCount: 18,
      },
      {
        slug: "typescript",
        name: "TypeScript",
        description: "Types, generics, utility types.",
        itemCount: 14,
      },
      {
        slug: "testing",
        name: "Testing",
        description: "Unit, integration, RTL, mocking.",
        itemCount: 12,
      },
    ],
  },
  {
    slug: "senior-frontend",
    name: "Senior Frontend",
    description:
      "Architecture, performance engineering, security, and system design. The bar for senior+ roles at top-tier product companies.",
    estimatedHours: 60,
    status: "active",
    topics: [
      {
        slug: "performance",
        name: "Performance",
        description: "Bundle optimisation, CWV, virtualization.",
        itemCount: 20,
      },
      {
        slug: "system-design",
        name: "System Design",
        description: "Scaling, micro-frontends, modular apps.",
        itemCount: 22,
      },
      {
        slug: "security",
        name: "Security",
        description: "XSS, CSRF, cookies, auth flows.",
        itemCount: 16,
      },
      {
        slug: "system-design",
        name: "System Design",
        description: "Design systems, monorepos, state strategy.",
        itemCount: 18,
      },
      {
        slug: "accessibility",
        name: "Accessibility",
        description: "WCAG, ARIA, keyboard navigation.",
        itemCount: 12,
      },
    ],
  },
  {
    slug: "dsa-for-frontend",
    name: "DSA & Algorithms",
    description:
      "Data structures and algorithms tailored for frontend engineers — arrays, trees, graphs, dynamic programming, and the patterns that show up most in FAANG-style coding rounds.",
    estimatedHours: 50,
    status: "active",
    topics: [
      {
        slug: "arrays-strings",
        name: "Arrays & Strings",
        description: "Two pointers, sliding window, prefix sums.",
        itemCount: 30,
      },
      {
        slug: "linked-lists",
        name: "Linked Lists",
        description: "Reversal, cycle detection, merge.",
        itemCount: 16,
      },
      {
        slug: "trees-graphs",
        name: "Trees & Graphs",
        description: "DFS, BFS, trie, topological sort.",
        itemCount: 28,
      },
      {
        slug: "dynamic-programming",
        name: "Dynamic Programming",
        description: "Memoisation, tabulation, classic patterns.",
        itemCount: 24,
      },
      {
        slug: "sorting-searching",
        name: "Sorting & Searching",
        description: "Binary search, quicksort, merge sort.",
        itemCount: 18,
      },
      {
        slug: "stacks-queues",
        name: "Stacks & Queues",
        description: "Monotonic stack, deque, priority queue.",
        itemCount: 14,
      },
      {
        slug: "recursion-backtracking",
        name: "Recursion & Backtracking",
        description: "Subsets, permutations, N-queens.",
        itemCount: 16,
      },
    ],
  },
];
