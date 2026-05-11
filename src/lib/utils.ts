import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function siteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontendace.vercel.app";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
