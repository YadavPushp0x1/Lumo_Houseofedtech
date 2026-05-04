import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useCoursesStore } from '@/stores/course-store';

export default function CourseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const courseId = Array.isArray(id) ? id[0] : id;

  const courses = useCoursesStore((s) => s.courses);
  const bookmarks = useCoursesStore((s) => s.bookmarks);
  const enrollments = useCoursesStore((s) => s.enrollments);
  const toggleBookmark = useCoursesStore((s) => s.toggleBookmark);
  const enroll = useCoursesStore((s) => s.enroll);

  const course = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);
  const bookmarked = course ? Boolean(bookmarks[course.id]) : false;
  const enrolled = course ? Boolean(enrollments[course.id]) : false;
  const progress = course ? Math.max(0, Math.min(100, enrollments[course.id]?.progressPct ?? 0)) : 0;

  const [enrolling, setEnrolling] = useState(false);

  if (!course) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Course not found</Text>
        <Text style={styles.notFoundText}>Go back and try again.</Text>
        <View style={styles.notFoundCta}>
          <Button title="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const onEnroll = async () => {
    setEnrolling(true);
    try {
      await enroll(course.id);
      Alert.alert('Enrolled', 'You’re enrolled. Open course content in the viewer.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 220 }} contentFit="cover" />
      ) : (
        <View style={styles.thumbnailFallback} />
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.instructor}>{course.instructorName}</Text>
        {enrolled ? (
          <View style={styles.progressWrap}>
            <Text style={styles.progressLabel}>Progress: {progress}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        ) : null}

        <View style={styles.descriptionBlock}>
          <Text style={styles.description}>{course.description}</Text>
          {course.category ? <Text style={styles.category}>Category: {course.category}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Button title={enrolled ? 'Enrolled' : 'Enroll'} loading={enrolling} disabled={enrolled} onPress={onEnroll} />
          <Button
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            variant="secondary"
            onPress={() => toggleBookmark(course.id)}
          />
          <Button
            title="Open content viewer"
            variant="secondary"
            onPress={() => router.push({ pathname: '/(app)/webview/[id]', params: { id: course.id } })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingHorizontal: 24 },
  notFoundTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  notFoundText: { marginTop: 4, textAlign: 'center', color: '#475569' },
  notFoundCta: { marginTop: 16, width: '100%' },

  scroll: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingBottom: 40 },
  thumbnailFallback: { height: 220, width: '100%', backgroundColor: '#f1f5f9' },

  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  instructor: { marginTop: 4, color: '#475569' },

  progressWrap: { marginTop: 12 },
  progressLabel: { fontSize: 12, color: '#64748b' },
  progressTrack: { marginTop: 4, height: 8, width: '100%', overflow: 'hidden', borderRadius: 999, backgroundColor: '#f1f5f9' },
  progressFill: { height: 8, backgroundColor: '#0284c7' },

  descriptionBlock: { marginTop: 16 },
  description: { fontSize: 16, color: '#334155' },
  category: { marginTop: 12, fontSize: 12, color: '#64748b' },

  actions: { marginTop: 24, gap: 12 },
});
