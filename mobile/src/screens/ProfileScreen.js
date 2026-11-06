import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { getBackendBaseUrl } from '../services/api';
import { SUPPORTED_LANGUAGES } from '../constants/translations';

export const ProfileScreen = ({ navigation }) => {
  const {
    user,
    logout,
    themeMode,
    isDark,
    themeColors,
    language,
    t,
    refreshUserProfile,
  } = useApp();

  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh profile on mount or focus
  useEffect(() => {
    if (refreshUserProfile) {
      refreshUserProfile();
    }
  }, [refreshUserProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refreshUserProfile) {
      await refreshUserProfile();
    }
    setRefreshing(false);
  }, [refreshUserProfile]);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutModalOpen(false);
      const rootNav = navigation.getParent() || navigation;
      if (rootNav.reset) {
        rootNav.reset({
          index: 0,
          routes: [{ name: ROUTES.LOGIN }],
        });
      } else {
        rootNav.navigate(ROUTES.LOGIN);
      }
    } catch (err) {
      console.warn('Error during logout:', err);
      setIsLogoutModalOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Determine avatar URL
  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${getBackendBaseUrl()}${user.avatar_url}`)
    : null;

  // Format theme label
  const themeLabel =
    themeMode === 'system'
      ? `System (${isDark ? 'Dark' : 'Light'})`
      : themeMode === 'dark'
        ? 'Dark'
        : 'Light';

  // Format language label
  const languageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate(ROUTES.TAB_HOME);
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileTitle') || 'Profile & Settings'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* User Profile Card */}
        <TouchableOpacity
          style={[styles.userCard, SHADOWS.subtle]}
          onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
          activeOpacity={0.85}
        >
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={28} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={11} color={COLORS.textWhite} />
            </View>
          </View>

          <View style={styles.userInfoCol}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.full_name || user?.name || 'StudyMate Student'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'student@university.edu'}
            </Text>
            <View style={styles.roleBadge}>
              <Ionicons name="school" size={12} color={isDark ? '#A5B4FC' : COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.roleBadgeText}>Student Account</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
        </TouchableOpacity>

        {/* Menu Items List */}
        <View style={[styles.menuContainer, SHADOWS.subtle]}>
          {/* Edit Profile */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#2E1065' : '#EDE9FE' }]}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{t('editProfile') || 'Edit Profile'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Change Password */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.menuLabel}>{t('changePassword') || 'Change Password'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.menuLabel}>{t('notifications') || 'Notifications'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Theme */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(ROUTES.THEME_SETTINGS)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#2E1065' : '#EDE9FE' }]}>
                <Ionicons name="color-palette-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{t('theme') || 'Theme'}</Text>
            </View>
            <View style={styles.menuRightValue}>
              <Text style={styles.menuValueText}>{themeLabel}</Text>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Language */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(ROUTES.LANGUAGE_SETTINGS)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#172554' : '#DBEAFE' }]}>
                <Ionicons name="globe-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.menuLabel}>{t('language') || 'Language'}</Text>
            </View>
            <View style={styles.menuRightValue}>
              <Text style={styles.menuValueText}>{languageLabel}</Text>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Help & Support */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(ROUTES.HELP_SUPPORT)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#10B981" />
              </View>
              <Text style={styles.menuLabel}>{t('helpSupport') || 'Help & Support'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Log Out */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: COLORS.danger }]}>{t('logOut') || 'Log Out'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>StudyMate AI • Version 1.0.0</Text>
          <Text style={styles.versionSub}>AI-Powered Student Learning Platform</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}
      >
        <View style={[styles.modalOverlay, styles.logoutModalOverlay]}>
          <View style={[styles.modalContent, styles.logoutModalContent, SHADOWS.glow]}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={32} color={COLORS.danger} />
            </View>

            <Text style={styles.logoutModalTitle}>{t('logoutConfirmTitle') || 'Log Out'}</Text>
            <Text style={styles.logoutModalSubtitle}>
              {t('logoutConfirmMessage') || 'Are you sure you want to log out of StudyMate AI?'}
            </Text>

            <View style={styles.logoutButtonRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
              >
                <Text style={styles.logoutCancelBtnText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={performLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.logoutConfirmBtnText}>{t('logOut') || 'Log Out'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: 52,
    },
    backBtn: {
      padding: 6,
    },
    headerTitle: {
      fontSize: SIZES.fontLg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    userCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    avatarWrapper: {
      position: 'relative',
      marginRight: 14,
    },
    avatarCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? '#1E1B4B' : '#EDE9FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    editBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: COLORS.primary,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    userInfoCol: {
      flex: 1,
      paddingRight: 10,
    },
    userName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#1E1B4B' : '#EDE9FE',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    menuContainer: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      paddingVertical: 6,
      marginBottom: 24,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    menuRightValue: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuValueText: {
      fontSize: 13,
      color: colors.textMuted,
      marginRight: 6,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 64,
    },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    versionText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 2,
    },
    versionSub: {
      fontSize: 11,
      color: colors.textMuted,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    logoutModalOverlay: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
    },
    logoutModalContent: {
      borderRadius: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      paddingVertical: 28,
      paddingHorizontal: 24,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    logoutIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoutModalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    logoutModalSubtitle: {
      fontSize: SIZES.fontSm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    logoutButtonRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    logoutCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? '#0F172A' : colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutCancelBtnText: {
      fontSize: SIZES.fontMd,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    logoutConfirmBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: COLORS.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutConfirmBtnText: {
      fontSize: SIZES.fontMd,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
