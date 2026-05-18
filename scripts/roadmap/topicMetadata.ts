import type { RoadmapTopic, StageSlug } from "../../src/lib/schema/roadmap";

/**
 * Each topic is authored by hand (the rich text) and paired with a routing
 * rule used by `build.ts` to bucket existing questions into it.
 *
 * Routing score for a question = keyword-hits × 10 + category-hit × 5,
 * with `priority` as the tiebreaker (higher = more specific).
 */
interface TopicRouting {
  categories: string[];
  include: string[];
  exclude?: string[];
  priority: number;
}

export interface AuthoredTopic extends Omit<RoadmapTopic, "position"> {
  routing: TopicRouting;
}

const lc = (s: string) => s.toLowerCase();

export function topicScore(
  topic: AuthoredTopic,
  q: { title: string; category: string },
): number {
  const t = lc(q.title);
  if (topic.routing.exclude?.some((k) => t.includes(lc(k)))) return -1;
  const kw = topic.routing.include.reduce(
    (n, k) => n + (t.includes(lc(k)) ? 1 : 0),
    0,
  );
  const cat = topic.routing.categories.includes(q.category) ? 1 : 0;
  if (kw === 0 && cat === 0) return 0;
  return kw * 10 + cat * 5;
}

// ---------------------------------------------------------------------------
// FOUNDATIONS
// ---------------------------------------------------------------------------

const javascriptCore: AuthoredTopic = {
  slug: "javascript-core",
  stageSlug: "foundations" as StageSlug,
  name: "JavaScript Core",
  description:
    "Closures, scope, hoisting, the `this` binding, prototypes, equality, and the language semantics every interviewer assumes you have memorized.",
  whyAsked:
    "Filters out candidates who can use a framework but cannot debug it. Closures and `this` show up in framework internals, library APIs, and almost every bug report you will ever see.",
  realWorld:
    "Every React hook leans on closures. Every event handler leans on `this` semantics. Every utility you write across a codebase is bounded by what the language actually guarantees.",
  commonPatterns: [
    "Explain closure-based encapsulation and the cost of holding references",
    "Trace `this` through arrow functions, methods, and event handlers",
    "Walk through hoisting, the TDZ, and var/let/const lifecycle",
    "Compare `==`, `===`, and the coercion table edge cases",
  ],
  commonMistakes: [
    "Confusing block scope with function scope under `var`",
    "Assuming arrow functions create a new `this` (they inherit it)",
    "Treating `typeof null` as anything other than `'object'`",
    "Mutating a captured variable inside a loop closure without realizing it",
  ],
  followUps: [
    "Walk through what a polyfill for `Function.prototype.bind` would look like",
    "How would currying change the function's `length` and `name`?",
    "When does the engine optimize away a closure, and when can't it?",
  ],
  difficulty: "easy",
  frequency: "very-high",
  masteryMinutes: 360,
  prereqTopicSlugs: [],
  routing: {
    categories: ["javascript"],
    include: [
      "closure",
      "hoisting",
      "scope",
      "this",
      "prototype",
      "var",
      "let",
      "const",
      "equality",
      "truthy",
      "falsy",
      "currying",
      "new operator",
      "spread",
      "rest",
      "weakmap",
      "weakset",
      "map versus",
      "ES5",
      "class component",
      "chainable",
      "polyfill",
      "shallow copy",
      "structural sharing",
      "frequency of",
      "nullish",
      "temporal dead",
    ],
    exclude: ["promise", "async", "await", "microtask", "event loop", "abort", "debounce", "throttle"],
    priority: 5,
  },
};

