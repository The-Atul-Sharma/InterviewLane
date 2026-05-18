"use client";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface ActivityEvent {
  kind: "completed" | "bookmarked" | "viewed";
  slug: string;
  at: string; // ISO
}

export interface DashboardActivity {
  loading: boolean;
  /** [oldest-week .. current-week][weekday 0=Sun..6=Sat] count of completions */
  heatmap: number[][];
  completionsThisWeek: number;
  completionsPrevWeek: number;
  bookmarksThisWeek: number;
  recent: ActivityEvent[];
  totalSessions: number;
}

const WEEKS = 26;

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

function buildHeatmap(dates: string[]): { matrix: number[][]; total: number } {
  const today = new Date();
  const anchor = startOfWeek(today);
  const startWeek = new Date(anchor);
  startWeek.setDate(startWeek.getDate() - 7 * (WEEKS - 1));
  // matrix[weekday][weekCol]
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(WEEKS).fill(0));
  let total = 0;
  for (const iso of dates) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) continue;
    if (d < startWeek) continue;
    const diffDays = Math.floor((d.getTime() - startWeek.getTime()) / 86_400_000);
    const col = Math.floor(diffDays / 7);
    if (col < 0 || col >= WEEKS) continue;
    const row = d.getDay();
    matrix[row][col] += 1;
    total += 1;
  }
  return { matrix, total };
}

function countSince(dates: string[], sinceMs: number, untilMs: number): number {
  return dates.reduce((n, iso) => {
    const t = new Date(iso).getTime();
    return t >= sinceMs && t < untilMs ? n + 1 : n;
  }, 0);
}

export function useDashboardActivity(enabled: boolean = true): DashboardActivity {
  const [state, setState] = React.useState<DashboardActivity>({
    loading: true,
    heatmap: Array.from({ length: 7 }, () => Array(WEEKS).fill(0)),
    completionsThisWeek: 0,
    completionsPrevWeek: 0,
    bookmarksThisWeek: 0,
    recent: [],
    totalSessions: 0,
  });

  React.useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;
    (async () => {
      // AuthGate guarantees a signed-in user before this hook mounts, so we
      // skip the redundant sb.auth.getUser() round-trip. RLS will scope rows.
      const sb = createClient();
      const since = new Date();
      since.setDate(since.getDate() - 7 * WEEKS);
      const sinceIso = since.toISOString();

      const [completedRes, bookmarksRes, recentRes] = await Promise.all([
        sb
          .from("completed")
          .select("slug, completed_at")
          .gte("completed_at", sinceIso)
          .order("completed_at", { ascending: false }),
        sb
          .from("bookmarks")
          .select("slug, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        sb
          .from("recently_viewed")
          .select("slug, viewed_at")
          .order("viewed_at", { ascending: false })
          .limit(30),
      ]);

      const completedRows =
        (completedRes.data as { slug: string; completed_at: string }[] | null) ?? [];
      const bookmarkRows =
        (bookmarksRes.data as { slug: string; created_at: string }[] | null) ?? [];
      const viewedRows =
        (recentRes.data as { slug: string; viewed_at: string }[] | null) ?? [];

      const completedDates = completedRows.map((r) => r.completed_at);
      const { matrix, total } = buildHeatmap(completedDates);

      const now = Date.now();
      const weekStart = startOfWeek(new Date()).getTime();
      const prevStart = weekStart - 7 * 86_400_000;

      const completionsThisWeek = countSince(completedDates, weekStart, now + 1);
      const completionsPrevWeek = countSince(completedDates, prevStart, weekStart);
      const bookmarksThisWeek = countSince(
        bookmarkRows.map((b) => b.created_at),
        weekStart,
        now + 1,
      );

      const recent: ActivityEvent[] = [
        ...completedRows.slice(0, 15).map((r) => ({
          kind: "completed" as const,
          slug: r.slug,
          at: r.completed_at,
        })),
        ...bookmarkRows.slice(0, 15).map((r) => ({
          kind: "bookmarked" as const,
          slug: r.slug,
          at: r.created_at,
        })),
        ...viewedRows.slice(0, 15).map((r) => ({
          kind: "viewed" as const,
          slug: r.slug,
          at: r.viewed_at,
        })),
      ]
        .sort((a, b) => +new Date(b.at) - +new Date(a.at))
        .slice(0, 8);

      if (cancelled) return;
      setState({
        loading: false,
        heatmap: matrix,
        completionsThisWeek,
        completionsPrevWeek,
        bookmarksThisWeek,
        recent,
        totalSessions: total,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
