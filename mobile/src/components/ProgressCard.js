import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/AppContext';

export const ProgressCard = ({
  progressPercent = 68,
  goalText = 'Complete 5 chapters this month',
  completedHours = 24,
  targetHours = 35,
  onPressDetails,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={[styles.card, SHADOWS.subtle]}>
      <View style={styles.headerRow}>
        <Text style={styles.cardHeaderTitle}>Your Learning Progress</Text>
        <View style={styles.hoursTag}>
          <Text style={styles.hoursText}>
            <Text style={styles.hoursBold}>{completedHours}</Text> / {targetHours} hrs
          </Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        {/* Circular Progress Ring */}
        <View style={styles.circleOuter}>
          <View style={styles.circleInner}>
            <Text style={styles.circlePercent}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Goal Description and Button */}
        <View style={styles.infoCol}>
          <Text style={styles.goalLabel}>Study Goal</Text>
          <Text style={styles.goalText} numberOfLines={2}>
            {goalText}
          </Text>

          {onPressDetails ? (
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={onPressDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsBtnText}>View Details</Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.textWhite} />
            </TouchableOpacity>
          ) : (
            <View style={styles.miniBarTrack}>
              <View
                style={[
                  styles.miniBarFill,
                  { width: `${Math.min(progressPercent, 100)}%` },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 18,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    cardHeaderTitle: {
      fontSize: SIZES.fontMd,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    hoursTag: {
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: SIZES.radiusSm,
    },
    hoursText: {
      fontSize: SIZES.fontXs,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    hoursBold: {
      color: isDark ? '#A5B4FC' : COLORS.primary,
      fontWeight: '800',
    },
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    circleOuter: {
      width: 74,
      height: 74,
      borderRadius: 37,
      borderWidth: 5,
      borderColor: isDark ? '#334155' : '#E0F2FE',
      borderTopColor: COLORS.cyan,
      borderRightColor: COLORS.primary,
      borderBottomColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      backgroundColor: isDark ? '#0F172A' : colors.surfaceSubtle,
    },
    circleInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    circlePercent: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    infoCol: {
      flex: 1,
      justifyContent: 'center',
    },
    goalLabel: {
      fontSize: SIZES.fontXs,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    goalText: {
      fontSize: SIZES.fontSm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    detailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: SIZES.radiusSm,
      alignSelf: 'flex-start',
    },
    detailsBtnText: {
      color: COLORS.textWhite,
      fontSize: 12,
      fontWeight: '700',
      marginRight: 4,
    },
    miniBarTrack: {
      height: 6,
      backgroundColor: isDark ? '#334155' : '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    miniBarFill: {
      height: '100%',
      backgroundColor: COLORS.primary,
      borderRadius: 3,
    },
  });
