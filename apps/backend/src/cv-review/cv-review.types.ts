export type ReviewPayload = {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  keywordMatches: string[];
  structureScore: number;
  clarityScore: number;
  keywordScore: number;
  completenessScore: number;
};

export type CvReviewRequest = {
  fileName: string;
  text: string;
  tagNames: string[];
  preferredCategories: string[];
  location: string;
};

export interface CvReviewProvider {
  readonly providerName: string;
  generateReview(input: CvReviewRequest): Promise<ReviewPayload>;
}

export const CV_REVIEW_PROVIDER = Symbol('CV_REVIEW_PROVIDER');
