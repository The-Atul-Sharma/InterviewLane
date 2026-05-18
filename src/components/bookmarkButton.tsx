"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck, CheckCircle2, Circle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/userState";
import { useAuth } from "@/components/providers/authProvider";

/**
 * Bookmark + complete buttons for the question detail page.
 *
 * - Anonymous users see a "sign in to save progress" inline CTA instead.
 * - Signed-in users get optimistic UI; writes go to Supabase in the
 *   background (see `useUserStore`).
 * - Tracks view + advances streak on mount.
 */
export function BookmarkAndCompleteButtons({ slug }: { slug: string }) {
  const { user, configured } = useAuth();
  const pathname = usePathname();
  const isBookmarked = useUserStore((s) => s.bookmarks.includes(slug));
  const isCompleted = useUserStore((s) => s.completed.includes(slug));
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);
  const toggleCompleted = useUserStore((s) => s.toggleCompleted);
  const trackView = useUserStore((s) => s.trackView);
  const recordStudyDay = useUserStore((s) => s.recordStudyDay);

  React.useEffect(() => {
    if (!user) return;
    trackView(slug);
    recordStudyDay();
  }, [slug, user, trackView, recordStudyDay]);

  if (!configured || !user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline" className="gap-2">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
            <LogIn className="h-4 w-4" />
            Sign in to bookmark & track progress
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={isBookmarked ? "default" : "outline"}
        onClick={() => toggleBookmark(slug)}
        className="gap-2"
      >
        {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
      <Button
        size="sm"
        variant={isCompleted ? "default" : "outline"}
        onClick={() => toggleCompleted(slug)}
        className="gap-2"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
        {isCompleted ? "Completed" : "Mark complete"}
      </Button>
    </div>
  );
}
