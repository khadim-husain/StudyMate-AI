import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../constants/routes';

// Screens
import {
  SplashScreen,
  OnboardingScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  DocumentDetailsScreen,
  PDFUploadScreen,
  AISummaryScreen,
  QuizScreen,
  FlashcardsScreen,
  TasksScreen,
  AnalyticsScreen,
  ChatHistoryScreen,
  EditProfileScreen,
  ChangePasswordScreen,
  NotificationsScreen,
  ThemeSettingsScreen,
  LanguageSettingsScreen,
  HelpSupportScreen,
} from '../screens';

import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.SPLASH}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Launch & Onboarding */}
      <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
      <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} />

      {/* Auth */}
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPasswordScreen} />

      {/* Main Tabs Container */}
      <Stack.Screen name={ROUTES.MAIN_TABS} component={TabNavigator} />

      {/* Feature Screens */}
      <Stack.Screen
        name={ROUTES.DOCUMENT_DETAILS}
        component={DocumentDetailsScreen}
      />
      <Stack.Screen name={ROUTES.PDF_UPLOAD} component={PDFUploadScreen} />
      <Stack.Screen name={ROUTES.AI_SUMMARY} component={AISummaryScreen} />
      <Stack.Screen name={ROUTES.QUIZ} component={QuizScreen} />
      <Stack.Screen name={ROUTES.FLASHCARDS} component={FlashcardsScreen} />
      <Stack.Screen name={ROUTES.TASKS} component={TasksScreen} />
      <Stack.Screen name={ROUTES.ANALYTICS} component={AnalyticsScreen} />
      <Stack.Screen name={ROUTES.CHAT_HISTORY} component={ChatHistoryScreen} />

      {/* Profile & Settings Sub-Screens */}
      <Stack.Screen name={ROUTES.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={ROUTES.CHANGE_PASSWORD} component={ChangePasswordScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={ROUTES.THEME_SETTINGS} component={ThemeSettingsScreen} />
      <Stack.Screen name={ROUTES.LANGUAGE_SETTINGS} component={LanguageSettingsScreen} />
      <Stack.Screen name={ROUTES.HELP_SUPPORT} component={HelpSupportScreen} />
    </Stack.Navigator>
  );
};
