export interface CvReviewResult {
  id: string;
  provider: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  keywordMatches: string[];
  structureScore: number;
  clarityScore: number;
  keywordScore: number;
  completenessScore: number;
  sourceCvUpdatedAt: string;
  createdAt: string;
  isCurrentVersion: boolean;
}
