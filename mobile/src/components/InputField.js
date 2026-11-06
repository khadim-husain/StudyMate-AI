import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useApp } from '../context/AppContext';

export const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  isPassword = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  rightAction,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef(null);

  let themeColors = COLORS;
  let isDark = false;
  try {
    const app = useApp();
    if (app) {
      themeColors = app.themeColors || COLORS;
      isDark = app.isDark;
    }
  } catch (_) {}

  const styles = useMemo(() => getStyles(themeColors, isDark), [themeColors, isDark]);

  const handleWrapperPress = () => {
    if (editable && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={handleWrapperPress}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          multiline && styles.inputMultiline,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : themeColors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={themeColors.textMuted}
          secureTextEntry={isPassword && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          showSoftInputOnFocus={true}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.input, inputStyle, multiline && styles.multilineInput]}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={themeColors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
        {rightAction && !isPassword ? (
          <View style={styles.rightIconButton}>{rightAction}</View>
        ) : null}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#CBD5E1' : '#334155',
      marginBottom: 7,
      letterSpacing: 0.2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? '#334155' : '#E2E8F0',
      borderRadius: 14,
      paddingHorizontal: 14,
      minHeight: 52,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    },
    inputFocused: {
      borderColor: COLORS.primary,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    inputError: {
      borderColor: COLORS.danger,
    },
    inputMultiline: {
      alignItems: 'flex-start',
      paddingVertical: 12,
    },
    leftIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      height: '100%',
      minHeight: 48,
      fontSize: 15,
      fontWeight: '400',
      color: isDark ? '#F8FAFC' : '#0F172A',
      paddingVertical: 10,
      ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    rightIconButton: {
      padding: 6,
      marginLeft: 6,
    },
    errorText: {
      fontSize: SIZES.fontXs,
      color: COLORS.danger,
      marginTop: 5,
      fontWeight: '500',
    },
  });
