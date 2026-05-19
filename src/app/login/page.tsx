import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./form";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to InterviewLane with your Google account.",
};

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your Google account to continue. No password needed.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
