import type { MetadataRoute } from "next";
import { repository } from "@/lib/repository";
import { CATEGORIES } from "@/lib/schema/question";
import { ROADMAPS } from "@/lib/roadmaps";
import { getStages, getPlans } from "@/lib/repository/roadmap-repository";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [questions, stages, plans] = await Promise.all([
    repository.listAll(),
    getStages().catch(() => []),
    getPlans().catch(() => []),
  ]);
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
    ...stages.map((s) => ({
      url: siteUrl(`/roadmaps/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...ROADMAPS.filter((r) => r.slug === "dsa-for-frontend").map((r) => ({
      url: siteUrl(`/roadmaps/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...plans.map((p) => ({
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
