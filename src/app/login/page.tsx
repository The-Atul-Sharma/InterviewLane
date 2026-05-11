import type { Metadata } from "next";
import { LoginForm } from "./form";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to FrontendAce with email + one-time code.",
};

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            We'll email you a 6-digit code. No password needed.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
