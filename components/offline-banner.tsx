import { StyleSheet, Text, View } from 'react-native';

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Offline mode: showing cached data where possible.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8 },
  text: { fontSize: 14, color: '#78350f' },
});