const browserRendering: AuthoredTopic = {
  slug: "browser-rendering",
  stageSlug: "foundations" as StageSlug,
  name: "Browser and Rendering",
  description:
    "How the browser turns HTML, CSS, and JS into pixels - the critical rendering path, layout vs paint vs composite, and where work blocks the main thread.",
  whyAsked:
    "Performance answers that don't ground in the rendering pipeline are guesses. Senior interviewers test whether you can explain *why* a fix works, not just *that* it does.",
  realWorld:
    "Debugging jank, slow LCP, or layout shifts always traces back to the pipeline. Knowing which stage a CSS property triggers is the difference between shipping a 60fps animation and a stuttery one.",
  commonPatterns: [
    "Walk through the Critical Rendering Path from HTML to pixels",
    "Distinguish reflow, repaint, and composite - and what triggers each",
    "Identify render-blocking resources and how to unblock them",
    "Explain how layout, paint, and composite map to DevTools' Performance panel",
  ],
  commonMistakes: [
    "Conflating reflow with repaint - only layout-affecting changes reflow",
    "Assuming `transform` and `opacity` always stay on the compositor (they can promote layers and bloat GPU memory)",
    "Forgetting that JS parsing blocks rendering unless `defer` or `async` is used",
    "Skipping the CSSOM step when explaining why CSS is render-blocking",
  ],
  followUps: [
    "Why does `display: none` skip layout entirely while `visibility: hidden` does not?",
    "How would you debug a Cumulative Layout Shift regression?",
    "What does the browser do differently for an off-screen `<iframe>`?",
  ],
  difficulty: "medium",
  frequency: "high",
  masteryMinutes: 240,
  prereqTopicSlugs: ["javascript-core"],
  routing: {
    categories: ["browser-internals", "css"],
    include: [
      "critical rendering",
      "reflow",
      "repaint",
      "composite",
      "render",
      "paint",
      "layout",
      "cssom",
      "css",
      "flex",
      "grid",
      "responsive",
      "specificity",
      "box model",
      "viewport",
      "media quer",
      "tailwind",
      "bem",
      "cross browser",
      "position",
      "pseudo",
      "rem",
      "em ",
      "image optim",
      "garbage collection",
      "memory limit",
      "memory leak",
    ],
    exclude: ["service worker", "pwa", "storage", "cookie", "event delegation", "event bubbling", "event capturing"],
    priority: 5,
  },
};

const dom: AuthoredTopic = {
  slug: "dom",
  stageSlug: "foundations" as StageSlug,
  name: "DOM",
  description:
    "The document model, event propagation, web storage, service workers, and the platform APIs that frameworks abstract but interviewers still ask about directly.",
  whyAsked:
    "Reveals whether you understand the platform underneath React. Every framework-specific quirk (synthetic events, hydration mismatches, PWA caching) traces back to a DOM concept.",
  realWorld:
    "Event delegation keeps long lists cheap. Service workers unlock offline. The wrong storage choice leaks auth tokens. These are decisions made weekly on real codebases.",
  commonPatterns: [
    "Explain capture, target, bubble - and why event delegation works",
    "Pick the right storage: cookie vs localStorage vs sessionStorage vs IndexedDB",
    "Describe the service worker lifecycle and what makes a PWA installable",
    "Trace what happens between a click and a network request",
  ],
  commonMistakes: [
    "Adding listeners in a loop instead of delegating to a parent",
    "Storing JWTs in localStorage (XSS-readable) instead of HttpOnly cookies",
    "Assuming service workers run on the main thread",
    "Forgetting `stopPropagation` does not stop default behavior",
  ],
  followUps: [
    "How would you sync state across multiple browser tabs of the same app?",
    "What changes when a service worker controls a page vs when it doesn't?",
    "How would you debug a memory leak rooted in a forgotten DOM reference?",
  ],
  difficulty: "easy",
  frequency: "high",
  masteryMinutes: 200,
  prereqTopicSlugs: ["javascript-core"],
  routing: {
    categories: ["browser-internals", "html"],
    include: [
      "dom",
      "event delegation",
      "event bubbling",
      "event capturing",
      "event propagation",
      "service worker",
      "pwa",
      "progressive web",
      "localstorage",
      "sessionstorage",
      "cookie",
      "indexeddb",
      "storage",
      "semantic html",
      "srcset",
      "tabs in sync",
      "tabs of the same app",
      "etag",
      "documentfragment",
    ],
    priority: 6,
  },
};

// ---------------------------------------------------------------------------
// INTERMEDIATE
// ---------------------------------------------------------------------------

const asyncJavascript: AuthoredTopic = {
  slug: "async-javascript",
  stageSlug: "intermediate" as StageSlug,
  name: "Async JavaScript",
  description:
    "Promises, async/await, the event loop, microtasks vs macrotasks, and the timing patterns - debounce, throttle, abort - that every real app uses.",
  whyAsked:
    "Async bugs are the most common production bugs. Interviewers want to know if you can reason about ordering, cancellation, and error propagation without hand-waving.",
  realWorld:
    "Every fetch, every animation frame, every queued task in your app routes through this model. Cancellation determines whether your search box leaks stale results into the UI.",
  commonPatterns: [
    "Trace execution order across sync, microtasks, and macrotasks",
    "Implement debounce and throttle from scratch",
    "Cancel a fetch with `AbortController` and the take-latest pattern",
    "Compose `Promise.all`, `allSettled`, `race`, and `any` correctly",
  ],
  commonMistakes: [
    "Confusing microtask and macrotask ordering - Promises drain before setTimeout",
    "`await`-ing inside a loop when `Promise.all` would parallelize",
    "Forgetting unhandled rejections still fire even after a `.catch` is attached later",
    "Treating async/await as a magic sync conversion instead of syntactic sugar over Promises",
  ],
  followUps: [
    "How would you implement `Promise.allSettled` from scratch?",
    "What happens to in-flight requests when a component unmounts mid-await?",
    "Compare debounce, throttle, and `requestAnimationFrame` for input handling",
  ],
  difficulty: "medium",
  frequency: "very-high",
  masteryMinutes: 300,
  prereqTopicSlugs: ["javascript-core"],
  routing: {
    categories: ["javascript"],
    include: [
      "promise",
      "async",
      "await",
      "microtask",
      "macrotask",
      "event loop",
      "execution context",
      "call stack",
      "debounce",
      "throttle",
      "abort",
      "generator",
      "fetch",
      "settimeout",
      "resolved promise",
    ],
    priority: 8,
  },
};

