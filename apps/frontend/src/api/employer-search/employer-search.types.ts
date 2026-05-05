export interface EmployerSearchFilters {
  query?: string;
  location?: string;
  tagId?: string;
  tagIds?: string[];
  tagMode?: 'ANY' | 'ALL';
  page?: number;
}

export interface EmployerSearchTag {
  id: string;
  name: string;
}

export interface EmployerCandidateContactRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message: string | null;
  createdAt: string;
  updatedAt: string;
  canRequestAgainAt: string | null;
  contactEmail: string | null;
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
  contactRequest: EmployerCandidateContactRequest | null;
}

export interface EmployerSearchResponse {
  items: EmployerSearchResultItem[];
  total: number;
  page: number;
  perPage: number;
}
