"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function AdminRestoreQuestion({ slug }: { slug: string }) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isAdmin) return null;

  const onRestore = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/${slug}/restore`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restore");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          This question is <span className="font-semibold">deleted</span>. Visitors
          see a 404. Restore it to publish again.
        </p>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={onRestore}
          className="gap-1.5 shrink-0"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <RotateCcw className="h-3.5 w-3.5" />
          Restore question
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
