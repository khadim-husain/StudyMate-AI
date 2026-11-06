import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';

export const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, authLoading } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1700,
        useNativeDriver: false,
      }),
    ]).start();

    // Normal splash duration
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1800);

    // Hard failsafe in case auth network check hangs
    const failsafe = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace(ROUTES.MAIN_TABS);
      } else {
        navigation.replace(ROUTES.ONBOARDING);
      }
    }, 3800);

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
    };
  }, [navigation, fadeAnim, scaleAnim, progressAnim, isAuthenticated]);

  useEffect(() => {
    if (minTimeElapsed && !authLoading) {
      if (isAuthenticated) {
        navigation.replace(ROUTES.MAIN_TABS);
      } else {
        navigation.replace(ROUTES.ONBOARDING);
      }
    }
  }, [minTimeElapsed, authLoading, isAuthenticated, navigation]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#0B0F19', '#111827', '#1E1B4B']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Decorative ambient glowing circles */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow Logo Cap Container */}
        <View style={styles.logoOuter}>
          <LinearGradient
            colors={['#5B4DFF', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="school" size={56} color={COLORS.textWhite} />
          </LinearGradient>
          <View style={styles.sparkleIcon}>
            <Ionicons name="sparkles" size={16} color="#38BDF8" />
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.appName}>StudyMate AI</Text>
        <Text style={styles.assistantSubtitle}>Your AI Study Assistant</Text>

        {/* Brand Tagline */}
        <View style={styles.taglineBox}>
          <Text style={styles.tagline}>
            Learn Smarter.{'\n'}Study Better.{'\n'}Achieve More.
          </Text>
        </View>

        {/* Sleek Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0.0 • Mobile Edition</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: '15%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(91, 77, 255, 0.12)',
    filter: 'blur(40px)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: '20%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 2,
    width: '100%',
  },
  logoOuter: {
    width: 104,
    height: 104,
    borderRadius: 30,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...SHADOWS.glow,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  appName: {
    fontSize: SIZES.fontTitle,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  assistantSubtitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  taglineBox: {
    marginBottom: 36,
  },
  tagline: {
    fontSize: SIZES.fontMd,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 22,
    fontWeight: '500',
  },
  progressTrack: {
    width: 150,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: SIZES.fontXs,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