const reactBasics: AuthoredTopic = {
  slug: "react-basics",
  stageSlug: "intermediate" as StageSlug,
  name: "React Basics",
  description:
    "Components, JSX, hooks, props, keys, conditional rendering, forms, refs, and the everyday patterns that make up a working React app.",
  whyAsked:
    "Most frontend roles are React roles. If you can't explain `useEffect`'s mental model, the interviewer will assume you can't ship cleanly.",
  realWorld:
    "Every feature ticket lives here. Picking the right hook, keying lists correctly, and colocating state are the decisions that compound into a maintainable codebase.",
  commonPatterns: [
    "Pick the right hook: state vs ref vs reducer vs effect",
    "Use stable keys to keep list reconciliation O(n)",
    "Lift state up - or colocate down - based on who reads it",
    "Build controlled forms with validation and field-level errors",
  ],
  commonMistakes: [
    "Using array index as a key for a list that reorders",
    "Reaching for `useEffect` for derived state instead of computing during render",
    "Mutating state in place instead of creating a new reference",
    "Creating new object/array literals in JSX that thrash child memo",
  ],
  followUps: [
    "Why does React batch state updates inside event handlers but not always inside Promises?",
    "When would you build a custom hook vs inline the logic?",
    "How does Suspense interact with data fetching libraries you have used?",
  ],
  difficulty: "medium",
  frequency: "very-high",
  masteryMinutes: 480,
  prereqTopicSlugs: ["javascript-core", "async-javascript"],
  routing: {
    categories: ["react", "nextjs", "machine-coding"],
    include: [
      "hook",
      "usestate",
      "useeffect",
      "usereducer",
      "useref",
      "usecontext",
      "props",
      "jsx",
      "component",
      "key",
      "conditional rendering",
      "form",
      "controlled",
      "uncontrolled",
      "render prop",
      "lifecycle",
      "todo",
      "carousel",
      "accordion",
      "tabs",
      "modal",
      "stepper",
      "stopwatch",
      "rating",
      "weather widget",
      "drag and drop",
      "tic tac toe",
      "ssr",
      "next.js",
      "getstaticprops",
      "getserversideprops",
      "image component",
    ],
    exclude: [
      "memo",
      "usememo",
      "usecallback",
      "fiber",
      "reconciliation",
      "concurrent",
      "strictmode",
      "virtualized",
      "infinite scroll",
      "10000",
      "ten thousand",
      "redux",
      "zustand",
      "recoil",
      "mobx",
    ],
    priority: 4,
  },
};

const networking: AuthoredTopic = {
  slug: "networking",
  stageSlug: "intermediate" as StageSlug,
  name: "Networking",
  description:
    "HTTP, REST vs GraphQL, CORS, caching, cookies, WebSockets, SSE, and the lifecycle of a request from `fetch()` to the wire.",
  whyAsked:
    "Frontend bugs blamed on the backend are often network bugs. Interviewers want someone who can read a waterfall, debug a 401, and reason about cache headers.",
  realWorld:
    "Every API call you write inherits decisions about retries, cancellation, caching, and auth headers. Picking the wrong primitive (polling when SSE would work) shows up directly in cost and battery.",
  commonPatterns: [
    "Cancel stale requests with `AbortController` and the take-latest pattern",
    "Compare `Cache-Control`, `ETag`, and `stale-while-revalidate`",
    "Walk through a CORS preflight and what the browser actually sends",
    "Pick WebSocket, SSE, or long polling based on directionality and reconnection cost",
  ],
  commonMistakes: [
    "Ignoring CORS until it breaks in prod - credentialed requests have stricter rules",
    "Not setting `SameSite` on auth cookies",
    "Polling for data that an SSE stream could push for free",
    "Treating fetch as a drop-in for Axios without porting interceptors and retry logic",
  ],
  followUps: [
    "How would you implement `fetch` with timeout + retry + exponential backoff?",
    "Where would you put the AbortController in a Redux-Saga or React Query flow?",
    "What changes when you switch from HTTP/1.1 to HTTP/2 multiplexing?",
  ],
  difficulty: "medium",
  frequency: "high",
  masteryMinutes: 240,
  prereqTopicSlugs: ["async-javascript"],
  routing: {
    categories: ["networking"],
    include: [],
    priority: 7,
  },
};

