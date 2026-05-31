import { API } from '../auth/axios';
import type {
  AdminAnalyticsFilters,
  AdminAnalyticsResponse,
} from './admin-analytics.types';

export async function getAdminAnalytics(filters: AdminAnalyticsFilters = {}) {
  const response = await API.get<AdminAnalyticsResponse>('/admin/analytics', {
    params: {
      preset: filters.preset ?? '30',
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
  return response.data;
}
