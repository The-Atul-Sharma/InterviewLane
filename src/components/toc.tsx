"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -70% 0px", threshold: [0, 1] },
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1.5 border-l">
        {items.map((it) => (
          <li key={it.id} style={{ paddingLeft: (it.level - 1) * 12 }}>
            <Link
              href={`#${it.id}`}
              className={cn(
                "-ml-px block border-l border-transparent pl-3 text-muted-foreground transition-colors hover:text-foreground",
                active === it.id && "border-foreground text-foreground",
              )}
            >
              {it.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
