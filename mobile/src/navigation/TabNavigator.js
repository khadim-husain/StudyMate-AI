import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';

// Tab Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { MaterialsScreen } from '../screens/MaterialsScreen';
import { PlannerScreen } from '../screens/PlannerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { themeColors, t } = useApp();

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.TAB_HOME}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: themeColors?.surface || COLORS.surface,
            borderTopColor: themeColors?.border || COLORS.borderLight,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === ROUTES.TAB_HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.TAB_CHAT) {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === ROUTES.TAB_MATERIALS) {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === ROUTES.TAB_PLANNER) {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === ROUTES.TAB_PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={iconName} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.TAB_HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_CHAT}
        component={ChatScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_MATERIALS}
        component={MaterialsScreen}
        options={{ tabBarLabel: 'Materials' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_PLANNER}
        component={PlannerScreen}
        options={{ tabBarLabel: 'Planner' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_PROFILE}
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    ...SHADOWS.medium,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  iconContainer: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusSm,
  },
  iconContainerActive: {
    backgroundColor: COLORS.lavenderSurface,
  },
});