const typescript: AuthoredTopic = {
  slug: "typescript",
  stageSlug: "intermediate" as StageSlug,
  name: "TypeScript",
  description:
    "Generics, narrowing, conditional types, utility types, and the discipline of typing a React app without `any`-escaping your way out.",
  whyAsked:
    "Most production codebases are TypeScript. Interviewers test whether you can model domain shapes correctly and whether you understand inference, not just syntax.",
  realWorld:
    "Strong types are a refactor multiplier. Library authors live and die by their generic constraints. Application engineers feel TS most in form schemas, API clients, and discriminated unions for UI state.",
  commonPatterns: [
    "Use discriminated unions to model `loading | success | error` UI state",
    "Pick between `interface` and `type` based on extension and declaration merging",
    "Build a generic helper with constraints and inferred return types",
    "Narrow with `in`, `typeof`, `instanceof`, and user-defined type guards",
  ],
  commonMistakes: [
    "Reaching for `any` instead of `unknown` and narrowing",
    "Using enums where a string union would be lighter and more inferable",
    "Forgetting that interface declaration merging affects library typings globally",
    "Over-engineering generics that don't make any call site safer",
  ],
  followUps: [
    "How would you type a `useFetch` hook that infers the response shape from the URL?",
    "What changes when you publish types for both ESM and CJS consumers?",
    "When does TS structural typing surprise you (e.g., excess property checks)?",
  ],
  difficulty: "medium",
  frequency: "high",
  masteryMinutes: 280,
  prereqTopicSlugs: ["javascript-core"],
  routing: {
    categories: ["typescript"],
    include: ["typescript", "generic", "utility type", "interface versus type"],
    priority: 9,
  },
};

const stateManagement: AuthoredTopic = {
  slug: "state-management",
  stageSlug: "intermediate" as StageSlug,
  name: "State Management",
  description:
    "Local state, lifted state, context, and external stores - Redux, Zustand, Recoil, MobX - with the tradeoffs that actually come up in code review.",
  whyAsked:
    "Picking the wrong state tool is one of the most expensive architectural mistakes a team makes. Interviewers test whether you can justify the choice, not just name the libraries.",
  realWorld:
    "Server state, URL state, form state, and global UI state each want different tools. Conflating them is the root cause of half the 'why is this re-rendering' bugs in a real codebase.",
  commonPatterns: [
    "Separate server state (React Query/RTK Query) from client state (Zustand/Redux)",
    "Lift state only as far as the lowest common ancestor needs",
    "Use context for low-frequency values (theme, auth) and a store for high-frequency",
    "Model derived state as a selector, not a mirrored copy",
  ],
  commonMistakes: [
    "Putting server response data in Redux when React Query would deduplicate it for free",
    "Subscribing to the whole store and re-rendering every consumer on any change",
    "Treating context as a state library - every consumer re-renders on any value change",
    "Building reducer logic for a value that one component owns",
  ],
  followUps: [
    "When would you pick Zustand over Redux Toolkit on a new project?",
    "How does MobX's observable model differ from Redux's immutable reducer model?",
    "Where does URL state fit alongside in-memory state?",
  ],
  difficulty: "medium",
  frequency: "high",
  masteryMinutes: 240,
  prereqTopicSlugs: ["react-basics"],
  routing: {
    categories: [],
    include: [
      "redux",
      "zustand",
      "recoil",
      "mobx",
      "state management",
      "pub sub",
      "selector dispatch",
      "global state",
      "context api",
      "rtk query",
    ],
    priority: 12,
  },
};

// ---------------------------------------------------------------------------
// ADVANCED
// ---------------------------------------------------------------------------

