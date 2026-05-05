import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import TextInput from '../components/ui/TextInput';
import Button from '../components/ui/Button';
import EmployerVerificationNotice from '../components/ui/EmployerVerificationNotice';
import { useAuth } from '../context/auth/AuthContext';
import { getAllTags } from '../api/tags/tags.api';
import type { Tag } from '../api/tags/tags.types';
import { searchCandidates } from '../api/employer-search/employer-search.api';
import type {
  EmployerSearchFilters,
  EmployerSearchResponse,
  EmployerSearchResultItem,
} from '../api/employer-search/employer-search.types';
import {
  createSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
} from '../api/saved-searches/saved-searches.api';
import type { SavedSearch } from '../api/saved-searches/saved-searches.types';
import {
  addToShortlist,
  getShortlist,
  removeFromShortlist,
} from '../api/shortlist/shortlist.api';
import type { ShortlistEntry } from '../api/shortlist/shortlist.types';
import { formatDate } from '../utils/functionUtils';

type SearchForm = {
  query: string;
  location: string;
  tagId: string;
};

const emptyForm: SearchForm = {
  query: '',
  location: '',
  tagId: '',
};

function parsePreferredCategories(value: string | null) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildFilters(form: SearchForm, page: number): EmployerSearchFilters {
  return {
    query: form.query.trim() || undefined,
    location: form.location.trim() || undefined,
    tagId: form.tagId || undefined,
    page,
  };
}

