import { API } from '../auth/axios';
import type {
  JobSeekerProfile,
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
