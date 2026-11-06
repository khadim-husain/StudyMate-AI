import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/AppContext';

export const ChatBubble = ({ message, onSourcePress, onRetry }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message.text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}
        >
          <Text style={styles.userText}>{message.text}</Text>
          <Text style={styles.userTime}>{message.timestamp}</Text>
        </LinearGradient>
      </View>
    );
  }

  const isError = Boolean(message.isError);

  return (
    <View style={styles.aiContainer}>
      <View style={[styles.avatar, isError && { backgroundColor: COLORS.danger }]}>
        <Ionicons name={isError ? "alert" : "school"} size={16} color={COLORS.textWhite} />
      </View>

      <View style={[styles.aiBubble, SHADOWS.subtle, isError && styles.errorBubble]}>
        <View style={styles.aiHeader}>
          <Text style={[styles.aiName, isError && { color: COLORS.danger }]}>
            {isError ? "StudyMate AI (Notice)" : "StudyMate AI"}
          </Text>
          <Text style={styles.aiTime}>{message.timestamp}</Text>
        </View>

        <Text style={[styles.aiText, isError && styles.errorText]}>{message.text}</Text>

        {/* Source Citations */}
        {!isError && message.sources && message.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <Text style={styles.sourcesTitle}>Sources:</Text>
            {message.sources.map((src, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sourceChip}
                activeOpacity={0.75}
                onPress={() => onSourcePress && onSourcePress(src)}
              >
                <Ionicons name="document-text-outline" size={13} color={isDark ? '#A5B4FC' : COLORS.primary} />
                <Text style={styles.sourceText} numberOfLines={1}>
                  {index + 1}. {src.docTitle} {src.page ? `(Page ${src.page})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Toolbar */}
        <View style={styles.actionToolbar}>
          {!isError ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={13}
                color={copied ? COLORS.success : colors.textSecondary}
              />
              <Text style={[styles.actionBtnText, copied && { color: COLORS.success }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          ) : onRetry ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.retryBtn]}
              onPress={() => onRetry(message)}
              activeOpacity={0.7}
            >
              <Ionicons name="reload-outline" size={13} color={COLORS.primary} />
              <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    userContainer: {
      alignSelf: 'flex-end',
      maxWidth: '85%',
      marginVertical: 6,
    },
    userBubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: SIZES.radiusLg,
      borderBottomRightRadius: 4,
    },
    userText: {
      color: COLORS.textWhite,
      fontSize: SIZES.fontMd,
      lineHeight: 22,
      fontWeight: '500',
    },
    userTime: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 10,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    aiContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      maxWidth: '90%',
      marginVertical: 6,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      marginTop: 2,
    },
    aiBubble: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: SIZES.radiusLg,
      borderTopLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    aiName: {
      fontSize: SIZES.fontXs,
      fontWeight: '800',
      color: isDark ? '#A5B4FC' : COLORS.primary,
      letterSpacing: 0.2,
    },
    aiTime: {
      fontSize: 10,
      color: colors.textMuted,
    },
    aiText: {
      color: colors.textPrimary,
      fontSize: SIZES.fontMd,
      lineHeight: 22,
    },
    sourcesContainer: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sourcesTitle: {
      fontSize: SIZES.fontXs,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    sourceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: SIZES.radiusSm,
      marginTop: 4,
      borderWidth: 1,
      borderColor: isDark ? colors.border : 'rgba(0, 0, 0, 0.04)',
    },
    sourceText: {
      fontSize: 11,
      color: colors.textPrimary,
      fontWeight: '600',
      marginLeft: 6,
      flex: 1,
    },
    actionToolbar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      paddingTop: 6,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 3,
      paddingHorizontal: 6,
    },
    actionBtnText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginLeft: 4,
    },
    errorBubble: {
      borderColor: isDark ? '#991B1B' : '#FECACA',
      backgroundColor: isDark ? '#450A0A' : '#FFF1F2',
    },
    errorText: {
      color: isDark ? '#FCA5A5' : '#991B1B',
    },
    retryBtn: {
      backgroundColor: isDark ? '#1E1B4B' : '#EDE9FE',
      borderRadius: SIZES.radiusSm,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
  });
