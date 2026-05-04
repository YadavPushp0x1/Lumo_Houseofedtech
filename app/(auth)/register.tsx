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
  fullName: z.string().min(2, 'Enter your name'),
  username: z.string().min(3, 'Username too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const registerUser = useAuthStore((s) => s.register);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { fullName: '', username: '', email: '', password: '' },
  });

  const fields = useMemo(() => {
    return {
      fullName: register('fullName'),
      username: register('username'),
      email: register('email'),
      password: register('password'),
    };
  }, [register]);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setLoading(true);
    try {
      await registerUser(values);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Registration failed');
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

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start building your learning path.</Text>

          <View style={styles.card}>
            <View style={styles.field}>
              <Input
                label="Full name"
                onBlur={fields.fullName.onBlur}
                onChangeText={(t) =>
                  setValue('fullName', t, { shouldValidate: isSubmitted, shouldDirty: true })
                }
                error={errors.fullName?.message}
                placeholder="Jane Doe"
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Username"
                autoCapitalize="none"
                onBlur={fields.username.onBlur}
                onChangeText={(t) =>
                  setValue('username', t, { shouldValidate: isSubmitted, shouldDirty: true })
                }
                error={errors.username?.message}
                placeholder="jane"
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={fields.email.onBlur}
                onChangeText={(t) =>
                  setValue('email', t, { shouldValidate: isSubmitted, shouldDirty: true })
                }
                error={errors.email?.message}
                placeholder="jane@example.com"
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

            <Button title="Create account" loading={loading} onPress={onSubmit} />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text style={styles.footerLink}>Sign in</Text>
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
