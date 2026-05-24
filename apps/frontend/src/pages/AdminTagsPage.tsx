import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import {
  createAdminTag,
  deleteAdminTag,
  getAdminTags,
  renameAdminTag,
} from '../api/tags/tags.api';
import type { AdminTag } from '../api/tags/tags.types';
import { formatDate } from '../utils/functionUtils';

export default function AdminTagsPage() {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadTags() {
    setError('');

    try {
      const items = await getAdminTags();
      setTags(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCreating(true);

    try {
      const createdTag = await createAdminTag(newTagName.trim());
      setTags((current) =>
        [...current, createdTag].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewTagName('');
      setSuccess(`Created tag "${createdTag.name}".`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRenameTag(tagId: string) {
    setError('');
    setSuccess('');
    setActiveTagId(tagId);

    try {
      const updatedTag = await renameAdminTag(tagId, editingName.trim());
      setTags((current) =>
        current
          .map((tag) => (tag.id === tagId ? updatedTag : tag))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingTagId(null);
      setEditingName('');
      setSuccess(`Updated tag "${updatedTag.name}".`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update tag');
    } finally {
      setActiveTagId(null);
    }
  }

  async function handleDeleteTag(tag: AdminTag) {
    const confirmed = window.confirm(
      `Delete "${tag.name}"? This removes it from CVs and saved-search filters.`,
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');
    setActiveTagId(tag.id);

    try {
      await deleteAdminTag(tag.id);
      setTags((current) => current.filter((item) => item.id !== tag.id));
      if (editingTagId === tag.id) {
        setEditingTagId(null);
        setEditingName('');
      }
      setSuccess(`Deleted tag "${tag.name}".`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete tag');
    } finally {
      setActiveTagId(null);
    }
  }

  return (
    <DashboardLayout
      title="Tag Management"
      subtitle="Create, rename, and retire platform-wide tags that power candidate discovery and saved filters."
    >
      <div className="space-y-6">
        <Section
          title="Create tag"
          description="Keep names short and recognizable so job seekers and employers can use them consistently."
        >
          <form
            onSubmit={handleCreateTag}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <TextInput
              label="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="React"
            />
            <Button type="submit" fullWidth={false} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create tag'}
            </Button>
          </form>
        </Section>

        <Section
          title="Existing tags"
          description="Usage counts show where each tag is already connected across candidate CVs and saved employer filters."
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
              Loading tags...
            </div>
          ) : tags.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1.4fr)_120px_140px_120px_220px]"
                >
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </p>
                    {editingTagId === tag.id ? (
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            fullWidth={false}
                            disabled={activeTagId === tag.id}
                            onClick={() => handleRenameTag(tag.id)}
                          >
                            {activeTagId === tag.id ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            fullWidth={false}
                            onClick={() => {
                              setEditingTagId(null);
                              setEditingName('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {tag.name}
                      </p>
                    )}
                  </div>

                  <InfoStat label="CVs" value={String(tag.cvCount)} />
                  <InfoStat label="Saved searches" value={String(tag.savedSearchCount)} />
                  <InfoStat
                    label="Updated"
                    value={tag.updatedAt ? formatDate(tag.updatedAt) : '—'}
                  />

                  {editingTagId === tag.id ? (
                    <div />
                  ) : (
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        className="px-4 py-2"
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingName(tag.name);
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        className="px-4 py-2"
                        disabled={activeTagId === tag.id}
                        onClick={() => handleDeleteTag(tag)}
                      >
                        {activeTagId === tag.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No tags created yet.
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
