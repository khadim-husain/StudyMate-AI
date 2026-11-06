import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, storage } from '../services/api';
import { COLORS, getThemeColors } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // App Theme & Preferences
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'light' | 'dark' | 'system'
  const [language, setLanguageState] = useState('en');
  const [userPreferences, setUserPreferences] = useState({
    notifications_enabled: true,
    study_reminders: true,
    task_deadline_reminders: true,
    quiz_reminders: true,
    daily_study_goals: true,
    doc_processing_notifications: true,
    theme: 'system',
    language: 'en',
  });

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const themeColors = getThemeColors(isDark);

  const t = useCallback((key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  }, [language]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [studyReminderTime, setStudyReminderTime] = useState('18:00');
  const [dailyGoalHours, setDailyGoalHours] = useState(2);

  // Data States
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg_welcome_init',
      sender: 'ai',
      text: "Hello! 👋 I'm StudyMate AI, your intelligent study tutor.\n\nI can help you:\n• Break down complex textbook concepts\n• Answer questions directly from your uploaded materials\n• Generate practice quizzes and study notes\n\nAsk me anything or tap a prompt below to get started!",
      timestamp: 'Just now',
    },
  ]);
  const [chatHistories, setChatHistories] = useState([]);
  const [activeDocumentContext, setActiveDocumentContext] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalDocuments: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalQuizzes: 0,
    averageQuizScore: 0,
    totalFlashcards: 0,
    masteredFlashcards: 0,
    studyStreakDays: 1,
  });

  const refreshDashboardStats = useCallback(async () => {
    try {
      const stats = await api.analytics.getDashboard();
      if (stats) {
        setDashboardStats({
          totalDocuments: stats.total_documents || 0,
          totalTasks: stats.total_tasks || 0,
          completedTasks: stats.completed_tasks || 0,
          pendingTasks: stats.pending_tasks || 0,
          totalQuizzes: stats.total_quizzes || 0,
          averageQuizScore: stats.average_quiz_score || 0,
          totalFlashcards: stats.total_flashcards || 0,
          masteredFlashcards: stats.mastered_flashcards || 0,
          studyStreakDays: stats.study_streak_days || 1,
        });
      }
    } catch (err) {
      console.warn('Dashboard stats refresh error:', err);
    }
  }, []);

  const refreshQuizzes = useCallback(async () => {
    try {
      const q = await api.quizzes.getAll();
      setQuizzes(q);
      return q;
    } catch (err) {
      return [];
    }
  }, []);

  // Load all user data from backend
  const refreshUserData = useCallback(async () => {
    try {
      const [docs, userTasks, histories, cards, dash, qList] = await Promise.allSettled([
        api.documents.getAll(),
        api.tasks.getAll(),
        api.chatHistory.getAll(),
        api.ai.listFlashcards(),
        api.analytics.getDashboard(),
        api.quizzes.getAll(),
      ]);

      if (docs.status === 'fulfilled') setDocuments(docs.value);
      if (userTasks.status === 'fulfilled') setTasks(userTasks.value);
      if (histories.status === 'fulfilled') setChatHistories(histories.value);
      if (cards.status === 'fulfilled') setFlashcards(cards.value);
      if (qList.status === 'fulfilled') setQuizzes(qList.value);
      if (dash.status === 'fulfilled' && dash.value) {
        const stats = dash.value;
        setDashboardStats({
          totalDocuments: stats.total_documents || 0,
          totalTasks: stats.total_tasks || 0,
          completedTasks: stats.completed_tasks || 0,
          pendingTasks: stats.pending_tasks || 0,
          totalQuizzes: stats.total_quizzes || 0,
          averageQuizScore: stats.average_quiz_score || 0,
          totalFlashcards: stats.total_flashcards || 0,
          masteredFlashcards: stats.mastered_flashcards || 0,
          studyStreakDays: stats.study_streak_days || 1,
        });
      }
    } catch (err) {
      console.warn('Error refreshing user data:', err);
    }
  }, []);

  // Check stored auth on launch
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Load cached theme & language
        const cachedTheme = await AsyncStorage.getItem('@studymate_theme');
        if (cachedTheme) setThemeModeState(cachedTheme);
        const cachedLang = await AsyncStorage.getItem('@studymate_lang');
        if (cachedLang) setLanguageState(cachedLang);

        const token = await storage.getToken();
        if (token) {
          try {
            const profile = await api.auth.getProfile();
            setUser(profile);
            setIsAuthenticated(true);
            await refreshUserData();
            try {
              const prefs = await api.users.getPreferences();
              if (prefs) {
                setUserPreferences(prefs);
                if (prefs.theme) setThemeModeState(prefs.theme);
                if (prefs.language) setLanguageState(prefs.language);
                if (prefs.notifications_enabled !== undefined) {
                  setNotificationsEnabled(prefs.notifications_enabled);
                }
              }
            } catch (_) {}
          } catch (profileErr) {
            console.warn('Stored token invalid or expired:', profileErr.message);
            await storage.removeToken();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [refreshUserData]);

  // Auth Handlers
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      try {
        const prefs = await api.users.getPreferences();
        if (prefs) {
          setUserPreferences(prefs);
          if (prefs.theme) setThemeModeState(prefs.theme);
          if (prefs.language) setLanguageState(prefs.language);
          if (prefs.notifications_enabled !== undefined) {
            setNotificationsEnabled(prefs.notifications_enabled);
          }
        }
      } catch (_) {}
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.register(name, email, password);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithGoogle = async (googleUser) => {
    setAuthLoading(true);
    try {
      const res = await api.auth.googleLogin(googleUser);
      setUser(res.user);
      setIsAuthenticated(true);
      await refreshUserData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    await storage.removeToken();
    setUser(null);
    setDocuments([]);
    setTasks([]);
    setFlashcards([]);
    setChatMessages([]);
    setChatHistories([]);
    setActiveDocumentContext(null);
    setActiveConversationId(null);
    setIsAuthenticated(false);
  };

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('@studymate_theme', mode);
      if (isAuthenticated) {
        await api.users.updatePreferences({ theme: mode });
      }
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  };

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('@studymate_lang', lang);
      if (isAuthenticated) {
        await api.users.updatePreferences({ language: lang });
      }
    } catch (e) {
      console.warn('Failed to persist language:', e);
    }
  };

  const updateUserPreferences = async (partial) => {
    setUserPreferences((prev) => ({ ...prev, ...partial }));
    if (partial.theme) setThemeModeState(partial.theme);
    if (partial.language) setLanguageState(partial.language);
    if (partial.notifications_enabled !== undefined) {
      setNotificationsEnabled(partial.notifications_enabled);
    }
    try {
      if (isAuthenticated) {
        const saved = await api.users.updatePreferences(partial);
        setUserPreferences(saved);
      }
    } catch (err) {
      console.warn('Failed to save preferences to backend:', err);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    try {
      const p = await api.users.getProfile();
      if (p) {
        setUser((prev) => ({
          ...prev,
          ...p,
          name: p.full_name || p.name || prev?.name,
        }));
      }
    } catch (e) {}
  }, []);

  const uploadUserAvatar = async (file) => {
    try {
      const updatedUser = await api.users.uploadAvatar(file);
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
        name: updatedUser.full_name || prev?.name,
      }));
      return { success: true, avatar_url: updatedUser.avatar_url };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const updated = await api.users.updateProfile(updates);
      setUser((prev) => ({ ...prev, ...updated }));
      return { success: true, user: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Document Handlers
  const refreshDocuments = async () => {
    try {
      const docs = await api.documents.getAll();
      setDocuments(docs);
      return docs;
    } catch (err) {
      console.warn('Failed to refresh documents:', err);
      return [];
    }
  };

  const addDocument = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    refreshDashboardStats();
  };

  const removeDocument = async (id) => {
    try {
      await api.documents.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeDocumentContext?.id === id) {
        setActiveDocumentContext(null);
      }
      refreshDashboardStats();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Task Handlers
  const refreshTasks = async () => {
    try {
      const fetchedTasks = await api.tasks.getAll();
      setTasks(fetchedTasks);
      return fetchedTasks;
    } catch (err) {
      console.warn('Failed to fetch tasks:', err);
      return [];
    }
  };

  const toggleTask = async (taskId) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;
    const newCompleted = !current.completed;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t))
    );

    try {
      await api.tasks.update(taskId, { completed: newCompleted });
      refreshDashboardStats();
    } catch (err) {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !newCompleted } : t))
      );
    }
  };

  const addTask = async (taskData) => {
    try {
      const created = await api.tasks.create(taskData);
      setTasks((prev) => [created, ...prev]);
      refreshDashboardStats();
      return { success: true, task: created };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const updated = await api.tasks.update(taskId, updates);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
      return { success: true, task: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.tasks.delete(taskId);
    } catch (err) {
      console.warn('Failed to delete task on backend:', err);
      await refreshTasks();
    }
  };

  // Chat Handlers
  const sendChatMessage = async (text) => {
    const tempId = `msg_${Date.now()}`;
    const userMsg = {
      id: tempId,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const aiReply = await api.ai.chat(
        text,
        activeDocumentContext?.id,
        activeConversationId
      );
      if (aiReply.conversationId) {
        setActiveConversationId(aiReply.conversationId);
      }
      setChatMessages((prev) => [...prev, aiReply]);
      // Refresh chat histories in background
      api.chatHistory.getAll().then(setChatHistories).catch(() => {});
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'ai',
          text: error.message || 'Sorry, I encountered a problem analyzing that query. Please try again.',
          timestamp: 'Just now',
          isError: true,
          retryText: text,
        },
      ]);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      setActiveConversationId(conversationId);
      const data = await api.chatHistory.getById(conversationId);
      if (data && data.messages && data.messages.length > 0) {
        setChatMessages(data.messages);
      } else {
        setChatMessages([
          {
            id: `msg_welcome_${Date.now()}`,
            sender: 'ai',
            text: `Loaded session: "${data?.title || 'Study Session'}". What would you like to explore next?`,
            timestamp: 'Just now',
          },
        ]);
      }
      return data;
    } catch (err) {
      console.warn('Failed to load conversation:', err);
    }
  };

  const clearChat = () => {
    setActiveConversationId(null);
    setChatMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'ai',
        text: "New study conversation started! ✨ Ask me any question, request a summary, or let's practice quiz questions together.",
        timestamp: 'Just now',
      },
    ]);
  };

  const deleteChatHistory = async (id) => {
    setChatHistories((prev) => prev.filter((h) => h.id !== id));
    if (activeConversationId === id) {
      clearChat();
    }
    try {
      await api.chatHistory.delete(id);
    } catch (err) {
      console.warn('Failed to delete conversation on backend:', err);
    }
  };

  // Flashcards Handlers
  const markFlashcard = async (id, isKnown) => {
    setFlashcards((prev) =>
      prev.map((fc) => (fc.id === id ? { ...fc, isKnown } : fc))
    );
    try {
      await api.ai.reviewFlashcard(id, isKnown);
    } catch (err) {
      console.warn('Failed to persist flashcard review:', err);
    }
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    try {
      await api.users.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getLearningProgress = useCallback(() => {
    const totalT = dashboardStats.totalTasks || tasks.length;
    const completedT = dashboardStats.completedTasks || tasks.filter((t) => t.completed).length;
    const totalF = dashboardStats.totalFlashcards || flashcards.length;
    const masteredF = dashboardStats.masteredFlashcards || flashcards.filter((f) => f.isKnown).length;
    const totalQ = dashboardStats.totalQuizzes || quizzes.length;

    const totalItems = totalT + totalF + totalQ;
    const completedItems = completedT + masteredF + totalQ;

    if (totalItems === 0) {
      return {
        percent: 0,
        completedHours: 0,
        targetHours: 14,
        goalText: 'Upload a document or create tasks to begin tracking',
      };
    }

    const percent = Math.min(100, Math.round((completedItems / totalItems) * 100));
    const completedHours = Math.round(completedT * 1.5 + totalQ * 0.5 + masteredF * 0.2);
    const targetHours = 14;
    const goalText = `${completedT} of ${totalT} study tasks completed`;

    return { percent, completedHours, targetHours, goalText };
  }, [dashboardStats, tasks, flashcards, quizzes]);

  const resetFlashcards = () => {
    setFlashcards((prev) => prev.map((fc) => ({ ...fc, isKnown: false })));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        authLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUserProfile,
        changeUserPassword,
        themeMode,
        setThemeMode,
        isDark,
        themeColors,
        language,
        setLanguage,
        t,
        userPreferences,
        updateUserPreferences,
        refreshUserProfile,
        uploadUserAvatar,
        notificationsEnabled,
        setNotificationsEnabled,
        studyReminderTime,
        setStudyReminderTime,
        dailyGoalHours,
        setDailyGoalHours,
        documents,
        refreshDocuments,
        addDocument,
        removeDocument,
        tasks,
        refreshTasks,
        toggleTask,
        addTask,
        updateTask,
        deleteTask,
        quizzes,
        refreshQuizzes,
        flashcards,
        setFlashcards,
        markFlashcard,
        resetFlashcards,
        dashboardStats,
        refreshDashboardStats,
        getLearningProgress,
        refreshUserData,
        chatMessages,
        sendChatMessage,
        clearChat,
        chatHistories,
        loadConversation,
        deleteChatHistory,
        activeConversationId,
        activeDocumentContext,
        setActiveDocumentContext,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useTheme = () => {
  const context = useContext(AppContext);
  if (!context) {
    return {
      colors: COLORS,
      themeColors: COLORS,
      isDark: false,
      themeMode: 'light',
      setThemeMode: () => {},
    };
  }
  return {
    colors: context.themeColors || COLORS,
    themeColors: context.themeColors || COLORS,
    isDark: context.isDark,
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
  };
};
