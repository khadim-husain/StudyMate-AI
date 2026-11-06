import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo } from 'react';
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

export const ThemeSettingsScreen = ({ navigation }) => {
  const { themeMode, setThemeMode, isDark, themeColors, t } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const THEME_OPTIONS = [
    {
      id: 'system',
      title: t('themeSystem') || 'System Default',
      desc: 'Automatically matches your device operating system display settings.',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'light',
      title: t('themeLight') || 'Light Theme',
      desc: 'Clean, radiant white and lavender surfaces with high contrast text.',
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      title: t('themeDark') || 'Dark Theme',
      desc: 'Deep midnight navy surfaces that reduce eye strain during late night study sessions.',
      icon: 'moon-outline',
    },
  ];

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
        <Text style={styles.headerTitle}>{t('theme') || 'Appearance & Theme'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBox}>
          <Ionicons name="color-palette-outline" size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>
            Selected theme is saved to your account and applied instantly across all learning materials and tabs.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.cardsList}>
          {THEME_OPTIONS.map((opt) => {
            const isSelected = themeMode === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setThemeMode(opt.id)}
                style={[
                  styles.themeCard,
                  SHADOWS.subtle,
                  isSelected && styles.themeCardActive,
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? COLORS.primary : themeColors.textSecondary}
                  />
                </View>

                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.cardDesc}>{opt.desc}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Current Active Mode Badge */}
        <View style={styles.activeStatusCard}>
          <Text style={styles.activeStatusLabel}>Currently Applied Mode:</Text>
          <View style={styles.activePill}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.activePillText}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
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
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderWidth: 1,
      borderColor: isDark ? '#3730A3' : '#C7D2FE',
      borderRadius: SIZES.radiusMd,
      padding: 14,
      marginBottom: 20,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#C7D2FE' : '#3730A3',
      lineHeight: 18,
      fontWeight: '500',
    },
    cardsList: {
      gap: 14,
      marginBottom: 24,
    },
    themeCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : 'transparent',
    },
    themeCardActive: {
      borderColor: COLORS.primary,
      backgroundColor: isDark ? '#1E1B4B' : '#FAF5FF',
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    iconCircleActive: {
      backgroundColor: isDark ? '#2E1065' : '#EDE9FE',
    },
    cardTextCol: {
      flex: 1,
      paddingRight: 10,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 3,
    },
    cardTitleActive: {
      color: isDark ? '#A5B4FC' : COLORS.primaryDark,
    },
    cardDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: isDark ? colors.border : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: COLORS.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.primary,
    },
    activeStatusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusMd,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeStatusLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1B4B' : '#EDE9FE',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    activePillText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
  });
