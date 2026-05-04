import { ActivityIndicator, Pressable, type PressableProps, StyleSheet, Text } from 'react-native';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ title, loading, disabled, variant = 'primary', ...props }: Props) {
  const v = variants[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={[styles.base, v.wrap, isDisabled ? styles.disabled : styles.enabled]}>
      {loading ? <ActivityIndicator color={v.spinner} /> : null}
      {!loading ? <Text style={[styles.title, v.text]}>{title}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  title: { fontSize: 16, fontWeight: '600' },
  enabled: { opacity: 1 },
  disabled: { opacity: 0.6 },

  primaryWrap: { backgroundColor: '#0284c7' },
  primaryText: { color: '#ffffff' },

  secondaryWrap: { backgroundColor: '#e2e8f0' },
  secondaryText: { color: '#0f172a' },

  dangerWrap: { backgroundColor: '#e11d48' },
  dangerText: { color: '#ffffff' },
});

const variants = {
  primary: { wrap: styles.primaryWrap, text: styles.primaryText, spinner: '#fff' },
  secondary: { wrap: styles.secondaryWrap, text: styles.secondaryText, spinner: '#0f172a' },
  danger: { wrap: styles.dangerWrap, text: styles.dangerText, spinner: '#fff' },
} as const;
