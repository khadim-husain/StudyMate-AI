import React from 'react';
import { Image, StyleSheet } from 'react-native';

const GOOGLE_LOGO_SRC = require('../../assets/google-logo.png');

export const GoogleIcon = ({ size = 20, style }) => {
  return (
    <Image
      source={GOOGLE_LOGO_SRC}
      style={[{ width: size, height: size }, styles.icon, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    marginRight: 10,
  },
});

