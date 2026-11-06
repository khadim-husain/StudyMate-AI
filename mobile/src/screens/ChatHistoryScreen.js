import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';

export const ChatHistoryScreen = ({ navigation }) => {
  const { chatHistories, deleteChatHistory, loadConversation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = chatHistories.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lastMessage && item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (item) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Delete conversation "${item.title}"?`)) {
        deleteChatHistory(item.id);
      }
      return;
    }
    Alert.alert(
      'Delete Conversation',
      `Delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChatHistory(item.id),
        },
      ]
    );
  };

  const handleOpenChat = async (item) => {
    if (loadConversation) {
      await loadConversation(item.id);
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_CHAT });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen 16 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_CHAT });
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchBar, SHADOWS.subtle]}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* History List */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.historyItemCard, SHADOWS.subtle]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Open conversation ${item.title}`}
              onPress={() => handleOpenChat(item)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
              </View>

              <View style={styles.textColumn}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
  },
  itemTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 6,
  },
});
