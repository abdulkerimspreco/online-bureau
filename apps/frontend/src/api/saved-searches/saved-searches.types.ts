export interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  location: string | null;
  tagId: string | null;
  tag: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchPayload {
  name: string;
  query?: string;
  location?: string;
  tagId?: string;
}