const reactInternals: AuthoredTopic = {
  slug: "react-internals",
  stageSlug: "advanced" as StageSlug,
  name: "React Internals",
  description:
    "Fiber, reconciliation, hydration, the synthetic event system, StrictMode, batching, concurrent rendering, and the runtime mental model.",
  whyAsked:
    "Senior interviews drill on internals because they predict whether you can debug subtle bugs (hydration mismatches, stale closures, missed batches) instead of cargo-culting fixes.",
  realWorld:
    "Concurrent features change when effects fire. Hydration mismatches break SSR in production. Knowing the runtime is the difference between guessing at React Profiler output and reading it.",
  commonPatterns: [
    "Explain Fiber's work loop and how reconciliation walks the tree",
    "Diagnose a hydration mismatch and propose the fix",
    "Trace why an effect double-fires under StrictMode in development",
    "Walk through how `useTransition` and `useDeferredValue` change rendering priority",
  ],
  commonMistakes: [
    "Assuming `setState` inside a Promise batches the same as inside an event handler (pre-React 18 it didn't)",
    "Misreading StrictMode's double-render as a real bug instead of a dev-mode mount/unmount/mount",
    "Reading state inside a stale closure and assuming React 'lost' the value",
    "Skipping the dependency array on `useEffect` and creating an infinite loop",
  ],
  followUps: [
    "How does the Fiber scheduler decide which work to yield?",
    "What invariant must hold for SSR markup to hydrate cleanly?",
    "How would you design an error boundary that recovers without remounting siblings?",
  ],
  difficulty: "hard",
  frequency: "high",
  masteryMinutes: 360,
  prereqTopicSlugs: ["react-basics"],
  routing: {
    categories: ["react"],
    include: [
      "fiber",
      "reconciliation",
      "hydration",
      "concurrent",
      "strictmode",
      "synthetic event",
      "batching",
      "error boundary",
      "suspense",
      "event handling",
      "ssr",
      "server side rendering",
      "server side render",
      "hydration mismatch",
      "improve performance compared to angular",
      "react.lazy",
      "ref forwarding",
      "imperative handle",
    ],
    priority: 6,
  },
};

const reactPerformance: AuthoredTopic = {
  slug: "react-performance",
  stageSlug: "advanced" as StageSlug,
  name: "React Performance",
  description:
    "When to memoize and when not to, virtualization, list rendering at scale, stable references, and the React Profiler workflow.",
  whyAsked:
    "Misapplied memo is the most common 'optimization' that hurts perf. Interviewers want to see you measure first, then fix with intent.",
  realWorld:
    "A 10k-row table, a slow type-ahead, a route transition that drops frames - these are weekly problems. Knowing the right tool (windowing, memo, key stability) avoids weeks of regressions.",
  commonPatterns: [
    "Virtualize long lists with `react-window` or a custom windower",
    "Stabilize callback identity with `useCallback` - only when the consumer is memoized",
    "Profile with the React Profiler to confirm a render is the bottleneck",
    "Split context to avoid full-tree re-renders on every change",
  ],
  commonMistakes: [
    "Wrapping every component in `React.memo` without measuring - adds overhead without payoff",
    "Memoizing with deps that change every render (new object/array literal)",
    "Virtualizing a list of 50 items where a key fix would have been enough",
    "Putting frequently-changing values in a context that many consumers subscribe to",
  ],
  followUps: [
    "How would you render 100k rows without freezing the browser?",
    "When does `useMemo` actually pay for itself, and when is it noise?",
    "How does React 18 automatic batching change perf tuning vs React 17?",
  ],
  difficulty: "hard",
  frequency: "high",
  masteryMinutes: 280,
  prereqTopicSlugs: ["react-basics", "react-internals"],
  routing: {
    categories: ["react"],
    include: [
      "memo",
      "usememo",
      "usecallback",
      "react.memo",
      "re render",
      "rerender",
      "virtualized",
      "virtualization",
      "ten thousand",
      "10000",
      "10k",
      "large list",
      "5000 records",
      "optimize rendering",
      "performance",
      "stale state",
      "functional state updates",
      "unnecessary re",
      "react profiler",
    ],
    priority: 8,
  },
};

const testing: AuthoredTopic = {
  slug: "testing",
  stageSlug: "advanced" as StageSlug,
  name: "Testing",
  description:
    "Unit, integration, and end-to-end testing strategy with Jest, React Testing Library, Cypress, and Playwright - and what to test vs what to mock.",
  whyAsked:
    "Tests reveal how a candidate thinks about contracts and regressions. The testing pyramid question separates engineers who write tests from those who write *useful* tests.",
  realWorld:
    "A flaky CI pipeline costs hours per week. Knowing where to draw the unit/integration/E2E line keeps the suite fast and trustworthy.",
  commonPatterns: [
    "Test behavior with RTL queries (`getByRole`) instead of implementation details",
    "Mock the network at the boundary with MSW, not at the fetch call",
    "Cover critical user flows in E2E, edge cases in unit",
    "Snapshot only stable, intentional output - never large trees",
  ],
  commonMistakes: [
    "Querying by `data-testid` when an accessible role would do",
    "Mocking React itself or RTL internals to make a test pass",
    "Writing E2E tests for logic that a unit test could cover in 10ms",
    "Snapshotting everything and treating diffs as 'just update the snapshot'",
  ],
  followUps: [
    "How would you test a component that depends on a context provider and a router?",
    "When would you prefer Cypress over Playwright (or vice versa)?",
    "How do you keep visual regression tests from flaking on font rendering?",
  ],
  difficulty: "medium",
  frequency: "medium",
  masteryMinutes: 200,
  prereqTopicSlugs: ["react-basics"],
  routing: {
    categories: ["testing"],
    include: ["test", "jest", "rtl", "react testing library", "cypress", "playwright"],
    priority: 9,
  },
};

