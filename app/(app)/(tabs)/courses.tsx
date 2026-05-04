import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { CourseCard } from '@/components/course-card';
import { OptimizedList } from '@/components/optimized-list';
import { OfflineBanner } from '@/components/offline-banner';
import { useOnline } from '@/hooks/use-online';
import { maybeNotifyBookmarkMilestone } from '@/lib/notifications';
import { selectFilteredCourses, useCoursesStore } from '@/stores/course-store';

export default function CoursesScreen() {
  const router = useRouter();
  const isOnline = useOnline();

  const status = useCoursesStore((s) => s.status);
  const error = useCoursesStore((s) => s.error);
  const query = useCoursesStore((s) => s.query);
  const setQuery = useCoursesStore((s) => s.setQuery);
  const refresh = useCoursesStore((s) => s.refresh);
  const bookmarks = useCoursesStore((s) => s.bookmarks);
  const toggleBookmark = useCoursesStore((s) => s.toggleBookmark);
  const filtered = useCoursesStore(selectFilteredCourses);

  const [refreshing, setRefreshing] = useState(false);

  const bookmarkCount = useMemo(() => Object.values(bookmarks).filter(Boolean).length, [bookmarks]);

  useEffect(() => {
    maybeNotifyBookmarkMilestone(bookmarkCount);
  }, [bookmarkCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <OfflineBanner visible={!isOnline} />
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={(text) => {
            if (text !== query) setQuery(text);
          }}
          placeholder="Search courses, instructors…"
          style={styles.searchInput}
          placeholderTextColor="#94a3b8"
        />
        <Text style={styles.bookmarkCount}>{bookmarkCount} bookmarked</Text>
      </View>

      <OptimizedList
        data={filtered}
        keyExtractor={(c) => c.id}
        refreshing={refreshing || status === 'loading'}
        onRefresh={onRefresh}
        ListHeaderComponent={
          status === 'error' ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Couldn’t load courses</Text>
              <Text style={styles.errorText}>{error ?? 'Please try again.'}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ padding: 16, paddingTop: 12 }}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            bookmarked={Boolean(bookmarks[item.id])}
            onPress={() => router.push({ pathname: '/(app)/course/[id]', params: { id: item.id } })}
            onToggleBookmark={() => toggleBookmark(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  bookmarkCount: { marginTop: 8, fontSize: 12, color: '#64748b' },
  errorBox: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    padding: 12,
  },
  errorTitle: { fontWeight: '600', color: '#be123c' },
  errorText: { marginTop: 4, fontSize: 14, color: '#be123c' },
});
