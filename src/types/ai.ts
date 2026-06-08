import type { Activity } from "./activity";

export interface ParsedActivityResult {
  activity: Activity;
  description: string;
  confidence: "high" | "medium" | "low";
}

export interface CoachReportInput {
  totalKgCo2e: number;
  periodDays: number;
  topCategories: Array<{ category: string; kgCo2e: number }>;
}

export interface CoachReport {
  summary: string;
  encouragement: string;
  tips: string[];
}
