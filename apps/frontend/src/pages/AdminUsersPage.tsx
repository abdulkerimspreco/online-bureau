import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import TextInput from '../components/ui/TextInput';
import Button from '../components/ui/Button';
import {
  deactivateAdminUser,
  deleteAdminUser,
  getAdminUsers,
  reactivateAdminUser,
} from '../api/admin-users/admin-users.api';
import type {
  AdminUserFilters,
  AdminUserListItem,
} from '../api/admin-users/admin-users.types';
import { formatDate } from '../utils/functionUtils';
import { useAuth } from '../context/auth/AuthContext';

const emptyFilters: AdminUserFilters = {
  query: '',
  role: '',
  status: '',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AdminUserFilters>(emptyFilters);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadUsers(nextFilters: AdminUserFilters = filters) {
    setError('');

    try {
      const items = await getAdminUsers(nextFilters);
      setUsers(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(emptyFilters);
  }, []);

  async function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await loadUsers(filters);
  }

  async function handleDeactivate(account: AdminUserListItem) {
    setActiveUserId(account.id);
    setError('');
    setSuccess('');

    try {
      await deactivateAdminUser(account.id);
      setUsers((current) =>
        current.map((item) =>
          item.id === account.id
            ? {
                ...item,
                isActive: false,
                deactivatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setSuccess(`Deactivated ${account.email}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setActiveUserId(null);
    }
  }

  async function handleReactivate(account: AdminUserListItem) {
    setActiveUserId(account.id);
    setError('');
    setSuccess('');

    try {
      await reactivateAdminUser(account.id);
      setUsers((current) =>
        current.map((item) =>
          item.id === account.id
            ? {
                ...item,
                isActive: true,
                deactivatedAt: null,
              }
            : item,
        ),
      );
      setSuccess(`Reactivated ${account.email}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reactivate user');
    } finally {
      setActiveUserId(null);
    }
  }

  async function handleDelete(account: AdminUserListItem) {
    const confirmed = window.confirm(
      `Permanently delete ${account.email}? This removes all associated data.`,
    );

    if (!confirmed) return;

    setActiveUserId(account.id);
    setError('');
    setSuccess('');

    try {
      await deleteAdminUser(account.id);
      setUsers((current) => current.filter((item) => item.id !== account.id));
      setSuccess(`Deleted ${account.email}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActiveUserId(null);
    }
  }

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Search and manage platform accounts without exposing private CV file contents."
    >
      <div className="space-y-6">
        <Section
          title="Filters"
          description="Search by email, candidate name, or company name, then narrow the list by role or account status."
        >
          <form
            onSubmit={handleApplyFilters}
            className="grid gap-4 lg:grid-cols-[1.4fr_180px_180px_auto]"
          >
            <TextInput
              label="Search"
              value={filters.query ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, query: e.target.value }))
              }
              placeholder="Email, company, or candidate name"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Role
              </span>
              <select
                value={filters.role ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    role: e.target.value as AdminUserFilters['role'],
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">All roles</option>
                <option value="JOB_SEEKER">Job seeker</option>
                <option value="EMPLOYER">Employer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </span>
              <select
                value={filters.status ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as AdminUserFilters['status'],
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <Button type="submit" fullWidth={false} className="px-6 py-3 self-end">
              Apply filters
            </Button>
          </form>
        </Section>

        <Section
          title="Users"
          description="Admins can deactivate, reactivate, or permanently delete accounts. Audit logging happens automatically in the backend."
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
              Loading users...
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <AdminInfo
                        label="Email"
                        value={account.email}
                      />
                      <AdminInfo
                        label="Role"
                        value={account.role.replace('_', ' ')}
                      />
                      <AdminInfo
                        label="Profile label"
                        value={account.displayName || account.companyName || '—'}
                      />
                      <AdminInfo
                        label="Status"
                        value={account.isActive ? 'Active' : 'Inactive'}
                      />
                      <AdminInfo
                        label="Verified"
                        value={account.isVerified ? 'Yes' : 'No'}
                      />
                      <AdminInfo
                        label="Created"
                        value={formatDate(account.createdAt)}
                      />
                      <AdminInfo
                        label="Updated"
                        value={formatDate(account.updatedAt)}
                      />
                      <AdminInfo
                        label="Deactivated"
                        value={account.deactivatedAt ? formatDate(account.deactivatedAt) : '—'}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[260px] lg:justify-end">
                      {account.isActive ? (
                        <Button
                          type="button"
                          variant="secondary"
                          fullWidth={false}
                          className="px-4 py-2"
                          disabled={activeUserId === account.id || user?.id === account.id}
                          onClick={() => handleDeactivate(account)}
                        >
                          {activeUserId === account.id ? 'Updating...' : 'Deactivate'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          fullWidth={false}
                          className="px-4 py-2"
                          disabled={activeUserId === account.id}
                          onClick={() => handleReactivate(account)}
                        >
                          {activeUserId === account.id ? 'Updating...' : 'Reactivate'}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        className="px-4 py-2"
                        disabled={activeUserId === account.id || user?.id === account.id}
                        onClick={() => handleDelete(account)}
                      >
                        {activeUserId === account.id ? 'Updating...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No users match the current filters.
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}

function AdminInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900 break-all">{value}</p>
    </div>
  );
}
