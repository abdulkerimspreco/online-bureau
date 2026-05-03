export enum UserRole {
  JOB_SEEKER = "job_seeker",
  EMPLOYER = "employer",
  ADMIN = "admin"
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
