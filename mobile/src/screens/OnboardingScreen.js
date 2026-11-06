import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { PrimaryButton } from '../components/PrimaryButton';
import { useTheme } from '../context/AppContext';

const SLIDES = [
  {
    id: '1',
    heroIcon: 'laptop-outline',
    title: 'Your Personal\nAI Study Assistant',
    subtitle:
      'Get personalized learning, AI-powered chat, study materials, quizzes and more.',
    badge1: 'chatbubbles',
    badge2: 'school',
    badge3: 'document-text',
    badge4: 'bulb',
  },
  {
    id: '2',
    heroIcon: 'document-attach-outline',
    title: 'Transform Heavy PDFs\nInto Active Mastery',
    subtitle:
      'Upload lecture slides and textbooks. Extract instant summaries, page citations, and key formulas.',
    badge1: 'bookmark',
    badge2: 'sparkles',
    badge3: 'layers',
    badge4: 'search',
  },
  {
    id: '3',
    heroIcon: 'trophy-outline',
    title: 'Adaptive Quizzes &\nSpaced Repetition',
    subtitle:
      'Practice active recall with automated quiz generation, memory flashcards, and study habit analytics.',
    badge1: 'ribbon',
    badge2: 'flame',
    badge3: 'calendar',
    badge4: 'checkmark-circle',
  },
];

export const OnboardingScreen = ({ navigation }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      navigation.replace(ROUTES.LOGIN);
    }
  };

  const handleSkip = () => {
    navigation.replace(ROUTES.LOGIN);
  };

  const currentSlide = SLIDES[currentSlideIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Top Header */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Ionicons name="school" size={22} color={COLORS.primary} />
              <Text style={styles.brandText}>StudyMate AI</Text>
            </View>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Artwork Card with Floating AI Icons */}
          <View style={styles.heroWrapper}>
            <View style={[styles.heroCard, SHADOWS.medium]}>
              <LinearGradient
                colors={isDark ? ['#1E1B4B', '#0F172A', '#1E293B'] : ['#EDE9FE', '#DBEAFE', '#F4F5FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBackground}
              >
                {/* Floating AI Icons */}
                <View style={[styles.floatBadge, styles.floatTopLeft, SHADOWS.subtle]}>
                  <Ionicons name={currentSlide.badge1} size={18} color={COLORS.primary} />
                </View>

                <View style={[styles.floatBadge, styles.floatTopRight, SHADOWS.subtle]}>
                  <Ionicons name={currentSlide.badge2} size={18} color={COLORS.blue} />
                </View>

                <View style={[styles.floatBadge, styles.floatBottomLeft, SHADOWS.subtle]}>
                  <Ionicons name={currentSlide.badge3} size={18} color={COLORS.warning} />
                </View>

                <View style={[styles.floatBadge, styles.floatBottomRight, SHADOWS.subtle]}>
                  <Ionicons name={currentSlide.badge4} size={18} color={COLORS.success} />
                </View>

                {/* Central Student / Study Hero Graphic */}
                <View style={styles.centerGraphic}>
                  <View style={[styles.graphicCircle, SHADOWS.glow]}>
                    <LinearGradient
                      colors={['#5B4DFF', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.graphicInner}
                    >
                      <Ionicons name="person" size={48} color={COLORS.textWhite} />
                    </LinearGradient>
                  </View>
                  <View style={styles.laptopBadge}>
                    <Ionicons name={currentSlide.heroIcon} size={24} color={COLORS.primary} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Slide Copy */}
          <View style={styles.textWrapper}>
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
          </View>

          {/* Pagination Dots */}
          <View style={styles.paginationRow}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentSlideIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <PrimaryButton
              title={currentSlideIndex === SLIDES.length - 1 ? "Let's Go" : "Continue"}
              onPress={handleNext}
              style={styles.getStartedBtn}
            />

            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipLink}
              activeOpacity={0.7}
            >
              <Text style={styles.skipLinkText}>Skip to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 440,
      justifyContent: 'space-between',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      marginBottom: 8,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandText: {
      fontSize: SIZES.fontMd,
      fontWeight: '800',
      color: isDark ? '#A5B4FC' : COLORS.primaryDark,
      marginLeft: 6,
    },
    skipBtn: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    skipBtnText: {
      fontSize: SIZES.fontSm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    heroWrapper: {
      alignItems: 'center',
      marginVertical: 12,
    },
    heroCard: {
      width: '100%',
      maxWidth: 380,
      height: 240,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    heroBackground: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    centerGraphic: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    graphicCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      padding: 3,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    graphicInner: {
      flex: 1,
      borderRadius: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    laptopBadge: {
      position: 'absolute',
      bottom: -10,
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: SIZES.radiusSm,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.subtle,
    },
    floatBadge: {
      position: 'absolute',
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatTopLeft: {
      top: 18,
      left: 18,
    },
    floatTopRight: {
      top: 18,
      right: 18,
    },
    floatBottomLeft: {
      bottom: 18,
      left: 18,
    },
    floatBottomRight: {
      bottom: 18,
      right: 18,
    },
    textWrapper: {
      alignItems: 'center',
      paddingHorizontal: 12,
      marginVertical: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 28,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: SIZES.fontSm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    paginationRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 12,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: isDark ? '#334155' : '#CBD5E1',
      marginHorizontal: 4,
    },
    dotActive: {
      width: 22,
      backgroundColor: COLORS.primary,
    },
    footer: {
      alignItems: 'center',
      marginTop: 8,
      width: '100%',
    },
    getStartedBtn: {
      width: '100%',
      marginBottom: 8,
    },
    skipLink: {
      paddingVertical: 8,
    },
    skipLinkText: {
      fontSize: SIZES.fontSm,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
