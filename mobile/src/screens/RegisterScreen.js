import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

WebBrowser.maybeCompleteAuthSession();
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { GOOGLE_AUTH_CONFIG, hasRealGoogleClientId } from '../constants/googleConfig';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GoogleIcon } from '../components/GoogleIcon';
import { useApp, useTheme } from '../context/AppContext';
import {
  getActiveServerUrl,
  testServerConnection,
  getServerCandidates,
  setCustomServerUrl,
  probeBestServer,
} from '../services/api';

export const RegisterScreen = ({ navigation }) => {
  const { register, loginWithGoogle, authLoading } = useApp();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [activeUrl, setActiveUrl] = useState(getActiveServerUrl());

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest(GOOGLE_AUTH_CONFIG);

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      setIsGoogleLoading(true);
      loginWithGoogle({ id_token: googleResponse.params.id_token })
        .then((res) => {
          if (res.success) {
            navigation.replace(ROUTES.MAIN_TABS);
          } else {
            setGeneralError(res.error || 'Google Sign-Up failed on server.');
          }
        })
        .catch((err) => {
          setGeneralError(err.message || 'Google authentication failed.');
        })
        .finally(() => setIsGoogleLoading(false));
    }
  }, [googleResponse]);

  React.useEffect(() => {
    let isMounted = true;
    testServerConnection(getActiveServerUrl()).then((res) => {
      if (isMounted) {
        setServerStatus(res.ok ? 'online' : 'offline');
        setActiveUrl(getActiveServerUrl());
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleTestServer = async () => {
    setServerStatus('checking');
    const current = getActiveServerUrl();
    const res = await testServerConnection(current);
    if (res.ok) {
      setServerStatus('online');
      Alert.alert(
        'Server Connected! 🟢',
        `Successfully connected to StudyMate AI API:\n${current}\n\nDatabase: ${res.data?.database || 'connected'}\nGemini Model: ${res.data?.gemini_model || 'active'}`
      );
      return;
    }

    // Auto-probe all candidates
    const probe = await probeBestServer();
    if (probe.ok) {
      setServerStatus('online');
      setActiveUrl(probe.url);
      Alert.alert(
        'Connected to Server! 🟢',
        `Found healthy backend at:\n${probe.url}\n\nDatabase: ${probe.data?.database || 'connected'}`
      );
    } else {
      setServerStatus('offline');
      Alert.alert(
        'Server Connection Options ⚙️',
        `Could not reach ${current}.\n\nChoose your network environment:`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Cloudflare Tunnel (Best 🟢)',
            onPress: async () => {
              await setCustomServerUrl('https://ceiling-ministry-investing-kitty.trycloudflare.com/api/v1');
              setActiveUrl(getActiveServerUrl());
              const test = await testServerConnection(getActiveServerUrl());
              setServerStatus(test.ok ? 'online' : 'offline');
              if (test.ok) Alert.alert('Connected! 🟢', 'Connected via secure Cloudflare Tunnel.');
              else Alert.alert('Tunnel Error', 'Could not reach Cloudflare Tunnel. Verify start-tunnel.bat is running.');
            },
          },
          {
            text: 'Wi-Fi LAN (172.19.119.123)',
            onPress: async () => {
              await setCustomServerUrl('http://172.19.119.123:8000/api/v1');
              setActiveUrl(getActiveServerUrl());
              const test = await testServerConnection(getActiveServerUrl());
              setServerStatus(test.ok ? 'online' : 'offline');
              if (test.ok) Alert.alert('Connected! 🟢', 'Connected to Wi-Fi server (172.19.119.123).');
              else Alert.alert('Connection Failed', 'Ensure phone is on the same Wi-Fi and firewall port 8000 is open.');
            },
          },
          {
            text: 'Wi-Fi LAN (10.10.5.167)',
            onPress: async () => {
              await setCustomServerUrl('http://10.10.5.167:8000/api/v1');
              setActiveUrl(getActiveServerUrl());
              const test = await testServerConnection(getActiveServerUrl());
              setServerStatus(test.ok ? 'online' : 'offline');
              if (test.ok) Alert.alert('Connected! 🟢', 'Connected to Wi-Fi server.');
              else Alert.alert('Connection Failed', 'Ensure phone is on the same Wi-Fi as your PC and backend is running.');
            },
          },
          {
            text: 'Cloud Tunnel',
            onPress: async () => {
              await setCustomServerUrl('https://studymate-ai-dev.loca.lt/api/v1');
              setActiveUrl(getActiveServerUrl());
              const test = await testServerConnection(getActiveServerUrl());
              setServerStatus(test.ok ? 'online' : 'offline');
              if (test.ok) Alert.alert('Connected! 🟢', 'Connected via tunnel.');
              else Alert.alert('Tunnel Offline', 'Please run start-tunnel.bat on your PC.');
            },
          },
        ]
      );
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Please enter a valid full name';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms & Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError('');
    if (!validate()) return;

    const res = await register(name, email, password);
    if (res.success) {
      navigation.replace(ROUTES.MAIN_TABS);
    } else {
      setGeneralError(res.error || 'Failed to create account.');
    }
  };

  const handleGoogleSignUp = async () => {
    setGeneralError('');
    setIsGoogleLoading(true);

    const isRealGoogleConfigured = hasRealGoogleClientId();

    try {
      if (isRealGoogleConfigured && promptGoogleAsync) {
        const result = await promptGoogleAsync();
        if (result?.type === 'success' && result.params?.id_token) {
          const res = await loginWithGoogle({ id_token: result.params.id_token });
          if (res.success) {
            navigation.replace(ROUTES.MAIN_TABS);
            return;
          } else {
            setGeneralError(res.error || 'Google Sign-Up failed on server.');
            return;
          }
        } else if (result?.type === 'dismiss' || result?.type === 'cancel') {
          return;
        }
      }

      // If client IDs are not yet registered in Google Cloud Console or running in dev:
      const confirmAction = () => {
        setIsGoogleLoading(true);
        const targetEmail = (email && email.includes('@')) ? email.trim() : 'student.google@university.edu';
        const targetName = name.trim() || targetEmail.split('@')[0].replace(/[._]/g, ' ');
        const formattedName =
          targetName
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ') || 'Google Student';

        loginWithGoogle({
          email: targetEmail,
          name: formattedName,
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
        })
          .then((res) => {
            if (res.success) {
              navigation.replace(ROUTES.MAIN_TABS);
            } else {
              setGeneralError(res.error || 'Google Sign-Up failed.');
            }
          })
          .catch((err) => {
            setGeneralError(err.message || 'Google authentication error.');
          })
          .finally(() => {
            setIsGoogleLoading(false);
          });
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const proceed = window.confirm(
          isRealGoogleConfigured
            ? 'Google authorization was closed. Try again or check your Google Account.'
            : 'Google Client ID is not yet configured in mobile/.env (EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB).\n\nClick OK to register using the development Google test profile, or Cancel to configure it.'
        );
        if (proceed && !isRealGoogleConfigured) {
          confirmAction();
        } else {
          setIsGoogleLoading(false);
        }
      } else {
        Alert.alert(
          'Google Sign-Up 🌐',
          isRealGoogleConfigured
            ? 'Google authorization was closed. Try again or check your Google Account.'
            : 'Google Client IDs are not yet configured in your mobile .env file (EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID).\n\nWould you like to register using the development Google test profile?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsGoogleLoading(false) },
            {
              text: 'Sign Up as Google Student',
              onPress: confirmAction,
            },
          ]
        );
      }
    } catch (err) {
      console.warn('Google sign-up error:', err);
      setGeneralError(err.message || 'Google authentication error.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate(ROUTES.LOGIN)}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Brand Logo Header */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Ionicons name="school" size={24} color={COLORS.textWhite} />
          </LinearGradient>
          <Text style={styles.brandTitle}>
            StudyMate <Text style={styles.brandHighlight}>AI</Text>
          </Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join thousands of students mastering their courses faster
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          {generalError ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={COLORS.danger}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          <InputField
            label="Username"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            }}
            placeholder="Username"
            icon="person-outline"
            error={errors.name}
          />

          <InputField
            label="Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="Email Address"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="Password"
            icon="lock-closed-outline"
            isPassword={true}
            error={errors.password}
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            placeholder="Confirm Password"
            icon="shield-checkmark-outline"
            isPassword={true}
            error={errors.confirmPassword}
          />

          {/* Terms Agreement */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreeTerms && styles.checkboxActive,
              ]}
            >
              {agreeTerms && (
                <Ionicons name="checkmark" size={13} color={COLORS.textWhite} />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsBold}>Terms of Service</Text> and{' '}
              <Text style={styles.termsBold}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms ? (
            <Text style={styles.errorText}>{errors.terms}</Text>
          ) : null}

          {/* Register Button */}
          <PrimaryButton
            title="Create Account"
            onPress={handleRegister}
            loading={authLoading}
            style={styles.registerBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-Up */}
          <TouchableOpacity
            style={[styles.googleBtn, isGoogleLoading && { opacity: 0.7 }]}
            onPress={handleGoogleSignUp}
            disabled={isGoogleLoading || authLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />
            ) : (
              <GoogleIcon size={22} />
            )}
            <Text style={styles.googleBtnText}>
              {isGoogleLoading ? 'Connecting Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Server Connectivity Status Pill */}
          <View style={styles.serverStatusContainer}>
            <TouchableOpacity
              style={styles.serverPill}
              activeOpacity={0.7}
              onPress={handleTestServer}
            >
              <View
                style={[
                  styles.serverDot,
                  {
                    backgroundColor:
                      serverStatus === 'online'
                        ? '#22C55E'
                        : serverStatus === 'offline'
                        ? '#EF4444'
                        : '#EAB308',
                  },
                ]}
              />
              <Text style={styles.serverPillText} numberOfLines={1}>
                {serverStatus === 'online'
                  ? `API: ${activeUrl.replace('https://', '').replace('http://', '').split('/')[0]}`
                  : serverStatus === 'checking'
                  ? 'Checking server...'
                  : 'Tap to connect server'}
              </Text>
              <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
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
      paddingHorizontal: 28,
      paddingTop: 16,
      paddingBottom: 28,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    brandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    logoBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      ...SHADOWS.glow,
    },
    brandTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    brandHighlight: {
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    titleSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: SIZES.fontMd,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    formSection: {
      width: '100%',
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 6,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      backgroundColor: colors.surface,
    },
    checkboxActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    termsText: {
      fontSize: SIZES.fontSm,
      color: colors.textSecondary,
    },
    termsBold: {
      color: isDark ? '#A5B4FC' : COLORS.primary,
      fontWeight: '600',
    },
    errorText: {
      fontSize: SIZES.fontXs,
      color: COLORS.danger,
      marginTop: -16,
      marginBottom: 16,
      marginLeft: 28,
    },
    registerBtn: {
      borderRadius: 14,
      marginBottom: 8,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 18,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: SIZES.fontXs,
      fontWeight: '600',
      color: colors.textMuted,
      paddingHorizontal: 16,
      letterSpacing: 1,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: isDark ? '#334155' : '#E2E8F0',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    googleBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F8FAFC' : '#1F2937',
      letterSpacing: 0.1,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
      borderWidth: 1,
      borderColor: isDark ? '#991B1B' : '#FCA5A5',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
    },
    errorBannerText: {
      flex: 1,
      fontSize: SIZES.fontSm,
      color: COLORS.danger,
      fontWeight: '600',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: SIZES.fontMd,
      color: colors.textSecondary,
    },
    loginLink: {
      fontSize: SIZES.fontMd,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    serverStatusContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    serverPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: isDark ? '#1E293B' : '#EDF2F7',
      borderWidth: 1,
      borderColor: colors.border,
    },
    serverDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    serverPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      maxWidth: 240,
    },
  });
