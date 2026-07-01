import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GradientButton, LabeledInputField } from '../../components/common';
import { Heading } from '../../components/ui/heading';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { ScrollView } from '../../components/ui/scroll-view';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { ForgotPasswordFormData } from '../../schemas/auth';
import { forgotPasswordSchema } from '../../schemas/auth';
import { requestPasswordReset } from '../../services/auth';
import { useToast } from '../../utils/toast';

export default function ForgotPasswordScreen() {
  const { showSuccess, showError } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        const result = await requestPasswordReset(data.email);

        if (result.resetToken) {
          showSuccess('Reset code ready', 'Enter a new password on the next screen.');
          setTimeout(() => {
            router.push({
              pathname: '/reset-password',
              params: { token: result.resetToken },
            });
          }, 400);
        } else {
          showSuccess('Check your email', 'If an account exists, reset instructions were sent.');
          setTimeout(() => router.replace('/login'), 1200);
        }
      } catch (error: unknown) {
        const authError = error as { message: string; fieldErrors?: Record<string, string> };
        showError('Request failed', authError.message || 'Something went wrong');
        if (authError.fieldErrors?.email) {
          setError('email', { type: 'server', message: authError.fieldErrors.email });
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

          <Heading style={styles.heading}>Forgot password?</Heading>
          <Text style={styles.subtitle}>
            Enter the email for your account. We will send reset instructions if it exists.
          </Text>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Email Address"
                  placeholder="Email Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={
                    <MaterialCommunityIcons name="email-lock-outline" size={24} color={'#C9A227'} />
                  }
                  error={errors.email?.message}
                />
              )}
            />

            <View style={styles.buttonWrapper}>
              <GradientButton
                title="Send reset link"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                loadingText="Sending..."
                height={54}
                borderRadius={27}
              />
            </View>

            <View style={styles.backRow}>
              <Text style={styles.backText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
                <Text style={styles.backLink}>Back to login</Text>
              </TouchableOpacity>
            </View>
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
    marginTop: 16,
    marginBottom: 24,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  backText: {
    fontSize: 15,
    color: '#1D3A5F',
    opacity: 0.7,
  },
  backLink: {
    fontSize: 15,
    color: '#C9A227',
    fontWeight: '600',
  },
});
