import type { Difficulty, Frequency } from "./question";

export type StageSlug =
  | "foundations"
  | "intermediate"
  | "advanced"
  | "senior"
  | "staff";

export interface RoadmapStage {
  slug: StageSlug;
  name: string;
  description: string;
  position: number;
  skills: string[];
  estHours: number;
  readinessLevel: string;
  difficultyBand: string;
}

export interface RoadmapTopic {
  slug: string;
  stageSlug: StageSlug;
  name: string;
  description: string;
  whyAsked: string;
  realWorld: string;
  commonPatterns: string[];
  commonMistakes: string[];
  followUps: string[];
  difficulty: Difficulty;
  frequency: Frequency;
  masteryMinutes: number;
  position: number;
  prereqTopicSlugs: string[];
}

export interface RoadmapTopicQuestion {
  slug: string;
  title: string;
  difficulty: Difficulty;
  frequency: Frequency;
  estimatedReadingMinutes: number;
}

export interface RoadmapTopicWithQuestions extends RoadmapTopic {
  questions: RoadmapTopicQuestion[];
}

export interface RoadmapStageWithTopics extends RoadmapStage {
  topics: RoadmapTopicWithQuestions[];
  questionCount: number;
}

export interface PrepPlan {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  days: number;
  questionsPerDay: number;
  revisionStrategy: string;
  milestoneCadence: { day: number; label: string }[];
  focus: string[];
  difficulty: string;
  position: number;
}

export interface PrepPlanDay {
  dayNum: number;
  focus: string;
  goals: string[];
  questionSlugs: string[];
  isMock: boolean;
  isRevision: boolean;
}

export interface PrepPlanWithDays extends PrepPlan {
  daysList: PrepPlanDay[];
}
