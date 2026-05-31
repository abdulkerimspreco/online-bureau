import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import {
  attachTagToMyCv,
  createCustomTagRequest,
  getAllTags,
  getMyCustomTagRequests,
  getMyCvTags,
  removeTagFromMyCv,
} from '../api/tags/tags.api';
import type { CustomTagRequest, Tag } from '../api/tags/tags.types';
import TextInput from '../components/ui/TextInput';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/functionUtils';

export default function TagsPage() {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [myTags, setMyTags] = useState<Tag[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomTagRequest[]>([]);
  const [requestedTagName, setRequestedTagName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    setError('');

    try {
      const [all, mine, requests] = await Promise.all([
        getAllTags(),
        getMyCvTags(),
        getMyCustomTagRequests(),
      ]);
      setAllTags(all);
      setMyTags(mine);
      setCustomRequests(requests);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const myTagIds = useMemo(() => new Set(myTags.map((tag) => tag.id)), [myTags]);

  async function handleAttach(tagId: string) {
    setBusyTagId(tagId);
    setError('');
    setSuccess('');

    try {
      await attachTagToMyCv(tagId);
      const updatedMyTags = await getMyCvTags();
      setMyTags(updatedMyTags);
      setSuccess('Tag attached successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to attach tag');
    } finally {
      setBusyTagId(null);
    }
  }

  async function handleRemove(tagId: string) {
    setBusyTagId(tagId);
    setError('');
    setSuccess('');

    try {
      await removeTagFromMyCv(tagId);
      const updatedMyTags = await getMyCvTags();
      setMyTags(updatedMyTags);
      setSuccess('Tag removed successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove tag');
    } finally {
      setBusyTagId(null);
    }
  }

  async function handleRequestCustomTag(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmittingRequest(true);

    try {
      const request = await createCustomTagRequest(requestedTagName);
      setCustomRequests((current) => [request, ...current]);
      setRequestedTagName('');
      setSuccess(`Requested "${request.requestedName}" for admin review.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to request custom tag');
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  return (
    <DashboardLayout
      title="My Tags"
      subtitle="Manage the tags attached to your CV so employers can find you more easily."
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <p className="text-sm font-medium text-slate-500">Attached to your CV</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Current tags
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These tags help employers discover your profile in search.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="mt-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading your tags...</p>
            ) : myTags.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No tags attached yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {myTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm cursor-pointer text-slate-800"
                    onClick={() => handleRemove(tag.id)}
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      disabled={busyTagId === tag.id}
                      className="text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Available tags</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Add more tags
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose tags that best represent your skills, role, and experience.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading available tags...</p>
            ) : allTags.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No tags available yet.
              </div>
            ) : (
              allTags.map((tag) => {
                const attached = myTagIds.has(tag.id);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={attached || busyTagId === tag.id}
                    onClick={() => handleAttach(tag.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      attached
                        ? 'cursor-not-allowed bg-emerald-100 text-emerald-700'
                        : 'bg-slate-900 cursor-pointer text-white hover:bg-slate-800 disabled:opacity-60'
                    }`}
                  >
                    {attached ? `${tag.name} ✓` : `Add ${tag.name}`}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            You need at least 1 tag on your CV, and your backend currently limits a CV to 20 tags.
          </div>
        </Card>
        </div>

        <Card>
          <p className="text-sm font-medium text-slate-500">Custom tag requests</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Need a new tag?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Request a tag that is missing from the platform. Admins can approve it and attach it to your CV automatically.
          </p>

          <form
            onSubmit={handleRequestCustomTag}
            className="mt-6 flex flex-col gap-3 md:flex-row md:items-end"
          >
            <TextInput
              label="Requested tag"
              value={requestedTagName}
              onChange={(e) => setRequestedTagName(e.target.value)}
              placeholder="Rust"
            />
            <Button type="submit" fullWidth={false} disabled={isSubmittingRequest}>
              {isSubmittingRequest ? 'Submitting...' : 'Request tag'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading request history...</p>
            ) : customRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No custom tag requests yet.
              </div>
            ) : (
              customRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {request.requestedName}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            request.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : request.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {request.status.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Requested {formatDate(request.createdAt)}
                        {request.reviewedAt
                          ? ` • reviewed ${formatDate(request.reviewedAt)}`
                          : ''}
                      </p>
                      {request.tag ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Linked tag: <span className="font-medium text-slate-900">{request.tag.name}</span>
                        </p>
                      ) : null}
                    </div>

                    {request.reviewedByEmail ? (
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Reviewed by {request.reviewedByEmail}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
