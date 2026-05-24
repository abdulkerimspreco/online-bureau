import { API } from '../auth/axios';
import type { MutedCompany } from './muted-companies.types';

export async function getMutedCompanies() {
  const response = await API.get<MutedCompany[]>('/muted-companies/job-seeker/me');
  return response.data;
}

export async function muteCompany(employerId: string) {
  const response = await API.post<MutedCompany>(
    `/muted-companies/job-seeker/${employerId}`,
  );
  return response.data;
}

export async function unmuteCompany(employerId: string) {
  await API.delete(`/muted-companies/job-seeker/${employerId}`);
}
