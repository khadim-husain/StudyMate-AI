import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { InputField } from '../components/InputField';

const TASK_FILTERS = ['All', 'Pending', 'Completed'];

export const TasksScreen = ({ navigation }) => {
  const { tasks, toggleTask, addTask, deleteTask } = useApp();

  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('High');

  const handleDeleteTask = (taskId, taskTitle) => {
    const doDelete = async () => {
      if (deleteTask) await deleteTask(taskId);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete task "${taskTitle}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Task', `Are you sure you want to delete "${taskTitle}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'Pending') return !t.completed;
    if (activeFilter === 'Completed') return t.completed;
    return true;
  });

  const handleSave = async () => {
    if (!title.trim()) return;

    await addTask({
      title: title.trim(),
      subject: subject.trim() || 'General Study',
      dueTime: 'Today',
      priority,
    });

    setTitle('');
    setSubject('');
    setIsModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen 14 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_PLANNER });
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks & Deadlines</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        {/* Filter Pills: All, Pending, Completed */}
        <View style={styles.filterRow}>
          {TASK_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterPill,
                activeFilter === f && styles.filterPillActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task Cards List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredTasks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="checkbox-outline" size={48} color={COLORS.border} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 }}>
                No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} tasks found
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                Stay on track by adding your study milestones!
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, SHADOWS.subtle]}
                activeOpacity={0.8}
                onPress={() => toggleTask(task.id)}
              >
                <TouchableOpacity
                  onPress={() => toggleTask(task.id)}
                  style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />
                  )}
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.priorityIndicatorDot,
                        task.priority === 'High' ? styles.dotHigh : styles.dotMedium,
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        task.priority === 'High' ? styles.textHigh : styles.textMedium,
                      ]}
                    >
                      {task.dueTime || 'Today'} • {task.priority || 'High'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id, task.title);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4, marginRight: 4 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add Task Button at Bottom */}
        <PrimaryButton
          title="+ Add Task"
          onPress={() => setIsModalOpen(true)}
          style={styles.addBtnBottom}
        />
      </View>

      {/* Add Task Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, SHADOWS.glow]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Study Task</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Complete Physics Revision"
              icon="create-outline"
            />

            <InputField
              label="Subject / Topic"
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Physics Mechanics"
              icon="book-outline"
            />

            <PrimaryButton
              title="Save Task"
              onPress={handleSave}
              disabled={!title.trim()}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textWhite,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotHigh: {
    backgroundColor: '#EF4444',
  },
  dotMedium: {
    backgroundColor: '#F59E0B',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textHigh: {
    color: '#EF4444',
  },
  textMedium: {
    color: '#D97706',
  },
  addBtnBottom: {
    borderRadius: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
