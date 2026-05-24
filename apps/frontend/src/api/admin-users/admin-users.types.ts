export interface AdminUserListItem {
  id: string;
  email: string;
  role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  displayName: string | null;
  companyName: string | null;
}

export interface AdminUserFilters {
  query?: string;
  role?: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN' | '';
  status?: 'ACTIVE' | 'INACTIVE' | '';
}
