import Link from "next/link";
import { ArrowRight, Home, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { HeroSearchTrigger } from "@/components/heroSearchTrigger";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
      <Logo size={36} />
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        404 &middot; Page not found
      </p>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        We couldn&apos;t find that page.
      </h1>
      <p className="max-w-md text-muted-foreground">
        The question or category you&apos;re looking for doesn&apos;t exist, or may have moved. Try
        searching, or jump back to a known spot.
      </p>

      <HeroSearchTrigger />

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home className="mr-1.5 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/categories">
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            Browse categories
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/roadmaps">
            Roadmaps
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
