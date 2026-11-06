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
import { LoadingIndicator } from '../components/LoadingIndicator';
import { MOCK_QUIZ } from '../services/mockData';

export const QuizScreen = ({ route, navigation }) => {
  const { docId } = route?.params || {};
  const { documents, refreshDashboardStats, refreshQuizzes } = useApp();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const targetDoc = documents.find((d) => d.id === docId) || documents[0];
      const data = await api.ai.getQuiz(targetDoc?.id, targetDoc?.title || 'General Knowledge');
      setQuiz(data);
    } catch (err) {
      console.warn('[Quiz] Fetch error:', err.message);
      setQuiz(MOCK_QUIZ);
    } finally {
      setLoading(false);
    }
  }, [docId, documents]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const questions = quiz?.questions || MOCK_QUIZ.questions;
  const currentQ = questions[currentIndex] || questions[0];
  const selectedOption = currentQ ? userAnswers[currentQ.id] : undefined;

  const handleSelectOption = (optionIndex) => {
    if (isSubmitted || !currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (quiz?.id) {
        try {
          const attempt = await api.quizzes.submit(quiz.id, userAnswers);
          if (attempt) {
            setAttemptResult(attempt);
            setIsSubmitted(true);
            if (refreshDashboardStats) refreshDashboardStats();
            if (refreshQuizzes) refreshQuizzes();
            return;
          }
        } catch (apiErr) {
          console.warn('[Quiz] Backend submit failed, falling back to local scoring:', apiErr.message);
        }
      }

      let score = 0;
      const results = questions.map((q) => {
        const sel = userAnswers[q.id];
        const correct = sel === q.correctAnswerIndex;
        if (correct) score += 1;
        return {
          question_id: q.id,
          question: q.question,
          options: q.options,
          selected_option: sel,
          correct_option: q.correctAnswerIndex,
          is_correct: correct,
          explanation: q.explanation,
        };
      });

      setAttemptResult({
        score,
        total_questions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        results,
      });
      setIsSubmitted(true);
      if (refreshDashboardStats) refreshDashboardStats();
    } catch (err) {
      Alert.alert('Submission Error', err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <LoadingIndicator message="Preparing Quiz..." />
      </SafeAreaView>
    );
  }

  // Quiz Results View
  if (isSubmitted && attemptResult) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.MAIN_TABS)} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={[styles.resultCard, SHADOWS.subtle]}>
            <Text style={styles.resultTitle}>Quiz Completed!</Text>
            <Text style={styles.resultScore}>
              {attemptResult.score} / {attemptResult.total_questions} Correct
            </Text>
            <Text style={styles.resultPercentage}>{attemptResult.percentage}% Score</Text>
          </View>

          {/* Graded Questions Review */}
          {attemptResult.results && attemptResult.results.length > 0 && (
            <View style={{ width: '100%', marginVertical: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 }}>
                Answer Review
              </Text>
              {attemptResult.results.map((res, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: res.is_correct ? '#86EFAC' : '#FCA5A5',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons
                      name={res.is_correct ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={res.is_correct ? COLORS.success : COLORS.danger}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: res.is_correct ? COLORS.success : COLORS.danger }}>
                      {res.is_correct ? 'Correct' : 'Needs Review'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
                    {res.question}
                  </Text>
                  {res.options && res.correct_option !== undefined && (
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>
                      Correct: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{res.options[res.correct_option] || res.correct_option}</Text>
                    </Text>
                  )}
                  {res.explanation ? (
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                      💡 {res.explanation}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => {
              setIsSubmitted(false);
              setCurrentIndex(0);
              setUserAnswers({});
            }}
          >
            <Text style={styles.retakeBtnText}>Retake Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with Back and Close */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.MAIN_TABS)} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.quizTitle}>{quiz?.title || 'Study Quiz'}</Text>

        {/* Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="document-text-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaBadgeText}>{questions.length} Questions</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="speedometer-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaBadgeText}>{quiz?.difficulty || 'Medium'}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaBadgeText}>15 min</Text>
          </View>
        </View>

        {/* Question Counter: e.g. 3 / 10 */}
        <Text style={styles.questionCounterText}>
          {currentIndex + 1} / {questions.length}
        </Text>

        {/* Question Title */}
        <Text style={styles.questionText}>
          {currentQ?.question ||
            'Which law states that for every action there is an equal and opposite reaction?'}
        </Text>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQ?.options?.map((opt, idx) => {
            const isSelected = selectedOption === idx;

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSelectOption(idx)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />
                  )}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Controls: Previous & Next */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          style={[styles.navBtn, styles.prevBtn, currentIndex === 0 && styles.btnDisabled]}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.prevBtnText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.navBtn, styles.nextBtn]}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === questions.length - 1 ? 'Submit' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textWhite} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  iconBtn: {
    padding: 6,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSm,
  },
  metaBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  questionCounterText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionCardSelected: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioCircleSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#065F46',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  prevBtn: {
    flex: 0.45,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  prevBtnText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  nextBtn: {
    flex: 0.48,
    backgroundColor: COLORS.primary,
  },
  nextBtnText: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  resultPercentage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  retakeBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    color: COLORS.textWhite,
    fontSize: SIZES.fontMd,
    fontWeight: '700',
  },
});
