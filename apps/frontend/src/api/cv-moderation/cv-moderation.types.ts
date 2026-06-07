export interface AdminModerationCandidateActiveCase {
  id: string;
  status: string;
  reason: string | null;
  createdAt: string;
  consentDeadlineAt: string;
  previewExpiresAt: string | null;
  flaggedByAdminEmail: string;
  isConsentExpired: boolean;
  isPreviewExpired: boolean;
}

export interface AdminModerationCandidate {
  candidateId: string;
  cvId: string;
  displayName: string;
  email: string;
  location: string;
  visibility: string;
  uploadedAt: string;
  activeCase: AdminModerationCandidateActiveCase | null;
}

export interface AdminModerationCase {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  location: string;
  flaggedByCurrentAdmin: boolean;
  status: string;
  reason: string | null;
  previousVisibility: string | null;
  consentDeadlineAt: string;
  candidateRespondedAt: string | null;
  previewGrantedAt: string | null;
  previewExpiresAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canPreview: boolean;
  canResolve: boolean;
  isConsentExpired: boolean;
  isPreviewExpired: boolean;
}

export interface CandidateModerationCase {
  id: string;
  status: string;
  reason: string | null;
  adminEmail: string;
  consentDeadlineAt: string;
  candidateRespondedAt: string | null;
  previewExpiresAt: string | null;
  previousVisibility: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canRespond: boolean;
  isConsentExpired: boolean;
}
