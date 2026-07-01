import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { GradientButton, LabeledInputField } from "../../components/common";
import { Heading } from "../../components/ui/heading";
import { SafeAreaView } from "../../components/ui/safe-area-view";
import { ScrollView } from "../../components/ui/scroll-view";
import { Text } from "../../components/ui/text";
import { VStack } from "../../components/ui/vstack";
import type { LoginFormData } from "../../schemas/auth";
import { loginSchema } from "../../schemas/auth";
import { login } from "../../services/auth";
import { useToast } from "../../utils/toast";


export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      try {
        // Call login service
        const response = await login({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });

        // Show success message
        showSuccess("Login successful!", "Welcome back to TailorConnect");

        // Navigate based on user role
        setTimeout(() => {
          if (response.user.role === "tailor") {
            router.replace("/(tailor)/(tabs)/dashboard");
          } else {
            router.replace("/(customer)/(tabs)/home");
          }
        }, 500);
      } catch (error: unknown) {
        // Handle API errors
        const authError = error as { message: string; fieldErrors?: Record<string, string> };

        // Show error toast
        showError("Login failed", authError.message || "Invalid email or password");

        // Set field-specific errors if provided
        if (authError.fieldErrors) {
          Object.entries(authError.fieldErrors).forEach(([field, message]) => {
            if (field === "email" || field === "password") {
              setError(field as keyof LoginFormData, {
                type: "server",
                message,
              });
            }
          });
        }
      }
    },
    [showSuccess, showError, setError]
  );

  const handleForgotPassword = useCallback(() => {
    router.push("/forgot-password");
  }, []);

  const handleRegister = useCallback(() => {
    router.push("/register");
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6F8" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" style={styles.container}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/TailorConnect_Logo.jpeg")}
              style={styles.logo}
              resizeMode="contain"
              alt="TailorConnect Logo"
            />
          </View>

          {/* Welcome Heading */}
          <Heading style={styles.welcomeHeading}>Welcome Back!</Heading>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Input */}
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
                  icon={<MaterialCommunityIcons name="email-lock-outline" size={24} color={'#C9A227'} />}
                  error={errors.email?.message}
                />
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Password"
                  placeholder="Password"
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

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <View style={styles.loginButtonWrapper}>
              <GradientButton
                title="Login"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                loadingText="Logging in..."
                height={54}
                borderRadius={27}
              />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Register</Text>
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
    backgroundColor: "#F5F6F8",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    alignItems: "center",
  },
  logoContainer: {
    height: 140,
    width: 140,
  },
  logo: {
    height: "100%",
    width: "100%",
  },
  welcomeHeading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D3A5F",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#1D3A5F",
    opacity: 0.9,
    fontWeight: "500",
  },
  loginButtonWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  registerText: {
    fontSize: 15,
    color: "#1D3A5F",
    opacity: 0.7,
  },
  registerLink: {
    fontSize: 15,
    color: "#C9A227",
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1D3A5F",
    opacity: 0.2,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1D3A5F",
    opacity: 0.4,
  },
  socialContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  socialButton: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12
  },
});

