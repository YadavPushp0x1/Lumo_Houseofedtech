import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/lib/config';
import { asyncStore } from '@/lib/storage/async-store';

export const REMINDER_NOTIFICATION_ID = 'daily-open-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationsPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleOpenAppReminder(hours: number): Promise<void> {
  const granted = await ensureNotificationsPermission();
  if (!granted) return;

  // Cancel any existing scheduled reminder.
  await cancelOpenAppReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Keep learning',
      body: 'You have courses waiting — open Lumo and continue where you left off.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      repeats: false,
      seconds: Math.max(60, Math.floor(hours * 3600)),
    },
  });
}

export async function cancelOpenAppReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {
    // ignore
  }
}

export async function maybeNotifyBookmarkMilestone(bookmarkCount: number): Promise<void> {
  if (bookmarkCount < 5) return;

  const lastNotifiedAt = await asyncStore.getJson<number>(STORAGE_KEYS.bookmarkMilestoneNotifiedAt);
  const now = Date.now();
  // Don't spam: once per 7 days.
  if (lastNotifiedAt && now - lastNotifiedAt < 7 * 24 * 60 * 60 * 1000) return;

  const granted = await ensureNotificationsPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nice picks',
      body: `You’ve bookmarked ${bookmarkCount} courses. Want to enroll in one now?`,
    },
    trigger: null,
  });

  await asyncStore.setJson(STORAGE_KEYS.bookmarkMilestoneNotifiedAt, now);
}

export function configureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
  }).catch(() => {});
}
