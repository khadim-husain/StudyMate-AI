import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { TaskCard } from '../components/TaskCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { InputField } from '../components/InputField';

const getWeekDays = () => {
  const now = new Date();
  const currentDay = now.getDay();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map((dayName, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - currentDay + idx);
    return {
      day: dayName,
      date: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      isToday: idx === currentDay,
    };
  });
};

export const PlannerScreen = ({ navigation }) => {
  const { tasks, toggleTask, addTask, themeColors, isDark } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const weekDays = React.useMemo(() => getWeekDays(), []);
  const todayIndex = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthTitle = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskTime, setTaskTime] = useState('9:00 AM - 10:00 AM');
  const [taskPriority, setTaskPriority] = useState('High');

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    await addTask({
      title: taskTitle.trim(),
      subject: taskSubject.trim() || 'General Study',
      dueTime: taskTime,
      dueDate: new Date().toISOString().split('T')[0],
      priority: taskPriority,
    });

    setTaskTitle('');
    setTaskSubject('');
    setIsModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate(ROUTES.TAB_HOME);
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Study Planner</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.TASKS)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="list" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Month Navigation */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Days of Week Strip */}
        <View style={styles.daysStrip}>
          {weekDays.map((item, index) => {
            const isSelected = selectedDayIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={styles.dayCol}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLabel, isSelected && { color: COLORS.primary, fontWeight: '700' }]}>
                  {item.day}
                </Text>
                <View
                  style={[
                    styles.dateCircle,
                    isSelected && styles.dateCircleActive,
                    item.isToday && !isSelected && { borderWidth: 1, borderColor: COLORS.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateNumber,
                      isSelected && styles.dateNumberActive,
                    ]}
                  >
                    {item.date}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tasks Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Scheduled Study Tasks ({tasks.length})
          </Text>
        </View>

        {/* Tasks List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tasksList}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              checkboxRight={true}
            />
          ))}
        </ScrollView>

        {/* Floating Action Button (+) */}
        <TouchableOpacity
          style={[styles.fab, SHADOWS.glow]}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Quick Add Task Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, SHADOWS.glow]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Study Task</Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Task Title"
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="e.g. Chapter 4 Practice Problems"
              icon="checkbox-outline"
            />

            <InputField
              label="Subject / Topic"
              value={taskSubject}
              onChangeText={setTaskSubject}
              placeholder="e.g. Organic Chemistry"
              icon="book-outline"
            />

            <InputField
              label="Scheduled Time"
              value={taskTime}
              onChangeText={setTaskTime}
              placeholder="e.g. 2:00 PM - 3:30 PM"
              icon="time-outline"
            />

            <PrimaryButton
              title="Save Task"
              onPress={handleCreateTask}
              disabled={!taskTitle.trim()}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
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
      padding: 4,
    },
    headerTitle: {
      fontSize: SIZES.fontLg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    monthNavRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    daysStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    dayCol: {
      alignItems: 'center',
    },
    dayLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 8,
      fontWeight: '500',
    },
    dateCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateCircleActive: {
      backgroundColor: COLORS.primary,
    },
    dateNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    dateNumberActive: {
      color: COLORS.textWhite,
      fontWeight: '700',
    },
    sectionHeaderRow: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    tasksList: {
      paddingBottom: 90,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 36,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
  });
