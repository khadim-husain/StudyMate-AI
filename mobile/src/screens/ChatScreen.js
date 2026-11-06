import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { ChatBubble } from '../components/ChatBubble';

const SUGGESTED_PROMPTS = [
  'Summarize my notes',
  'Create a quiz',
  'Explain this concept',
  'What are Newton’s laws?',
  'Generate flashcards',
];

const PROMPT_CARDS = [
  {
    icon: 'document-text-outline',
    title: 'Summarize Notes',
    desc: 'Extract key formulas, definitions, and main exam takeaways',
    prompt: 'Summarize my study materials and highlight the core formulas and definitions.',
    iconColor: '#4F46E5',
    bgColor: '#EEF2FF',
  },
  {
    icon: 'help-circle-outline',
    title: 'Create a Quiz',
    desc: 'Practice with 5 multiple-choice questions with answers',
    prompt: 'Create a 5-question practice quiz based on the key concepts with answer explanations.',
    iconColor: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    icon: 'bulb-outline',
    title: 'Explain Concepts',
    desc: 'Break down complex topics into clear, intuitive steps',
    prompt: 'Explain the fundamental concepts step-by-step with real-world examples.',
    iconColor: '#D97706',
    bgColor: '#FFFBEB',
  },
  {
    icon: 'school-outline',
    title: "Newton's Laws",
    desc: 'Deep dive into laws of motion with practical demonstrations',
    prompt: 'What are Newton’s laws of motion? Explain each law with examples.',
    iconColor: '#7C3AED',
    bgColor: '#F5F3FF',
  },
];

export const ChatScreen = ({ navigation }) => {
  const {
    chatMessages,
    sendChatMessage,
    clearChat,
    activeDocumentContext,
    setActiveDocumentContext,
    themeColors,
    isDark,
  } = useApp();

  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages, isAiTyping]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage || '').trim();
    if (!text || isAiTyping) return;

    setInputMessage('');
    setIsAiTyping(true);

    try {
      await sendChatMessage(text);
    } finally {
      setIsAiTyping(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="sparkles" size={28} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>AI Study Assistant</Text>
      <Text style={styles.emptySubtitle}>
        {activeDocumentContext
          ? `Grounded in "${activeDocumentContext.title}". Ask anything or explore below:`
          : 'Ask any academic question, request a summary, or practice with a quiz.'}
      </Text>

      <View style={styles.cardsGrid}>
        {PROMPT_CARDS.map((card, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.cardItem, SHADOWS.subtle]}
            activeOpacity={0.75}
            onPress={() => handleSend(card.prompt)}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: isDark ? '#1E1B4B' : card.bgColor }]}>
              <Ionicons name={card.icon} size={20} color={card.iconColor} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardHeading}>{card.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {card.desc}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_HOME });
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Study Assistant</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {activeDocumentContext
                ? `Context: ${activeDocumentContext.title}`
                : 'Powered by Gemini AI'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate(ROUTES.CHAT_HISTORY)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Chat History"
            >
              <Ionicons name="time-outline" size={22} color={themeColors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={clearChat}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="New Chat"
            >
              <Ionicons name="create-outline" size={22} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Document Context Pill Banner */}
        {activeDocumentContext && (
          <View style={styles.contextBanner}>
            <Ionicons name="document-text" size={16} color={COLORS.primary} />
            <Text style={styles.contextText} numberOfLines={1}>
              Active Document: {activeDocumentContext.title}
            </Text>
            <TouchableOpacity
              onPress={() => setActiveDocumentContext(null)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Messages List */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              onSourcePress={(src) => {
                const docId = src.documentId || src.docId;
                if (docId) {
                  navigation.navigate(ROUTES.DOCUMENT_DETAILS, { id: docId, documentId: docId });
                }
              }}
              onRetry={(failedMsg) => handleSend(failedMsg.retryText || failedMsg.promptText || failedMsg.text)}
            />
          )}
          contentContainerStyle={[
            styles.messageList,
            (!chatMessages || chatMessages.length === 0) && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isAiTyping ? (
              <View style={styles.typingContainer}>
                <View style={[styles.typingBubble, SHADOWS.subtle]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.typingText}>StudyMate is thinking & analyzing...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggested Prompts (when few messages) */}
        {chatMessages && chatMessages.length <= 2 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggested Prompts</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={SUGGESTED_PROMPTS}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.promptsRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.promptChip}
                  onPress={() => handleSend(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promptChipText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Bottom Input Composer */}
        <View style={styles.composerBar}>
          <TextInput
            style={styles.composerInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask anything about your studies..."
            placeholderTextColor={themeColors.textMuted}
            multiline
            maxHeight={100}
            onSubmitEditing={() => handleSend()}
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
                e.preventDefault?.();
                handleSend();
              }
            }}
            returnKeyType="send"
          />

          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!inputMessage.trim() || isAiTyping}
            style={[
              styles.sendCircle,
              inputMessage.trim() && !isAiTyping
                ? styles.sendCircleActive
                : styles.sendCircleDisabled,
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={17} color={COLORS.textWhite} style={styles.sendIconOffset} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardContainer: {
      flex: 1,
    },
    header: {
      height: 60,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      padding: 4,
      marginRight: 6,
    },
    headerCenter: {
      flex: 1,
    },
    headerTitle: {
      fontSize: SIZES.fontLg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: SIZES.fontXs,
      color: colors.textMuted,
      marginTop: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerActionBtn: {
      padding: 6,
      marginLeft: 6,
    },
    contextBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceMuted,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contextText: {
      flex: 1,
      fontSize: SIZES.fontXs,
      color: isDark ? '#A5B4FC' : COLORS.primaryDark,
      fontWeight: '600',
      marginHorizontal: 8,
    },
    messageList: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    emptyIconCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: SIZES.fontLg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: SIZES.fontSm,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 16,
      marginBottom: 20,
      lineHeight: 20,
    },
    cardsGrid: {
      width: '100%',
      gap: 10,
    },
    cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTextWrap: {
      flex: 1,
    },
    cardHeading: {
      fontSize: SIZES.fontSm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: SIZES.fontXs,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    typingContainer: {
      paddingVertical: 6,
      alignSelf: 'flex-start',
    },
    typingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: SIZES.radiusMd,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typingText: {
      fontSize: SIZES.fontXs,
      color: colors.textSecondary,
      marginLeft: 8,
      fontWeight: '500',
    },
    suggestionsContainer: {
      paddingTop: 10,
      paddingBottom: 6,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    suggestionsTitle: {
      fontSize: SIZES.fontXs,
      fontWeight: '600',
      color: colors.textMuted,
      paddingHorizontal: 16,
      marginBottom: 6,
    },
    promptsRow: {
      paddingHorizontal: 14,
    },
    promptChip: {
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: SIZES.radiusFull,
      marginRight: 8,
    },
    promptChipText: {
      fontSize: SIZES.fontXs,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    composerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    composerInput: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : colors.surfaceSubtle,
      borderRadius: SIZES.radiusFull,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: SIZES.fontSm,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 10,
    },
    sendCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendCircleActive: {
      backgroundColor: COLORS.primary,
    },
    sendCircleDisabled: {
      backgroundColor: isDark ? '#334155' : '#CBD5E1',
    },
    sendIconOffset: {
      marginLeft: 2,
    },
  });