const security: AuthoredTopic = {
  slug: "security",
  stageSlug: "advanced" as StageSlug,
  name: "Security",
  description:
    "XSS, CSRF, CSP, cookie flags, auth token handling, OAuth basics, and the OWASP slice that frontend engineers actually own.",
  whyAsked:
    "Security questions filter for engineers who think about threat models, not just features. Senior loops expect you to bring it up before the interviewer does.",
  realWorld:
    "A token in localStorage is one XSS away from full account takeover. A missing `SameSite` cookie is one CSRF away from a fraudulent transfer. These choices live in code, not in security review.",
  commonPatterns: [
    "Store auth tokens in HttpOnly, Secure, SameSite cookies - never localStorage",
    "Sanitize user input at render, not just at submit; trust no string from the network",
    "Use CSP with nonces to lock down inline scripts",
    "Defend against CSRF with same-site cookies + a CSRF token on state-changing requests",
  ],
  commonMistakes: [
    "Storing JWTs in localStorage 'because it's easier'",
    "Trusting `target=\"_blank\"` without `rel=\"noopener noreferrer\"`",
    "Relying on framework escaping alone for `dangerouslySetInnerHTML`",
    "Treating CORS as a security boundary (it's a browser policy, not server auth)",
  ],
  followUps: [
    "How would you design a token refresh flow that survives XSS exposure?",
    "What does a strict CSP break, and how do you stage the rollout?",
    "How would you prevent a malicious parent page from spoofing a postMessage from your widget?",
  ],
  difficulty: "medium",
  frequency: "high",
  masteryMinutes: 200,
  prereqTopicSlugs: ["dom", "networking"],
  routing: {
    categories: ["security"],
    include: [],
    priority: 9,
  },
};

const accessibility: AuthoredTopic = {
  slug: "accessibility",
  stageSlug: "advanced" as StageSlug,
  name: "Accessibility",
  description:
    "Semantic HTML, ARIA roles, keyboard navigation, focus management, screen reader behavior, and WCAG compliance at the component and app level.",
  whyAsked:
    "A11y is a quality signal. Senior interviewers expect you to default to semantic HTML and only reach for ARIA when the platform falls short.",
  realWorld:
    "Accessibility lawsuits and regulatory pressure have made WCAG a delivery requirement at most large companies. A non-accessible modal blocks shipping in many compliance regimes.",
  commonPatterns: [
    "Prefer semantic HTML (`<button>`, `<dialog>`) over ARIA-on-div",
    "Trap focus inside modals and restore on close",
    "Announce live regions for dynamic content (toasts, errors)",
    "Test with keyboard-only navigation and a screen reader, not just axe",
  ],
  commonMistakes: [
    "Using `<div onClick>` instead of `<button>` and losing keyboard + screen reader support",
    "ARIA-labeling a button that already has a visible label (duplicate announcement)",
    "Forgetting to update `aria-live` regions when async content arrives",
    "Relying on color alone to convey state",
  ],
  followUps: [
    "How would you make a custom dropdown accessible without going full ARIA combobox?",
    "What does an SR announce differently for `role=\"alert\"` vs `aria-live=\"polite\"`?",
    "How would you enforce a11y across a 200-engineer org without slowing teams down?",
  ],
  difficulty: "medium",
  frequency: "medium",
  masteryMinutes: 180,
  prereqTopicSlugs: ["dom"],
  routing: {
    categories: ["accessibility"],
    include: ["accessibility", "wcag", "aria", "screen reader", "alt attribute", "semantic html"],
    priority: 9,
  },
};

// ---------------------------------------------------------------------------
// SENIOR
// ---------------------------------------------------------------------------

