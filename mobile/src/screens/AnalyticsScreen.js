import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MOCK_ANALYTICS } from '../services/mockData';

const TABS = ['Overview', 'Subjects', 'Activity'];

export const AnalyticsScreen = ({ navigation }) => {
  const { user, tasks, documents, dashboardStats, getLearningProgress } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        const overview = await api.analytics.getOverview();
        if (isMounted) setData(overview);
      } catch (err) {
        console.warn('[Analytics] Failed to fetch overview:', err.message);
      }
    };
    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const overallPercent = getLearningProgress
    ? getLearningProgress().percent
    : (dashboardStats?.completedTasks && dashboardStats?.totalTasks
      ? Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100)
      : 0);

  const streakDays = dashboardStats?.studyStreakDays || data?.dashboard_metrics?.study_streak_days || 1;
  const studyHours = getLearningProgress
    ? getLearningProgress().completedHours
    : (tasks.filter((t) => t.completed).length * 1.5 + (documents?.length || 0) * 0.5).toFixed(1);

  const colors = ['#5B4DFF', '#7C3AED', '#8B5CF6', '#A78BFA', '#3B82F6', '#06B6D4'];

  const computedSubjects = React.useMemo(() => {
    if (data?.subjects && data.subjects.length > 0) {
      return data.subjects.map((s, idx) => ({
        name: s.subject || 'General Study',
        percent: s.mastery_percent || 0,
        color: colors[idx % colors.length],
      }));
    }

    // Group local tasks by subject
    const subjectMap = {};
    tasks.forEach((t) => {
      const sub = t.subject || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, done: 0 };
      subjectMap[sub].total += 1;
      if (t.completed) subjectMap[sub].done += 1;
    });

    const entries = Object.entries(subjectMap);
    if (entries.length > 0) {
      return entries.map(([sub, info], idx) => ({
        name: sub,
        percent: Math.round((info.done / info.total) * 100),
        color: colors[idx % colors.length],
      }));
    }

    return [
      { name: 'General Studies', percent: overallPercent || 0, color: '#5B4DFF' },
    ];
  }, [data, tasks, overallPercent]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen 15 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_HOME });
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Tabs: Overview, Subjects, Activity */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabBtn,
                activeTab === tab && styles.tabBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2 Highlight Cards: Overall Progress & Days Streak */}
        <View style={styles.highlightCardsRow}>
          {/* Card 1: Overall Progress */}
          <View style={[styles.highlightCard, SHADOWS.subtle]}>
            <View style={styles.ringWrapper}>
              <View style={styles.circleOuter}>
                <View style={styles.circleInner}>
                  <Text style={styles.ringPercentText}>{overallPercent}%</Text>
                </View>
              </View>
            </View>
            <Text style={styles.highlightCardLabel}>Overall Progress</Text>
          </View>

          {/* Card 2: Days Streak */}
          <View style={[styles.highlightCard, SHADOWS.subtle]}>
            <View style={styles.streakIconBox}>
              <Ionicons name="flash" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.streakNumberText}>{streakDays}</Text>
            <Text style={styles.highlightCardLabel}>Days Streak</Text>
          </View>
        </View>

        {/* Subject Performance Section */}
        <View style={styles.subjectSection}>
          <Text style={styles.sectionHeaderTitle}>Subject Performance</Text>

          {computedSubjects.map((item, idx) => (
            <View key={idx} style={styles.subjectItem}>
              <View style={styles.subjectTextRow}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.subjectPercent}>{item.percent}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, Math.max(0, item.percent))}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Extra Activity Metrics when Activity Tab is selected */}
        {activeTab === 'Activity' && (
          <View style={[styles.extraCard, SHADOWS.subtle]}>
            <Text style={styles.extraCardTitle}>Weekly Activity</Text>
            <Text style={styles.extraCardSub}>
              {studyHours} Study Hours completed across {documents?.length || 0} indexed documents and {tasks.filter(t => t.completed).length} completed tasks.
            </Text>
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
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
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: SIZES.radiusSm,
  },
  tabBtnActive: {
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
  highlightCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 14,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  ringWrapper: {
    marginBottom: 10,
  },
  circleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  streakIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  streakNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  highlightCardLabel: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subjectSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 18,
  },
  subjectItem: {
    marginBottom: 18,
  },
  subjectTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subjectPercent: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  extraCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  extraCardTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  extraCardSub: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
