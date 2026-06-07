import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import {
  getMyModerationCases,
  respondToModerationCase,
} from '../api/cv-moderation/cv-moderation.api';
import type { CandidateModerationCase } from '../api/cv-moderation/cv-moderation.types';
import { formatDate } from '../utils/functionUtils';

export default function JobSeekerCvModerationPage() {
  const [cases, setCases] = useState<CandidateModerationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadCases() {
    setError('');

    try {
      const items = await getMyModerationCases();
      setCases(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load moderation cases');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function handleDecision(caseId: string, decision: 'CONSENT' | 'DECLINE') {
    setError('');
    setSuccess('');
    setActiveCaseId(caseId);

    try {
      await respondToModerationCase(caseId, decision);
      setSuccess(
        decision === 'CONSENT'
          ? 'You granted a 30-minute admin preview window for this review.'
          : 'You declined admin preview for this review request.',
      );
      await loadCases();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update moderation case');
    } finally {
      setActiveCaseId(null);
    }
  }

  return (
    <DashboardLayout
      title="CV Review"
      subtitle="Admin review requests temporarily hide your CV until you choose whether to allow a 30-minute preview."
    >
      <div className="space-y-6">
        <Section
          title="Moderation requests"
          description="You have 72 hours to consent or decline whenever an admin requests temporary preview access."
        >
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
              Loading review cases...
            </div>
          ) : cases.length > 0 ? (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <article
                  key={caseItem.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Info label="Status" value={caseItem.status} />
                    <Info label="Requested" value={formatDate(caseItem.createdAt)} />
                    <Info label="Consent deadline" value={formatDate(caseItem.consentDeadlineAt)} />
                    <Info
                      label="Preview expires"
                      value={caseItem.previewExpiresAt ? formatDate(caseItem.previewExpiresAt) : '—'}
                    />
                    <Info label="Reason" value={caseItem.reason || 'No reason supplied.'} />
                    <Info label="Reviewer" value={caseItem.adminEmail} />
                    <Info
                      label="Visibility restore target"
                      value={caseItem.previousVisibility || 'Remain private'}
                    />
                    <Info
                      label="Resolved"
                      value={caseItem.resolvedAt ? formatDate(caseItem.resolvedAt) : '—'}
                    />
                  </div>

                  {caseItem.canRespond ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        fullWidth={false}
                        className="min-w-[160px] px-4 py-2"
                        disabled={activeCaseId === caseItem.id}
                        onClick={() => handleDecision(caseItem.id, 'CONSENT')}
                      >
                        {activeCaseId === caseItem.id ? 'Updating...' : 'Allow preview'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        className="min-w-[160px] px-4 py-2"
                        disabled={activeCaseId === caseItem.id}
                        onClick={() => handleDecision(caseItem.id, 'DECLINE')}
                      >
                        Decline preview
                      </Button>
                    </div>
                  ) : caseItem.isConsentExpired ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      The 72-hour consent window expired before a decision was recorded.
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No CV review requests yet.
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
