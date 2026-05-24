import { API } from '../auth/axios';
import type { AdminUserFilters, AdminUserListItem } from './admin-users.types';

export async function getAdminUsers(filters: AdminUserFilters = {}) {
  const response = await API.get<AdminUserListItem[]>('/admin/users', {
    params: {
      query: filters.query || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
    },
  });
  return response.data;
}

export async function deactivateAdminUser(userId: string) {
  const response = await API.patch<{ id: string; isActive: boolean; deactivatedAt: string | null }>(
    `/admin/users/${userId}/deactivate`,
  );
  return response.data;
}

export async function reactivateAdminUser(userId: string) {
  const response = await API.patch<{ id: string; isActive: boolean; deactivatedAt: string | null }>(
    `/admin/users/${userId}/reactivate`,
  );
  return response.data;
}

export async function deleteAdminUser(userId: string) {
  const response = await API.delete<{ success: true }>(`/admin/users/${userId}`);
  return response.data;
}
