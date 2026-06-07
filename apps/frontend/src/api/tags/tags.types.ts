export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTag extends Tag {
  cvCount: number;
  savedSearchCount: number;
}

export type CustomTagRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CustomTagRequest {
  id: string;
  requestedName: string;
  status: CustomTagRequestStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  tag: Tag | null;
  requester: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  reviewedByEmail: string | null;
}
