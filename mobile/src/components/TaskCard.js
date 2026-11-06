import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Badge } from './Badge';
import { useTheme } from '../context/AppContext';

export const TaskCard = ({
  task,
  onToggle,
  onDelete,
  onPress,
  style,
  checkboxRight = false,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isDone = task.completed;

  const renderCheckbox = () => (
    <TouchableOpacity
      onPress={() => onToggle && onToggle(task.id)}
      style={[styles.checkbox, isDone && styles.checkboxDone]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {isDone && <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, SHADOWS.subtle, isDone && styles.cardDone, style]}>
      {!checkboxRight && renderCheckbox()}

      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Text
          style={[styles.title, isDone && styles.titleDone]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.timeTag}>
            <Ionicons
              name={task.priority === 'High' ? 'flame' : 'time-outline'}
              size={12}
              color={task.priority === 'High' ? COLORS.danger : (isDark ? '#A5B4FC' : COLORS.primary)}
            />
            <Text style={styles.timeText}>
              {task.dueDate ? `${task.dueDate} • ` : ''}{task.priority || 'Normal'}
            </Text>
          </View>

          {task.dueTime ? (
            <Text style={styles.dueTimeText}>{task.dueTime}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {checkboxRight ? (
        renderCheckbox()
      ) : (
        <View style={styles.rightActions}>
          {onDelete ? (
            <TouchableOpacity
              onPress={() => onDelete(task.id)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          )}
        </View>
      )}
    </View>
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
    cardDone: {
      backgroundColor: isDark ? '#1E1B4B30' : '#FAF5FF',
      borderColor: isDark ? '#334155' : '#E9D5FF',
      opacity: 0.85,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? colors.border : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    checkboxDone: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: SIZES.fontMd,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    titleDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginRight: 8,
    },
    timeText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginLeft: 4,
      fontWeight: '600',
    },
    dueTimeText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500',
    },
    rightActions: {
      marginLeft: 8,
    },
    actionBtn: {
      padding: 6,
    },
  });
