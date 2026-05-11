import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The question or category you're looking for doesn't exist or may have moved.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/categories">Browse categories</Link>
        </Button>
      </div>
    </div>
  );
}
