import type { MetadataRoute } from "next";
import { repository } from "@/lib/repository";
import { CATEGORIES } from "@/lib/schema/question";
import { ROADMAPS, PREP_PLANS } from "@/lib/roadmaps";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const questions = await repository.listAll();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/categories",
    "/roadmaps",
    "/plans",
    "/daily",
    "/random",
    "/bookmarks",
    "/dashboard",
  ].map((p) => ({ url: siteUrl(p), lastModified: now, changeFrequency: "weekly", priority: 0.7 }));

  return [
    ...staticRoutes,
    ...CATEGORIES.map((c) => ({
      url: siteUrl(`/categories/${c}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...ROADMAPS.map((r) => ({
      url: siteUrl(`/roadmaps/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...PREP_PLANS.map((p) => ({
      url: siteUrl(`/plans/${p.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...questions.map((q) => ({
      url: siteUrl(`/questions/${q.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
