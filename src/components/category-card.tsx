import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowUpRight, Layers } from "lucide-react";
import type { CategoryMeta } from "@/lib/schema/question";

/** Map category slug → oklch hue for the gradient icon badge. */
const HUE: Record<string, number> = {
  frontend: 220,
  react: 220,
  javascript: 50,
  typescript: 215,
  css: 320,
  html: 25,
  "browser-internals": 270,
  performance: 30,
  accessibility: 175,
  "system-design": 270,
  "dsa-algorithms": 0,
  "machine-coding": 40,
  testing: 130,
  security: 5,
  networking: 200,
  architecture: 250,
  behavioral: 340,
};

export function CategoryCard({
  cat,
  count,
  compact,
}: {
  cat: CategoryMeta;
  count?: number;
  compact?: boolean;
}) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    cat.icon
  ];
  const hue = HUE[cat.slug] ?? 220;
  const grad = `linear-gradient(135deg, oklch(0.62 0.13 ${hue}), oklch(0.45 0.10 ${(hue + 50) % 360}))`;
  return (
    <Link
      href={`/categories/${cat.slug}`}
      className="group surface surface-hover relative flex flex-col gap-3.5 p-[18px] transition-all"
    >
      <div
        className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-sm"
        style={{ background: grad }}
      >
        {Icon ? <Icon className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[14px] font-semibold tracking-tight">{cat.name}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {typeof count === "number" ? `${count} questions` : "—"}
        </span>
      </div>
      {!compact && (
        <p className="line-clamp-2 text-[12.5px] text-muted-foreground">{cat.description}</p>
      )}
      <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
