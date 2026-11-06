import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { MOCK_FLASHCARDS } from '../services/mockData';

export const FlashcardsScreen = ({ route, navigation }) => {
  const { docId } = route?.params || {};
  const { flashcards, setFlashcards, documents, markFlashcard, refreshDashboardStats } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadFlashcards = useCallback(async () => {
    if (docId || flashcards.length === 0) {
      setLoading(true);
      try {
        const targetDoc = documents.find((d) => d.id === docId) || documents[0];
        const cards = await api.ai.getFlashcards(
          targetDoc?.id,
          targetDoc?.title || 'General Concepts'
        );
        if (cards && cards.length > 0) {
          setFlashcards(cards);
        }
      } catch (err) {
        console.warn('[Flashcards] Fetch error:', err.message);
        setFlashcards(MOCK_FLASHCARDS);
      } finally {
        setLoading(false);
      }
    }
  }, [docId, documents, flashcards.length, setFlashcards]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const cards = flashcards.length > 0 ? flashcards : MOCK_FLASHCARDS;
  const totalCards = cards.length;
  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * totalCards);
    setCurrentIndex(randomIndex);
  };

  const handleMarkReview = async (isKnown) => {
    if (currentCard?.id && markFlashcard) {
      await markFlashcard(currentCard.id, isKnown);
    }
    if (currentIndex < totalCards - 1) {
      handleNext();
    } else {
      setIsFlipped(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_HOME });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flashcards</Text>
          <View style={{ width: 24 }} />
        </View>
        <LoadingIndicator message="Loading Flashcards..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen 12 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {totalCards}
        </Text>
      </View>

      <View style={styles.container}>
        {/* Flashcard Card */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setIsFlipped(!isFlipped)}
          style={[styles.flashcardCard, SHADOWS.medium]}
        >
          {/* Bulb Icon in Soft Circle */}
          <View style={styles.bulbCircle}>
            <Ionicons
              name={isFlipped ? 'checkmark-circle' : 'bulb'}
              size={28}
              color={COLORS.primary}
            />
          </View>

          {/* Flashcard Question / Answer */}
          <View style={styles.cardContentBox}>
            <Text style={styles.cardQuestionText}>
              {isFlipped
                ? currentCard?.answer ||
                  'The biochemical process in plants that converts carbon dioxide and water into glucose and oxygen using sunlight.'
                : currentCard?.question ||
                  'What is the definition of photosynthesis?'}
            </Text>
          </View>

          {/* Tap to Reveal Answer */}
          <View style={styles.revealHintRow}>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={COLORS.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.revealHintText}>
              {isFlipped ? 'Tap to see Question' : 'Tap to reveal answer'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Spaced Repetition / Active Recall Rating */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            onPress={() => handleMarkReview(false)}
            style={[styles.actionBtn, styles.reviewActionBtn]}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.reviewActionText}>Needs Review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleMarkReview(true)}
            style={[styles.actionBtn, styles.knownActionBtn]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.knownActionText}>Know It</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation Row: < Previous, (Shuffle), Next > */}
        <View style={styles.bottomNavRow}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            style={[styles.prevTextBtn, currentIndex === 0 && styles.btnDisabled]}
          >
            <Ionicons name="chevron-back" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.prevTextBtnLabel}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShuffle}
            style={styles.shuffleCircle}
            activeOpacity={0.8}
          >
            <Ionicons name="shuffle" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            disabled={currentIndex === totalCards - 1}
            style={[styles.nextPillBtn, currentIndex === totalCards - 1 && styles.btnDisabled]}
          >
            <Text style={styles.nextPillText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textWhite} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
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
  counterText: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  flashcardCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bulbCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContentBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardQuestionText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  revealHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  revealHintText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  prevTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  prevTextBtnLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  shuffleCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  nextPillText: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
  },
  reviewActionBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  reviewActionText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  knownActionBtn: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  knownActionText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
});
