"use client";
/**
 * User-state store, Supabase-backed.
 *
 * Same hook surface as the previous localStorage version so existing
 * components don't change. Each mutation is **optimistic** — store updates
 * first, then writes to Supabase in the background. On failure the local
 * state is reverted.
 *
 * Hydration:
 *   - `AuthProvider` calls `hydrate()` on SIGNED_IN.
 *   - `hydrate()` runs three parallel selects + a profile read.
 *   - Anonymous users get an empty store (no localStorage fallback per spec).
 */
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Slug = string;

export interface UserStreak {
  lastDate: string | null;
  days: number;
}

export interface PlanDayKey {
  planSlug: string;
  dayNum: number;
}

export interface UserState {
  // Data
  bookmarks: Slug[];
  completed: Slug[];
  recentlyViewed: Slug[];
  streak: UserStreak;
  topicProgress: string[]; // topic slugs marked complete
  planProgress: PlanDayKey[]; // (plan, day) pairs marked complete

  // Lifecycle
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  reset: () => void;

  // Mutations (optimistic)
  toggleBookmark: (slug: Slug) => Promise<void>;
  toggleCompleted: (slug: Slug) => Promise<void>;
  toggleTopicProgress: (topicSlug: string) => Promise<void>;
  togglePlanDay: (planSlug: string, dayNum: number) => Promise<void>;
  trackView: (slug: Slug) => Promise<void>;
  recordStudyDay: () => Promise<void>;
}

const EMPTY_STREAK: UserStreak = { lastDate: null, days: 0 };

