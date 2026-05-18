import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill - small status chip. Tones map to the InterviewPerp palette.
 * Hairline border by default; tonal fill for status colors.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 h-5 text-[11px] font-medium leading-none whitespace-nowrap tracking-normal tabular-nums",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        outline: "border border-border text-muted-foreground bg-transparent",
        muted: "border border-border text-muted-foreground bg-transparent",
        solid: "border border-border bg-secondary text-foreground",
        brand:
          "border border-transparent bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]",
        success:
          "border border-transparent bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
        warning:
          "border border-transparent bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
        danger:
          "border border-transparent bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]",
        teal:
          "border border-transparent bg-[hsl(var(--teal)/0.12)] text-[hsl(var(--teal))]",
        info:
          "border border-transparent bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]",
      },
      size: {
        sm: "h-5 px-2 text-[11px]",
        md: "h-6 px-2.5 text-[11.5px]",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/** Difficulty pill - maps easy/medium/hard to the right tonal color. */
export function DifficultyBadge({
  level,
  size,
  className,
}: {
  level: "easy" | "medium" | "hard";
  size?: "sm" | "md";
  className?: string;
}) {
  const variant: BadgeProps["variant"] =
    level === "easy" ? "success" : level === "medium" ? "warning" : "danger";
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
}
