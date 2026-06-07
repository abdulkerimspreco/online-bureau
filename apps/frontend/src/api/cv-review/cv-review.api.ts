import { API } from '../auth/axios';
import type { CvReviewResult } from './cv-review.types';

export async function getLatestCvReview() {
  const response = await API.get<CvReviewResult | null>('/cv-review/me');
  return response.data;
}

export async function createCvReview() {
  const response = await API.post<CvReviewResult>('/cv-review/me');
  return response.data;
}
