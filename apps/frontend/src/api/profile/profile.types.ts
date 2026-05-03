export interface ProfileUser {
  id: string;
  email: string;
  role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
}

export interface JobSeekerProfile {
  id: string;
  userId: string;
  displayName: string;
  location: string;
  preferredJobCategories: string | null;
  createdAt: string;
  updatedAt: string;
  user: ProfileUser;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  description: string | null;
  website: string | null;
  industry: string;
  companySize: string | null;
  createdAt: string;
  updatedAt: string;
  user: ProfileUser;
}

export interface UpdateJobSeekerProfilePayload {
  displayName?: string;
  location?: string;
  preferredJobCategories?: string;
}

export interface UpdateEmployerProfilePayload {
  companyName?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
}