const performanceOptimization: AuthoredTopic = {
  slug: "performance-optimization",
  stageSlug: "senior" as StageSlug,
  name: "Performance Optimization",
  description:
    "Core Web Vitals, bundle splitting, image strategy, caching layers, third-party scripts, and SSR/SSG/CSR tradeoffs measured end-to-end.",
  whyAsked:
    "Senior loops test whether you can move a real metric. Naming techniques is the floor; knowing which one applies to *this* app on *this* metric is the bar.",
  realWorld:
    "Every 100ms of LCP costs measurable conversion. Performance work is one of the highest-leverage things a senior frontend engineer does, and it's measurable on dashboards leadership watches.",
  commonPatterns: [
    "Move work off the critical path with `defer`, dynamic imports, and route splitting",
    "Prioritize hero images with `fetchpriority` and preload",
    "Cache at every layer: CDN, service worker, HTTP, in-memory",
    "Pick SSR/SSG/CSR per route based on freshness, personalization, and SEO",
  ],
  commonMistakes: [
    "Optimizing TTI without checking what's blocking it (often a third-party script)",
    "Lazy-loading above-the-fold content and tanking LCP",
    "Treating bundle size as the only perf metric (TBT and INP often matter more)",
    "Preloading more than the browser can use, starving real-priority requests",
  ],
  followUps: [
    "How would you cut LCP by 30% on a page you've never seen?",
    "What does INP catch that FID didn't?",
    "How would you measure a perf regression in production, not just synthetics?",
  ],
  difficulty: "hard",
  frequency: "very-high",
  masteryMinutes: 320,
  prereqTopicSlugs: ["browser-rendering", "networking", "react-performance"],
  routing: {
    categories: ["performance"],
    include: [
      "core web vital",
      "lcp",
      "tti",
      "tbt",
      "inp",
      "fid",
      "cls",
      "fcp",
      "cache",
      "image",
      "lazy load",
      "preload",
      "prefetch",
      "preconnect",
      "dns prefetch",
      "third party",
      "ssr",
      "ssg",
      "csr",
      "metrics",
      "page load",
      "first paint",
      "time to interactive",
    ],
    exclude: ["webpack", "tree shaking", "bundle size", "code splitting", "dynamic imports"],
    priority: 7,
  },
};

const buildTools: AuthoredTopic = {
  slug: "build-tools",
  stageSlug: "senior" as StageSlug,
  name: "Build Tools",
  description:
    "Webpack vs Vite vs Turbopack, tree shaking, code splitting, source maps, module formats, and the publishing story for shared packages.",
  whyAsked:
    "Senior engineers own the build. Slow CI, broken source maps, and accidental bundle bloat are owned by whoever understands the toolchain - usually the person who can explain it in interviews.",
  realWorld:
    "A 30-second slower build × every engineer × every push = real money. Shipping ESM/CJS dual exports correctly is the difference between a usable package and a support ticket queue.",
  commonPatterns: [
    "Split routes and big libraries with dynamic `import()`",
    "Use tree shaking + side-effect-free modules to drop unused exports",
    "Publish ESM + CJS + types for library consumers",
    "Generate stable source maps and ship only `.map` to error monitoring",
  ],
  commonMistakes: [
    "Importing a whole library (`lodash`) when a named export would tree-shake",
    "Marking a side-effectful module as side-effect-free and losing CSS imports",
    "Shipping unminified bundles to production behind a misconfigured `NODE_ENV`",
    "Writing a webpack config that works in dev but breaks long-term caching in prod",
  ],
  followUps: [
    "Why is Vite faster in dev than Webpack, and where does that advantage disappear?",
    "How would you debug a tree-shaking failure?",
    "What changes in the build when you support both Server and Client Components?",
  ],
  difficulty: "medium",
  frequency: "medium",
  masteryMinutes: 220,
  prereqTopicSlugs: ["javascript-core"],
  routing: {
    categories: [],
    include: [
      "webpack",
      "vite",
      "turbopack",
      "rollup",
      "esbuild",
      "tree shaking",
      "bundle size",
      "bundle",
      "code splitting",
      "dynamic imports",
      "code split",
      "module",
      "esm",
      "cjs",
      "npm package",
      "publish",
      "library",
      "script loading",
      "defer",
      "async",
      "modulepreload",
    ],
    exclude: ["promise", "await", "abortcontroller"],
    priority: 10,
  },
};

