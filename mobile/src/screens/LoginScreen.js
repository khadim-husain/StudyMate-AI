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

export const LoginScreen = ({ navigation }) => {
  const { login, loginWithGoogle, authLoading } = useApp();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
            setGeneralError(res.error || 'Google Sign-In failed on server.');
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
    if (!email.trim()) {
      newErrors.email = 'Username is required';
    } else if (email.includes('@') && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setGeneralError('');
    if (!validate()) return;

    const res = await login(email, password);
    if (res.success) {
      navigation.replace(ROUTES.MAIN_TABS);
    } else {
      setGeneralError(res.error || 'Invalid email or password.');
    }
  };

  const handleGoogleSignIn = async () => {
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
            setGeneralError(res.error || 'Google Sign-In failed on server.');
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
        const targetName = targetEmail.split('@')[0].replace(/[._]/g, ' ');
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
              setGeneralError(res.error || 'Google Sign-In failed.');
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
            : 'Google Client ID is not yet configured in mobile/.env (EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB).\n\nClick OK to sign in using the development Google test profile, or Cancel to configure it.'
        );
        if (proceed && !isRealGoogleConfigured) {
          confirmAction();
        } else {
          setIsGoogleLoading(false);
        }
      } else {
        Alert.alert(
          'Google Sign-In 🌐',
          isRealGoogleConfigured
            ? 'Google authorization was closed. Try again or check your Google Account.'
            : 'Google Client IDs are not yet configured in your mobile .env file (EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID).\n\nWould you like to sign in using the development Google test profile?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsGoogleLoading(false) },
            {
              text: 'Sign In as Google Student',
              onPress: confirmAction,
            },
          ]
        );
      }
    } catch (err) {
      console.warn('Google sign-in error:', err);
      setGeneralError(err.message || 'Google authentication error.');
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate(ROUTES.FORGOT_PASSWORD);
  };

  const fillDemoAccount = () => {
    setEmail('ahmed@gmail.com');
    setPassword('Password123!');
    setErrors({});
    setGeneralError('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Brand Logo Header */}
          <View style={styles.brandRow}>
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

          {/* Welcome Title */}
          <View style={styles.titleSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your intelligent learning journey
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
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="Username"
              icon="person-outline"
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

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxActive,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={13} color={COLORS.textWhite} />
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={authLoading}
              style={styles.loginBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Social Login */}
            <TouchableOpacity
              style={[styles.googleBtn, isGoogleLoading && { opacity: 0.7 }]}
              onPress={handleGoogleSignIn}
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

            {/* Footer / Switch to Register */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.REGISTER)}
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Server Connection Status Pill */}
            <TouchableOpacity
              style={styles.serverPill}
              onPress={handleTestServer}
              activeOpacity={0.7}
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
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 420,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
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
    welcomeTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: SIZES.fontMd,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    formSection: {
      width: '100%',
    },
    optionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      marginTop: 4,
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      backgroundColor: colors.surface,
    },
    checkboxActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    rememberText: {
      fontSize: SIZES.fontSm,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    forgotText: {
      fontSize: SIZES.fontSm,
      fontWeight: '600',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    loginBtn: {
      marginBottom: 20,
      borderRadius: 14,
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
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 32,
    },
    footerText: {
      fontSize: SIZES.fontMd,
      color: colors.textSecondary,
    },
    registerLink: {
      fontSize: SIZES.fontMd,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    serverPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: 20,
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
