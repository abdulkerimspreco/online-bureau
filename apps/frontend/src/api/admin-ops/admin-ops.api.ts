import { API } from '../auth/axios';
import type { AdminOpsResponse } from './admin-ops.types';

export async function getAdminOpsSummary() {
  const response = await API.get<AdminOpsResponse>('/admin/ops');
  return response.data;
}
