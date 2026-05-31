import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { getAdminAnalytics } from '../api/admin-analytics/admin-analytics.api';
import type {
  AdminAnalyticsFilters,
  AdminAnalyticsPoint,
  AdminAnalyticsResponse,
} from '../api/admin-analytics/admin-analytics.types';
import { formatDate } from '../utils/functionUtils';

const presetOptions: Array<{ value: '7' | '30' | '90' | 'custom'; label: string }> =
  [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' },
  ];

const emptyFilters: AdminAnalyticsFilters = {
  preset: '30',
  startDate: '',
  endDate: '',
};

export default function AdminAnalyticsPage() {
  const [filters, setFilters] = useState<AdminAnalyticsFilters>(emptyFilters);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAnalytics(nextFilters: AdminAnalyticsFilters) {
    setError('');

    try {
      const result = await getAdminAnalytics(nextFilters);
      setAnalytics(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(emptyFilters);
  }, []);

  async function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await loadAnalytics(filters);
  }

  const maxPointValue = useMemo(() => {
    if (!analytics || analytics.series.length === 0) return 1;

    return Math.max(
      1,
      ...analytics.series.flatMap((point) => [
        point.registrations,
        point.contactRequests,
        point.activeCvs,
      ]),
    );
  }, [analytics]);

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Anonymised platform activity across users, CVs, and employer outreach."
    >
      <div className="space-y-6">
        <Section
          title="Date range"
          description="Switch between standard windows or provide a custom date range for the chart and table below."
        >
          <form
            onSubmit={handleApplyFilters}
            className="grid gap-4 lg:grid-cols-[220px_180px_180px_auto]"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Preset
              </span>
              <select
                value={filters.preset ?? '30'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    preset: e.target.value as AdminAnalyticsFilters['preset'],
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                {presetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Start date
              </span>
              <input
                type="date"
                value={filters.startDate ?? ''}
                disabled={filters.preset !== 'custom'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                End date
              </span>
              <input
                type="date"
                value={filters.endDate ?? ''}
                disabled={filters.preset !== 'custom'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <Button type="submit" fullWidth={false} className="self-end px-6 py-3">
              Apply
            </Button>
          </form>
        </Section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Loading analytics...
          </div>
        ) : analytics ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total users"
                value={String(analytics.summary.totalUsers)}
                hint={`${analytics.summary.registrationsInRange} registrations in ${analytics.range.label.toLowerCase()}`}
              />
              <StatCard
                label="Active CVs"
                value={String(analytics.summary.activeCvCount)}
                hint={`${analytics.summary.cvsInRange} new CVs in ${analytics.range.label.toLowerCase()}`}
              />
              <StatCard
                label="Contact requests sent"
                value={String(analytics.summary.contactRequestsSent)}
                hint={`Within ${analytics.range.label.toLowerCase()}`}
              />
              <StatCard
                label="Reporting window"
                value={analytics.range.label}
                hint={`${analytics.range.startDate} to ${analytics.range.endDate}`}
              />
            </div>

            <Section
              title="Chart view"
              description="Daily anonymised activity across registrations, contact requests, and CV uploads."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analytics.series.map((point) => (
                  <ChartCard
                    key={point.date}
                    point={point}
                    maxPointValue={maxPointValue}
                  />
                ))}
              </div>
            </Section>

            <Section
              title="Table view"
              description="The same analytics data presented in tabular form for easier comparison or export."
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Registrations</th>
                      <th className="px-3 py-3 font-medium">Contact requests</th>
                      <th className="px-3 py-3 font-medium">New CVs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.series.map((point) => (
                      <tr key={point.date} className="text-slate-700">
                        <td className="px-3 py-3">{formatDate(point.date)}</td>
                        <td className="px-3 py-3">{point.registrations}</td>
                        <td className="px-3 py-3">{point.contactRequests}</td>
                        <td className="px-3 py-3">{point.activeCvs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}

function ChartCard({
  point,
  maxPointValue,
}: {
  point: AdminAnalyticsPoint;
  maxPointValue: number;
}) {
  const registrationHeight = `${Math.max(
    8,
    (point.registrations / maxPointValue) * 100,
  )}%`;
  const requestHeight = `${Math.max(
    8,
    (point.contactRequests / maxPointValue) * 100,
  )}%`;
  const cvHeight = `${Math.max(8, (point.activeCvs / maxPointValue) * 100)}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {formatDate(point.date)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            Daily activity
          </p>
        </div>
        <div className="flex items-end gap-2 h-24 min-w-[84px]">
          <Bar height={registrationHeight} color="bg-slate-950" />
          <Bar height={requestHeight} color="bg-emerald-500" />
          <Bar height={cvHeight} color="bg-amber-400" />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <Legend label="Registrations" value={point.registrations} swatch="bg-slate-950" />
        <Legend
          label="Contact requests"
          value={point.contactRequests}
          swatch="bg-emerald-500"
        />
        <Legend label="New CVs" value={point.activeCvs} swatch="bg-amber-400" />
      </div>
    </div>
  );
}

function Bar({ height, color }: { height: string; color: string }) {
  return (
    <div className="flex h-full w-5 items-end rounded-full bg-white px-1 py-1">
      <div className={`w-full rounded-full ${color}`} style={{ height }} />
    </div>
  );
}

function Legend({
  label,
  value,
  swatch,
}: {
  label: string;
  value: number;
  swatch: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${swatch}`} />
        <span>{label}</span>
      </div>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
