import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { getShortlist, removeFromShortlist } from '../api/shortlist/shortlist.api';
import type { ShortlistEntry } from '../api/shortlist/shortlist.types';
import { formatDate } from '../utils/functionUtils';

function parsePreferredCategories(value: string | null) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EmployerShortlistPage() {
  const [entries, setEntries] = useState<ShortlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadShortlist() {
      try {
        const items = await getShortlist();
        setEntries(items);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to load shortlist',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadShortlist();
  }, []);

  async function handleRemove(entryId: string) {
    setActiveEntryId(entryId);
    setError('');

    try {
      await removeFromShortlist(entryId);
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove shortlist entry');
    } finally {
      setActiveEntryId(null);
    }
  }

  return (
    <DashboardLayout
      title="Candidate Shortlist"
      subtitle="Keep promising candidate profiles in one place and revisit them without rerunning search."
    >
      <Section
        title="Shortlisted candidates"
        description="Each entry keeps the candidate summary, skill tags, and latest contact state together."
      >
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Loading shortlist...
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <ShortlistCard
                key={entry.id}
                entry={entry}
                isRemoving={activeEntryId === entry.id}
                onRemove={() => handleRemove(entry.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No shortlisted candidates yet.
          </div>
        )}
      </Section>
    </DashboardLayout>
  );
}

function ShortlistCard({
  entry,
  isRemoving,
  onRemove,
}: {
  entry: ShortlistEntry;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const categories = useMemo(
    () => parsePreferredCategories(entry.preferredJobCategories),
    [entry.preferredJobCategories],
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            {entry.displayName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{entry.location}</p>
          <p className="mt-2 text-sm text-slate-500">
            Added {formatDate(entry.addedAt)}
          </p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {entry.visibility === 'COMPANY_ONLY' ? 'Employer visible' : 'Public'}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Preferred categories
          </p>
          {categories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No preferred categories listed.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Tags
          </p>
          {entry.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No tags attached.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
        <span>CV updated {formatDate(entry.cvUpdatedAt)}</span>
        <span>
          {entry.contactRequestStatus === 'ACCEPTED' && entry.contactEmail
            ? `Contact unlocked: ${entry.contactEmail}`
            : entry.contactRequestStatus === 'PENDING'
              ? 'Contact request pending'
              : entry.contactRequestStatus === 'DECLINED'
                ? 'Contact request declined'
                : 'No contact request sent yet'}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/employer/candidates/${entry.candidateId}`}
          className="inline-flex w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          View candidate profile
        </Link>
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          className="px-4 py-2"
          disabled={isRemoving}
          onClick={onRemove}
        >
          {isRemoving ? 'Removing...' : 'Remove from shortlist'}
        </Button>
      </div>
    </article>
  );
}
