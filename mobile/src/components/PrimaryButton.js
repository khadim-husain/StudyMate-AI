import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  gradientColors = COLORS.gradientPrimary,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.container, SHADOWS.light, style, isDisabled && styles.disabled]}
    >
      <LinearGradient
        colors={isDisabled ? ['#CBD5E1', '#94A3B8'] : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textWhite} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={20}
                color={COLORS.textWhite}
                style={styles.iconLeft}
              />
            )}
            <Text style={[styles.text, textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={20}
                color={COLORS.textWhite}
                style={styles.iconRight}
              />
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textWhite,
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.65,
  },
});
