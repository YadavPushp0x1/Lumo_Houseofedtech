import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Alert, AppState, InteractionManager, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useCoursesStore } from '@/stores/course-store';

export default function ProfileScreen() {
  const isFocused = useIsFocused();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);

  const enrollments = useCoursesStore((s) => s.enrollments);
  const bookmarks = useCoursesStore((s) => s.bookmarks);

  const stats = useMemo(() => {
    const enrolled = Object.keys(enrollments).length;
    const bookmarked = Object.values(bookmarks).filter(Boolean).length;
    const avgProgress =
      enrolled === 0
        ? 0
        : Math.round(
            Object.values(enrollments).reduce((sum, e) => sum + (e.progressPct ?? 0), 0) / enrolled
          );
    return { enrolled, bookmarked, avgProgress };
  }, [enrollments, bookmarks]);

  const [updating, setUpdating] = useState(false);

  const safeAlert = (title: string, message?: string) => {
    if (!isFocused) return;
    if (AppState.currentState !== 'active') return;

    // On Android, `Alert.alert()` can throw if the screen isn't attached to an Activity yet
    // (e.g. during navigation transitions or app background/foreground changes).
    InteractionManager.runAfterInteractions(() => {
      if (!isFocused) return;
      if (AppState.currentState !== 'active') return;
      requestAnimationFrame(() => {
        try {
          Alert.alert(title, message);
        } catch {
          // ignore (can happen on Android when not attached to an Activity)
        }
      });
    });
  };

  const waitForInteractions = async () => {
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
  };

  const onPickAvatar = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      if (AppState.currentState !== 'active') return;
      await waitForInteractions();
      if (AppState.currentState !== 'active') return;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        safeAlert('Permission needed', 'Allow photo access to update your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        legacy: Platform.OS === 'android',
      });
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) await updateAvatar(uri);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Could not open the image library. Please try again.';
      safeAlert('Image picker failed', msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onPickAvatar} style={styles.avatarButton}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: 92, height: 92 }} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{user?.fullName?.[0] ?? 'U'}</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.name}>{user?.fullName ?? 'User'}</Text>
        <Text style={styles.email}>{user?.email ?? user?.username ?? ''}</Text>
        <Text style={styles.hint}>Tap avatar to update</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.enrolled}</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bookmarked}</Text>
          <Text style={styles.statLabel}>Bookmarked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.avgProgress}%</Text>
          <Text style={styles.statLabel}>Avg progress</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title={updating ? 'Updating…' : 'Update picture'} variant="secondary" onPress={onPickAvatar} />
        <Button title="Logout" variant="danger" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 20, paddingTop: 20 },
  header: { alignItems: 'center' },
  avatarButton: {
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  avatarFallback: { height: 92, width: 92, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  avatarFallbackText: { fontSize: 24, fontWeight: '600', color: '#64748b' },
  name: { marginTop: 12, fontSize: 20, fontWeight: '700', color: '#0f172a' },
  email: { color: '#475569' },
  hint: { marginTop: 4, fontSize: 12, color: '#64748b' },

  statsCard: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b' },

  actions: { marginTop: 32, gap: 12 },
});
