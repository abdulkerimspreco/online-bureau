import { API } from '../auth/axios';
import type {
  EmployerSearchFilters,
  EmployerSearchResponse,
} from './employer-search.types';

export async function searchCandidates(filters: EmployerSearchFilters) {
  const response = await API.get<EmployerSearchResponse>('/employers/search', {
    params: filters,
  });

  return response.data;
}
