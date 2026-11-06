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
import { SUPPORTED_LANGUAGES } from '../constants/translations';

export const LanguageSettingsScreen = ({ navigation }) => {
  const { language, setLanguage, themeColors, isDark, t } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

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
        <Text style={styles.headerTitle}>{t('language') || 'Language'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBox}>
          <Ionicons name="globe-outline" size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>
            Select your preferred display language. Your selection is synchronized across all your devices.
          </Text>
        </View>

        {/* Language Options List */}
        <View style={[styles.listCard, SHADOWS.subtle]}>
          {SUPPORTED_LANGUAGES.map((lang, idx) => {
            const isSelected = language === lang.code;

            return (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  onPress={() => setLanguage(lang.code)}
                  style={[styles.langRow, isSelected && styles.langRowActive]}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <View style={[styles.langIconCircle, isSelected && styles.langIconCircleActive]}>
                      <Ionicons
                        name="language-outline"
                        size={20}
                        color={isSelected ? COLORS.primary : themeColors.textSecondary}
                      />
                    </View>

                    <View>
                      <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                        {lang.label}
                      </Text>
                      <Text style={styles.nativeLabel}>{lang.nativeName}</Text>
                    </View>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>

                {idx < SUPPORTED_LANGUAGES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
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
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    langRowActive: {
      backgroundColor: isDark ? '#1E1B4B40' : '#EDE9FE30',
    },
    langLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    langIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    langIconCircleActive: {
      backgroundColor: isDark ? '#2E1065' : '#EDE9FE',
    },
    langLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    langLabelActive: {
      color: isDark ? '#A5B4FC' : COLORS.primaryDark,
    },
    nativeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
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
      backgroundColor: COLORS.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
