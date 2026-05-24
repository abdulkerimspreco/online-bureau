import { API } from '../auth/axios';
import type { AdminTag, Tag } from './tags.types';

export async function getAllTags() {
    const response = await API.get<Tag[]>('/tags');
    return response.data;
}

export async function getMyCvTags() {
    const response = await API.get<Tag[]>('/tags/me');
    return response.data;
}

export async function attachTagToMyCv(tagId: string) {
    const response = await API.post<{ message: string }>('/tags/me', { tagId });
    return response.data;
}

export async function removeTagFromMyCv(tagId: string) {
    const response = await API.delete<{ message: string }>(`/tags/me/${tagId}`);
    return response.data;
}

export async function getAdminTags() {
    const response = await API.get<AdminTag[]>('/tags/admin');
    return response.data;
}

export async function createAdminTag(name: string) {
    const response = await API.post<AdminTag>('/tags', { name });
    return response.data;
}

export async function renameAdminTag(tagId: string, name: string) {
    const response = await API.patch<AdminTag>(`/tags/${tagId}`, { name });
    return response.data;
}

export async function deleteAdminTag(tagId: string) {
    const response = await API.delete<{ success: true }>(`/tags/${tagId}`);
    return response.data;
}
