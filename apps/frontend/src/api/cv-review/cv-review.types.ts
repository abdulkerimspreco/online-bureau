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
  reviewMode: 'OPT_IN';
  appStoresRawCvText: boolean;
  providerResponseStorage: 'disabled';
  requestTimeoutMs: number;
}
