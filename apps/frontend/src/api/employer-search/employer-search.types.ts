export interface EmployerSearchFilters {
  query?: string;
  location?: string;
  tagId?: string;
  page?: number;
}

export interface EmployerSearchTag {
  id: string;
  name: string;
}

export interface EmployerSearchResultItem {
  cvId: string;
  candidateId: string;
  displayName: string;
  location: string;
  preferredJobCategories: string | null;
  visibility: 'PRIVATE' | 'PUBLIC' | 'COMPANY_ONLY';
  createdAt: string;
  updatedAt: string;
  tags: EmployerSearchTag[];
}

export interface EmployerSearchResponse {
  items: EmployerSearchResultItem[];
  total: number;
  page: number;
  perPage: number;
}
