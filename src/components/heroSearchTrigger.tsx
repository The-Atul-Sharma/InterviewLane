"use client";

import { Search } from "lucide-react";
import { useCommandPalette } from "@/components/commandPalette";

export function HeroSearchTrigger() {
  const setOpen = useCommandPalette((s) => s.setOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group mt-2 inline-flex w-full max-w-[440px] items-center gap-3 rounded-full border bg-card/80 px-4 py-2.5 text-left text-[13.5px] text-muted-foreground shadow-sm transition-colors hover:border-foreground/30 hover:text-foreground"
      aria-label="Open search"
    >
      <Search className="h-4 w-4 shrink-0 opacity-70" />
      <span className="flex-1 truncate">Search 800+ questions, roadmaps, plans…</span>
      <kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-80 sm:inline-flex">
        <span className="text-xs leading-none">⌘</span>K
      </kbd>
    </button>
  );
}
