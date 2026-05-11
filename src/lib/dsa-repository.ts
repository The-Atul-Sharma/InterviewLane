/**
 * Fetch the Grind 169 / Grind 75 list from Supabase (`public.dsa_questions`).
 *
 * Single source of truth. If the table is unreachable or empty, the
 * category page renders an empty state — there is no static fallback.
 */
import "server-only";
import { cache } from "react";
import { createPublicReadClient } from "./supabase/public-read";
import type { GrindQuestion } from "./dsa-types";

interface Row {
  slug: string;
  leetcode_id: number;
  title: string;
  url: string;
  difficulty: GrindQuestion["difficulty"];
  topic: string;
  duration: number;
  in_grind75: boolean;
  position: number;
}

function fromRow(r: Row): GrindQuestion {
  return {
    id: r.leetcode_id,
    slug: r.slug,
    title: r.title,
    url: r.url,
    difficulty: r.difficulty,
    topic: r.topic,
    duration: r.duration,
    inGrind75: r.in_grind75,
  };
}

export const listDsaQuestions = cache(async (): Promise<GrindQuestion[]> => {
  try {
    const supabase = createPublicReadClient();
    const { data, error } = await supabase
      .from("dsa_questions")
      .select("slug,leetcode_id,title,url,difficulty,topic,duration,in_grind75,position")
      .order("position", { ascending: true });

    if (error) {
      console.warn(`[dsa] supabase read failed: ${error.message}`);
      return [];
    }
    return (data as Row[] | null)?.map(fromRow) ?? [];
  } catch (e) {
    console.warn(`[dsa] listDsaQuestions threw:`, e);
    return [];
  }
});
