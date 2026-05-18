"use client";
import * as React from "react";
import Link from "next/link";
import { Bookmark, Loader2, Search, X } from "lucide-react";
import { useUserStore } from "@/lib/store/userState";
import type { QuestionMeta } from "@/lib/schema/question";
import { QuestionCard } from "@/components/questionCard";
import { GrindCard } from "@/components/dsaGrindList";
import {
  DSA_SLUG_PREFIX,
  leetcodeSlugKey,
  type GrindQuestion,
} from "@/lib/dsaTypes";
import { CATEGORY_META } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/authGate";
import { cn } from "@/lib/utils";

const DSA_GROUP_KEY = "__dsa__";
const DSA_GROUP_LABEL = "DSA & Algorithms";

export function BookmarksClient({
  pool,
  dsaPool,
}: {
  pool: QuestionMeta[];
  dsaPool: GrindQuestion[];
}) {
  return (
    <AuthGate
      title="Sign in to view bookmarks"
      description="Bookmarks sync across all your devices once you sign in with Google."
    >
      <BookmarksList pool={pool} dsaPool={dsaPool} />
    </AuthGate>
  );
}

function BookmarksList({
  pool,
  dsaPool,
}: {
  pool: QuestionMeta[];
  dsaPool: GrindQuestion[];
}) {
  const bookmarks = useUserStore((s) => s.bookmarks);
  const hydrated = useUserStore((s) => s.hydrated);
  const loading = useUserStore((s) => s.loading);
  const [query, setQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null);

  if (!hydrated || loading) {
    return (
      <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading bookmarks…
      </Card>
    );
  }

  const internalMap = new Map(pool.map((q) => [q.slug, q]));
  const dsaMap = new Map(dsaPool.map((q) => [leetcodeSlugKey(q.slug), q]));

  const internalItems = bookmarks
    .filter((s) => !s.startsWith(DSA_SLUG_PREFIX))
    .map((s) => internalMap.get(s))
    .filter((q): q is QuestionMeta => !!q);

  const dsaItems = bookmarks
    .filter((s) => s.startsWith(DSA_SLUG_PREFIX))
    .map((s) => dsaMap.get(s))
    .filter((q): q is GrindQuestion => !!q);

  if (internalItems.length === 0 && dsaItems.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <Bookmark className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">No bookmarks yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Open a question and tap{" "}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Bookmark</span> to
          save it here.
        </p>
        <Link
          href="/categories"
          className="mt-2 text-sm font-medium underline underline-offset-4"
        >
          Browse categories
        </Link>
      </Card>
    );
  }

  // Group internal items by category, DSA into its own bucket.
  const groups = new Map<string, QuestionMeta[]>();
  for (const q of internalItems) {
    const list = groups.get(q.category) ?? [];
    list.push(q);
    groups.set(q.category, list);
  }

  // Apply text filter across title + category.
  const needle = query.trim().toLowerCase();
  const matchInternal = (q: QuestionMeta) =>
    !needle ||
    q.title.toLowerCase().includes(needle) ||
    q.category.toLowerCase().includes(needle) ||
    (CATEGORY_META[q.category]?.name ?? "").toLowerCase().includes(needle);
  const matchDsa = (q: GrindQuestion) =>
    !needle || q.title.toLowerCase().includes(needle);

  const filteredGroups: Array<{ key: string; label: string; items: QuestionMeta[] }> = [];
  for (const [key, items] of groups) {
    if (activeGroup && activeGroup !== key) continue;
    const filtered = items.filter(matchInternal);
    if (filtered.length > 0) {
      filteredGroups.push({
        key,
        label: CATEGORY_META[key]?.name ?? key,
        items: filtered,
      });
    }
  }
  filteredGroups.sort((a, b) => a.label.localeCompare(b.label));

  const filteredDsa =
    (!activeGroup || activeGroup === DSA_GROUP_KEY) ? dsaItems.filter(matchDsa) : [];

  const totalShown =
    filteredGroups.reduce((n, g) => n + g.items.length, 0) + filteredDsa.length;
  const totalAll = internalItems.length + dsaItems.length;

  const chips: Array<{ key: string; label: string; count: number }> = [
    ...Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: CATEGORY_META[key]?.name ?? key,
      count: items.length,
    })),
  ];
  if (dsaItems.length > 0) {
    chips.push({ key: DSA_GROUP_KEY, label: DSA_GROUP_LABEL, count: dsaItems.length });
  }
  chips.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter bookmarks…"
            aria-label="Filter bookmarks"
            className="w-full rounded-md border bg-background pl-10 pr-10 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {totalShown} of {totalAll} {totalAll === 1 ? "bookmark" : "bookmarks"}
        </span>
      </div>

      {chips.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <GroupChip active={!activeGroup} onClick={() => setActiveGroup(null)}>
            All <span className="ml-1 opacity-60">{totalAll}</span>
          </GroupChip>
          {chips.map((c) => (
            <GroupChip
              key={c.key}
              active={activeGroup === c.key}
              onClick={() => setActiveGroup(activeGroup === c.key ? null : c.key)}
            >
              {c.label} <span className="ml-1 opacity-60">{c.count}</span>
            </GroupChip>
          ))}
        </div>
      )}

      {totalShown === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No bookmarks match your filter.
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((g) => (
            <section key={g.key} className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {g.label}{" "}
                <span className="ml-1 font-mono text-[11px] normal-case opacity-70">
                  {g.items.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((q) => (
                  <QuestionCard key={q.slug} q={q} />
                ))}
              </div>
            </section>
          ))}

          {filteredDsa.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {DSA_GROUP_LABEL}{" "}
                <span className="ml-1 font-mono text-[11px] normal-case opacity-70">
                  {filteredDsa.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDsa.map((q) => (
                  <GrindCard key={q.id} q={q} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function GroupChip({
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
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={cn("h-7 text-xs", active && "border-transparent")}
    >
      {children}
    </Button>
  );
}
