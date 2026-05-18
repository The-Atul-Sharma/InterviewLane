import type { Metadata } from "next";
import { repository } from "@/lib/repository";
import { listDsaQuestions } from "@/lib/dsa-repository";
import { UserStateBoot } from "@/components/user-state-boot";
import { BookmarksClient } from "./client";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved interview questions for revision.",
};

export default async function BookmarksPage() {
  const [all, dsa] = await Promise.all([repository.listAll(), listDsaQuestions()]);
  return (
    <div className="container-page py-12 space-y-6">
      <UserStateBoot />
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Bookmarks
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your saved questions
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Stored in your browser. Revisit during revision; clear anytime from the dashboard.
        </p>
      </header>
      <BookmarksClient pool={all} dsaPool={dsa} />
    </div>
  );
}
