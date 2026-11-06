export const COLORS = {
  // Brand Primary & Accents
  primary: '#5B4DFF',        // Electric violet / Royal purple
  primaryDark: '#4338CA',    // Deep violet
  primaryLight: '#818CF8',   // Light luminous violet
  primaryGlow: 'rgba(91, 77, 255, 0.25)',
  indigo: '#4F46E5',         // Indigo
  blue: '#2563EB',           // Vibrant Blue
  blueLight: '#3B82F6',      // Sky Blue
  cyan: '#06B6D4',           // Luminous Cyan
  cyanLight: '#E0F2FE',
  violetLight: '#EDE9FE',    // Soft Lavender

  // Deep Midnight Navy (for Splash, Header, Important Badges)
  midnight: '#0B0F19',
  midnightNavy: '#0F172A',
  midnightSurface: '#1E293B',

  // Gradients (LinearGradient stops)
  gradientPrimary: ['#5B4DFF', '#4338CA'],
  gradientSplash: ['#0B0F19', '#1E1B4B', '#2E1065'],
  gradientVioletCyan: ['#5B4DFF', '#06B6D4'],
  gradientIndigoBlue: ['#4F46E5', '#2563EB'],
  gradientCard: ['#5B4DFF', '#4338CA'],
  gradientWarm: ['#F59E0B', '#EF4444'],
  gradientSuccess: ['#10B981', '#059669'],

  // Backgrounds & Surfaces
  background: '#F8F9FE',     // Warm off-white / light lavender
  surface: '#FFFFFF',        // Pure white card surface
  surfaceSubtle: '#F4F5FB',  // Soft tint
  surfaceMuted: '#EDE9FE',   // Muted purple tint
  surfaceCard: '#FFFFFF',

  // Text Colors
  textPrimary: '#0F172A',    // Deep slate navy
  textSecondary: '#64748B',  // Slate gray
  textMuted: '#94A3B8',      // Light slate gray
  textLight: '#F8FAFC',      // Off-white
  textWhite: '#FFFFFF',

  // Status & Feedback
  success: '#10B981',        // Emerald Green
  successLight: '#DCFCE7',
  warning: '#F59E0B',        // Amber / Orange
  warningLight: '#FEF3C7',
  danger: '#EF4444',         // Coral Red
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#EEF2F6',
  borderFocus: '#5B4DFF',

  // Dark Mode Overrides
  dark: {
    background: '#0B0F19',
    surface: '#1E293B',
    surfaceSubtle: '#111827',
    surfaceMuted: '#1E1B4B',
    surfaceCard: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
  }
};

export const getThemeColors = (isDark = false) => {
  if (!isDark) return COLORS;
  return {
    ...COLORS,
    ...COLORS.dark,
  };
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,

  // Typography
  fontXs: 11,
  fontSm: 13,
  fontMd: 15,
  fontLg: 17,
  fontXl: 22,
  fontXxl: 28,
  fontTitle: 32,

  // Radius
  radiusSm: 8,
  radiusMd: 14,
  radiusLg: 20,
  radiusXl: 28,
  radiusFull: 9999,
};

export const SHADOWS = {
  light: {
    shadowColor: '#5B4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  glow: {
    shadowColor: '#5B4DFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
};
