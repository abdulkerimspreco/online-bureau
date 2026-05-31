import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import { getAdminOpsSummary } from '../api/admin-ops/admin-ops.api';
import type { AdminOpsResponse } from '../api/admin-ops/admin-ops.types';
import { formatDate } from '../utils/functionUtils';

export default function AdminOpsPage() {
  const [summary, setSummary] = useState<AdminOpsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await getAdminOpsSummary();
        setSummary(result);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load ops summary');
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();
  }, []);

  return (
    <DashboardLayout
      title="Ops"
      subtitle="Live operational visibility for latency thresholds, recent alerts, and observed uptime since the latest restart."
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Loading ops summary...
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Service status"
                value={summary.status.toUpperCase()}
                hint={`Started ${formatDate(summary.startedAt)}`}
              />
              <StatCard
                label="Observed uptime"
                value={formatUptime(summary.uptimeSeconds)}
                hint={summary.summary.uptimeTarget}
              />
              <StatCard
                label="Alerts in last hour"
                value={String(summary.recentAlertCount)}
                hint="Any threshold breach is recorded immediately."
              />
              <StatCard
                label="Critical alerts in 24h"
                value={String(summary.summary.criticalAlertsLast24Hours)}
                hint={`${summary.summary.totalAlertsLast24Hours} total alerts in 24h`}
              />
            </div>

            <Section
              title="Tracked thresholds"
              description="These are the current target timings we are validating against in Release 2."
            >
              <div className="space-y-3">
                {summary.thresholds.map((threshold) => (
                  <div
                    key={threshold.metricKey}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                          {threshold.route}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {threshold.description || threshold.metricKey}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                        {threshold.thresholdMs}ms target
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Recent alerts"
              description="Alerts are deduplicated per metric for one minute to avoid noisy spam during repeated threshold breaches."
            >
              {summary.alerts.length > 0 ? (
                <div className="space-y-3">
                  {summary.alerts.map((alert) => (
                    <article
                      key={alert.id}
                      className={`rounded-2xl border p-4 ${
                        alert.severity === 'CRITICAL'
                          ? 'border-red-200 bg-red-50'
                          : 'border-amber-200 bg-amber-50'
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-950">
                              {alert.route}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {alert.message}
                          </p>
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDate(alert.createdAt)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <Metric label="Observed" value={`${alert.observedMs}ms`} />
                        <Metric label="Threshold" value={`${alert.thresholdMs}ms`} />
                        <Metric label="Metric key" value={alert.metricKey} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No recent alerts recorded.
                </div>
              )}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}
