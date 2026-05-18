"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, LayoutGrid, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { HeroSearchTrigger } from "@/components/heroSearchTrigger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
      <Logo size={36} />
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        Something broke
      </p>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        That didn&apos;t load.
      </h1>
      <p className="max-w-md text-muted-foreground">
        {error.message || "An unexpected error occurred. Try again, or head somewhere else."}
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-muted-foreground/70">ref: {error.digest}</p>
      )}

      <HeroSearchTrigger />

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCw className="mr-1.5 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-1.5 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/categories">
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            Browse categories
          </Link>
        </Button>
      </div>
    </div>
  );
}
