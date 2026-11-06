import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export const LoadingIndicator = ({
  message = 'Loading...',
  fullScreen = false,
  color = COLORS.primary,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: 12,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
