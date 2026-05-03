import { API } from '../auth/axios';
import type { Tag } from './tags.types';

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
