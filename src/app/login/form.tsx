"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function LoginForm() {
  const configured = isSupabaseConfigured();
  if (!configured) return <NotConfigured />;
  return <ConfiguredLoginForm />;
}

function ConfiguredLoginForm() {
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function signInWithGoogle() {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setBusy(false);
      setError(error.message);
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          className="w-full gap-2"
          variant="outline"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          By continuing you agree to sign in with your Google account. No marketing emails.
        </p>
      </div>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44c-.28 1.48-1.13 2.73-2.4 3.57v2.97h3.88c2.27-2.09 3.57-5.18 3.57-8.78z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-2.97c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.32c-.25-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.59H1.27A11.97 11.97 0 0 0 0 12c0 1.94.47 3.77 1.27 5.41l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.59l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function NotConfigured() {
  return (
    <Card className="space-y-3 p-6">
      <h2 className="font-semibold">Supabase not configured</h2>
      <p className="text-sm text-muted-foreground">
        Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>{" "}
        to <code className="font-mono text-xs">.env.local</code> and restart the dev server.
      </p>
      <p className="text-xs text-muted-foreground">
        See <code className="font-mono">supabase/README.md</code> for setup steps.
      </p>
    </Card>
  );
}
