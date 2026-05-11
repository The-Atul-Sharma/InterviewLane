import type { Question } from "../../src/lib/schema/question";

export interface RawDocument {
  filePath: string;
  relativePath: string;
  content: string;
}

export interface ExtractedQuestion {
  rawTitle: string;
  rawHints: string[];
  sourceFile: string;
  context?: string;
}

export interface EnrichmentProvider {
  name: string;
  enrich(extracted: ExtractedQuestion): Promise<Question>;
}
