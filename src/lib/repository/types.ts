import type {
  Question,
  QuestionMeta,
  Category,
  Difficulty,
} from "../schema/question";

export interface QuestionFilters {
  category?: Category;
  difficulty?: Difficulty;
  query?: string;
}

export interface RepoStats {
  total: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  byFrequency: Record<string, number>;
  bySeniority: Record<string, number>;
  generatedAt: string;
  sources: string[];
}

/**
 * Repository contract - every page goes through this.
 * Implementations are interchangeable (filesystem, SQLite, Postgres, REST).
 */
export interface QuestionRepository {
  /** Lean meta for *all* questions - list pages, search, dashboards. */
  listAll(): Promise<QuestionMeta[]>;

  /** Full question for a single slug - only loaded by the detail page. */
  getBySlug(slug: string): Promise<Question | null>;

  /** Lean meta filtered to a category. */
  listByCategory(category: Category): Promise<QuestionMeta[]>;

  /** Repo-wide aggregates. */
  getStats(): Promise<RepoStats>;

  /** Multi-filter convenience for list pages. */
  filter(filters: QuestionFilters): Promise<QuestionMeta[]>;
}
