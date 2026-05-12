import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAdminEmail,
  PLACEHOLDER_ANSWER_MARKER,
  ADMIN_HIDDEN_CATEGORIES,
} from "@/lib/admin";
import { CATEGORIES, DIFFICULTIES, FREQUENCIES, SENIORITY } from "@/lib/schema/question";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "all";
  const status = searchParams.get("status") ?? "all"; // all | answered | unanswered
  const query = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE),
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();
  let q = admin
    .from("questions")
    .select("slug,title,category,difficulty,answer,updated_at,deleted_at", {
      count: "exact",
    })
    .not("category", "in", `(${ADMIN_HIDDEN_CATEGORIES.join(",")})`)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (status === "deleted") {
    q = q.not("deleted_at", "is", null);
  } else {
    q = q.is("deleted_at", null);
    if (status === "unanswered") {
      q = q.ilike("answer", `%${PLACEHOLDER_ANSWER_MARKER}%`);
    } else if (status === "answered") {
      q = q.not("answer", "ilike", `%${PLACEHOLDER_ANSWER_MARKER}%`);
    }
  }

  if (category && category !== "all") {
    q = q.eq("category", category);
  }
  if (query) {
    q = q.ilike("title", `%${query}%`);
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    slug: string;
    title: string;
    category: string;
    difficulty: string;
    answer: string | null;
    updated_at: string;
    deleted_at: string | null;
  };

  const items = (data as Row[]).map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
    difficulty: r.difficulty,
    deleted: !!r.deleted_at,
    answered: !!r.answer && !r.answer.toLowerCase().includes(PLACEHOLDER_ANSWER_MARKER),
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({
    items,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1,
  });
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function buildPlaceholderAnswer(slug: string): string {
  return `This question was imported as "${slug}" and is awaiting an authored answer. Re-run the ingestion pipeline with an AI provider configured to auto-generate the deep explanation.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return bad("Forbidden", 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("Invalid JSON body");
  }

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const num = (k: string, fallback: number) => {
    const v = body[k];
    const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const slug = str("slug").toLowerCase();
  const title = str("title");
  const category = str("category");
  const subcategory = str("subcategory");
  const difficulty = str("difficulty");
  const frequency = str("frequency");
  const seniority = str("seniority");
  const shortDescription = str("shortDescription");
  const answer = str("answer");

  if (!slug || !SLUG_RE.test(slug)) return bad("slug must be lowercase-kebab-case");
  if (!title) return bad("title is required");
  if (!(CATEGORIES as readonly string[]).includes(category)) return bad("invalid category");
  if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) return bad("invalid difficulty");
  if (!(FREQUENCIES as readonly string[]).includes(frequency)) return bad("invalid frequency");
  if (!(SENIORITY as readonly string[]).includes(seniority)) return bad("invalid seniority");
  if (shortDescription.length < 10) return bad("shortDescription must be at least 10 characters");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("questions")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return bad("A question with this slug already exists", 409);

  const now = new Date().toISOString();
  const row = {
    slug,
    title,
    category,
    subcategory: subcategory || null,
    difficulty,
    frequency,
    seniority,
    short_description: shortDescription,
    answer: answer && answer.length >= 10 ? answer : buildPlaceholderAnswer(slug),
    code_snippets: [],
    follow_ups: [],
    common_mistakes: [],
    performance_considerations: [],
    edge_cases: [],
    real_world_examples: [],
    related_slugs: [],
    estimated_reading_minutes: num("estimatedReadingMinutes", 5),
    estimated_solving_minutes: num("estimatedSolvingMinutes", 5),
    created_at: now,
    updated_at: now,
  };

  const { error } = await admin.from("questions").insert(row);
  if (error) return bad(error.message, 500);

  return NextResponse.json({ slug, answered: !answer.toLowerCase().includes(PLACEHOLDER_ANSWER_MARKER) && !!answer });
}
