"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/providers/auth-provider";

const COLUMNS = [
  {
    h: "Practice",
    items: [
      { label: "Categories", href: "/categories" },
      { label: "Random round", href: "/random" },
      { label: "Daily challenge", href: "/daily" },
    ],
  },
  {
    h: "Roadmaps",
    items: [
      { label: "All roadmaps", href: "/roadmaps" },
      { label: "Frontend foundations", href: "/roadmaps/frontend-foundations" },
      { label: "Senior frontend", href: "/roadmaps/senior-frontend" },
    ],
  },
  {
    h: "Plans",
    items: [
      { label: "7-day refresher", href: "/plans/7-day" },
      { label: "30-day deep prep", href: "/plans/30-day" },
      { label: "90-day mastery", href: "/plans/90-day" },
    ],
  },
];

export function SiteFooter() {
  const { user } = useAuth();
  const accountItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bookmarks", href: "/bookmarks" },
    ...(user ? [] : [{ label: "Sign in", href: "/login" }]),
  ];
  const columns = [...COLUMNS, { h: "Account", items: accountItems }];
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-[2fr_repeat(4,1fr)]">
        <div>
          <Logo size={20} />
          <p className="mt-3 max-w-[260px] text-[12.5px] leading-6 text-muted-foreground">
            The frontend interview prep platform built by engineers, for engineers.
          </p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <Link
              href="https://github.com/The-Atul-Sharma/frontendAce"
              aria-label="GitHub"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </Link>
          </div>
        </div>
        {columns.map((c) => (
          <div key={c.h} className="flex flex-col gap-2.5">
            <span className="eyebrow">{c.h}</span>
            {c.items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {i.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col items-start justify-between gap-2 border-t py-5 text-[11.5px] sm:flex-row sm:items-center">
        <span className="font-mono text-muted-foreground">
          © {new Date().getFullYear()} FrontendAce
        </span>
        <span className="font-mono text-muted-foreground">Built for senior frontend engineers</span>
      </div>
    </footer>
  );
}
