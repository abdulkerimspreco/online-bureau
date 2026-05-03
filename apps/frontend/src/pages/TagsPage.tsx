import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import {
  attachTagToMyCv,
  getAllTags,
  getMyCvTags,
  removeTagFromMyCv,
} from '../api/tags/tags.api';
import type { Tag } from '../api/tags/tags.types';

export default function TagsPage() {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [myTags, setMyTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    setError('');

    try {
      const [all, mine] = await Promise.all([getAllTags(), getMyCvTags()]);
      setAllTags(all);
      setMyTags(mine);
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

  return (
    <DashboardLayout
      title="My Tags"
      subtitle="Manage the tags attached to your CV so employers can find you more easily."
    >
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
    </DashboardLayout>
  );
}