const frontendArchitecture: AuthoredTopic = {
  slug: "frontend-architecture",
  stageSlug: "senior" as StageSlug,
  name: "Frontend Architecture",
  description:
    "Monorepos, micro-frontends, design systems, SDK publishing, module boundaries, and the org-shaped decisions interviews increasingly drill into.",
  whyAsked:
    "Architecture answers test whether you can scope, version, and own a system. The interviewer is watching for tradeoff fluency, not for a memorized pattern.",
  realWorld:
    "Cross-team contracts, version skew, and dependency graphs are the dominant complexity at scale. Architecture choices determine whether a 50-engineer org ships weekly or quarterly.",
  commonPatterns: [
    "Pick monorepo vs polyrepo based on dependency velocity and release cadence",
    "Use module federation or build-time integration for micro-frontends, not iframes by default",
    "Version a design system with semver + changesets, ship migration codemods",
    "Expose an SDK with a stable, namespaced public API and internal-only escape hatches",
  ],
  commonMistakes: [
    "Reaching for micro-frontends to solve a team-coordination problem that monorepo + codeowners would fix cheaper",
    "Publishing a design system without documenting the deprecation policy",
    "Letting internal-only utilities leak into a public SDK surface",
    "Coupling apps through shared global state instead of contracts",
  ],
  followUps: [
    "When would you split a monorepo into multiple repos?",
    "How would you migrate a legacy app to a modern framework without a freeze?",
    "How do you handle cross-app routing in a micro-frontend setup?",
  ],
  difficulty: "hard",
  frequency: "medium",
  masteryMinutes: 320,
  prereqTopicSlugs: ["build-tools", "state-management"],
  routing: {
    categories: ["system-design"],
    include: [
      "monorepo",
      "micro frontend",
      "design system",
      "sdk",
      "npm package",
      "embeddable",
      "library",
      "scale",
      "multi team",
      "design tokens",
      "migrate",
      "legacy",
      "feature flag",
      "feature toggle",
      "solid principles",
      "share common functions",
      "release strategy",
      "semver",
      "changesets",
      "monitoring",
      "logging",
      "global namespace",
    ],
    exclude: ["calendar", "kanban", "whatsapp", "facebook", "google docs", "infinite scroll", "table", "social media", "maps", "real time collaborative", "dashboard", "checkout widget"],
    priority: 8,
  },
};

// ---------------------------------------------------------------------------
// STAFF
// ---------------------------------------------------------------------------

const frontendSystemDesign: AuthoredTopic = {
  slug: "frontend-system-design",
  stageSlug: "staff" as StageSlug,
  name: "Frontend System Design",
  description:
    "End-to-end design of large frontend systems - feeds, editors, dashboards, real-time collaboration - covering data model, state, rendering, networking, and rollout.",
  whyAsked:
    "Staff loops use system design as the highest-signal interview. They want to see scoping, tradeoffs, and how you handle ambiguity - not a memorized answer.",
  realWorld:
    "Every staff engineer eventually owns a system that crosses team and surface boundaries. The patterns you reach for here are the same ones you defend in real design reviews.",
  commonPatterns: [
    "Scope: clarify users, scale, freshness, and non-goals before drawing anything",
    "Data + state: separate server state, derived UI state, and persisted preferences",
    "Rendering strategy: virtualization, optimistic updates, suspense boundaries",
    "Rollout: feature flags, observability, kill-switch path, gradual ramp",
  ],
  commonMistakes: [
    "Jumping to a tech stack before defining the read/write/freshness model",
    "Ignoring offline, retries, and conflict resolution in collaborative designs",
    "Designing for the happy path without naming the failure modes (network, auth, partial)",
    "Missing observability - how would you even know if the rollout broke?",
  ],
  followUps: [
    "How would you design Google Docs–style collaborative editing?",
    "How would you scale a real-time dashboard to 100k concurrent viewers?",
    "How would you roll out a redesign to 10% of traffic with kill-switch and metrics?",
  ],
  difficulty: "hard",
  frequency: "very-high",
  masteryMinutes: 480,
  prereqTopicSlugs: ["frontend-architecture", "performance-optimization", "react-internals"],
  routing: {
    categories: ["system-design"],
    include: [
      "design ",
      "build a ",
      "kanban",
      "calendar",
      "google docs",
      "google maps",
      "whatsapp",
      "facebook",
      "social media feed",
      "infinite scroll",
      "table component",
      "real time collaborative",
      "dashboard",
      "maps",
      "checkout widget",
      "embeddable checkout",
      "10k",
      "millions of",
      "ai interface",
      "llm",
      "openai",
      "claude",
      "ai api",
      "ai powered",
      "language model",
    ],
    priority: 9,
  },
};

// ---------------------------------------------------------------------------

export const TOPICS: AuthoredTopic[] = [
  // foundations
  javascriptCore,
  browserRendering,
  dom,
  // intermediate
  asyncJavascript,
  reactBasics,
  networking,
  typescript,
  stateManagement,
  // advanced
  reactInternals,
  reactPerformance,
  testing,
  security,
  accessibility,
  // senior
  performanceOptimization,
  buildTools,
  frontendArchitecture,
  // staff
  frontendSystemDesign,
];

export const TOPIC_BY_SLUG: Record<string, AuthoredTopic> = Object.fromEntries(
  TOPICS.map((t) => [t.slug, t]),
);
