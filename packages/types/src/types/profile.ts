export interface JobSeekerProfile {
  id: string;
  userId: string;
  displayName: string;
  location?: string;
  createdAt: Date;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  createdAt: Date;
}
