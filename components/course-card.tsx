import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Course } from '@/types/course';

type Props = {
  course: Course;
  bookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: () => void;
};

export const CourseCard = memo(function CourseCard({
  course,
  bookmarked,
  onPress,
  onToggleBookmark,
}: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 140 }} contentFit="cover" />
      ) : (
        <View style={styles.thumbnailFallback} />
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {course.title}
          </Text>
          <Pressable onPress={onToggleBookmark} hitSlop={10} style={styles.bookmarkButton}>
            <Text style={bookmarked ? styles.bookmarked : styles.unbookmarked}>
              {bookmarked ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>
        <Text numberOfLines={2} style={styles.description}>
          {course.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{course.instructorName}</Text>
          {typeof course.rating === 'number' ? (
            <Text style={styles.meta}>{course.rating.toFixed(1)} ★</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  thumbnailFallback: { height: 140, width: '100%', backgroundColor: '#f1f5f9' },
  body: { padding: 12, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a' },
  bookmarkButton: { marginLeft: 12, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  bookmarked: { color: '#0369a1' },
  unbookmarked: { color: '#94a3b8' },
  description: { fontSize: 14, color: '#475569' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#64748b' },
});
