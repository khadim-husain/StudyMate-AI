import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';

export const Header = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
  transparent = false,
  variant = 'light', // 'light' | 'dark'
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS);
    }
  };

  const isDark = variant === 'dark';

  return (
    <View
      style={[
        styles.container,
        transparent
          ? styles.transparent
          : isDark
          ? styles.darkContainer
          : [styles.surface, SHADOWS.subtle],
      ]}
    >
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, isDark && styles.darkBackButton]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? COLORS.textWhite : COLORS.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        <Text
          style={[styles.title, isDark && styles.darkTitle]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, isDark && styles.darkSubtitle]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>{rightAction || null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  surface: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  darkContainer: {
    backgroundColor: COLORS.midnight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: SIZES.fontLg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  darkTitle: {
    color: COLORS.textWhite,
  },
  subtitle: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  darkSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
