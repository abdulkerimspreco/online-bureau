import { API } from '../auth/axios';
import type {
  CreateShortlistEntryResponse,
  ShortlistEntry,
} from './shortlist.types';

export async function getShortlist() {
  const response = await API.get<ShortlistEntry[]>('/shortlist/employer/me');
  return response.data;
}

export async function addToShortlist(candidateId: string) {
  const response = await API.post<CreateShortlistEntryResponse>(
    `/shortlist/employer/${candidateId}`,
  );
  return response.data;
}

export async function removeFromShortlist(shortlistEntryId: string) {
  await API.delete(`/shortlist/employer/${shortlistEntryId}`);
}
