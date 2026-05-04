import { API } from '../auth/axios';
import type {
  EmployerSearchFilters,
  EmployerSearchResponse,
  EmployerSearchResultItem,
} from './employer-search.types';

export async function searchCandidates(filters: EmployerSearchFilters) {
  const response = await API.get<EmployerSearchResponse>('/employers/search', {
    params: filters,
  });

  return response.data;
}

export async function getCandidateProfile(candidateId: string) {
  const response = await API.get<EmployerSearchResultItem>(
    `/employers/candidates/${candidateId}`,
  );

  return response.data;
}
