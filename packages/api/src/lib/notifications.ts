import { db } from '@tr/db';
import { notifications } from '@tr/db/schema';

export type NotificationType =
  | 'program_update'
  | 'goal_reminder'
  | 'assessment_invite'
  | 'assessment_reminder'
  | 'coaching_session'
  | 'feedback_received'
  | 'achievement'
  | 'mention'
  | 'system'
  | 'deadline'
  | 'approval_request'
  | 'enrollment';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an in-app notification for a user.
 * Called alongside email sends so users have a persistent record in-app.
 * Fails silently to avoid breaking the primary action if notification insert fails.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      priority: params.priority ?? 'medium',
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err);
  }
}
