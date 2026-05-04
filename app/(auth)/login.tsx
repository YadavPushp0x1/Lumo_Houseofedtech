import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  usernameOrEmail: z.string().min(3, 'Enter username or email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitted },
    register,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { usernameOrEmail: '', password: '' },
  });

  // react-hook-form register for RN
  const fields = useMemo(() => {
    return {
      usernameOrEmail: register('usernameOrEmail'),
      password: register('password'),
    };
  }, [register]);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setLoading(true);
    try {
      await login(values);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>L</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue learning.</Text>

          <View style={styles.card}>
            <View style={styles.field}>
              <Input
                label="Username or Email"
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={fields.usernameOrEmail.onBlur}
                onChangeText={(t) =>
                  setValue('usernameOrEmail', t, { shouldValidate: isSubmitted, shouldDirty: true })
                }
                error={errors.usernameOrEmail?.message}
                placeholder="you@example.com"
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Password"
                secureTextEntry
                onBlur={fields.password.onBlur}
                onChangeText={(t) =>
                  setValue('password', t, { shouldValidate: isSubmitted, shouldDirty: true })
                }
                error={errors.password?.message}
                placeholder="••••••••"
              />
            </View>

            {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

            <Button title="Sign in" loading={loading} onPress={onSubmit} />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New here?</Text>
            <Link href="/(auth)/register">
              <Text style={styles.footerLink}>Create account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40 },

  logo: {
    alignSelf: 'center',
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#0284c7',
  },
  logoText: { fontSize: 20, fontWeight: '800', color: '#ffffff' },

  title: { marginTop: 24, fontSize: 30, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#475569' },

  card: {
    marginTop: 32,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  field: { marginBottom: 16 },
  apiError: { marginBottom: 12, fontSize: 14, color: '#e11d48' },

  footerRow: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  footerText: { color: '#475569' },
  footerLink: { fontWeight: '600', color: '#0369a1' },
});
