import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/AppContext';

export const StatCard = ({
  icon,
  iconColor = COLORS.primary,
  bgColor,
  value,
  label,
  subtext,
  onPress,
  style,
  compact = false,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const defaultBg = bgColor || (isDark ? '#1E1B4B' : '#EDE9FE');
  const CardContainer = onPress ? TouchableOpacity : View;

  if (compact) {
    return (
      <CardContainer
        activeOpacity={0.82}
        onPress={onPress}
        style={[styles.compactCard, { backgroundColor: isDark ? colors.surface : defaultBg }, style]}
      >
        <Text style={[styles.compactValue, { color: isDark ? '#A5B4FC' : iconColor }]}>{value}</Text>
        <View style={styles.compactLabelRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={13}
              color={isDark ? '#A5B4FC' : iconColor}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.compactLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </CardContainer>
    );
  }

  return (
    <CardContainer
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.card, SHADOWS.subtle, style]}
    >
      <View style={[styles.iconBox, { backgroundColor: defaultBg }]}>
        <Ionicons name={icon} size={20} color={isDark ? '#A5B4FC' : iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      </View>
    </CardContainer>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    compactCard: {
      flex: 1,
      borderRadius: SIZES.radiusMd,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'rgba(0, 0, 0, 0.04)',
    },
    compactValue: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 4,
    },
    compactLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    compactLabel: {
      fontSize: SIZES.fontXs,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 16,
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 110,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: SIZES.radiusSm,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    textContainer: {
      flexDirection: 'column',
    },
    value: {
      fontSize: SIZES.fontXl,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    label: {
      fontSize: SIZES.fontSm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    subtext: {
      fontSize: 11,
      color: isDark ? '#A5B4FC' : COLORS.primary,
      marginTop: 2,
      fontWeight: '600',
    },
  });
