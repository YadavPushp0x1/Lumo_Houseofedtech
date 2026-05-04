import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CourseCard } from '@/components/course-card';
import { OptimizedList } from '@/components/optimized-list';
import { useCoursesStore } from '@/stores/course-store';

export default function BookmarksScreen() {
  const router = useRouter();
  const courses = useCoursesStore((s) => s.courses);
  const bookmarks = useCoursesStore((s) => s.bookmarks);
  const toggleBookmark = useCoursesStore((s) => s.toggleBookmark);

  const bookmarkedCourses = useMemo(
    () => courses.filter((c) => Boolean(bookmarks[c.id])),
    [courses, bookmarks]
  );

  return (
    <View style={styles.screen}>
      {bookmarkedCourses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyText}>
            Bookmark courses to quickly find them later.
          </Text>
        </View>
      ) : (
        <OptimizedList
          data={bookmarkedCourses}
          keyExtractor={(c) => c.id}
          refreshing={false}
          onRefresh={() => {}}
          contentContainerStyle={{ padding: 16, paddingTop: 12 }}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              bookmarked
              onPress={() => router.push({ pathname: '/(app)/course/[id]', params: { id: item.id } })}
              onToggleBookmark={() => toggleBookmark(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptyText: { marginTop: 4, textAlign: 'center', color: '#475569' },
});
