export interface CreateContactRequestPayload {
  candidateId: string;
  message?: string;
}

export interface ContactRequestResponse {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  message: string | null;
  candidate: {
    id: string;
    displayName: string;
  };
}

export interface PendingContactRequest {
  id: string;
  employerId: string;
  companyName: string;
  message: string | null;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}
