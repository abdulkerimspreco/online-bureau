import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import { getJobSeekerContactRequestHistory } from '../api/contact-requests/contact-requests.api';
import type { JobSeekerContactRequestHistoryItem } from '../api/contact-requests/contact-requests.types';
import Button from '../components/ui/Button';
import {
  getMutedCompanies,
  muteCompany,
  unmuteCompany,
} from '../api/muted-companies/muted-companies.api';
import { formatDate } from '../utils/functionUtils';

export default function JobSeekerContactHistoryPage() {
  const [history, setHistory] = useState<JobSeekerContactRequestHistoryItem[]>([]);
  const [mutedEmployerIds, setMutedEmployerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEmployerId, setActiveEmployerId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const [items, mutedCompanies] = await Promise.all([
          getJobSeekerContactRequestHistory(),
          getMutedCompanies(),
        ]);
        setHistory(items);
        setMutedEmployerIds(mutedCompanies.map((company) => company.employerId));
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Failed to load contact request history',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  async function handleToggleMute(item: JobSeekerContactRequestHistoryItem) {
    setError('');
    setSuccess('');
    setActiveEmployerId(item.employerId);

    try {
      if (mutedEmployerIds.includes(item.employerId)) {
        await unmuteCompany(item.employerId);
        setMutedEmployerIds((current) =>
          current.filter((employerId) => employerId !== item.employerId),
        );
        setSuccess(`${item.companyName} can discover you again.`);
      } else {
        await muteCompany(item.employerId);
        setMutedEmployerIds((current) => [...current, item.employerId]);
        setSuccess(
          `${item.companyName} has been muted and can no longer send new contact requests.`,
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to update company mute status',
      );
    } finally {
      setActiveEmployerId(null);
    }
  }

  return (
    <DashboardLayout
      title="Request History"
      subtitle="Review every employer request you have received, including outcomes and unlocked contact details."
    >
      <Section
        title="Employer request timeline"
        description="Pending, accepted, and declined requests stay here as your contact history."
      >
        {success ? (
          <HistoryMessage tone="success">{success}</HistoryMessage>
        ) : null}

        {error ? (
          <HistoryMessage tone="error">{error}</HistoryMessage>
        ) : isLoading ? (
          <HistoryMessage>Loading contact request history...</HistoryMessage>
        ) : history.length === 0 ? (
          <HistoryMessage>No contact request history yet.</HistoryMessage>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <HistoryCard
                key={item.id}
                title={item.companyName}
                subtitle={formatDate(item.updatedAt)}
                status={item.status}
                message={item.message}
                isMuted={mutedEmployerIds.includes(item.employerId)}
                isUpdatingMute={activeEmployerId === item.employerId}
                onToggleMute={() => handleToggleMute(item)}
                detail={
                  item.status === 'ACCEPTED'
                    ? `Employer email: ${item.employerEmail}`
                    : null
                }
              />
            ))}
          </div>
        )}
      </Section>
    </DashboardLayout>
  );
}

function HistoryCard({
  title,
  subtitle,
  status,
  message,
  isMuted,
  isUpdatingMute,
  onToggleMute,
  detail,
}: {
  title: string;
  subtitle: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message: string | null;
  isMuted: boolean;
  isUpdatingMute: boolean;
  onToggleMute: () => void;
  detail?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {message || 'No intro message was included.'}
      </p>

      {detail ? <p className="mt-3 text-sm font-medium text-slate-800">{detail}</p> : null}

      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          className="px-4 py-2"
          disabled={isUpdatingMute}
          onClick={onToggleMute}
        >
          {isUpdatingMute
            ? 'Updating...'
            : isMuted
              ? 'Unmute company'
              : 'Mute company'}
        </Button>
      </div>
    </div>
  );
}

function HistoryMessage({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: 'neutral' | 'error' | 'success';
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        tone === 'error'
          ? 'border border-red-200 bg-red-50 text-red-700'
          : tone === 'success'
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border border-dashed border-slate-300 bg-slate-50 text-slate-600'
      }`}
    >
      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}) {
  const styles =
    status === 'ACCEPTED'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'DECLINED'
        ? 'bg-rose-100 text-rose-800'
        : 'bg-amber-100 text-amber-800';

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
