import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { DocumentCard } from '../components/DocumentCard';
import { EmptyState } from '../components/EmptyState';

const FILTERS = ['All', 'Processing', 'Completed'];

export const MaterialsScreen = ({ navigation }) => {
  const { documents, refreshDocuments, setActiveDocumentContext, themeColors, isDark } = useApp();
  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    let matchesFilter = true;
    if (activeFilter === 'Completed') {
      matchesFilter = doc.status?.toLowerCase() === 'completed';
    } else if (activeFilter === 'Processing') {
      matchesFilter = doc.status?.toLowerCase().includes('process');
    }

    const matchesQuery =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subject && doc.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const handleDocumentPress = (doc) => {
    setActiveDocumentContext(doc);
    navigation.navigate(ROUTES.DOCUMENT_DETAILS, { documentId: doc.id });
  };

  const handleRefresh = async () => {
    if (refreshDocuments) {
      setRefreshing(true);
      await refreshDocuments();
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate(ROUTES.TAB_HOME);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Study Materials</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, SHADOWS.subtle]}>
          <Ionicons name="search" size={18} color={themeColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search study documents..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((item) => {
            const isActive = activeFilter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterText, isActive && styles.filterTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Document List */}
        <FlatList
          data={filteredDocs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={() => handleDocumentPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No Documents Found"
              subtitle={
                searchQuery
                  ? "Try searching with a different term."
                  : "Tap '+' below to upload your first study PDF."
              }
            />
          }
        />

        {/* Floating Action Button (+) */}
        <TouchableOpacity
          style={[styles.fab, SHADOWS.glow]}
          onPress={() => navigation.navigate(ROUTES.PDF_UPLOAD)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      marginBottom: 8,
    },
    backBtn: {
      padding: 4,
    },
    headerTitle: {
      fontSize: SIZES.fontLg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    refreshBtn: {
      padding: 4,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusMd,
      paddingHorizontal: 14,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: SIZES.fontSm,
      color: colors.textPrimary,
      marginLeft: 8,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    filterPill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: SIZES.radiusFull,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    filterPillActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    filterText: {
      fontSize: SIZES.fontXs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: COLORS.textWhite,
    },
    listContent: {
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
  });
