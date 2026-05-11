import type { Metadata } from "next";
import { SearchClient } from "./client";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Search",
  description: "Full-text search across all interview questions and categories.",
};

export default function SearchPage() {
  return (
    <div className="container-page py-12 space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Search</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Find a question</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Fuzzy search across titles and descriptions. Filter by category and difficulty.
        </p>
      </header>
      <SearchClient />
    </div>
  );
}
