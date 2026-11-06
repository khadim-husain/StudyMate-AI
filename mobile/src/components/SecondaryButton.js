import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

export const SecondaryButton = ({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  variant = 'outline', // 'outline' | 'subtle'
  style,
  textStyle,
  disabled = false,
}) => {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        isOutline ? styles.outlineContainer : styles.subtleContainer,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={18}
            color={COLORS.primary}
            style={styles.iconLeft}
          />
        )}
        <Text
          style={[
            styles.text,
            isOutline ? styles.outlineText : styles.subtleText,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={18}
            color={COLORS.primary}
            style={styles.iconRight}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusMd,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  subtleContainer: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  outlineText: {
    color: COLORS.primary,
  },
  subtleText: {
    color: COLORS.primaryDark,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
