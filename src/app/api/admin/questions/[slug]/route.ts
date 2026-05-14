import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, PLACEHOLDER_ANSWER_MARKER } from "@/lib/admin";
import {
  CATEGORIES,
  DIFFICULTIES,
  FREQUENCIES,
  SENIORITY,
  CodeSnippetSchema,
} from "@/lib/schema/question";
import { asStringArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FULL_COLUMNS =
  "slug,title,category,subcategory,difficulty,frequency,seniority,short_description,answer,code_snippets,follow_ups,common_mistakes,performance_considerations,edge_cases,real_world_examples,senior_discussion,related_slugs,estimated_reading_minutes,estimated_solving_minutes,updated_at,deleted_at";

type Row = {
  slug: string;
  title: string;
  category: string;
  subcategory: string | null;
  difficulty: string;
  frequency: string;
  seniority: string;
  short_description: string;
  answer: string | null;
  code_snippets: unknown[] | null;
  follow_ups: string[] | null;
  common_mistakes: string[] | null;
  performance_considerations: string[] | null;
  edge_cases: string[] | null;
  real_world_examples: string[] | null;
  senior_discussion: string | null;
  related_slugs: string[] | null;
  estimated_reading_minutes: number;
  estimated_solving_minutes: number;
  updated_at: string;
  deleted_at: string | null;
};

function toApi(r: Row) {
  const answer = r.answer ?? "";
  return {
    slug: r.slug,
    title: r.title,
    category: r.category,
    subcategory: r.subcategory ?? "",
    difficulty: r.difficulty,
    frequency: r.frequency,
    seniority: r.seniority,
    shortDescription: r.short_description,
    answer,
    codeSnippets: r.code_snippets ?? [],
    followUps: asStringArray(r.follow_ups),
    commonMistakes: asStringArray(r.common_mistakes),
    performanceConsiderations: asStringArray(r.performance_considerations),
    edgeCases: asStringArray(r.edge_cases),
    realWorldExamples: asStringArray(r.real_world_examples),
    seniorDiscussion: r.senior_discussion ?? "",
    relatedSlugs: asStringArray(r.related_slugs),
    estimatedReadingMinutes: r.estimated_reading_minutes,
    estimatedSolvingMinutes: r.estimated_solving_minutes,
    answered:
      !!answer && !answer.toLowerCase().includes(PLACEHOLDER_ANSWER_MARKER),
    isDeleted: !!r.deleted_at,
    updatedAt: r.updated_at,
  };
}

async function assertAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { slug } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select(FULL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toApi(data as Row));
}

const PatchSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters."),
    category: z.enum(CATEGORIES),
    subcategory: z.string().trim().max(80).nullable().optional(),
    difficulty: z.enum(DIFFICULTIES),
    frequency: z.enum(FREQUENCIES),
    seniority: z.enum(SENIORITY),
    shortDescription: z
      .string()
      .trim()
      .min(10, "Short description must be at least 10 characters."),
    answer: z.string().min(10, "Answer must be at least 10 characters."),
    codeSnippets: z.array(CodeSnippetSchema),
    followUps: z.array(z.string().min(1)),
    commonMistakes: z.array(z.string().min(1)),
    performanceConsiderations: z.array(z.string().min(1)),
    edgeCases: z.array(z.string().min(1)),
    realWorldExamples: z.array(z.string().min(1)),
    seniorDiscussion: z.string().nullable().optional(),
    relatedSlugs: z.array(z.string().min(1)),
    estimatedReadingMinutes: z.number().int().positive().max(180),
    estimatedSolvingMinutes: z.number().int().positive().max(360),
  })
  .partial();

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { slug } = await ctx.params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }
  const b = parsed.data;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.title !== undefined) update.title = b.title;
  if (b.category !== undefined) update.category = b.category;
  if (b.subcategory !== undefined) update.subcategory = b.subcategory || null;
  if (b.difficulty !== undefined) update.difficulty = b.difficulty;
  if (b.frequency !== undefined) update.frequency = b.frequency;
  if (b.seniority !== undefined) update.seniority = b.seniority;
  if (b.shortDescription !== undefined) update.short_description = b.shortDescription;
  if (b.answer !== undefined) update.answer = b.answer;
  if (b.codeSnippets !== undefined) update.code_snippets = b.codeSnippets;
  if (b.followUps !== undefined) update.follow_ups = b.followUps;
  if (b.commonMistakes !== undefined) update.common_mistakes = b.commonMistakes;
  if (b.performanceConsiderations !== undefined)
    update.performance_considerations = b.performanceConsiderations;
  if (b.edgeCases !== undefined) update.edge_cases = b.edgeCases;
  if (b.realWorldExamples !== undefined) update.real_world_examples = b.realWorldExamples;
  if (b.seniorDiscussion !== undefined)
    update.senior_discussion = b.seniorDiscussion ? b.seniorDiscussion : null;
  if (b.relatedSlugs !== undefined) update.related_slugs = b.relatedSlugs;
  if (b.estimatedReadingMinutes !== undefined)
    update.estimated_reading_minutes = b.estimatedReadingMinutes;
  if (b.estimatedSolvingMinutes !== undefined)
    update.estimated_solving_minutes = b.estimatedSolvingMinutes;

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .update(update)
    .eq("slug", slug)
    .select(FULL_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath(`/questions/${slug}`);
  return NextResponse.json(toApi(data as Row));
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { slug } = await ctx.params;
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("questions")
    .update({ deleted_at: now, updated_at: now })
    .eq("slug", slug)
    .is("deleted_at", null)
    .select("slug")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath(`/questions/${slug}`);
  revalidatePath("/admin/answers");
  return NextResponse.json({ slug, deleted: true });
}
