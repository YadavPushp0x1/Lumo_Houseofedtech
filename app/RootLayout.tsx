import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';

import { LoadingSplash } from '@/components/loading-splash';
import { useAuthStore } from '@/stores/auth-store';
import { asyncStore } from '@/lib/storage/async-store';
import { STORAGE_KEYS } from '@/lib/config';
import {
  cancelOpenAppReminder,
  configureAndroidChannels,
  ensureNotificationsPermission,
  scheduleOpenAppReminder,
} from '@/lib/notifications';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const revalidate = useAuthStore((s) => s.revalidate);

  useEffect(() => {
    configureAndroidChannels();
    ensureNotificationsPermission().catch(() => {});
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (status === 'booting') return;
    if (status !== 'signedIn' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'signedIn' && inAuthGroup) {
      router.replace('/(app)/(tabs)/courses');
    }
  }, [router, segments, status]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (s) => {
      if (s === 'active') {
        await cancelOpenAppReminder();
        await asyncStore.setJson(STORAGE_KEYS.lastOpenedAt, Date.now());
        await revalidate();
      } else if (s === 'background') {
        await scheduleOpenAppReminder(24);
      }
    });
    return () => sub.remove();
  }, [revalidate]);

  if (status === 'booting') {
    return <LoadingSplash />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
