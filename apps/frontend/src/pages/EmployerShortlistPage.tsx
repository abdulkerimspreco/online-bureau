import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import {
  addShortlistEntryToFolder,
  createShortlistFolder,
  deleteShortlistFolder,
  getShortlist,
  getShortlistFolders,
  removeFromShortlist,
  removeShortlistEntryFromFolder,
} from '../api/shortlist/shortlist.api';
import type { ShortlistEntry, ShortlistFolder } from '../api/shortlist/shortlist.types';
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
  const [folders, setFolders] = useState<ShortlistFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<'all' | string>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadShortlist() {
      try {
        const [items, shortlistFolders] = await Promise.all([
          getShortlist(),
          getShortlistFolders(),
        ]);
        setEntries(items);
        setFolders(shortlistFolders);
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

  const filteredEntries = useMemo(() => {
    if (selectedFolderId === 'all') {
      return entries;
    }

    return entries.filter((entry) =>
      entry.folders.some((folder) => folder.id === selectedFolderId),
    );
  }, [entries, selectedFolderId]);

  async function refreshShortlistState() {
    const [items, shortlistFolders] = await Promise.all([
      getShortlist(),
      getShortlistFolders(),
    ]);
    setEntries(items);
    setFolders(shortlistFolders);
  }

  async function handleRemove(entryId: string) {
    setActiveEntryId(entryId);
    setError('');

    try {
      await removeFromShortlist(entryId);
      await refreshShortlistState();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove shortlist entry');
    } finally {
      setActiveEntryId(null);
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!newFolderName.trim()) {
      setError('Folder name is required.');
      return;
    }

    setActiveFolderId('creating');

    try {
      const folder = await createShortlistFolder(newFolderName.trim());
      setFolders((current) => [folder, ...current]);
      setNewFolderName('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create shortlist folder');
    } finally {
      setActiveFolderId(null);
    }
  }

  async function handleDeleteFolder(folderId: string) {
    setError('');
    setActiveFolderId(folderId);

    try {
      await deleteShortlistFolder(folderId);
      setFolders((current) => current.filter((folder) => folder.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all');
      }
      await refreshShortlistState();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete shortlist folder');
    } finally {
      setActiveFolderId(null);
    }
  }

  async function handleAddEntryToFolder(shortlistEntryId: string, folderId: string) {
    if (!folderId) return;

    setError('');
    setActiveFolderId(`${folderId}:${shortlistEntryId}`);

    try {
      await addShortlistEntryToFolder(folderId, shortlistEntryId);
      await refreshShortlistState();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add candidate to folder');
    } finally {
      setActiveFolderId(null);
    }
  }

  async function handleRemoveEntryFromFolder(
    shortlistEntryId: string,
    folderId: string,
  ) {
    setError('');
    setActiveFolderId(`${folderId}:${shortlistEntryId}`);

    try {
      await removeShortlistEntryFromFolder(folderId, shortlistEntryId);
      await refreshShortlistState();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to remove candidate from folder',
      );
    } finally {
      setActiveFolderId(null);
    }
  }

  return (
    <DashboardLayout
      title="Candidate Shortlist"
      subtitle="Keep promising candidate profiles in one place and revisit them without rerunning search."
    >
      <Section
        title="Folder management"
        description='Use "All saved" as the master shortlist, then group candidates into named folders without removing them from the overall list.'
      >
        <form
          onSubmit={handleCreateFolder}
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <TextInput
            label="New folder"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Frontend finalists"
          />
          <Button
            type="submit"
            fullWidth={false}
            disabled={activeFolderId === 'creating'}
          >
            {activeFolderId === 'creating' ? 'Creating...' : 'Create folder'}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolderId('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              selectedFolderId === 'all'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            All saved ({entries.length})
          </button>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                selectedFolderId === folder.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className="font-medium"
              >
                {folder.name} ({folder.entryCount})
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(folder.id)}
                disabled={activeFolderId === folder.id}
                className="text-xs opacity-80 hover:opacity-100 disabled:opacity-50"
                aria-label={`Delete ${folder.name}`}
              >
                {activeFolderId === folder.id ? '...' : 'x'}
              </button>
            </div>
          ))}
        </div>
      </Section>

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
        ) : filteredEntries.length > 0 ? (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <ShortlistCard
                key={entry.id}
                entry={entry}
                folders={folders}
                isRemoving={activeEntryId === entry.id}
                activeFolderActionId={activeFolderId}
                onRemove={() => handleRemove(entry.id)}
                onAddToFolder={(folderId) =>
                  handleAddEntryToFolder(entry.id, folderId)
                }
                onRemoveFromFolder={(folderId) =>
                  handleRemoveEntryFromFolder(entry.id, folderId)
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            {selectedFolderId === 'all'
              ? 'No shortlisted candidates yet.'
              : 'No candidates are assigned to this folder yet.'}
          </div>
        )}
      </Section>
    </DashboardLayout>
  );
}

function ShortlistCard({
  entry,
  folders,
  isRemoving,
  activeFolderActionId,
  onRemove,
  onAddToFolder,
  onRemoveFromFolder,
}: {
  entry: ShortlistEntry;
  folders: ShortlistFolder[];
  isRemoving: boolean;
  activeFolderActionId: string | null;
  onRemove: () => void;
  onAddToFolder: (folderId: string) => void;
  onRemoveFromFolder: (folderId: string) => void;
}) {
  const categories = useMemo(
    () => parsePreferredCategories(entry.preferredJobCategories),
    [entry.preferredJobCategories],
  );
  const [folderToAdd, setFolderToAdd] = useState('');
  const availableFolders = folders.filter(
    (folder) => !entry.folders.some((entryFolder) => entryFolder.id === folder.id),
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

      <div className="mt-5 space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Folder assignments
          </p>
          {entry.folders.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {entry.folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onRemoveFromFolder(folder.id)}
                  disabled={activeFolderActionId === `${folder.id}:${entry.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 disabled:opacity-60"
                >
                  {folder.name}
                  <span aria-hidden="true">
                    {activeFolderActionId === `${folder.id}:${entry.id}` ? '...' : 'x'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Not assigned to any folder.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block sm:min-w-[220px]">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Add to folder
            </span>
            <select
              value={folderToAdd}
              onChange={(e) => setFolderToAdd(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            >
              <option value="">Select folder</option>
              {availableFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            fullWidth={false}
            variant="secondary"
            disabled={!folderToAdd || activeFolderActionId === `${folderToAdd}:${entry.id}`}
            onClick={() => {
              onAddToFolder(folderToAdd);
              setFolderToAdd('');
            }}
          >
            {activeFolderActionId === `${folderToAdd}:${entry.id}`
              ? 'Adding...'
              : 'Add to folder'}
          </Button>
        </div>
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