export const useUserStore = create<UserState>((set, get) => ({
  bookmarks: [],
  completed: [],
  recentlyViewed: [],
  streak: EMPTY_STREAK,
  topicProgress: [],
  planProgress: [],
  hydrated: false,
  loading: false,
  error: null,

  reset() {
    set({
      bookmarks: [],
      completed: [],
      recentlyViewed: [],
      streak: EMPTY_STREAK,
      topicProgress: [],
      planProgress: [],
      hydrated: false,
      loading: false,
      error: null,
    });
  },

  async hydrate() {
    // Idempotent: if already hydrated or in-flight, no-op.
    // Callers (multiple consumer hooks across the tree) can fire freely.
    if (get().hydrated || get().loading) return;
    if (!isSupabaseConfigured()) {
      set({ hydrated: true });
      return;
    }
    set({ loading: true, error: null });
    const supabase = createClient();

    // We rely on RLS — no need to round-trip `auth.getUser()` here. If the
    // session is absent, each select returns 0 rows and we still mark
    // hydrated. This also drops `record_study_day` from the hydrate path:
    // the streak self-heal lives in `toggleCompleted` where it's actually
    // earned, so we no longer ping it on every page load.
    const [b, c, r, p, tp, pp] = await Promise.all([
      supabase.from("bookmarks").select("slug, created_at").order("created_at", { ascending: false }),
      supabase.from("completed").select("slug, completed_at").order("completed_at", { ascending: false }),
      supabase.from("recently_viewed").select("slug, viewed_at").order("viewed_at", { ascending: false }),
      supabase.from("profiles").select("streak_days, streak_last_date").maybeSingle(),
      supabase.from("user_topic_progress").select("topic_slug").order("completed_at", { ascending: false }),
      supabase.from("user_plan_progress").select("plan_slug, day_num").order("completed_at", { ascending: false }),
    ]);

    // Hydrate every successful table independently — a single failing query
    // (e.g. RLS edge case) must NOT throw away the bookmarks/completed data.
    set({
      bookmarks: b.error ? [] : (b.data ?? []).map((x) => x.slug as string),
      completed: c.error ? [] : (c.data ?? []).map((x) => x.slug as string),
      recentlyViewed: r.error ? [] : (r.data ?? []).map((x) => x.slug as string),
      topicProgress: tp.error ? [] : (tp.data ?? []).map((x) => x.topic_slug as string),
      planProgress: pp.error
        ? []
        : (pp.data ?? []).map((x) => ({
            planSlug: x.plan_slug as string,
            dayNum: x.day_num as number,
          })),
      streak: {
        lastDate: (p.data?.streak_last_date as string | null) ?? null,
        days: (p.data?.streak_days as number | null) ?? 0,
      },
      loading: false,
      hydrated: true,
      error: b.error?.message ?? c.error?.message ?? r.error?.message ?? null,
    });
  },

  async toggleBookmark(slug) {
    if (!isSupabaseConfigured()) return;
    const prev = get().bookmarks;
    const has = prev.includes(slug);
    set({ bookmarks: has ? prev.filter((x) => x !== slug) : [slug, ...prev] });

    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      set({ bookmarks: prev });
      return;
    }
    const { error } = has
      ? await supabase.from("bookmarks").delete().eq("user_id", uid).eq("slug", slug)
      : await supabase
          .from("bookmarks")
          .upsert({ user_id: uid, slug }, { onConflict: "user_id,slug", ignoreDuplicates: true });
    if (error) set({ bookmarks: prev, error: error.message });
  },

  async toggleCompleted(slug) {
    if (!isSupabaseConfigured()) return;
    const prev = get().completed;
    const has = prev.includes(slug);
    
    // Optimistic streak update
    let optimisticStreak: UserStreak | undefined;
    const prevStreak = get().streak;

    if (!has) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (prevStreak.lastDate !== todayStr) {
        let newDays = 1;
        if (prevStreak.lastDate) {
          const lastDate = new Date(prevStreak.lastDate);
          const today = new Date(todayStr);
          const diffTime = Math.abs(today.getTime() - lastDate.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newDays = prevStreak.days + 1;
          }
        }
        optimisticStreak = { days: newDays, lastDate: todayStr };
      }
    }

    set({ 
      completed: has ? prev.filter((x) => x !== slug) : [slug, ...prev],
      ...(optimisticStreak && { streak: optimisticStreak }),
    });

    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      set({ completed: prev, streak: prevStreak });
      return;
    }
    const { error } = has
      ? await supabase.from("completed").delete().eq("user_id", uid).eq("slug", slug)
      : await supabase
          .from("completed")
          .upsert({ user_id: uid, slug }, { onConflict: "user_id,slug", ignoreDuplicates: true });
    if (error) {
      set({ completed: prev, streak: prevStreak, error: error.message });
      return;
    }
    if (!has) {
      get().recordStudyDay().catch(() => {});
    }
  },

  async toggleTopicProgress(topicSlug) {
    if (!isSupabaseConfigured()) return;
    const prev = get().topicProgress;
    const has = prev.includes(topicSlug);
    set({ topicProgress: has ? prev.filter((x) => x !== topicSlug) : [topicSlug, ...prev] });

    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      set({ topicProgress: prev });
      return;
    }
    const { error } = has
      ? await supabase
          .from("user_topic_progress")
          .delete()
          .eq("user_id", uid)
          .eq("topic_slug", topicSlug)
      : await supabase
          .from("user_topic_progress")
          .upsert(
            { user_id: uid, topic_slug: topicSlug, status: "completed" },
            { onConflict: "user_id,topic_slug", ignoreDuplicates: false },
          );
    if (error) set({ topicProgress: prev, error: error.message });
  },

  async togglePlanDay(planSlug, dayNum) {
    if (!isSupabaseConfigured()) return;
    const prev = get().planProgress;
    const has = prev.some((p) => p.planSlug === planSlug && p.dayNum === dayNum);
    set({
      planProgress: has
        ? prev.filter((p) => !(p.planSlug === planSlug && p.dayNum === dayNum))
        : [{ planSlug, dayNum }, ...prev],
    });

    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      set({ planProgress: prev });
      return;
    }
    const { error } = has
      ? await supabase
          .from("user_plan_progress")
          .delete()
          .eq("user_id", uid)
          .eq("plan_slug", planSlug)
          .eq("day_num", dayNum)
      : await supabase
          .from("user_plan_progress")
          .upsert(
            { user_id: uid, plan_slug: planSlug, day_num: dayNum },
            { onConflict: "user_id,plan_slug,day_num", ignoreDuplicates: false },
          );
    if (error) set({ planProgress: prev, error: error.message });
  },

  async trackView(slug) {
    if (!isSupabaseConfigured()) return;
    const prev = get().recentlyViewed;
    set({ recentlyViewed: [slug, ...prev.filter((x) => x !== slug)].slice(0, 24) });

    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return; // anonymous — no remote write
    await supabase.rpc("track_view", { p_slug: slug });
  },

  async recordStudyDay() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) return;

    const { data, error } = await supabase.rpc("record_study_day");
    if (error) {
      // Don't revert the optimistic update if the server call fails (e.g. missing RPC)
      return;
    }

    if (data) {
      const row = Array.isArray(data) ? data[0] : (data as Record<string, unknown>);
      if (row && typeof row === "object") {
        const days = Number((row as any).streak_days);
        const lastDate = (row as any).streak_last_date;
        if (!isNaN(days)) {
          set({ streak: { days, lastDate: lastDate ?? null } });
          return;
        }
      }
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("streak_days, streak_last_date")
      .eq("user_id", uid)
      .single();
      
    if (prof) {
      const dbDays = Number(prof.streak_days);
      // Only fallback to DB state if it's > 0, to prevent resetting the optimistic update
      // just because the DB profile hasn't been updated properly by a broken RPC.
      if (!isNaN(dbDays) && dbDays > 0) {
        set({
          streak: {
            days: dbDays,
            lastDate: (prof.streak_last_date as string | null) ?? null,
          },
        });
      }
    }
  },
}));

// Backwards-compat alias used by older components.
export const useUserState = useUserStore;

/**
 * SSR-safe selector — returns `fallback` until the store has hydrated from
 * Supabase. Prevents flash of "wrong" state on first paint.
 */
export function useHydratedUserState<T>(selector: (s: UserState) => T, fallback: T): T {
  const value = useUserStore(selector);
  const hydrated = useUserStore((s) => s.hydrated);
  return hydrated ? value : fallback;
}
