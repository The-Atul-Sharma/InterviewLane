/**
 * Validate ORDERINGS against Supabase and write `position` per slug.
 *
 * Steps:
 *  1. Fetch slug/category for every live question.
 *  2. For each category in ORDERINGS:
 *      - error if a listed slug doesn't exist in that category
 *      - warn if a real slug is missing from the ordering (it keeps position 0)
 *  3. Pass `--apply` to actually write; otherwise dry-run.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./_env";
import { ORDERINGS } from "./orderings";

loadEnvLocal();

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await supabase
    .from("questions")
    .select("slug,category")
    .is("deleted_at", null);
  if (error) throw error;

  const byCat = new Map<string, Set<string>>();
  for (const r of data as { slug: string; category: string }[]) {
    if (!byCat.has(r.category)) byCat.set(r.category, new Set());
    byCat.get(r.category)!.add(r.slug);
  }

  let problems = 0;
  const updates: { slug: string; position: number }[] = [];

  for (const [cat, slugs] of Object.entries(ORDERINGS)) {
    const real = byCat.get(cat);
    if (!real) { console.error(`category not found: ${cat}`); problems++; continue; }
    const seen = new Set<string>();
    for (let i = 0; i < slugs.length; i++) {
      const s = slugs[i];
      if (seen.has(s)) { console.error(`[${cat}] duplicate slug in ordering: ${s}`); problems++; }
      seen.add(s);
      if (!real.has(s)) { console.error(`[${cat}] slug not in DB: ${s}`); problems++; continue; }
      updates.push({ slug: s, position: i + 1 });
    }
    for (const r of real) if (!seen.has(r)) console.warn(`[${cat}] DB slug missing from ordering (stays 0): ${r}`);
  }

  console.log(`\n${problems} problems, ${updates.length} updates queued.`);
  if (problems) { console.error("Fix problems before --apply"); process.exit(1); }
  if (!apply) { console.log("Dry run. Pass --apply to write."); return; }

  let done = 0;
  for (const u of updates) {
    const { error: e } = await supabase
      .from("questions")
      .update({ position: u.position })
      .eq("slug", u.slug);
    if (e) { console.error(`update ${u.slug}: ${e.message}`); process.exit(1); }
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${updates.length}`);
  }
  console.log(`Updated ${done} rows.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
