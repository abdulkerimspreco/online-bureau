import { API } from '../auth/axios';
import type {
  CreateSavedSearchPayload,
  SavedSearch,
} from './saved-searches.types';

export async function getSavedSearches() {
  const response = await API.get<SavedSearch[]>('/saved-searches/employer/me');
  return response.data;
}

export async function createSavedSearch(payload: CreateSavedSearchPayload) {
  const response = await API.post<SavedSearch>('/saved-searches/employer', payload);
  return response.data;
}

export async function deleteSavedSearch(savedSearchId: string) {
  await API.delete(`/saved-searches/employer/${savedSearchId}`);
}
