import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { ProgressCard } from '../components/ProgressCard';
import { DocumentCard } from '../components/DocumentCard';

export const HomeScreen = ({ navigation }) => {
  const {
    user,
    documents,
    tasks,
    quizzes,
    flashcards,
    dashboardStats,
    getLearningProgress,
    refreshUserData,
    setActiveDocumentContext,
    themeColors,
    isDark,
  } = useApp();

  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Time-aware dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const displayName = (user?.full_name || user?.name || 'Student').split(' ')[0];

  // Learning progress calculated from real completed study activity
  const progressData = getLearningProgress ? getLearningProgress() : {
    percent: 0,
    completedHours: 0,
    targetHours: 14,
    goalText: 'Keep learning, keep growing',
  };

  // Cross-entity search: Documents, Tasks, and Flashcards
  const query = searchQuery.trim().toLowerCase();
  const matchedDocs = query
    ? documents.filter(
        (d) =>
          d.title?.toLowerCase().includes(query) ||
          d.subject?.toLowerCase().includes(query)
      )
    : [];

  const matchedTasks = query
    ? tasks.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.subject?.toLowerCase().includes(query)
      )
    : [];

  const matchedCards = query
    ? flashcards.filter(
        (f) =>
          f.question?.toLowerCase().includes(query) ||
          f.answer?.toLowerCase().includes(query)
      )
    : [];

  const isSearching = query.length > 0;
  const totalMatches = matchedDocs.length + matchedTasks.length + matchedCards.length;

  const recentDocs = documents.slice(0, 3);

  const handleDocumentPress = (doc) => {
    setActiveDocumentContext(doc);
    navigation.navigate(ROUTES.DOCUMENT_DETAILS, { documentId: doc.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Top Header: Greeting & Profile Avatar */}
        <View style={styles.topHeader}>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingSub}>{getGreeting()}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.greetingName}>{displayName} 👋</Text>
            </View>
            <Text style={styles.taglineSub}>Keep learning, keep growing</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate(ROUTES.TAB_PROFILE)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, SHADOWS.subtle]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={COLORS.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents, tasks, flashcards..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Real Search Results Section */}
        {isSearching ? (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchHeaderRow}>
              <Text style={styles.searchResultsTitle}>
                Search Results ({totalMatches})
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {totalMatches === 0 ? (
              <View style={styles.noResultsBox}>
                <Ionicons name="search" size={28} color={COLORS.textMuted} />
                <Text style={styles.noResultsText}>
                  No items found matching "{searchQuery}"
                </Text>
              </View>
            ) : null}

            {/* Matched Documents */}
            {matchedDocs.length > 0 ? (
              <View style={styles.resultGroup}>
                <Text style={styles.groupLabel}>Documents ({matchedDocs.length})</Text>
                {matchedDocs.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearchQuery('');
                      handleDocumentPress(doc);
                    }}
                  >
                    <Ionicons
                      name="document-text"
                      size={18}
                      color={COLORS.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.searchResultText} numberOfLines={1}>
                      {doc.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Matched Tasks */}
            {matchedTasks.length > 0 ? (
              <View style={styles.resultGroup}>
                <Text style={styles.groupLabel}>Tasks ({matchedTasks.length})</Text>
                {matchedTasks.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearchQuery('');
                      navigation.navigate(ROUTES.TASKS);
                    }}
                  >
                    <Ionicons
                      name={t.completed ? 'checkmark-circle' : 'time-outline'}
                      size={18}
                      color={t.completed ? COLORS.success : COLORS.warning}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.searchResultText,
                        t.completed && { textDecorationLine: 'line-through', opacity: 0.6 },
                      ]}
                      numberOfLines={1}
                    >
                      {t.title} ({t.subject})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Matched Flashcards */}
            {matchedCards.length > 0 ? (
              <View style={styles.resultGroup}>
                <Text style={styles.groupLabel}>Flashcards ({matchedCards.length})</Text>
                {matchedCards.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearchQuery('');
                      navigation.navigate(ROUTES.FLASHCARDS);
                    }}
                  >
                    <Ionicons
                      name="albums-outline"
                      size={18}
                      color="#0D9488"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.searchResultText} numberOfLines={1}>
                      {f.question}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 3 Stat Cards Row: Documents, Quizzes, Tasks from Database */}
        <View style={styles.statCardsRow}>
          <StatCard
            compact
            value={(dashboardStats.totalDocuments || documents.length).toString()}
            label="Documents"
            colorVariant="emerald"
            onPress={() => navigation.navigate(ROUTES.TAB_MATERIALS)}
          />
          <StatCard
            compact
            value={(dashboardStats.totalQuizzes || quizzes.length).toString()}
            label="Quizzes"
            colorVariant="violet"
            onPress={() => navigation.navigate(ROUTES.QUIZ)}
          />
          <StatCard
            compact
            value={(dashboardStats.totalTasks || tasks.length).toString()}
            label="Tasks"
            colorVariant="cyan"
            onPress={() => navigation.navigate(ROUTES.TASKS)}
          />
        </View>

        {/* Dynamic Learning Progress Card */}
        <ProgressCard
          progressPercent={progressData.percent}
          completedHours={progressData.completedHours}
          targetHours={progressData.targetHours}
          goalText={progressData.goalText}
          onPressDetails={() => navigation.navigate(ROUTES.ANALYTICS)}
        />

        {/* Quick Actions Header */}
        <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.TAB_CHAT)}
          >
            <View style={[styles.qaCircle, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="chatbubbles" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.qaLabel}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.PDF_UPLOAD)}
          >
            <View style={[styles.qaCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="cloud-upload" size={22} color="#0284C7" />
            </View>
            <Text style={styles.qaLabel}>Upload PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.QUIZ)}
          >
            <View style={[styles.qaCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="help-circle" size={22} color="#9333EA" />
            </View>
            <Text style={styles.qaLabel}>Create Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.FLASHCARDS)}
          >
            <View style={[styles.qaCircle, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="albums" size={22} color="#0D9488" />
            </View>
            <Text style={styles.qaLabel}>Flashcards</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Documents Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recent Documents</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.TAB_MATERIALS)}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Documents List or Empty State */}
        {recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={() => handleDocumentPress(doc)}
            />
          ))
        ) : (
          <View style={[styles.emptyDocsCard, SHADOWS.subtle]}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyDocsTitle}>No study documents uploaded yet</Text>
            <Text style={styles.emptyDocsSub}>
              Upload your lecture notes, syllabus, or textbook PDFs to generate AI summaries and quizzes.
            </Text>
            <TouchableOpacity
              style={styles.emptyUploadBtn}
              onPress={() => navigation.navigate(ROUTES.PDF_UPLOAD)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={COLORS.textWhite}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.emptyUploadBtnText}>Upload PDF</Text>
            </TouchableOpacity>
          </View>
        )}
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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
    },
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    greetingCol: {
      flex: 1,
    },
    greetingSub: {
      fontSize: SIZES.fontSm,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    greetingName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    taglineSub: {
      fontSize: SIZES.fontXs,
      color: colors.textMuted,
      marginTop: 2,
    },
    avatarButton: {
      padding: 2,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : COLORS.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusMd,
      paddingHorizontal: 14,
      height: 46,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: SIZES.fontSm,
      color: colors.textPrimary,
      paddingVertical: 8,
    },
    searchResultsContainer: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusMd,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.subtle,
    },
    searchHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    searchResultsTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    clearSearchText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    noResultsBox: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    noResultsText: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 6,
    },
    resultGroup: {
      marginTop: 8,
    },
    groupLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchResultText: {
      fontSize: 13,
      color: colors.textPrimary,
      flex: 1,
    },
    statCardsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionHeaderTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 18,
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 18,
      marginBottom: 12,
    },
    seeAllLink: {
      fontSize: SIZES.fontSm,
      fontWeight: '600',
      color: isDark ? '#A5B4FC' : COLORS.primary,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.subtle,
    },
    quickActionItem: {
      flex: 1,
      alignItems: 'center',
    },
    qaCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    qaLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyDocsCard: {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
    },
    emptyIconCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: isDark ? '#1E1B4B' : colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyDocsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyDocsSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
      paddingHorizontal: 10,
    },
    emptyUploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: SIZES.radiusMd,
    },
    emptyUploadBtnText: {
      color: COLORS.textWhite,
      fontSize: 13,
      fontWeight: '700',
    },
  });
