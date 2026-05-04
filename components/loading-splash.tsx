import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function LoadingSplash({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Lumo</Text>
      <Text style={styles.subtitle}>{subtitle ?? 'Signing you in…'}</Text>
      <View style={styles.spinner}>
        <ActivityIndicator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 8, textAlign: 'center', color: '#475569' },
  spinner: { marginTop: 18 },
});

