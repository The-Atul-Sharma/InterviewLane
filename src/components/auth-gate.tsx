"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Wraps content that requires a signed-in user. Renders an inline
 * sign-in prompt when there's no session — no redirect, so the user
 * keeps their place on the page.
 */
export function AuthGate({
  children,
  title = "Sign in to continue",
  description = "Sign in with Google to sync your bookmarks, progress, and streak across devices.",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();

  if (!configured) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <h2 className="font-semibold">Supabase not configured</h2>
        <p className="text-sm text-muted-foreground">
          Add Supabase env vars to enable bookmarks and progress tracking. See{" "}
          <code className="font-mono text-xs">supabase/README.md</code>.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground/5">
          <LogIn className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Continue with Google</Link>
        </Button>
      </Card>
    );
  }

  return <>{children}</>;
}
