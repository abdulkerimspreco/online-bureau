export type NotificationType =
  | 'CONTACT_REQUEST_SENT'
  | 'CONTACT_REQUEST_ACCEPTED'
  | 'CONTACT_REQUEST_DECLINED'
  | 'CV_MODERATION_REVIEW_REQUESTED'
  | 'CV_MODERATION_CONSENT_GRANTED'
  | 'CV_MODERATION_CONSENT_DECLINED'
  | 'CV_MODERATION_DISMISSED'
  | 'CV_MODERATION_ESCALATED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCountResponse {
  count: number;
}

export interface NotificationMutationResponse {
  id?: string;
  readAt?: string | null;
  updatedCount?: number;
  deletedCount?: number;
}
