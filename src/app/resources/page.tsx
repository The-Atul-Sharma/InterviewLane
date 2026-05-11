import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import {
  RESOURCE_SECTIONS,
  KIND_LABEL,
  STUDY_TRACK,
  type Resource,
  type ResourceSection,
} from "@/lib/resources";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Resources",
  description:
    "A curated, opinionated reading list for frontend interviews — organized by topic with a 10-week study track.",
};

const totalCount = RESOURCE_SECTIONS.reduce((n, s) => n + s.resources.length, 0);

export default function ResourcesPage() {
  return (
    <div className="container-page space-y-12 py-12">
      <Hero />

      <StudyTrack />

      <nav
        aria-label="Section quick links"
        className="sticky top-14 z-30 -mx-4 border-y bg-background/85 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/65"
      >
        <ul className="flex gap-1.5 overflow-x-auto">
          {RESOURCE_SECTIONS.map((s) => (
            <li key={s.slug}>
              <a
                href={`#${s.slug}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <s.icon className="h-3 w-3" />
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-12">
        {RESOURCE_SECTIONS.map((section) => (
          <Section key={section.slug} section={section} />
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[hsl(var(--brand-soft))] via-background to-background p-8 sm:p-10">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[hsl(var(--brand)/0.15)] blur-3xl" />
      <div className="relative space-y-3">
        <Badge variant="brand" className="gap-1">
          <Sparkles className="h-3 w-3" /> Curated reading list
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Frontend interview resources
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Every link worth bookmarking, organized by topic. {totalCount} resources across{" "}
          {RESOURCE_SECTIONS.length} tracks — from DSA fundamentals to behavioral stories. 10-week
          study track included.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href="#dsa"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            Start with DSA
          </a>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <BookOpen className="h-3 w-3" /> Daily prep plans
          </Link>
        </div>
      </div>
    </header>
  );
}

function StudyTrack() {
  return (
    <section aria-labelledby="study-track" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 id="study-track" className="text-xl font-semibold tracking-tight">
            Suggested 10-week track
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Light scaffolding if you&apos;re starting from zero — adjust to the time you have.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STUDY_TRACK.map((w, i) => (
          <Card key={w.week} className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="muted">{w.week}</Badge>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-snug">{w.focus}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {w.sections.map((slug) => (
                <a
                  key={slug}
                  href={`#${slug}`}
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  #{slug}
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Section({ section }: { section: ResourceSection }) {
  const Icon = section.icon;
  return (
    <section
      id={section.slug}
      aria-labelledby={`${section.slug}-h`}
      className="scroll-mt-24 space-y-4"
    >
      <div className={cn("rounded-xl border bg-gradient-to-br p-5", section.accent)}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-background/70 p-2 shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2
              id={`${section.slug}-h`}
              className="text-lg font-semibold tracking-tight sm:text-xl"
            >
              {section.name}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{section.blurb}</p>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {section.resources.map((r) => (
          <li key={r.url}>
            <ResourceLink resource={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceLink({ resource }: { resource: Resource }) {
  const isExternal = /^https?:\/\//.test(resource.url);
  return (
    <a
      href={resource.url}
      {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group flex h-full flex-col rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent/50"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-medium leading-snug">
            <span className="truncate">{resource.title}</span>
            {resource.recommended ? (
              <Badge variant="brand" className="shrink-0">
                Pick
              </Badge>
            ) : null}
          </div>
          {resource.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {resource.description}
            </p>
          ) : null}
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="outline">{KIND_LABEL[resource.kind]}</Badge>
        {resource.free ? <span>· Free</span> : null}
        <span className="ml-auto truncate font-mono text-[10px]">
          {isExternal ? hostnameOf(resource.url) : "frontendAce"}
        </span>
      </div>
    </a>
  );
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