export default function EmployerSearchPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SearchForm>(emptyForm);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [shortlistEntries, setShortlistEntries] = useState<ShortlistEntry[]>(
    [],
  );
  const [results, setResults] = useState<EmployerSearchResponse | null>(null);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isLoadingSavedSearches, setIsLoadingSavedSearches] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [activeSavedSearchId, setActiveSavedSearchId] = useState<string | null>(
    null,
  );
  const [activeShortlistCandidateId, setActiveShortlistCandidateId] = useState<
    string | null
  >(null);
  const [error, setError] = useState('');
  const [savedSearchMessage, setSavedSearchMessage] = useState('');

  const isVerifiedEmployer = Boolean(
    user?.role === 'EMPLOYER' && user.isVerified,
  );

  async function runSearch(page = 1, nextForm: SearchForm = form) {
    setError('');
    setIsSearching(true);

    try {
      const response = await searchCandidates(buildFilters(nextForm, page));
      setResults(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to search candidates');
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const [allTags, existingSavedSearches, existingShortlist] =
          await Promise.all([
            getAllTags(),
            getSavedSearches(),
            getShortlist(),
          ]);
        setTags(allTags);
        setSavedSearches(existingSavedSearches);
        setShortlistEntries(existingShortlist);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to load search filters',
        );
      } finally {
        setIsLoadingTags(false);
        setIsLoadingSavedSearches(false);
      }
    }

    if (isVerifiedEmployer) {
      bootstrap();
    } else {
      setIsLoadingTags(false);
      setIsLoadingSavedSearches(false);
      setSavedSearches([]);
      setShortlistEntries([]);
    }
  }, [isVerifiedEmployer]);

  useEffect(() => {
    if (isVerifiedEmployer) {
      runSearch(1, emptyForm);
    } else {
      setResults(null);
    }
  }, [isVerifiedEmployer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(1);
  }

  async function handleClear() {
    setForm(emptyForm);
    setSavedSearchMessage('');

    if (isVerifiedEmployer) {
      await runSearch(1, emptyForm);
    }
  }

  async function goToPage(page: number) {
    await runSearch(page);
  }

  async function handleSaveSearch() {
    setError('');
    setSavedSearchMessage('');
    setIsSavingSearch(true);

    try {
      const savedSearch = await createSavedSearch({
        name: savedSearchName.trim() || 'Saved search',
        ...buildFilters(form, 1),
      });
      setSavedSearches((current) => [savedSearch, ...current]);
      setSavedSearchName('');
      setSavedSearchMessage(`Saved "${savedSearch.name}".`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save search');
    } finally {
      setIsSavingSearch(false);
    }
  }

  async function handleApplySavedSearch(savedSearch: SavedSearch) {
    const nextForm = {
      query: savedSearch.query ?? '',
      location: savedSearch.location ?? '',
      tagId: savedSearch.tagId ?? '',
    };
    setForm(nextForm);
    setSavedSearchMessage(`Applied "${savedSearch.name}".`);
    await runSearch(1, nextForm);
  }

  async function handleDeleteSavedSearch(savedSearchId: string) {
    setError('');
    setSavedSearchMessage('');
    setActiveSavedSearchId(savedSearchId);

    try {
      await deleteSavedSearch(savedSearchId);
      setSavedSearches((current) =>
        current.filter((search) => search.id !== savedSearchId),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete saved search');
    } finally {
      setActiveSavedSearchId(null);
    }
  }

  async function handleToggleShortlist(candidateId: string) {
    setError('');
    setSavedSearchMessage('');
    setActiveShortlistCandidateId(candidateId);

    try {
      const existingEntry = shortlistEntries.find(
        (entry) => entry.candidateId === candidateId,
      );

      if (existingEntry) {
        await removeFromShortlist(existingEntry.id);
        setShortlistEntries((current) =>
          current.filter((entry) => entry.id !== existingEntry.id),
        );
      } else {
        await addToShortlist(candidateId);
        const refreshedShortlist = await getShortlist();
        setShortlistEntries(refreshedShortlist);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update shortlist');
    } finally {
      setActiveShortlistCandidateId(null);
    }
  }

  const totalPages = results
    ? Math.max(1, Math.ceil(results.total / results.perPage))
    : 1;

  return (
    <DashboardLayout
      title="Candidate Search"
      subtitle="Search visible candidate CVs by keyword, location, and tags. Contact details stay hidden at this stage."
    >
      <div className="space-y-6">
        {!isVerifiedEmployer ? <EmployerVerificationNotice /> : null}

        <Section
          title="Filters"
          description="Search over visible candidate CVs only. Results are limited to 20 per page."
        >
          <form
            className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]"
            onSubmit={handleSubmit}
          >
            <TextInput
              label="Keyword"
              placeholder="React, backend, Sarajevo"
              value={form.query}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, query: e.target.value }))
              }
              disabled={!isVerifiedEmployer}
            />

            <TextInput
              label="Location"
              placeholder="Sarajevo"
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
              disabled={!isVerifiedEmployer}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Tag
              </span>
              <select
                value={form.tagId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tagId: e.target.value }))
                }
                disabled={!isVerifiedEmployer || isLoadingTags}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={!isVerifiedEmployer || isSearching}
                fullWidth={false}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClear}
                disabled={!isVerifiedEmployer || isSearching}
                className="inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!isVerifiedEmployer ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              Verify your employer account to unlock candidate search.
            </div>
          ) : null}
        </Section>

        <Section
          title="Saved searches"
          description="Save useful filter combinations and rerun them in one click."
        >
          {savedSearchMessage ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {savedSearchMessage}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <TextInput
              label="Search name"
              placeholder="Backend candidates in Sarajevo"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
              disabled={!isVerifiedEmployer || isSavingSearch}
            />

            <div className="flex items-end">
              <Button
                type="button"
                fullWidth={false}
                disabled={!isVerifiedEmployer || isSavingSearch}
                onClick={handleSaveSearch}
              >
                {isSavingSearch ? 'Saving...' : 'Save current filters'}
              </Button>
            </div>
          </div>

          <div className="mt-5">
            {!isVerifiedEmployer ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Verify your employer account to save and reuse searches.
              </div>
            ) : isLoadingSavedSearches ? (
              <p className="text-sm text-slate-500">Loading saved searches...</p>
            ) : savedSearches.length > 0 ? (
              <div className="space-y-3">
                {savedSearches.map((savedSearch) => (
                  <div
                    key={savedSearch.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                          {savedSearch.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Updated {formatDate(savedSearch.updatedAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {savedSearch.query ? (
                            <SearchChip label={`Keyword: ${savedSearch.query}`} />
                          ) : null}
                          {savedSearch.location ? (
                            <SearchChip
                              label={`Location: ${savedSearch.location}`}
                            />
                          ) : null}
                          {savedSearch.tag ? (
                            <SearchChip label={`Tag: ${savedSearch.tag.name}`} />
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          fullWidth={false}
                          className="px-4 py-2"
                          onClick={() => handleApplySavedSearch(savedSearch)}
                        >
                          Run search
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          fullWidth={false}
                          className="px-4 py-2"
                          disabled={activeSavedSearchId === savedSearch.id}
                          onClick={() => handleDeleteSavedSearch(savedSearch.id)}
                        >
                          {activeSavedSearchId === savedSearch.id
                            ? 'Removing...'
                            : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No saved searches yet.
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Results"
          description={
            results
              ? `Showing ${results.items.length} of ${results.total} visible candidates.`
              : 'Search results will appear here.'
          }
        >
          {!isVerifiedEmployer ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Candidate search is unavailable until your employer email is
              verified.
            </div>
          ) : isSearching && !results ? (
            <p className="text-sm text-slate-500">Loading candidates...</p>
          ) : results && results.items.length > 0 ? (
            <div className="space-y-4">
              {results.items.map((candidate) => (
                <CandidateCard
                  key={candidate.cvId}
                  candidate={candidate}
                  shortlistEntry={shortlistEntries.find(
                    (entry) => entry.candidateId === candidate.candidateId,
                  )}
                  isUpdatingShortlist={
                    activeShortlistCandidateId === candidate.candidateId
                  }
                  onToggleShortlist={() =>
                    handleToggleShortlist(candidate.candidateId)
                  }
                />
              ))}

              {totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500">
                    Page {results.page} of {totalPages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(results.page - 1)}
                      disabled={results.page <= 1 || isSearching}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => goToPage(results.page + 1)}
                      disabled={results.page >= totalPages || isSearching}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No visible candidates matched your current filters.
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}

function SearchChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function CandidateCard({
  candidate,
  shortlistEntry,
  isUpdatingShortlist,
  onToggleShortlist,
}: {
  candidate: EmployerSearchResultItem;
  shortlistEntry?: ShortlistEntry;
  isUpdatingShortlist: boolean;
  onToggleShortlist: () => void;
}) {
  const categories = parsePreferredCategories(candidate.preferredJobCategories);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            {candidate.displayName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{candidate.location}</p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {candidate.visibility === 'COMPANY_ONLY'
            ? 'Employer visible'
            : 'Public'}
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
            <p className="mt-2 text-sm text-slate-500">
              No preferred categories listed.
            </p>
          )}
        </div>

        <div>
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
            <p className="mt-2 text-sm text-slate-500">No tags attached.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
        <span>CV updated {formatDate(candidate.updatedAt)}</span>
        <span>Contact details remain hidden</span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/employer/candidates/${candidate.candidateId}`}
          className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          View candidate profile
        </Link>
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          className="px-4 py-2"
          disabled={isUpdatingShortlist}
          onClick={onToggleShortlist}
        >
          {isUpdatingShortlist
            ? 'Updating...'
            : shortlistEntry
              ? 'Remove from shortlist'
              : 'Add to shortlist'}
        </Button>
      </div>
    </article>
  );
}
