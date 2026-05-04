import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  getCandidateProfile,
} from '../api/employer-search/employer-search.api';
import type { EmployerSearchResultItem } from '../api/employer-search/employer-search.types';
import { createContactRequest } from '../api/contact-requests/contact-requests.api';
import { formatDate } from '../utils/functionUtils';

function parsePreferredCategories(value: string | null) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EmployerCandidateProfilePage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<EmployerSearchResultItem | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadCandidate() {
      if (!candidateId) {
        setError('Candidate profile not found.');
        setIsLoading(false);
        return;
      }

      setError('');

      try {
        const data = await getCandidateProfile(candidateId);
        setCandidate(data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to load candidate profile',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCandidate();
  }, [candidateId]);

  async function handleRequestContact(e: React.FormEvent) {
    e.preventDefault();

    if (!candidate) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await createContactRequest({
        candidateId: candidate.candidateId,
        message: message.trim() || undefined,
      });
      setCandidate((current) =>
        current
          ? {
              ...current,
              contactRequest: {
                id: response.id,
                status: response.status,
                message: response.message,
                createdAt: response.createdAt,
                updatedAt: response.createdAt,
                canRequestAgainAt: null,
                contactEmail: null,
              },
            }
          : current,
      );
      setSuccess('Contact request sent successfully.');
      setMessage('');
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to send contact request',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const categories = useMemo(
    () => parsePreferredCategories(candidate?.preferredJobCategories ?? null),
    [candidate],
  );

  const currentRequest = candidate?.contactRequest ?? null;
  const canRetryDeclinedRequest =
    currentRequest?.status === 'DECLINED' &&
    (!currentRequest.canRequestAgainAt ||
      new Date(currentRequest.canRequestAgainAt) <= new Date());
  const canSendRequest =
    !currentRequest ||
    (currentRequest.status === 'DECLINED' && canRetryDeclinedRequest);
  const requestStatusLabel =
    currentRequest?.status === 'ACCEPTED'
      ? 'Accepted'
      : currentRequest?.status === 'DECLINED'
        ? 'Declined'
        : currentRequest?.status === 'PENDING'
          ? 'Pending'
          : null;

  return (
    <DashboardLayout
      title="Candidate Profile"
      subtitle="Review candidate details before sending a contact request. Contact details stay hidden until the candidate accepts."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/employer/search"
            className="text-sm font-medium text-slate-900 underline underline-offset-4"
          >
            Back to search
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading candidate profile...</p>
        ) : candidate ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Candidate summary
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {candidate.displayName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {candidate.location}
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {candidate.visibility === 'COMPANY_ONLY'
                    ? 'Employer visible'
                    : 'Public'}
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <InfoBlock
                  label="Preferred categories"
                  value={
                    categories.length > 0
                      ? categories.join(', ')
                      : 'No preferred categories listed.'
                  }
                />
                <InfoBlock
                  label="CV last updated"
                  value={formatDate(candidate.updatedAt)}
                />
              </div>

              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tags
                </p>
                {candidate.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {candidate.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No tags attached.
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-medium text-slate-500">
                Contact request
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Request access
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Send a contact request to this candidate. They will be notified
                in-platform and by email preview, and their contact details stay
                hidden until they accept.
              </p>

              {currentRequest ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Current status
                    </p>
                    {requestStatusLabel ? (
                      <span className="inline-flex w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {requestStatusLabel}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {currentRequest.status === 'ACCEPTED'
                      ? 'This candidate accepted your contact request.'
                      : currentRequest.status === 'PENDING'
                        ? 'Your contact request is waiting for a response.'
                        : currentRequest.canRequestAgainAt &&
                            new Date(currentRequest.canRequestAgainAt) > new Date()
                          ? `This candidate declined your last request. You can try again after ${formatDate(
                              currentRequest.canRequestAgainAt,
                            )}.`
                          : 'This candidate declined your last request. You can send a new request if you still want to connect.'}
                  </p>

                  {currentRequest.message ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Last message: {currentRequest.message}
                    </p>
                  ) : null}

                  {currentRequest.contactEmail ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      Contact email unlocked: {currentRequest.contactEmail}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {canSendRequest ? (
                <form onSubmit={handleRequestContact} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Intro message (optional)
                    </span>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      maxLength={500}
                      rows={6}
                      placeholder="Share a short introduction about the role or why you would like to connect."
                      className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                    />
                    <div className="mt-2 text-right text-xs text-slate-500">
                      {message.length}/500
                    </div>
                  </label>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Sending request...'
                      : currentRequest?.status === 'DECLINED'
                        ? 'Send new request'
                        : 'Request contact'}
                  </Button>
                </form>
              ) : null}
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-900">{value}</p>
    </div>
  );
}
