import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { getBackendBaseUrl } from '../services/api';

export const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile, uploadUserAvatar, refreshUserProfile, themeColors, isDark, t } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handlePickImage = async () => {
    setErrorMessage('');
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Permission to access photo gallery is required to choose a profile picture.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setAvatarUri(selectedAsset.uri);

        // Upload immediately to backend
        setIsUploadingPhoto(true);
        const uploadResult = await uploadUserAvatar({
          uri: selectedAsset.uri,
          name: selectedAsset.fileName || 'profile_avatar.jpg',
          type: selectedAsset.mimeType || 'image/jpeg',
          file: selectedAsset.file,
        });
        setIsUploadingPhoto(false);

        if (uploadResult.success) {
          setSuccessMessage('Profile photo updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrorMessage(uploadResult.error || 'Failed to upload photo.');
        }
      }
    } catch (err) {
      setIsUploadingPhoto(false);
      setErrorMessage(err.message || 'Error selecting photo.');
    }
  };

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUserProfile({
        full_name: trimmedName,
        email: trimmedEmail,
      });

      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        if (refreshUserProfile) await refreshUserProfile();
        setTimeout(() => {
          handleBack();
        }, 1000);
      } else {
        setErrorMessage(result.error || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_PROFILE });
    }
  };

  const currentDisplayAvatar =
    avatarUri ||
    (user?.avatar_url
      ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${getBackendBaseUrl()}${user.avatar_url}`)
      : null);

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
        <Text style={styles.headerTitle}>{t('editProfile') || 'Edit Profile'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={[styles.avatarSection, SHADOWS.subtle]}>
          <View style={styles.avatarWrapper}>
            {currentDisplayAvatar ? (
              <Image source={{ uri: currentDisplayAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={50} color={COLORS.primary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handlePickImage}
            disabled={isUploadingPhoto}
            style={styles.changePhotoBtn}
          >
            <Text style={styles.changePhotoText}>
              {isUploadingPhoto ? 'Uploading...' : t('changePhoto') || 'Change Profile Photo'}
            </Text>
          </TouchableOpacity>
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

        {/* Fields */}
        <View style={[styles.formCard, SHADOWS.subtle]}>
          <InputField
            label={t('fullName') || 'Full Name'}
            value={fullName}
            onChangeText={(val) => {
              setFullName(val);
              setErrorMessage('');
            }}
            icon="person-outline"
          />

          <InputField
            label={t('emailAddress') || 'Email Address'}
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setErrorMessage('');
            }}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <PrimaryButton
            title={isSaving ? 'Saving...' : t('saveChanges') || 'Save Changes'}
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveBtn}
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
    avatarSection: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: 12,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    defaultAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? '#1E1B4B' : '#EDE9FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: COLORS.primary,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: colors.surface,
    },
    changePhotoBtn: {
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    changePhotoText: {
      fontSize: SIZES.fontSm,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 18,
      marginBottom: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
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
    saveBtn: {
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
