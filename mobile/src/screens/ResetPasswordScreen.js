import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../context/AppContext';
import { api } from '../services/api';

export const ResetPasswordScreen = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  // Route parameters extracted from deep link (e.g. studymate://reset-password?token=...&email=...)
  const initialEmail = route?.params?.email || '';
  const initialToken = route?.params?.token || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isVerifying, setIsVerifying] = useState(Boolean(initialToken && initialEmail));
  const [tokenValid, setTokenValid] = useState(!initialToken || Boolean(initialToken && initialEmail));
  const [verifyError, setVerifyError] = useState('');

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify the reset token on mount if provided via deep link
  useEffect(() => {
    let isMounted = true;
    if (initialEmail && initialToken) {
      setIsVerifying(true);
      api.auth
        .verifyResetToken(initialEmail, initialToken)
        .then(() => {
          if (isMounted) {
            setTokenValid(true);
            setVerifyError('');
          }
        })
        .catch((err) => {
          if (isMounted) {
            setTokenValid(false);
            setVerifyError(err.message || 'This password reset link is invalid or has expired.');
          }
        })
        .finally(() => {
          if (isMounted) setIsVerifying(false);
        });
    } else {
      setIsVerifying(false);
      setTokenValid(true);
    }
    return () => {
      isMounted = false;
    };
  }, [initialEmail, initialToken]);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!token.trim()) {
      errs.token = 'Reset token is required';
    }

    if (!newPassword) {
      errs.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async () => {
    setGeneralError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.auth.resetPassword(email.trim(), token.trim(), newPassword);
      setIsSuccess(true);
    } catch (err) {
      setGeneralError(err.message || 'Failed to reset password. Please check your token or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Verifying secure reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Top Bar */}
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.topNavTitle}>Set New Password</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Brand Row */}
          <View style={styles.brandRow}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Ionicons name="shield-checkmark" size={26} color={COLORS.textWhite} />
            </LinearGradient>
            <Text style={styles.brandTitle}>
              StudyMate <Text style={styles.brandHighlight}>AI</Text>
            </Text>
          </View>

          {/* Invalid or Expired Token State */}
          {!tokenValid ? (
            <View style={styles.invalidState}>
              <View style={styles.invalidIconCircle}>
                <Ionicons name="alert-circle" size={54} color={COLORS.danger} />
              </View>
              <Text style={styles.invalidTitle}>Link Expired or Invalid</Text>
              <Text style={styles.invalidSubtitle}>{verifyError}</Text>

              <View style={{ width: '100%', marginTop: 24 }}>
                <PrimaryButton
                  title="Request New Reset Link"
                  onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
                  fullWidth
                />
              </View>

              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => navigation.navigate(ROUTES.LOGIN)}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : !isSuccess ? (
            /* Reset Password Form */
            <>
              <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Your new password must be at least 6 characters long and different from previous passwords.
                </Text>
              </View>

              {generalError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              ) : null}

              <View style={styles.formSection}>
                <InputField
                  label="Registered Email"
                  placeholder="student@university.edu"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  error={errors.email}
                  editable={!initialEmail}
                />

                {!initialToken && (
                  <InputField
                    label="Reset Token"
                    placeholder="Paste reset token from email"
                    value={token}
                    onChangeText={(val) => {
                      setToken(val);
                      if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                    }}
                    autoCapitalize="none"
                    leftIcon="key-outline"
                    error={errors.token}
                  />
                )}

                <InputField
                  label="New Password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  isPassword
                  leftIcon="lock-closed-outline"
                  error={errors.newPassword}
                />

                <InputField
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  isPassword
                  leftIcon="lock-closed-outline"
                  error={errors.confirmPassword}
                />

                {/* Password Criteria Checklist */}
                <View style={styles.criteriaCard}>
                  <View style={styles.criteriaRow}>
                    <Ionicons
                      name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={newPassword.length >= 6 ? COLORS.success : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        newPassword.length >= 6 && { color: COLORS.success, fontWeight: '600' },
                      ]}
                    >
                      At least 6 characters
                    </Text>
                  </View>
                  <View style={styles.criteriaRow}>
                    <Ionicons
                      name={newPassword && newPassword === confirmPassword ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={newPassword && newPassword === confirmPassword ? COLORS.success : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        newPassword && newPassword === confirmPassword && { color: COLORS.success, fontWeight: '600' },
                      ]}
                    >
                      Passwords match
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 24 }}>
                  <PrimaryButton
                    title="Update Password"
                    onPress={handleResetPassword}
                    loading={isLoading}
                    fullWidth
                  />
                </View>
              </View>
            </>
          ) : (
            /* Success State */
            <View style={styles.successSection}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-done-circle" size={60} color={COLORS.success} />
              </View>

              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successSubtitle}>
                Your password has been securely reset. You can now sign in with your new credentials on all your devices.
              </Text>

              <View style={{ width: '100%', marginTop: 24 }}>
                <PrimaryButton
                  title="Proceed to Login"
                  onPress={() => navigation.replace(ROUTES.LOGIN)}
                  fullWidth
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 16,
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 440,
    },
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    topNavTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      gap: 12,
    },
    logoBadge: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.md,
    },
    brandTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    brandHighlight: {
      color: COLORS.primary,
    },
    titleSection: {
      marginBottom: 24,
      alignItems: 'center',
    },
    mainTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.25)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      gap: 8,
    },
    errorBannerText: {
      color: COLORS.danger,
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
    },
    formSection: {
      width: '100%',
    },
    criteriaCard: {
      backgroundColor: isDark ? colors.card : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginTop: 10,
      gap: 8,
    },
    criteriaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    criteriaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    invalidState: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    invalidIconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    invalidTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    invalidSubtitle: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    backToLoginBtn: {
      marginTop: 16,
      paddingVertical: 8,
    },
    backToLoginText: {
      color: COLORS.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    successSection: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    successIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    successSubtitle: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
  });

