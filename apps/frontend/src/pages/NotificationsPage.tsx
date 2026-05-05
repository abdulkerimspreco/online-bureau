import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Section from '../components/ui/Section';
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications/notifications.api';
import type { NotificationItem } from '../api/notifications/notifications.types';
import { formatDate } from '../utils/functionUtils';

function notifyBadgeRefresh() {
  window.dispatchEvent(new CustomEvent('notifications:changed'));
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notifications = await getNotifications();
        setItems(notifications);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markNotificationAsRead(notificationId);
      setItems((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      notifyBadgeRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update notification');
    }
  }

  async function handleMarkAllAsRead() {
    setIsSaving(true);
    try {
      await markAllNotificationsAsRead();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      notifyBadgeRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update notifications');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearAll() {
    setIsSaving(true);
    try {
      await clearNotifications();
      setItems([]);
      notifyBadgeRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to clear notifications');
    } finally {
      setIsSaving(false);
    }
  }

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Track candidate activity and contact-request decisions in one place."
    >
      <div className="space-y-6">
        <Section
          title="Activity centre"
          description="Unread items stay highlighted until you mark them as read."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'All caught up.'}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                fullWidth={false}
                disabled={isSaving || unreadCount === 0}
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth={false}
                disabled={isSaving || items.length === 0}
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Recent notifications"
          description="Notifications older than 90 days are automatically left out of this view."
        >
          {error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : isLoading ? (
            <p className="text-sm text-slate-500">Loading notifications...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.readAt
                      ? 'border-slate-200 bg-white'
                      : 'border-amber-200 bg-amber-50/60'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {item.title}
                        </h3>
                        {!item.readAt ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      {!item.readAt ? (
                        <Button
                          type="button"
                          variant="secondary"
                          fullWidth={false}
                          onClick={() => handleMarkAsRead(item.id)}
                        >
                          Mark as read
                        </Button>
                      ) : null}

                      {item.linkUrl ? (
                        <Link
                          to={item.linkUrl}
                          className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}
