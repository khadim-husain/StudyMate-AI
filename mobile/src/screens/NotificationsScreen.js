import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export const NotificationsScreen = ({ navigation }) => {
  const { userPreferences, updateUserPreferences, themeColors, isDark, t } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [prefs, setPrefs] = useState({
    notifications_enabled: true,
    study_reminders: true,
    task_deadline_reminders: true,
    quiz_reminders: true,
    daily_study_goals: true,
    doc_processing_notifications: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(false);

  useEffect(() => {
    if (userPreferences) {
      setPrefs({
        notifications_enabled: userPreferences.notifications_enabled ?? true,
        study_reminders: userPreferences.study_reminders ?? true,
        task_deadline_reminders: userPreferences.task_deadline_reminders ?? true,
        quiz_reminders: userPreferences.quiz_reminders ?? true,
        daily_study_goals: userPreferences.daily_study_goals ?? true,
        doc_processing_notifications: userPreferences.doc_processing_notifications ?? true,
      });
    }
  }, [userPreferences]);

  const handleToggle = async (key) => {
    const updated = {
      ...prefs,
      [key]: !prefs[key],
    };

    setPrefs(updated);
    setIsSaving(true);
    await updateUserPreferences({ [key]: updated[key] });
    setIsSaving(false);
    setSuccessFeedback(true);
    setTimeout(() => setSuccessFeedback(false), 2000);
  };

  const notificationItems = [
    {
      key: 'study_reminders',
      title: t('studyReminders') || 'Study Reminders',
      desc: 'Daily study nudge based on your active revision plan.',
      icon: 'school-outline',
      color: COLORS.primary,
    },
    {
      key: 'task_deadline_reminders',
      title: t('taskDeadlines') || 'Task Deadline Reminders',
      desc: 'Alerts before your homework and assignment due dates.',
      icon: 'alarm-outline',
      color: '#F59E0B',
    },
    {
      key: 'quiz_reminders',
      title: t('quizReminders') || 'Quiz Reminders',
      desc: 'Spaced repetition alerts for weak quiz topics.',
      icon: 'help-circle-outline',
      color: '#3B82F6',
    },
    {
      key: 'daily_study_goals',
      title: t('dailyGoals') || 'Daily Study Goals',
      desc: 'Progress alerts when approaching your daily learning target.',
      icon: 'flame-outline',
      color: '#EF4444',
    },
    {
      key: 'doc_processing_notifications',
      title: t('docProcessing') || 'Document Processing',
      desc: 'Notification when uploaded PDFs finish AI embedding & indexing.',
      icon: 'document-text-outline',
      color: '#10B981',
    },
  ];

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_PROFILE });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications') || 'Notification Settings'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Save confirmation pill */}
        {successFeedback && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.savedText}>Preferences saved to your account</Text>
          </View>
        )}

        {/* Master Switch Card */}
        <View style={[styles.masterCard, SHADOWS.subtle]}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIconCircle}>
              <Ionicons name="notifications" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.masterTextCol}>
              <Text style={styles.masterTitle}>{t('enableNotifications') || 'Allow Notifications'}</Text>
              <Text style={styles.masterSubtitle}>
                Master switch to enable or pause all learning alerts.
              </Text>
            </View>
          </View>

          <Switch
            value={prefs.notifications_enabled}
            onValueChange={() => handleToggle('notifications_enabled')}
            trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: COLORS.primary }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* Category Toggles */}
        <Text style={styles.sectionHeader}>{t('notificationCategories') || 'Alert Preferences'}</Text>

        <View style={[styles.listCard, SHADOWS.subtle]}>
          {notificationItems.map((item, index) => {
            const isRowDisabled = !prefs.notifications_enabled;

            return (
              <React.Fragment key={item.key}>
                <View style={[styles.toggleRow, isRowDisabled && styles.rowDisabled]}>
                  <View style={[styles.itemIconCircle, { backgroundColor: isDark ? '#1E1B4B' : `${item.color}15` }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>

                  <View style={styles.itemTextCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>

                  <Switch
                    value={prefs[item.key] && prefs.notifications_enabled}
                    disabled={isRowDisabled}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: item.color }}
                    thumbColor={'#FFFFFF'}
                  />
                </View>

                {index < notificationItems.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: 52,
    },
    backBtn: {
      padding: 6,
    },
    headerTitle: {
      fontSize: SIZES.fontLg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    savedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
      borderColor: isDark ? '#047857' : '#A7F3D0',
      borderWidth: 1,
      borderRadius: SIZES.radiusMd,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
    },
    savedText: {
      fontSize: 13,
      color: isDark ? '#6EE7B7' : '#059669',
      fontWeight: '700',
    },
    masterCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    masterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 12,
    },
    masterIconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: isDark ? '#1E1B4B' : '#EDE9FE',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    masterTextCol: {
      flex: 1,
    },
    masterTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    masterSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
      marginLeft: 4,
    },
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
    },
    rowDisabled: {
      opacity: 0.45,
    },
    itemIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    itemTextCol: {
      flex: 1,
      paddingRight: 10,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    itemDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
