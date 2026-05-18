"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { CATEGORY_LIST } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_HIDDEN = new Set(["dsa-algorithms-75", "dsa-algorithms-169"]);

type Status = "all" | "answered" | "unanswered" | "deleted";

type Item = {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  deleted: boolean;
  answered: boolean;
  updatedAt: string;
};

type Response = {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const CATEGORY_OPTIONS = CATEGORY_LIST.filter((c) => !ADMIN_HIDDEN.has(c.slug));
const CATEGORY_NAME = Object.fromEntries(
  CATEGORY_LIST.map((c) => [c.slug, c.name] as const),
);

export function AdminAnswersList() {
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get("category") ?? "all";
  const status = ((params.get("status") as Status) ?? "all") as Status;
  const query = params.get("q") ?? "";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = 20;

  const [searchInput, setSearchInput] = React.useState(query);
  const [data, setData] = React.useState<Response | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSearchInput(query);
  }, [query]);

  React.useEffect(() => {
    let cancelled = false;
    const url = new URL("/api/admin/questions", window.location.origin);
    if (category !== "all") url.searchParams.set("category", category);
    if (status !== "all") url.searchParams.set("status", status);
    if (query) url.searchParams.set("q", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));

    setLoading(true);
    setError(null);
    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
        return (await res.json()) as Response;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, status, query, page]);

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "all") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in patch)) next.delete("page");
      router.replace(`/admin/answers${next.size ? `?${next.toString()}` : ""}`);
    },
    [params, router],
  );

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: searchInput.trim() || null });
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={category} onValueChange={(v) => update({ category: v })}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unanswered">Unanswered</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={onSubmitSearch} className="ml-auto flex-1 min-w-[220px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title…"
              className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm outline-none focus:border-foreground"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading
            ? "Loading…"
            : data
              ? `${data.total} question${data.total === 1 ? "" : "s"}`
              : ""}
        </span>
        {data && data.total > 0 && (
          <span>
            Page {data.page} of {totalPages}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border bg-card">
        {data && data.items.length === 0 && !loading && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No questions match these filters.
          </div>
        )}
        <ul className="divide-y divide-border">
          {data?.items.map((q) => (
            <li key={q.slug}>
              <Link
                href={`/questions/${q.slug}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
              >
                {q.deleted ? (
                  <Trash2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                ) : q.answered ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{q.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {CATEGORY_NAME[q.category] ?? q.category} · {q.difficulty}
                  </p>
                </div>
                {q.deleted ? (
                  <Badge variant="danger">Deleted</Badge>
                ) : (
                  <Badge variant={q.answered ? "success" : "warning"}>
                    {q.answered ? "Answered" : "Pending"}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => update({ page: String(page - 1) })}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
