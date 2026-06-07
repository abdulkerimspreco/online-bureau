import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import TextInput from '../components/ui/TextInput';
import Button from '../components/ui/Button';
import {
  createAdminModerationCase,
  getAdminModerationCandidates,
  getAdminModerationCases,
  getAdminModerationPreviewFile,
  resolveAdminModerationCase,
} from '../api/cv-moderation/cv-moderation.api';
import type {
  AdminModerationCandidate,
  AdminModerationCase,
} from '../api/cv-moderation/cv-moderation.types';
import { formatDate } from '../utils/functionUtils';

export default function AdminCvModerationPage() {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<AdminModerationCandidate[]>([]);
  const [cases, setCases] = useState<AdminModerationCase[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData(nextQuery = query) {
    setError('');

    try {
      const [nextCandidates, nextCases] = await Promise.all([
        getAdminModerationCandidates(nextQuery),
        getAdminModerationCases(),
      ]);
      setCandidates(nextCandidates);
      setCases(nextCases);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load moderation data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData('');
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await loadData(query);
  }

  async function handleFlag(candidate: AdminModerationCandidate) {
    setError('');
    setSuccess('');
    setActiveCandidateId(candidate.candidateId);

    try {
      await createAdminModerationCase(
        candidate.candidateId,
        reasons[candidate.candidateId]?.trim() || undefined,
      );
      setReasons((current) => ({
        ...current,
        [candidate.candidateId]: '',
      }));
      setSuccess(`Flagged ${candidate.displayName} for moderation review.`);
      await loadData(query);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to flag candidate CV');
    } finally {
      setActiveCandidateId(null);
    }
  }

  async function handlePreview(caseId: string) {
    setError('');

    try {
      const blob = await getAdminModerationPreviewFile(caseId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to open CV preview');
    }
  }

  async function handleResolve(caseId: string, action: 'DISMISS' | 'ESCALATE') {
    setError('');
    setSuccess('');
    setActiveCaseId(caseId);

    try {
      await resolveAdminModerationCase(caseId, action);
      setSuccess(
        action === 'DISMISS'
          ? 'Moderation case dismissed and candidate notified.'
          : 'Moderation case escalated and candidate notified.',
      );
      await loadData(query);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resolve moderation case');
    } finally {
      setActiveCaseId(null);
    }
  }

  const openCases = useMemo(
    () =>
      cases.filter((item) =>
        ['AWAITING_CONSENT', 'PREVIEW_GRANTED', 'DECLINED'].includes(item.status),
      ),
    [cases],
  );

  return (
    <DashboardLayout
      title="CV Review"
      subtitle="Flag candidate CVs, wait for consent, and keep every preview strictly time-limited and auditable."
    >
      <div className="space-y-6">
        <Section
          title="Candidate CVs"
          description="Search candidates with uploaded CVs, then create a moderation case when you need consent to review the file contents."
        >
          <form
            onSubmit={handleSearch}
            className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <TextInput
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Candidate name, email, or location"
            />
            <Button type="submit" fullWidth={false} className="self-end px-6 py-3">
              Search
            </Button>
          </form>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Loading candidates...
            </div>
          ) : candidates.length > 0 ? (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.candidateId}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Info label="Candidate" value={candidate.displayName} />
                      <Info label="Email" value={candidate.email} />
                      <Info label="Location" value={candidate.location} />
                      <Info label="Current visibility" value={candidate.visibility} />
                      <Info label="CV updated" value={formatDate(candidate.uploadedAt)} />
                      <Info
                        label="Moderation state"
                        value={candidate.activeCase ? candidate.activeCase.status : 'No active case'}
                      />
                    </div>

                    <div className="space-y-3">
                      {candidate.activeCase ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          This CV already has an active review case ({candidate.activeCase.status}).
                        </div>
                      ) : null}

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Review reason (optional)
                        </span>
                        <textarea
                          value={reasons[candidate.candidateId] ?? ''}
                          onChange={(e) =>
                            setReasons((current) => ({
                              ...current,
                              [candidate.candidateId]: e.target.value,
                            }))
                          }
                          placeholder="Explain why this CV should be reviewed."
                          rows={4}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                        />
                      </label>

                      <Button
                        type="button"
                        fullWidth={false}
                        disabled={Boolean(candidate.activeCase) || activeCandidateId === candidate.candidateId}
                        onClick={() => handleFlag(candidate)}
                      >
                        {activeCandidateId === candidate.candidateId
                          ? 'Flagging...'
                          : 'Flag for review'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No candidate CVs matched this search.
            </div>
          )}
        </Section>

        <Section
          title="Moderation cases"
          description="Preview access only becomes available after the candidate explicitly consents, and every file open is audit-logged."
        >
          {openCases.length > 0 ? (
            <div className="space-y-4">
              {openCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Info label="Candidate" value={caseItem.candidateName} />
                      <Info label="Email" value={caseItem.candidateEmail} />
                      <Info label="Status" value={caseItem.status} />
                      <Info label="Location" value={caseItem.location} />
                      <Info label="Flagged" value={formatDate(caseItem.createdAt)} />
                      <Info label="Consent deadline" value={formatDate(caseItem.consentDeadlineAt)} />
                      <Info
                        label="Preview expires"
                        value={caseItem.previewExpiresAt ? formatDate(caseItem.previewExpiresAt) : '—'}
                      />
                      <Info
                        label="Reason"
                        value={caseItem.reason || 'No reason supplied.'}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 md:max-w-[320px] md:justify-end">
                      {caseItem.canPreview ? (
                        <Button
                          type="button"
                          fullWidth={false}
                          className="px-4 py-2"
                          onClick={() => handlePreview(caseItem.id)}
                        >
                          Preview CV
                        </Button>
                      ) : null}
                      {caseItem.canResolve ? (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            fullWidth={false}
                            className="px-4 py-2"
                            disabled={activeCaseId === caseItem.id}
                            onClick={() => handleResolve(caseItem.id, 'DISMISS')}
                          >
                            {activeCaseId === caseItem.id ? 'Updating...' : 'Dismiss'}
                          </Button>
                          <Button
                            type="button"
                            fullWidth={false}
                            className="px-4 py-2"
                            disabled={activeCaseId === caseItem.id}
                            onClick={() => handleResolve(caseItem.id, 'ESCALATE')}
                          >
                            {activeCaseId === caseItem.id ? 'Updating...' : 'Escalate'}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No open moderation cases right now.
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
