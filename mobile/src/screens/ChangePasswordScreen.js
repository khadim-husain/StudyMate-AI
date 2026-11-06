import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export const ChangePasswordScreen = ({ navigation }) => {
  const { changeUserPassword, themeColors, isDark, t } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength check
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: COLORS.border, width: '0%' };
    if (pass.length < 6) return { label: 'Weak (min 6 chars)', color: COLORS.danger, width: '30%' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    if (pass.length >= 8 && hasNum && hasSpecial) {
      return { label: 'Strong', color: COLORS.success, width: '100%' };
    }
    return { label: 'Medium', color: COLORS.warning, width: '65%' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdatePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changeUserPassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          handleBack();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_PROFILE });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('changePassword') || 'Change Password'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
          <Text style={styles.infoBannerText}>
            Choose a strong password containing letters, numbers, and symbols to keep your study materials secure.
          </Text>
        </View>

        {/* Feedback Alerts */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Password Fields */}
        <View style={[styles.formCard, SHADOWS.subtle]}>
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <InputField
              label={t('currentPassword') || 'Current Password'}
              value={currentPassword}
              onChangeText={(val) => {
                setCurrentPassword(val);
                setErrorMessage('');
              }}
              icon="lock-closed-outline"
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={themeColors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <InputField
              label={t('newPassword') || 'New Password'}
              value={newPassword}
              onChangeText={(val) => {
                setNewPassword(val);
                setErrorMessage('');
              }}
              icon="key-outline"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowNewPassword(!showNewPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={themeColors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {newPassword ? (
            <View style={styles.meterContainer}>
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    { width: strength.width, backgroundColor: strength.color },
                  ]}
                />
              </View>
              <Text style={[styles.meterText, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          ) : null}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <InputField
              label={t('confirmNewPassword') || 'Confirm New Password'}
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                setErrorMessage('');
              }}
              icon="checkmark-done-outline"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={themeColors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actionButtons}>
          <PrimaryButton
            title={isLoading ? 'Updating...' : t('updatePassword') || 'Update Password'}
            onPress={handleUpdatePassword}
            loading={isLoading}
            style={styles.updateBtn}
          />

          <TouchableOpacity
            onPress={handleBack}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>{t('cancel') || 'Cancel'}</Text>
          </TouchableOpacity>
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
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderWidth: 1,
      borderColor: isDark ? '#3730A3' : '#C7D2FE',
      borderRadius: SIZES.radiusMd,
      padding: 14,
      marginBottom: 20,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#C7D2FE' : '#3730A3',
      lineHeight: 18,
      fontWeight: '500',
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 18,
      marginBottom: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    inputContainer: {
      position: 'relative',
      marginBottom: 10,
    },
    eyeBtn: {
      position: 'absolute',
      right: 14,
      top: 40,
      padding: 4,
    },
    meterContainer: {
      marginBottom: 16,
      marginTop: -4,
    },
    meterTrack: {
      height: 4,
      backgroundColor: isDark ? '#334155' : '#E2E8F0',
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    meterFill: {
      height: '100%',
      borderRadius: 2,
    },
    meterText: {
      fontSize: 11,
      fontWeight: '700',
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? '#991B1B' : '#FCA5A5',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      color: isDark ? '#FCA5A5' : '#DC2626',
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    successBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDark ? '#047857' : '#6EE7B7',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    successText: {
      color: isDark ? '#6EE7B7' : '#059669',
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    actionButtons: {
      marginTop: 8,
    },
    updateBtn: {
      marginBottom: 12,
    },
    cancelBtn: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: SIZES.fontMd,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
