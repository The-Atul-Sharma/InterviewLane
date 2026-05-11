"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Github, Bookmark, LayoutGrid, Map, BarChart3, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { UserButton } from "@/components/user-button";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/roadmaps", label: "Roadmaps", icon: Map },
  { href: "/plans", label: "Plans", icon: BarChart3 },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-page flex h-14 items-center gap-4">
          <Link href="/" aria-label="Home">
            <Logo size={22} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="gap-2 text-muted-foreground"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-80 sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Link
              href="https://github.com"
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

        <nav className="container-page flex gap-1 overflow-x-auto py-1.5 text-sm md:hidden" aria-label="Mobile">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
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
