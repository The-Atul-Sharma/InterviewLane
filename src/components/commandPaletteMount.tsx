"use client";
/**
 * Lightweight mount point for the command palette.
 *
 * Listens for ⌘K / Ctrl+K and only dynamically imports the heavy palette UI
 * (cmdk + shiki-adjacent icons + dialog) once `open` flips true. Keeps the
 * palette JS out of every page's first-paint bundle.
 */
import * as React from "react";
import dynamic from "next/dynamic";
import { useCommandPalette } from "@/components/commandPaletteStore";

const CommandPalette = dynamic(
  () => import("@/components/commandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteMount() {
  const open = useCommandPalette((s) => s.open);
  const setOpen = useCommandPalette((s) => s.setOpen);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useCommandPalette.getState().open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  React.useEffect(() => {
    if (open) setShouldRender(true);
  }, [open]);

  if (!shouldRender) return null;
  return <CommandPalette />;
}
