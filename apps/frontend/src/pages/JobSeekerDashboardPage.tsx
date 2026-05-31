import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Section from '../components/ui/Section';
import { useAuth } from '../context/auth/AuthContext';
import {
  getPendingContactRequests,
  respondToContactRequest,
} from '../api/contact-requests/contact-requests.api';
import { muteCompany } from '../api/muted-companies/muted-companies.api';
import type { PendingContactRequest } from '../api/contact-requests/contact-requests.types';

export default function JobSeekerDashboardPage() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PendingContactRequest[]>([]);
  const [requestsError, setRequestsError] = useState('');
  const [requestActionMessage, setRequestActionMessage] = useState('');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPendingRequests() {
      try {
        const requests = await getPendingContactRequests();
        setPendingRequests(requests);
      } catch (err: any) {
        setRequestsError(
          err?.response?.data?.message || 'Failed to load contact requests',
        );
      }
    }

    loadPendingRequests();
  }, []);

  async function handleRequestDecision(
    requestId: string,
    action: 'ACCEPT' | 'DECLINE',
  ) {
    setRequestsError('');
    setRequestActionMessage('');
    setActiveRequestId(requestId);

    try {
      const response = await respondToContactRequest(requestId, { action });
      setPendingRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );
      setRequestActionMessage(
        action === 'ACCEPT'
          ? `Accepted ${response.employer.companyName}. Their team can now contact you at ${response.candidate.email}.`
          : `Declined ${response.employer.companyName}. They can send another request after the cooldown period.`,
      );
    } catch (err: any) {
      setRequestsError(
        err?.response?.data?.message || 'Failed to update contact request',
      );
    } finally {
      setActiveRequestId(null);
    }
  }

  async function handleMuteCompany(request: PendingContactRequest) {
    setRequestsError('');
    setRequestActionMessage('');
    setActiveRequestId(request.id);

    try {
      await muteCompany(request.employerId);
      setPendingRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );
      setRequestActionMessage(
        `${request.companyName} has been muted and can no longer send new contact requests.`,
      );
    } catch (err: any) {
      setRequestsError(
        err?.response?.data?.message || 'Failed to mute company',
      );
    } finally {
      setActiveRequestId(null);
    }
  }

  return (
    <DashboardLayout
      title="Overview"
      subtitle="Your candidate workspace for managing profile visibility, CV uploads, and discoverability."
    >
      <div className="space-y-6">
        <Section
          title="Pending contact requests"
          description="Employers who want to reach you will appear here first."
        >
          {requestActionMessage ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {requestActionMessage}
            </div>
          ) : null}

          {requestsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {requestsError}
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-950">
                        {request.companyName}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Pending
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {request.message || 'No intro message was included.'}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      fullWidth={false}
                      className="min-w-[152px] px-4 py-2"
                      disabled={activeRequestId === request.id}
                      onClick={() => handleRequestDecision(request.id, 'ACCEPT')}
                    >
                      {activeRequestId === request.id
                        ? 'Updating...'
                        : 'Accept request'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth={false}
                      className="min-w-[120px] px-4 py-2"
                      disabled={activeRequestId === request.id}
                      onClick={() => handleRequestDecision(request.id, 'DECLINE')}
                    >
                      Decline
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth={false}
                      className="min-w-[140px] px-4 py-2"
                      disabled={activeRequestId === request.id}
                      onClick={() => handleMuteCompany(request)}
                    >
                      Mute company
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No contact requests yet.
            </div>
          )}
        </Section>

        <Section
          title="Account summary"
          description="Basic information about your current session."
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Role
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {user?.role}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Verification
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {user?.isVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Candidate setup"
          description="Complete these steps to make your profile useful for employers."
        >
          <div className="divide-y divide-slate-200">
            <DashboardAction
              title="Complete your profile"
              description="Update your display name, location, and preferred categories."
              to="/job-seeker/profile"
            />
            <DashboardAction
              title="Upload your CV"
              description="Upload or replace your current CV and manage privacy settings."
              to="/job-seeker/cv"
            />
            <DashboardAction
              title="Attach tags"
              description="Add skills and role tags to improve employer search results."
              to="/job-seeker/tags"
            />
            <DashboardAction
              title="Review request history"
              description="See every employer decision and keep accepted contact details in one place."
              to="/job-seeker/requests"
            />
            <DashboardAction
              title="Manage privacy settings"
              description="Mute companies that should no longer discover you or send new requests."
              to="/job-seeker/privacy"
            />
            <DashboardAction
              title="Respond to CV review requests"
              description="Review any admin moderation requests, grant or decline preview access, and track outcomes."
              to="/job-seeker/cv-moderation"
            />
            <DashboardAction
              title="Open notification centre"
              description="Keep unread employer activity and request updates visible in one inbox."
              to="/job-seeker/notifications"
            />
          </div>
        </Section>

        <Section
          title="Upcoming modules"
          description="These features are planned for the next backend/frontend iteration."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock title="Activity feed" text="Keep CV updates, employer responses, and account changes visible in one place." />
            <InfoBlock title="AI review" text="Optional CV review and improvement suggestions." />
            <InfoBlock title="Privacy controls" text="Refine what employers can access as the platform grows." />
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}

function DashboardAction({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <Link
        to={to}
        className="inline-flex w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Open
      </Link>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
