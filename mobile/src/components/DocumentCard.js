import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Badge } from './Badge';
import { useTheme } from '../context/AppContext';

export const DocumentCard = ({ document, onPress, onDelete, style }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isCompleted = document.status === 'Completed';
  const isProcessing = document.status === 'Processing';
  const isFailed = document.status === 'Failed';

  const badgeVariant = isCompleted ? 'Completed' : isProcessing ? 'Processing' : 'Failed';
  const badgeLabel = isProcessing && document.progress ? `Processing (${document.progress})` : document.status;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.card, SHADOWS.subtle, style]}
    >
      <View style={[styles.iconWrapper, isFailed && styles.iconWrapperFailed]}>
        <Ionicons
          name="document-text"
          size={22}
          color={isFailed ? COLORS.danger : isCompleted ? '#EF4444' : COLORS.primary}
        />
      </View>

      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={styles.metaText}>
          {document.pages} pages • {document.size}
        </Text>
      </View>

      <View style={styles.rightActionCol}>
        <Badge label={badgeLabel} variant={badgeVariant} size="sm" />
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusMd,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrapper: {
      width: 42,
      height: 42,
      borderRadius: SIZES.radiusSm,
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconWrapperFailed: {
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
    },
    contentCol: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: SIZES.fontMd,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    metaText: {
      fontSize: SIZES.fontXs,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    rightActionCol: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chevron: {
      marginLeft: 6,
    },
  });
