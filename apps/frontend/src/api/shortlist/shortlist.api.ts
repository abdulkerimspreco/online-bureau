import { API } from '../auth/axios';
import type {
  CreateShortlistEntryResponse,
  ShortlistFolder,
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

export async function getShortlistFolders() {
  const response = await API.get<ShortlistFolder[]>('/shortlist/employer/folders');
  return response.data;
}

export async function createShortlistFolder(name: string) {
  const response = await API.post<ShortlistFolder>('/shortlist/employer/folders', {
    name,
  });
  return response.data;
}

export async function deleteShortlistFolder(folderId: string) {
  await API.delete(`/shortlist/employer/folders/${folderId}`);
}

export async function addShortlistEntryToFolder(
  folderId: string,
  shortlistEntryId: string,
) {
  await API.post(
    `/shortlist/employer/folders/${folderId}/entries/${shortlistEntryId}`,
  );
}

export async function removeShortlistEntryFromFolder(
  folderId: string,
  shortlistEntryId: string,
) {
  await API.delete(
    `/shortlist/employer/folders/${folderId}/entries/${shortlistEntryId}`,
  );
}
