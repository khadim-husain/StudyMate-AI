import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';

const TABS = ['Overview', 'Chunks', 'Q&A'];

export const DocumentDetailsScreen = ({ route, navigation }) => {
  const { documentId, initialTab } = route?.params || {};
  const { documents, removeDocument, setActiveDocumentContext, sendChatMessage } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab || 'Overview');
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const doc =
    documents.find((d) => d.id === documentId) ||
    documents[0];

  useEffect(() => {
    if (doc?.id) {
      setLoadingChunks(true);
      api.documents.getChunks(doc.id)
        .then((data) => {
          if (data && data.length > 0) setChunks(data);
        })
        .finally(() => setLoadingChunks(false));
    }
  }, [doc?.id]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_MATERIALS });
    }
  };

  const handleDeleteDocument = () => {
    if (!doc) return;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
        removeDocument(doc.id).then(() => handleBack());
      }
      return;
    }
    Alert.alert('Delete Document', `Are you sure you want to delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeDocument(doc.id);
          handleBack();
        },
      },
    ]);
  };

  const handleAskAQuestion = (customQuestion) => {
    if (!doc) return;
    setActiveDocumentContext(doc);
    if (customQuestion) {
      sendChatMessage(`Regarding "${doc.title}": ${customQuestion}`);
    }
    navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_CHAT });
  };

  if (!doc) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Document Selected</Text>
          <PrimaryButton
            title="Upload Document"
            onPress={() => navigation.navigate(ROUTES.PDF_UPLOAD)}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Details</Text>
        <TouchableOpacity onPress={handleDeleteDocument} style={styles.trashBtn}>
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Document Top Card */}
        <View style={[styles.docTopCard, SHADOWS.subtle]}>
          <View style={styles.docIconBox}>
            <Ionicons name="document-text" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
          <Text style={styles.docMeta}>
            {doc.pages || 12} pages • {doc.size || '2.4 MB'}
          </Text>
          <View style={styles.badgeWrapper}>
            <Badge label="Completed" variant="Completed" size="sm" />
          </View>
        </View>

        {/* 3 Tabs: Overview, Chunks, Q&A */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content: Overview */}
        {activeTab === 'Overview' && (
          <View style={styles.overviewContainer}>
            {/* Metadata Fields */}
            <View style={styles.metaFieldRow}>
              <View style={styles.metaFieldLeft}>
                <Ionicons name="layers-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaLabel}>Pages</Text>
              </View>
              <Text style={styles.metaValue}>{doc.pages || 12}</Text>
            </View>

            <View style={styles.metaFieldRow}>
              <View style={styles.metaFieldLeft}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaLabel}>Uploaded</Text>
              </View>
              <Text style={styles.metaValue}>{doc.uploadedAt || 'Recently'}</Text>
            </View>

            <View style={styles.metaFieldRow}>
              <View style={styles.metaFieldLeft}>
                <Ionicons name="document-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaLabel}>File Type</Text>
              </View>
              <Text style={styles.metaValue}>PDF</Text>
            </View>

            {/* Description */}
            <View style={styles.descSection}>
              <Text style={styles.descHeading}>Document Overview</Text>
              <Text style={styles.descBody}>
                {doc.description ||
                  `Uploaded study material: ${doc.title}. Extracted text and vectorized chunks are ready for instant Q&A, active recall quizzes, and flashcards.`}
              </Text>
            </View>

            {/* AI Action Buttons */}
            <TouchableOpacity
              style={styles.summaryNavBtn}
              onPress={() => navigation.navigate(ROUTES.AI_SUMMARY, { docId: doc.id, docTitle: doc.title })}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              <Text style={styles.summaryNavText}>View AI Summary & Key Concepts</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.summaryNavBtn, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}
              onPress={() => navigation.navigate(ROUTES.QUIZ, { docId: doc.id, docTitle: doc.title })}
              activeOpacity={0.8}
            >
              <Ionicons name="help-circle" size={18} color="#9333EA" />
              <Text style={[styles.summaryNavText, { color: '#9333EA' }]}>Generate Quiz from Document</Text>
              <Ionicons name="chevron-forward" size={18} color="#9333EA" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.summaryNavBtn, { backgroundColor: '#CCFBF1', borderColor: '#99F6E4' }]}
              onPress={() => navigation.navigate(ROUTES.FLASHCARDS, { docId: doc.id, docTitle: doc.title })}
              activeOpacity={0.8}
            >
              <Ionicons name="albums" size={18} color="#0D9488" />
              <Text style={[styles.summaryNavText, { color: '#0D9488' }]}>Generate Flashcards from Document</Text>
              <Ionicons name="chevron-forward" size={18} color="#0D9488" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* Ask a Question Primary Button */}
            <PrimaryButton
              title="Ask AI a Question about this PDF"
              onPress={() => handleAskAQuestion()}
              style={styles.askBtn}
            />
          </View>
        )}

        {/* Tab Content: Chunks */}
        {activeTab === 'Chunks' && (
          <View style={styles.tabContent}>
            {loadingChunks ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 13 }}>Loading document chunks...</Text>
              </View>
            ) : (chunks.length > 0 ? chunks : (doc.chunks && doc.chunks.length > 0 ? doc.chunks : [
              {
                id: 'c1',
                page: 1,
                heading: 'Section 1: Document Intro',
                text: 'Extracted content indexed for question answering and retrieval.',
              }
            ])).map((chunk) => (
              <View key={chunk.id} style={[styles.chunkCard, SHADOWS.subtle]}>
                <View style={styles.chunkTopRow}>
                  <View style={styles.chunkBadge}>
                    <Text style={styles.chunkBadgeText}>Page {chunk.page || 1}</Text>
                  </View>
                  <Text style={styles.chunkTitle}>{chunk.heading}</Text>
                </View>
                <Text style={styles.chunkSnippet}>{chunk.text}</Text>
                <TouchableOpacity
                  style={styles.chunkAsk}
                  onPress={() => handleAskAQuestion(`Explain this section: "${chunk.heading}"`)}
                >
                  <Ionicons name="chatbubble-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.chunkAskText}>Ask about this chunk</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tab Content: Q&A */}
        {activeTab === 'Q&A' && (
          <View style={styles.tabContent}>
            <Text style={styles.qaHint}>Select a prompt to ask AI with direct citations:</Text>
            {[
              'Explain Newton’s second law with an everyday example.',
              'What are the core formulas for conservative forces?',
              'Generate 3 quiz practice questions from this chapter.',
            ].map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.qaItem, SHADOWS.subtle]}
                onPress={() => handleAskAQuestion(q)}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
                <Text style={styles.qaItemText}>{q}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  trashBtn: {
    padding: 6,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  docTopCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  docIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  docMeta: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  badgeWrapper: {
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: SIZES.radiusSm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  overviewContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  metaFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  metaFieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  metaValue: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  descSection: {
    paddingVertical: 16,
  },
  descHeading: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  descBody: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  summaryNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    marginBottom: 20,
  },
  summaryNavText: {
    fontSize: SIZES.fontXs,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  askBtn: {
    borderRadius: 14,
  },
  tabContent: {
    gap: 12,
  },
  chunkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chunkTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  chunkBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  chunkBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chunkTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  chunkSnippet: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  chunkAsk: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chunkAskText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  qaHint: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  qaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qaItemText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    marginLeft: 10,
    marginRight: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
});
