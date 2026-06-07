export interface AdminAnalyticsFilters {
  preset?: '7' | '30' | '90' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface AdminAnalyticsPoint {
  date: string;
  registrations: number;
  contactRequests: number;
  activeCvs: number;
}

export interface AdminAnalyticsResponse {
  range: {
    preset: '7' | '30' | '90' | 'custom';
    label: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalUsers: number;
    activeCvCount: number;
    contactRequestsSent: number;
    registrationsInRange: number;
    cvsInRange: number;
  };
  series: AdminAnalyticsPoint[];
}
