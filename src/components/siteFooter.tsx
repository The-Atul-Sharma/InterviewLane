"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/providers/authProvider";

const CATEGORIES = [
  { label: "React", href: "/categories/react" },
  { label: "JavaScript", href: "/categories/javascript" },
  { label: "System Design", href: "/categories/system-design" },
  { label: "Performance", href: "/categories/performance" },
  { label: "DSA · Blind 75", href: "/categories/dsa-algorithms-75" },
];

const PRACTICE = [
  { label: "Roadmaps", href: "/roadmaps" },
  { label: "Plans", href: "/plans" },
  { label: "Resources", href: "/resources" },
  { label: "Daily challenge", href: "/daily" },
];

const LEGAL = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function SiteFooter() {
  const { user } = useAuth();
  const account = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bookmarks", href: "/bookmarks" },
    ...(user ? [] : [{ label: "Sign in", href: "/login" }]),
  ];

  const columns = [
    { h: "Categories", items: CATEGORIES },
    { h: "Practice", items: PRACTICE },
    { h: "Account", items: account },
    { h: "Legal", items: LEGAL },
  ];

  return (
    <footer className="mt-24 border-t bg-card">
      <div className="container-page grid grid-cols-2 gap-10 py-14 md:grid-cols-[1.6fr_repeat(4,1fr)]">
        <div>
          <Logo size={20} />
          <p className="mt-4 max-w-[34ch] text-[13px] leading-6 text-muted-foreground">
            Curated frontend interview prep. Practice React, JavaScript, system design,
            performance, and DSA with structured roadmaps and day-by-day plans. Free for
            senior engineers.
          </p>
          <div className="mt-5 flex gap-3 text-muted-foreground">
            <Link
              href="https://github.com/The-Atul-Sharma/InterviewLane"
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
          <div key={c.h} className="flex flex-col gap-3">
            <h5 className="font-mono text-[11px] font-medium uppercase tracking-[0.10em] text-muted-foreground">
              {c.h}
            </h5>
            <ul className="flex flex-col gap-2">
              {c.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col items-start justify-between gap-2 border-t py-5 font-mono text-[11px] text-muted-foreground sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} InterviewLane · All rights reserved</span>
        <span>Built for senior frontend engineers</span>
      </div>
    </footer>
  );
}
