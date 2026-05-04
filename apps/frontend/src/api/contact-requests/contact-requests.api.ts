import { API } from '../auth/axios';
import type {
  ContactRequestDecisionResponse,
  ContactRequestResponse,
  CreateContactRequestPayload,
  EmployerContactRequestHistoryItem,
  JobSeekerContactRequestHistoryItem,
  PendingContactRequest,
  RespondToContactRequestPayload,
} from './contact-requests.types';

export async function createContactRequest(
  payload: CreateContactRequestPayload,
) {
  const response = await API.post<ContactRequestResponse>(
    '/contact-requests/employer',
    payload,
  );
  return response.data;
}

export async function getPendingContactRequests() {
  const response = await API.get<PendingContactRequest[]>(
    '/contact-requests/job-seeker/pending',
  );
  return response.data;
}

export async function respondToContactRequest(
  requestId: string,
  payload: RespondToContactRequestPayload,
) {
  const response = await API.patch<ContactRequestDecisionResponse>(
    `/contact-requests/job-seeker/${requestId}/respond`,
    payload,
  );
  return response.data;
}

export async function getJobSeekerContactRequestHistory() {
  const response = await API.get<JobSeekerContactRequestHistoryItem[]>(
    '/contact-requests/job-seeker/history',
  );
  return response.data;
}

export async function getEmployerContactRequestHistory() {
  const response = await API.get<EmployerContactRequestHistoryItem[]>(
    '/contact-requests/employer/history',
  );
  return response.data;
}
