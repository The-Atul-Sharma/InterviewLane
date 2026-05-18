"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CATEGORY_LIST } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  short: string;
}

const SORTS = ["recommended", "easiest", "hardest", "title-az"] as const;
type SortKey = (typeof SORTS)[number];

const DIFF_RANK = { easy: 0, medium: 1, hard: 2 } as const;

export function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [items, setItems] = React.useState<Item[]>([]);
  const [q, setQ] = React.useState(() => params.get("q") ?? "");
  const [cat, setCat] = React.useState<string | null>(() => params.get("cat") || null);
  const [diff, setDiff] = React.useState<string | null>(() => params.get("diff") || null);
  const [sort, setSort] = React.useState<SortKey>(() => {
    const s = params.get("sort");
    return (SORTS as readonly string[]).includes(s ?? "") ? (s as SortKey) : "recommended";
  });
  const [loaded, setLoaded] = React.useState(false);
  const [focusIdx, setFocusIdx] = React.useState(-1);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  React.useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: Item[]) => {
        setItems(data);
        setLoaded(true);
      });
  }, []);

  // Sync state -> URL (replace, no history spam).
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (cat) next.set("cat", cat);
    if (diff) next.set("diff", diff);
    if (sort !== "recommended") next.set("sort", sort);
    const str = next.toString();
    const url = str ? `/search?${str}` : "/search";
    router.replace(url, { scroll: false });
  }, [q, cat, diff, sort, router]);

  const fuse = React.useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "short", weight: 0.25 },
          { name: "category", weight: 0.15 },
        ],
        threshold: 0.36,
        ignoreLocation: true,
      }),
    [items],
  );

  const filtered = React.useMemo(() => {
    let arr = q.trim() ? fuse.search(q.trim()).map((r) => r.item) : items;
    if (cat) arr = arr.filter((x) => x.category === cat);
    if (diff) arr = arr.filter((x) => x.difficulty === diff);
    if (sort === "easiest") arr = [...arr].sort((a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty]);
    if (sort === "hardest") arr = [...arr].sort((a, b) => DIFF_RANK[b.difficulty] - DIFF_RANK[a.difficulty]);
    if (sort === "title-az") arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
    return arr;
  }, [items, fuse, q, cat, diff, sort]);

  // Reset focus when the result set changes.
  React.useEffect(() => {
    setFocusIdx(filtered.length > 0 ? 0 : -1);
  }, [filtered]);

  // Scroll the focused row into view.
  React.useEffect(() => {
    if (focusIdx < 0 || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-row-idx="${focusIdx}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [focusIdx]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => (i <= 0 ? filtered.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      const target = filtered[focusIdx >= 0 ? focusIdx : 0];
      if (target) router.push(`/questions/${target.slug}`);
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusIdx(filtered.length - 1);
    }
  };

  return (
    <div className="space-y-6" onKeyDown={onKeyDown}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, description…"
          aria-label="Search questions"
          aria-controls="search-results"
          aria-activedescendant={focusIdx >= 0 ? `search-row-${focusIdx}` : undefined}
          className="w-full rounded-md border bg-background pl-10 pr-10 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill active={!cat} onClick={() => setCat(null)}>
          All categories
        </FilterPill>
        {CATEGORY_LIST.map((c) => (
          <FilterPill key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
            {c.name}
          </FilterPill>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <FilterPill key={d} active={diff === d} onClick={() => setDiff(diff === d ? null : d)}>
              <span className="capitalize">{d}</span>
            </FilterPill>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground hidden sm:inline">
            Tip: ↑ ↓ to navigate, ↵ to open
          </span>
          <span className="text-muted-foreground">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!loaded ? (
        <Card className="p-6 text-sm text-muted-foreground">Loading index…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No matches.</Card>
      ) : (
        <ul
          id="search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="divide-y rounded-lg border bg-card"
        >
          {filtered.map((x, i) => (
            <li
              key={x.slug}
              id={`search-row-${i}`}
              data-row-idx={i}
              role="option"
              aria-selected={i === focusIdx}
              onMouseEnter={() => setFocusIdx(i)}
              className={cn(
                "p-4 transition-colors",
                i === focusIdx && "bg-accent/60",
              )}
            >
              <Link href={`/questions/${x.slug}`} className="block hover:underline">
                <div className="font-medium">{x.title}</div>
              </Link>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{x.short}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="muted" className="capitalize">
                  {x.category}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {x.difficulty}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("h-7 text-xs", active && "border-transparent")}
    >
      {children}
    </Button>
  );
}
