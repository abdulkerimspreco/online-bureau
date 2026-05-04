import { API } from '../auth/axios';
import type {
  ContactRequestResponse,
  CreateContactRequestPayload,
  PendingContactRequest,
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
