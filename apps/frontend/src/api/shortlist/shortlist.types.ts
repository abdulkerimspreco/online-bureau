export interface ShortlistEntry {
  id: string;
  candidateId: string;
  displayName: string;
  location: string;
  preferredJobCategories: string | null;
  cvUpdatedAt: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'COMPANY_ONLY';
  tags: Array<{
    id: string;
    name: string;
  }>;
  addedAt: string;
  contactRequestStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null;
  contactEmail: string | null;
  folders: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateShortlistEntryResponse {
  id: string;
  employerId: string;
  candidateId: string;
  createdAt?: string;
}

export interface ShortlistFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  shortlistEntryIds: string[];
}
