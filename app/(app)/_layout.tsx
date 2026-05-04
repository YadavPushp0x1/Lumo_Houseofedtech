import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useCoursesStore } from '@/stores/course-store';

export default function AppLayout() {
  const bootstrap = useCoursesStore((s) => s.bootstrap);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="course/[id]" options={{ title: 'Course', headerShown: true }} />
      <Stack.Screen name="webview/[id]" options={{ title: 'Content', headerShown: true }} />
    </Stack>
  );
}
