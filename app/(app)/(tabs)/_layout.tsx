import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';

export default function TabsLayout() {
  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      tabBarStyle: { borderTopWidth: 0.5 },
    }),
    []
  );

  const coursesOptions = useMemo(
    () => ({
      title: 'Courses',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="list-outline" color={color} size={size} />
      ),
    }),
    []
  );

  const bookmarksOptions = useMemo(
    () => ({
      title: 'Bookmarks',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="bookmark-outline" color={color} size={size} />
      ),
    }),
    []
  );

  const profileOptions = useMemo(
    () => ({
      title: 'Profile',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Ionicons name="person-outline" color={color} size={size} />
      ),
    }),
    []
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="courses" options={coursesOptions} />
      <Tabs.Screen name="bookmarks" options={bookmarksOptions} />
      <Tabs.Screen name="profile" options={profileOptions} />
    </Tabs>
  );
}
