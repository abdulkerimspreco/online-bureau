import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import {
  getMutedCompanies,
  unmuteCompany,
} from '../api/muted-companies/muted-companies.api';
import type { MutedCompany } from '../api/muted-companies/muted-companies.types';
import { formatDate } from '../utils/functionUtils';

export default function JobSeekerPrivacyPage() {
  const [mutedCompanies, setMutedCompanies] = useState<MutedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEmployerId, setActiveEmployerId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadMutedCompanies() {
      try {
        const items = await getMutedCompanies();
        setMutedCompanies(items);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load privacy settings');
      } finally {
        setIsLoading(false);
      }
    }

    loadMutedCompanies();
  }, []);

  async function handleUnmute(employerId: string) {
    setError('');
    setSuccess('');
    setActiveEmployerId(employerId);

    try {
      await unmuteCompany(employerId);
      setMutedCompanies((current) =>
        current.filter((company) => company.employerId !== employerId),
      );
      setSuccess('Company unmuted successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to unmute company');
    } finally {
      setActiveEmployerId(null);
    }
  }

  return (
    <DashboardLayout
      title="Privacy"
      subtitle="Control which employers can discover you or send new contact requests."
    >
      <Section
        title="Muted companies"
        description="Muted companies are hidden from your search visibility and cannot send new contact requests."
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
            Loading muted companies...
          </div>
        ) : mutedCompanies.length > 0 ? (
          <div className="space-y-3">
            {mutedCompanies.map((company) => (
              <div
                key={company.employerId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {company.companyName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {company.industry || 'Industry not provided'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Muted {formatDate(company.mutedAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {company.employerEmail}
                    </p>
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        Visit company website
                      </a>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth={false}
                    className="px-4 py-2"
                    disabled={activeEmployerId === company.employerId}
                    onClick={() => handleUnmute(company.employerId)}
                  >
                    {activeEmployerId === company.employerId
                      ? 'Updating...'
                      : 'Unmute company'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No muted companies yet.
          </div>
        )}
      </Section>
    </DashboardLayout>
  );
}
