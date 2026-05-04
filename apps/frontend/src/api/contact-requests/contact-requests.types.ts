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

export interface RespondToContactRequestPayload {
  action: 'ACCEPT' | 'DECLINE';
}

export interface ContactRequestDecisionResponse {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  updatedAt: string;
  candidate: {
    id: string;
    displayName: string;
    email: string | null;
  };
  employer: {
    id: string;
    companyName: string;
  };
}
