import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../context/AppContext';
import { api, getActiveServerUrl, testServerConnection } from '../services/api';

export const ForgotPasswordScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverStatus, setServerStatus] = useState('online');

  const validateEmail = (val) => {
    if (!val.trim()) {
      return 'Email address is required';
    }
    if (!/\S+@\S+\.\S+/.test(val.trim())) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSendResetLink = async () => {
    setError('');
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Top Navigation Bar */}
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.topNavTitle}>Reset Password</Text>
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
              <Ionicons name="lock-closed" size={26} color={COLORS.textWhite} />
            </LinearGradient>
            <Text style={styles.brandTitle}>
              StudyMate <Text style={styles.brandHighlight}>AI</Text>
            </Text>
          </View>

          {!isSubmitted ? (
            <>
              {/* Heading */}
              <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter the email address associated with your StudyMate account and we'll send you instructions to securely reset your password.
                </Text>
              </View>

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              {/* Input Form */}
              <View style={styles.formSection}>
                <InputField
                  label="Registered Email"
                  placeholder="student@university.edu"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.infoBoxText}>
                    Password reset links remain valid for 15 minutes and can only be used once for your security.
                  </Text>
                </View>

                <View style={{ marginTop: 20 }}>
                  <PrimaryButton
                    title="Send Reset Instructions"
                    onPress={handleSendResetLink}
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
                <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
              </View>

              <Text style={styles.successTitle}>Check Your Inbox</Text>
              <Text style={styles.successSubtitle}>
                If <Text style={styles.highlightEmail}>{email.trim()}</Text> is registered, we have sent instructions to reset your password.
              </Text>

              <View style={styles.securityAdviceCard}>
                <View style={styles.adviceRow}>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.adviceText}>Link expires in 15 minutes.</Text>
                </View>
                <View style={styles.adviceRow}>
                  <Ionicons name="mail-unread-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.adviceText}>Be sure to check your spam/junk folder.</Text>
                </View>
                <View style={styles.adviceRow}>
                  <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.adviceText}>Open the link directly on your phone to launch the app automatically.</Text>
                </View>
              </View>

              <View style={{ width: '100%', marginTop: 24 }}>
                <PrimaryButton
                  title="Back to Login"
                  onPress={() => navigation.navigate(ROUTES.LOGIN)}
                  fullWidth
                />
              </View>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => setIsSubmitted(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.resendButtonText}>Try another email address</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Footer */}
          {!isSubmitted && (
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.LOGIN)}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>Back to Login</Text>
              </TouchableOpacity>
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
    infoBox: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(108, 92, 231, 0.12)' : 'rgba(108, 92, 231, 0.08)',
      borderRadius: 12,
      padding: 12,
      marginTop: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(108, 92, 231, 0.25)' : 'rgba(108, 92, 231, 0.15)',
    },
    infoBoxText: {
      color: isDark ? '#C7D2FE' : '#4F46E5',
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    successSection: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    successIconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
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
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    highlightEmail: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    securityAdviceCard: {
      backgroundColor: isDark ? colors.card : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 16,
      width: '100%',
      gap: 12,
    },
    adviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    adviceText: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    resendButton: {
      marginTop: 16,
      paddingVertical: 8,
    },
    resendButtonText: {
      color: COLORS.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    footerSection: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 36,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.primary,
    },
  });

