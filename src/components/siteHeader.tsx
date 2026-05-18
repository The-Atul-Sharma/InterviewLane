"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/themeToggle";
import { CommandPalette, useCommandPalette } from "@/components/commandPalette";
import { UserButton } from "@/components/userButton";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/categories", label: "Categories" },
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/plans", label: "Plans" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const THRESHOLD = 8;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y < 80) {
          setHidden(false);
        } else if (dy > THRESHOLD) {
          setHidden(true);
        } else if (dy < -THRESHOLD) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-page flex h-14 items-center gap-4">
          <Link href="/" aria-label="Home">
            <Logo size={22} className="py-2" />
          </Link>

          <nav className="ml-2 hidden flex-1 items-center gap-0.5 sm:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label="Search"
              className="text-muted-foreground sm:hidden"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="hidden gap-2 text-muted-foreground sm:inline-flex"
            >
              <Search className="h-4 w-4" />
              <span>Search…</span>
              <kbd className="ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-80 sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Link
              href="https://github.com/The-Atul-Sharma/InterviewLane"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hidden md:block"
            >
              <Button variant="ghost" size="icon">
                <Github className="h-4 w-4" />
              </Button>
            </Link>
            <ThemeToggle />
            <UserButton />
          </div>
        </div>

        {/* Mobile sub-menu — nav links shown as a row below the header.
            Hides on scroll-down and reappears on scroll-up. */}
        <nav
          className={cn(
            "container-page flex gap-1 overflow-x-auto border-t border-border/60 py-2 transition-[transform,opacity,max-height,padding] duration-200 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden",
            hidden
              ? "pointer-events-none max-h-0 -translate-y-1 overflow-hidden border-t-0 py-0 opacity-0"
              : "max-h-16 opacity-100",
          )}
          aria-label="Main (mobile)"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <CommandPalette />
    </>
  );
}
