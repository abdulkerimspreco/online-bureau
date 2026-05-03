import { API } from '../auth/axios';
import type {
  EmployerProfile,
  JobSeekerProfile,
  UpdateEmployerProfilePayload,
  UpdateJobSeekerProfilePayload,
} from './profile.types';

export async function getMyJobSeekerProfile() {
  const response = await API.get<JobSeekerProfile>('/job-seekers/getMyProfile');
  return response.data;
}

export async function updateMyJobSeekerProfile(
  payload: UpdateJobSeekerProfilePayload,
) {
  const response = await API.patch<JobSeekerProfile>(
    '/job-seekers/updateMyProfile',
    payload,
  );
  return response.data;
}

export async function getMyEmployerProfile() {
  const response = await API.get<EmployerProfile>('/employers/getMyProfile');
  return response.data;
}

export async function updateMyEmployerProfile(
  payload: UpdateEmployerProfilePayload,
) {
  const response = await API.patch<EmployerProfile>(
    '/employers/updateMyProfile',
    payload,
  );
  return response.data;
}
