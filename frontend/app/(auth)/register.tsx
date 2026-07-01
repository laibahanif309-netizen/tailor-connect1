import React, { useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "../../components/ui/safe-area-view";
import { ScrollView } from "../../components/ui/scroll-view";
import { VStack } from "../../components/ui/vstack";
import { Heading } from "../../components/ui/heading";
import { Text } from "../../components/ui/text";
import { LabeledInputField, GradientButton, UserTypeToggle } from "../../components/common";
import { registerSchema } from "../../schemas/auth";
import type { RegisterFormData } from "../../schemas/auth";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { register } from "../../services/auth";
import { useToast } from "../../utils/toast";

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: "customer",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const userType = watch("userType");

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      try {
        // Call register service
        // Type assertions needed due to react-hook-form type inference
        const username = typeof data.username === 'string' ? data.username : String(data.username || '');
        const email = typeof data.email === 'string' ? data.email : String(data.email || '');
        const password = typeof data.password === 'string' ? data.password : String(data.password || '');
        const role = (data.userType === 'customer' || data.userType === 'tailor') 
          ? data.userType 
          : 'customer' as 'customer' | 'tailor';

        const response = await register({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          role: role,
        });

        // Show success message
        showSuccess(
          "Registration successful!",
          `Welcome to TailorConnect, ${response.user.name}!`
        );

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
        showError("Registration failed", authError.message || "Please check your information and try again");

        // Set field-specific errors if provided
        if (authError.fieldErrors) {
          Object.entries(authError.fieldErrors).forEach(([field, message]) => {
            if (field === "username" || field === "email" || field === "password") {
              setError(field as keyof RegisterFormData, {
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

  const handleLogin = useCallback(() => {
    router.push("/login");
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

          {/* Create Account Heading */}
          <Heading style={styles.createAccountHeading}>Create Account</Heading>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              {/* <Text style={styles.userTypeLabel}>I am a:</Text> */}
              <Controller
                control={control}
                name="userType"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.toggleWrapper}>
                    <UserTypeToggle
                      value={value as 'customer' | 'tailor'}
                      onValueChange={onChange}
                    />
                    {errors.userType && (
                      <Text style={styles.errorText}>{errors.userType.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Username Input */}
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Username"
                  placeholder="Username"
                  value={value as string}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  icon={<MaterialCommunityIcons name="account-outline" size={24} color={'#C9A227'} />}
                  error={errors.username?.message}
                />
              )}
            />

            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Email Address"
                  placeholder="Email Address"
                  value={value as string}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<MaterialCommunityIcons name="email-outline" size={24} color={'#C9A227'} />}
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
                  value={value as string}
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

            {/* Confirm Password Input */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <LabeledInputField
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  value={value as string}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showConfirmPassword}
                  icon={
                    showConfirmPassword ? (
                      <Eye size={22} color="#C9A227" strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={22} color="#C9A227" strokeWidth={1.5} />
                    )
                  }
                  onIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {/* Register Button */}
            <View style={styles.registerButtonWrapper}>
              <GradientButton
                title="Register"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                loadingText="Registering..."
                height={54}
                borderRadius={27}
              />
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Login</Text>
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
  createAccountHeading: {
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
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D3A5F",
    marginBottom: 8,
  },
  toggleWrapper: {
    width: "100%",
  },
  registerButtonWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  loginText: {
    fontSize: 15,
    color: "#1D3A5F",
    opacity: 0.7,
  },
  loginLink: {
    fontSize: 15,
    color: "#C9A227",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
});

