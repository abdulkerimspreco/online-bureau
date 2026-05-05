import { API } from '../auth/axios';
import type {
  NotificationCountResponse,
  NotificationItem,
  NotificationMutationResponse,
} from './notifications.types';

export async function getNotifications(onlyUnread = false) {
  const response = await API.get<NotificationItem[]>('/notifications/me', {
    params: {
      onlyUnread,
    },
  });
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await API.get<NotificationCountResponse>(
    '/notifications/me/unread-count',
  );
  return response.data;
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await API.patch<NotificationMutationResponse>(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await API.patch<NotificationMutationResponse>(
    '/notifications/me/read-all',
  );
  return response.data;
}

export async function clearNotifications() {
  const response = await API.delete<NotificationMutationResponse>(
    '/notifications/me',
  );
  return response.data;
}
