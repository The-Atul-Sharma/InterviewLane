import type { Question } from "../src/lib/schema/question";

const q: Omit<Question, "createdAt" | "updatedAt"> = {
  id: "usestate-vs-usereducer",
  slug: "usestate-vs-usereducer",
  title: "useState vs useReducer",
  category: "react",
  subcategory: "Hooks",
  tags: ["usestate", "usereducer", "state", "react", "hooks"],
  difficulty: "easy",
  frequency: "high",
  seniority: "mid",
  shortDescription:
    "`useState` for a few independent values. `useReducer` when state is a complex object with multiple related fields, when next-state depends on multiple current values, or when state transitions form a state machine (idle → loading → success/error). Reducers also pair well with TypeScript's discriminated unions for exhaustive action handling and are easier to test in isolation.",
  answer: `Same primitive (React's underlying state slot), different ergonomics.

# useState

\`\`\`tsx
const [count, setCount] = useState(0);
const [name, setName] = useState("");
const [open, setOpen] = useState(false);
\`\`\`

One slot per variable. Best when:

- Values are independent (changing one doesn't imply changing another).
- Update logic is trivial.
- No state machine semantics.

# useReducer

\`\`\`tsx
type State = { status: "idle" | "loading" | "success" | "error"; data?: Data; error?: string };
type Action =
  | { type: "fetch" }
  | { type: "success"; data: Data }
  | { type: "error"; error: string }
  | { type: "reset" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "fetch": return { status: "loading" };
    case "success": return { status: "success", data: a.data };
    case "error": return { status: "error", error: a.error };
    case "reset": return { status: "idle" };
  }
}

const [state, dispatch] = useReducer(reducer, { status: "idle" });
\`\`\`

Best when:

- State is a related set of fields.
- Many transitions touch multiple fields atomically.
- Logic is easier to read as a switch.
- You want to test the transitions without mounting React.

# The switch points

**Switch to useReducer when…**

- You have **3+ useStates that update together**. Multiple setStates across fields → one dispatch.
- State forms a **state machine**: idle/loading/success/error, draft/saved/syncing.
- Next state depends on **multiple current values** plus the action. Cleaner with a reducer.
- You want **typed exhaustive transitions** (discriminated union + switch with \`assertNever\`).
- The transitions need **derived/computed fields** that you want centralized.

**Stay with useState when…**

- Values are clearly independent.
- Transitions are one-liners.
- The component is small.

# State machine pattern

The reducer-as-state-machine pattern is the high-value usage:

\`\`\`tsx
type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: Data }
  | { kind: "error"; error: Error };
\`\`\`

Each transition produces a **valid** state. You can't be in "success" without data. The TS narrowing means \`state.data\` only exists in the success branch — impossible states become unrepresentable.

# Testing

\`\`\`ts
test("loading → success", () => {
  expect(reducer({ kind: "idle" }, { type: "fetch" })).toEqual({ kind: "loading" });
  expect(reducer({ kind: "loading" }, { type: "success", data: D }))
    .toEqual({ kind: "success", data: D });
});
\`\`\`

Pure function, no React. Easier to unit-test than scattered \`setState\`s.

# When neither is the right answer

- **State that belongs in a server cache** — use TanStack Query.
- **Cross-component state** — use context, Zustand, or Redux Toolkit.
- **Form state** — use react-hook-form.
- **Routing state** — keep in URL params, not local state.

# A common misuse: too much in one reducer

A 200-line reducer that handles every aspect of a page is a god-component. Split by domain: one reducer per concern (data, UI, selection) or extract sub-components with their own state.

# useState's lazy initializer

\`\`\`tsx
const [state, setState] = useState(() => expensiveInit());
\`\`\`

The function runs once. Use for parsing localStorage, computing initial state. Same trick for useReducer:

\`\`\`tsx
useReducer(reducer, initialArg, init);
\`\`\`

\`init(initialArg)\` runs once.

# Senior framing

The interviewer wants:

1. **State-machine framing** for when reducers shine.
2. **Discriminated-union types** to make invalid states impossible.
3. **Testing benefits** of a pure reducer.
4. **Awareness that neither is right** for server cache, form, or global state.

The "useReducer is for complex state" answer is shallow. The state-machine + impossible-states framing is senior.`,
  codeSnippets: [],
  followUps: [
    "Why are discriminated unions a natural fit for reducers?",
    "How does useReducer compare to a state-machine library like XState?",
    "When should you split one big reducer into several?",
    "What's the lazy initializer for?",
  ],
  commonMistakes: [
    "useState for multi-field state that always changes together.",
    "Forgetting to handle every action in the switch (no exhaustive check).",
    "Putting server cache in useReducer instead of using a data lib.",
    "Mutating state inside the reducer.",
  ],
  performanceConsiderations: [
    "useReducer slightly favors React's bailout when the reducer returns the same state reference.",
    "Big reducers can be moved out of components for clarity, no perf cost.",
  ],
  edgeCases: [
    "Strict mode runs reducers twice in dev — they must be pure.",
    "Actions that contain DOM references / functions cause issues with time-travel debugging.",
    "Reducers throwing inside transitions surface as render errors.",
  ],
  realWorldExamples: [
    "Async data fetching states, multi-step wizards, drag-and-drop state, complex toggles.",
  ],
  companyTags: [],
  relatedSlugs: ["how-do-you-manage-state-in-react-using-usestate-and-usereducer"],
  estimatedReadingMinutes: 6,
  estimatedSolvingMinutes: 12,
  sourceFile: "12.txt",
};

export default q;
