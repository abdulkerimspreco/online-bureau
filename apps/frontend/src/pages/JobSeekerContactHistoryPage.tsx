import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import { getJobSeekerContactRequestHistory } from '../api/contact-requests/contact-requests.api';
import type { JobSeekerContactRequestHistoryItem } from '../api/contact-requests/contact-requests.types';
import { formatDate } from '../utils/functionUtils';

export default function JobSeekerContactHistoryPage() {
  const [history, setHistory] = useState<JobSeekerContactRequestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const items = await getJobSeekerContactRequestHistory();
        setHistory(items);
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

  return (
    <DashboardLayout
      title="Request History"
      subtitle="Review every employer request you have received, including outcomes and unlocked contact details."
    >
      <Section
        title="Employer request timeline"
        description="Pending, accepted, and declined requests stay here as your contact history."
      >
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
  detail,
}: {
  title: string;
  subtitle: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message: string | null;
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
    </div>
  );
}

function HistoryMessage({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        tone === 'error'
          ? 'border border-red-200 bg-red-50 text-red-700'
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
