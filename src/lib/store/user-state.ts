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

export interface UserState {
  // Data
  bookmarks: Slug[];
  completed: Slug[];
  recentlyViewed: Slug[];
  streak: UserStreak;

  // Lifecycle
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  reset: () => void;

  // Mutations (optimistic)
  toggleBookmark: (slug: Slug) => Promise<void>;
  toggleCompleted: (slug: Slug) => Promise<void>;
  trackView: (slug: Slug) => Promise<void>;
  recordStudyDay: () => Promise<void>;
}

const EMPTY_STREAK: UserStreak = { lastDate: null, days: 0 };

export const useUserStore = create<UserState>((set, get) => ({
  bookmarks: [],
  completed: [],
  recentlyViewed: [],
  streak: EMPTY_STREAK,
  hydrated: false,
  loading: false,
  error: null,

  reset() {
    set({
      bookmarks: [],
      completed: [],
      recentlyViewed: [],
      streak: EMPTY_STREAK,
      hydrated: false,
      loading: false,
      error: null,
    });
  },

  async hydrate() {
    if (!isSupabaseConfigured()) {
      set({ hydrated: true });
      return;
    }
    set({ loading: true, error: null });
    const supabase = createClient();

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      set({ loading: false, hydrated: true });
      return;
    }

    const [b, c, r, p] = await Promise.all([
      supabase.from("bookmarks").select("slug, created_at").order("created_at", { ascending: false }),
      supabase.from("completed").select("slug, completed_at").order("completed_at", { ascending: false }),
      supabase.from("recently_viewed").select("slug, viewed_at").order("viewed_at", { ascending: false }),
      supabase.from("profiles").select("streak_days, streak_last_date").maybeSingle(),
    ]);

    // If `profiles` row is missing (auth trigger didn't fire), create it now
    // so streak math works. Don't let it fail the whole hydration.
    if (!p.error && !p.data) {
      await supabase
        .from("profiles")
        .upsert({ user_id: userRes.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    }

    // Hydrate every successful table independently — a single failing query
    // (e.g. RLS edge case) must NOT throw away the bookmarks/completed data.
    set({
      bookmarks: b.error ? [] : (b.data ?? []).map((x) => x.slug as string),
      completed: c.error ? [] : (c.data ?? []).map((x) => x.slug as string),
      recentlyViewed: r.error ? [] : (r.data ?? []).map((x) => x.slug as string),
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
