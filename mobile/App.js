import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AppProvider, useApp } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ROUTES } from './src/constants/routes';

const linking = {
  prefixes: ['studymate://', 'https://studymate.app', 'http://localhost:8081'],
  config: {
    screens: {
      [ROUTES.RESET_PASSWORD]: 'reset-password',
      [ROUTES.FORGOT_PASSWORD]: 'forgot-password',
      [ROUTES.LOGIN]: 'login',
    },
  },
};

// Inject essential full-height flexbox reset on React Native Web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const existingReset = document.getElementById('studymate-web-reset');
  if (!existingReset) {
    const style = document.createElement('style');
    style.id = 'studymate-web-reset';
    style.textContent = `
      html, body, #root {
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: auto !important;
        background-color: #F8F9FE;
      }
      * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StudyMate App caught render error:', error, errorInfo);
  }

  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <View style={errorStyles.card}>
            <Text style={errorStyles.icon}>🎓</Text>
            <Text style={errorStyles.title}>StudyMate AI</Text>
            <Text style={errorStyles.subtitle}>Something went wrong during rendering.</Text>
            <Text style={errorStyles.errorText}>
              {this.state.error?.message || 'Unknown error occurred'}
            </Text>
            <TouchableOpacity style={errorStyles.btn} onPress={this.handleReload} activeOpacity={0.8}>
              <Text style={errorStyles.btnText}>Reload Application</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#5B4DFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

function NavigationWrapper() {
  const { isDark, themeColors } = useApp();

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0B0F19',
      card: '#1E293B',
      text: '#F8FAFC',
      border: '#334155',
      primary: '#5B4DFF',
    },
  };

  const customDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F8F9FE',
      card: '#FFFFFF',
      text: '#0F172A',
      border: '#E2E8F0',
      primary: '#5B4DFF',
    },
  };

  return (
    <NavigationContainer theme={isDark ? customDarkTheme : customDefaultTheme} linking={linking}>
      <RootNavigator />
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={isDark ? '#0B0F19' : '#F8F9FE'}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
        <AppProvider>
          <NavigationWrapper />
        </AppProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
