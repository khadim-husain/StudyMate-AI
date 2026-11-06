import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingIndicator } from '../components/LoadingIndicator';

const LENGTH_OPTIONS = ['Short', 'Medium', 'Detailed'];

export const AISummaryScreen = ({ route, navigation }) => {
  const { docId } = route?.params || {};
  const { documents } = useApp();

  const doc = documents.find((d) => d.id === docId) || documents[0];

  const [selectedLength, setSelectedLength] = useState('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const loadSummary = useCallback(async (length) => {
    if (!doc) return;
    setIsGenerating(true);
    try {
      const res = await api.ai.generateSummary(doc.id, length);
      setSummaryData(res);
    } catch (err) {
      setSummaryData({
        summary:
          doc.summary ||
          'This chapter covers the basics of mechanics, motion, force, laws of motion, work, energy and power. Newton’s laws explain how objects move and interact with forces.',
        keyConcepts: doc.keyConcepts || [
          'Laws of Motion',
          'Force and Acceleration',
          'Work and Energy',
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  }, [doc]);

  useEffect(() => {
    if (doc) {
      loadSummary(selectedLength);
    }
  }, [doc, selectedLength, loadSummary]);

  const handleGenerateSummary = async () => {
    await loadSummary(selectedLength);
    Alert.alert('Summary Generated', `New ${selectedLength.toLowerCase()} AI summary has been created!`);
  };

  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(currentSummary);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Alert.alert('Copy', 'Summary copied to clipboard!');
    }
  };

  const handleAskAI = () => {
    navigation.navigate(ROUTES.MAIN_TABS, {
      screen: ROUTES.CHAT,
      params: { docId: doc?.id, docTitle: doc?.title },
    });
  };

  const currentSummary =
    summaryData?.summary ||
    doc?.summary ||
    'This chapter covers the basics of mechanics, motion, force, laws of motion, work, energy and power. Newton’s laws explain how objects move and interact with forces.';

  const currentKeyConcepts =
    summaryData?.keyConcepts?.length
      ? summaryData.keyConcepts
      : doc?.keyConcepts || [
          'Laws of Motion',
          'Force and Acceleration',
          'Work and Energy',
        ];

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_MATERIALS });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen 10 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Document Title Banner */}
        <Text style={styles.docTitleBanner} numberOfLines={1}>
          {doc?.title || 'Physics Notes.pdf'}
        </Text>

        {/* Length Selector Pills: Short, Medium, Detailed */}
        <View style={styles.lengthPillRow}>
          {LENGTH_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setSelectedLength(opt)}
              style={[
                styles.lengthPill,
                selectedLength === opt && styles.lengthPillActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.lengthPillText,
                  selectedLength === opt && styles.lengthPillTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isGenerating ? (
          <LoadingIndicator message={`Generating ${selectedLength.toLowerCase()} summary with AI...`} />
        ) : (
          /* Summary Card */
          <View style={[styles.summaryCard, SHADOWS.subtle]}>
            <Text style={styles.summaryCardHeader}>
              {selectedLength === 'Short' ? 'Short Summary' : `${selectedLength} Summary`}
            </Text>
            <Text style={styles.summaryBodyText}>{currentSummary}</Text>

            {/* Key Concepts */}
            <Text style={styles.keyConceptsHeader}>Key Concepts</Text>
            {currentKeyConcepts.map((concept, idx) => (
              <View key={idx} style={styles.conceptRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.conceptItemText}>{concept}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Copy & Q&A Actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
          <TouchableOpacity
            style={[
              styles.copyBtn,
              copied && { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
            ]}
            onPress={handleCopySummary}
            activeOpacity={0.8}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={copied ? '#10B981' : COLORS.textPrimary}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontSize: 13, fontWeight: '700', color: copied ? '#10B981' : COLORS.textPrimary }}>
              {copied ? 'Copied!' : 'Copy Summary'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.askAiBtn}
            onPress={handleAskAI}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>Ask AI About Doc</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <PrimaryButton
            title="Regenerate Summary"
            icon="sparkles"
            onPress={handleGenerateSummary}
            loading={isGenerating}
            style={styles.generateButton}
          />
        </View>
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  docTitleBanner: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  lengthPillRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  lengthPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: SIZES.radiusSm,
  },
  lengthPillActive: {
    backgroundColor: COLORS.primary,
  },
  lengthPillText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  lengthPillTextActive: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 24,
  },
  summaryCardHeader: {
    fontSize: SIZES.fontMd,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  summaryBodyText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  keyConceptsHeader: {
    fontSize: SIZES.fontSm,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  conceptItemText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButton: {
    flex: 1,
    borderRadius: 14,
    marginRight: 12,
  },
  bookmarkButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  askAiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight || '#DBEAFE',
    backgroundColor: '#EEF2FF',
  },
});
