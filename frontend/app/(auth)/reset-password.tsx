import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GradientButton, LabeledInputField } from '../../components/common';
import { Heading } from '../../components/ui/heading';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { ScrollView } from '../../components/ui/scroll-view';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { ResetPasswordFormData } from '../../schemas/auth';
import { resetPasswordSchema } from '../../schemas/auth';
import { resetPasswordWithToken } from '../../services/auth';
import { useToast } from '../../utils/toast';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const paramToken = typeof params.token === 'string' ? params.token : Array.isArray(params.token) ? params.token[0] : '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: paramToken || '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (paramToken) {
      setValue('token', paramToken);
    }
  }, [paramToken, setValue]);

  const onSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      try {
        await resetPasswordWithToken(data.token.trim(), data.password);
        showSuccess('Password updated', 'You can sign in with your new password.');
        setTimeout(() => router.replace('/login'), 800);
      } catch (error: unknown) {
        const authError = error as { message: string; fieldErrors?: Record<string, string> };
        showError('Reset failed', authError.message || 'Invalid or expired code.');
        if (authError.fieldErrors?.token) {
          setError('token', { type: 'server', message: authError.fieldErrors.token });
        }
        if (authError.fieldErrors?.password) {
          setError('password', { type: 'server', message: authError.fieldErrors.password });
        }
      }
    },
    [showSuccess, showError, setError]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6F8" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/TailorConnect_Logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
              alt="TailorConnect Logo"
            />
          </View>

          <Heading style={styles.heading}>New password</Heading>
          <Text style={styles.subtitle}>
            Paste the reset code from your email (or from the previous step in development).
          </Text>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="token"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Reset code"
                  placeholder="Reset code"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  icon={<MaterialCommunityIcons name="key-variant" size={24} color={'#C9A227'} />}
                  error={errors.token?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="New password"
                  placeholder="New password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  icon={
                    showPassword ? (
                      <Eye size={22} color="#C9A227" strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={22} color="#C9A227" strokeWidth={1.5} />
                    )
                  }
                  onIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Confirm password"
                  placeholder="Confirm password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showConfirm}
                  icon={
                    showConfirm ? (
                      <Eye size={22} color="#C9A227" strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={22} color="#C9A227" strokeWidth={1.5} />
                    )
                  }
                  onIconPress={() => setShowConfirm(!showConfirm)}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <View style={styles.buttonWrapper}>
              <GradientButton
                title="Update password"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                loadingText="Updating..."
                height={54}
                borderRadius={27}
              />
            </View>

            <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    alignItems: 'center',
  },
  logoContainer: {
    height: 120,
    width: 120,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1D3A5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#1D3A5F',
    opacity: 0.75,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 400,
    marginBottom: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 16,
  },
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#C9A227',
    fontWeight: '600',
  },
});
