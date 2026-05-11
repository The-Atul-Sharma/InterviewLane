"use client";
import Link from "next/link";
import { Bookmark, Loader2 } from "lucide-react";
import { useUserStore } from "@/lib/store/user-state";
import type { QuestionMeta } from "@/lib/schema/question";
import { QuestionCard } from "@/components/question-card";
import { GrindCard } from "@/components/dsa-grind-list";
import {
  DSA_SLUG_PREFIX,
  leetcodeSlugKey,
  type GrindQuestion,
} from "@/lib/dsa-types";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";

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
      description="Bookmarks sync across all your devices once you sign in with email."
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

  return (
    <div className="space-y-8">
      {internalItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Questions
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {internalItems.map((q) => (
              <QuestionCard key={q.slug} q={q} />
            ))}
          </div>
        </section>
      )}

      {dsaItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            DSA & Algorithms
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dsaItems.map((q) => (
              <GrindCard key={q.id} q={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
