"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { create } from "zustand";
import {
  Search as SearchIcon,
  LayoutGrid,
  Map,
  BarChart3,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  Shuffle,
  Calendar,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Item = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  short: string;
};

interface PaletteState {
  open: boolean;
  setOpen: (v: boolean) => void;
}
export const useCommandPalette = create<PaletteState>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));

const ROUTES = [
  { href: "/", title: "Home", icon: SearchIcon },
  { href: "/categories", title: "Categories", icon: LayoutGrid },
  { href: "/roadmaps", title: "Roadmaps", icon: Map },
  { href: "/plans", title: "Preparation Plans", icon: BarChart3 },
  { href: "/bookmarks", title: "Bookmarks", icon: Bookmark },
  { href: "/dashboard", title: "Dashboard", icon: Sparkles },
  { href: "/daily", title: "Daily Challenge", icon: Calendar },
  { href: "/random", title: "Random Interview Mode", icon: Shuffle },
];

export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen } = useCommandPalette();
  const { setTheme } = useTheme();
  const [items, setItems] = React.useState<Item[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [randomSeed, setRandomSeed] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setRandomSeed((s) => s + 1);
    }
  }, [open]);

  const visibleQuestions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return items.filter((it) => it.title.toLowerCase().includes(q)).slice(0, 15);
    }
    const arr = [...items];
    let seed = randomSeed;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 5);
  }, [items, query, randomSeed]);

  const queryLower = query.trim().toLowerCase();
  const visibleRoutes = queryLower
    ? ROUTES.filter((r) => r.title.toLowerCase().includes(queryLower))
    : ROUTES;
  const themeMatches = (label: string) =>
    !queryLower || label.toLowerCase().includes(queryLower) || "theme".includes(queryLower);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open || loaded) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: Item[]) => {
        setItems(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex max-h-[70vh] flex-col overflow-hidden p-0 sm:top-auto sm:bottom-8 sm:translate-y-0 sm:data-[state=open]:slide-in-from-bottom-8 sm:data-[state=closed]:slide-out-to-bottom-8 max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:h-[85vh] max-sm:max-h-[85vh] max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-xl max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom"
        hideClose
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          label="Command palette"
          loop
          shouldFilter={false}
          className="flex min-h-0 flex-1 flex-col rounded-lg [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-2 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4"
        >
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search questions, categories, commands…"
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-70 sm:inline-flex">
              ESC
            </kbd>
          </div>

          <Command.List className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>

            {visibleRoutes.length > 0 && (
            <Command.Group heading="Pages" className="text-xs text-muted-foreground">
              {visibleRoutes.map((r) => (
                <Command.Item
                  key={r.href}
                  value={`page ${r.title} ${r.href}`}
                  onSelect={() => go(r.href)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                >
                  <r.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{r.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.href}</span>
                </Command.Item>
              ))}
            </Command.Group>
            )}

            {loaded && visibleQuestions.length > 0 && (
              <Command.Group
                heading={query.trim() ? "Questions" : "Suggested Questions"}
                className="text-xs text-muted-foreground"
              >
                {visibleQuestions.map((q) => (
                  <Command.Item
                    key={q.slug}
                    value={`${q.title} ${q.category} ${q.short}`}
                    onSelect={() => go(`/questions/${q.slug}`)}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                  >
                    <SearchIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="whitespace-normal break-words text-foreground">
                        {q.title}
                      </div>
                      <div className="whitespace-normal break-words text-xs text-muted-foreground">
                        {q.category} · {q.difficulty}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {(themeMatches("Light") || themeMatches("Dark") || themeMatches("System")) && (
            <Command.Group heading="Theme" className="text-xs text-muted-foreground">
              {themeMatches("Light") && (
              <Command.Item
                value="theme light"
                onSelect={() => {
                  setTheme("light");
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <Sun className="h-4 w-4 text-muted-foreground" /> Light
              </Command.Item>
              )}
              {themeMatches("Dark") && (
              <Command.Item
                value="theme dark"
                onSelect={() => {
                  setTheme("dark");
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <Moon className="h-4 w-4 text-muted-foreground" /> Dark
              </Command.Item>
              )}
              {themeMatches("System") && (
              <Command.Item
                value="theme system"
                onSelect={() => {
                  setTheme("system");
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              >
                <Sparkles className="h-4 w-4 text-muted-foreground" /> System
              </Command.Item>
              )}
            </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
