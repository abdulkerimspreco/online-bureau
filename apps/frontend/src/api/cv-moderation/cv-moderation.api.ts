import { API } from '../auth/axios';
import type {
  AdminModerationCandidate,
  AdminModerationCase,
  CandidateModerationCase,
} from './cv-moderation.types';

export async function getAdminModerationCandidates(query = '') {
  const response = await API.get<AdminModerationCandidate[]>(
    '/admin/cv-moderation/candidates',
    {
      params: {
        query,
      },
    },
  );

  return response.data;
}

export async function getAdminModerationCases() {
  const response = await API.get<AdminModerationCase[]>(
    '/admin/cv-moderation/cases',
  );
  return response.data;
}

export async function createAdminModerationCase(
  candidateId: string,
  reason?: string,
) {
  const response = await API.post('/admin/cv-moderation/cases', {
    candidateId,
    reason,
  });
  return response.data;
}

export async function resolveAdminModerationCase(
  caseId: string,
  action: 'DISMISS' | 'ESCALATE',
  note?: string,
) {
  const response = await API.patch(`/admin/cv-moderation/cases/${caseId}/outcome`, {
    action,
    note,
  });
  return response.data;
}

export async function getAdminModerationPreviewFile(caseId: string) {
  const response = await API.get(`/admin/cv-moderation/cases/${caseId}/file`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function getMyModerationCases() {
  const response = await API.get<CandidateModerationCase[]>('/cv-moderation/me');
  return response.data;
}

export async function respondToModerationCase(
  caseId: string,
  decision: 'CONSENT' | 'DECLINE',
) {
  const response = await API.patch(`/cv-moderation/me/${caseId}/decision`, {
    decision,
  });
  return response.data;
}
