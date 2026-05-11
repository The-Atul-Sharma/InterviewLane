"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

type Step = "email" | "code" | "done";

const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LoginForm() {
  const configured = isSupabaseConfigured();
  if (!configured) return <NotConfigured />;
  return <ConfiguredLoginForm />;
}

function ConfiguredLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!EMAIL_RX.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const token = code.trim();
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("done");
    router.replace(next);
    router.refresh();
  }

  return (
    <Card className="p-6">
      {step === "email" && (
        <form onSubmit={sendOtp} className="space-y-4" noValidate>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                autoFocus
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border bg-background py-2 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
            </div>
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send code
          </Button>
          <p className="text-xs text-muted-foreground">
            By continuing you agree to email-based authentication. No marketing emails.
          </p>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyOtp} className="space-y-4" noValidate>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Use a different email
          </button>
          <div className="space-y-1.5">
            <p className="text-sm">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              Check spam if it doesn't arrive within a minute.
            </p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Code</span>
            <input
              type="text"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.5em] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              )}
            />
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify & sign in
          </Button>
          <button
            type="button"
            onClick={() => sendOtp()}
            disabled={busy}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      )}
    </Card>
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
