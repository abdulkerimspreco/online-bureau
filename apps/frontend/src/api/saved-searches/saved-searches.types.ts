export interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  location: string | null;
  tagId: string | null;
  tagIds: string[];
  tagMode: 'ANY' | 'ALL' | null;
  tag: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchPayload {
  name: string;
  query?: string;
  location?: string;
  tagId?: string;
  tagIds?: string[];
  tagMode?: 'ANY' | 'ALL';
}
