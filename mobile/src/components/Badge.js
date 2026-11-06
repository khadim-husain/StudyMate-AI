import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export const Badge = ({ label, variant = 'primary', size = 'md' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
      case 'Completed':
        return { bg: '#DCFCE7', text: '#059669', border: '#86EFAC' };
      case 'warning':
      case 'Processing':
      case 'Medium':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'danger':
      case 'High':
      case 'Failed':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      case 'Low':
      case 'info':
        return { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' };
      case 'purple':
      case 'primary':
      default:
        return { bg: '#EDE9FE', text: COLORS.primary, border: '#DDD6FE' };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: SIZES.fontXs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
  },
});
