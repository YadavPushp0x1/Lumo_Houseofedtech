import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function Input({ label, error, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, error ? styles.inputError : styles.inputOk]}
        placeholderTextColor="#94a3b8"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { marginBottom: 4, fontSize: 14, fontWeight: '500', color: '#334155' },
  input: {
    height: 48,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  inputOk: { borderColor: '#e2e8f0' },
  inputError: { borderColor: '#f43f5e' },
  error: { marginTop: 4, fontSize: 12, color: '#e11d48' },
});
