// G-LOVE ACADEMY Result Platform Color Constants
export const COLORS = {
  // Primary Brand Colors
  primary: {
    red: '#aecb1f',      // Main brand color (green)
    blue: '#382f89',     // Secondary brand color (purple)
    yellow: '#e8bf41',   // Brand yellow/gold (keeping for accents)
  },
  
  // Extended Color Palette
  secondary: {
    lightRed: '#ff3333',
    darkRed: '#cc0000',
    lightYellow: '#f5d76e',
    darkYellow: '#d4a017',
    lightBlue: '#3333ff',
    darkBlue: '#0000cc',
  },
  
  // Neutral Colors
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  
  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    dark: '#0f172a',
    overlay: 'rgba(0, 0, 0, 0.5)',
  }
};

// CSS Custom Properties for Tailwind
export const CSS_VARIABLES = {
  '--color-primary-red': COLORS.primary.red,
  '--color-primary-yellow': COLORS.primary.yellow,
  '--color-primary-blue': COLORS.primary.blue,
  '--color-secondary-light-red': COLORS.secondary.lightRed,
  '--color-secondary-dark-red': COLORS.secondary.darkRed,
  '--color-secondary-light-yellow': COLORS.secondary.lightYellow,
  '--color-secondary-dark-yellow': COLORS.secondary.darkYellow,
  '--color-secondary-light-blue': COLORS.secondary.lightBlue,
  '--color-secondary-dark-blue': COLORS.secondary.darkBlue,
};

// Gradient Combinations
export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.primary.red} 0%, ${COLORS.primary.blue} 100%)`,
  secondary: `linear-gradient(135deg, ${COLORS.primary.blue} 0%, ${COLORS.primary.red} 100%)`,
  accent: `linear-gradient(135deg, ${COLORS.primary.blue} 0%, ${COLORS.primary.yellow} 100%)`,
  hero: `linear-gradient(135deg, ${COLORS.primary.red} 0%, ${COLORS.primary.blue} 50%, ${COLORS.primary.yellow} 100%)`,
};

// Export colors object for compatibility with student portal components
export const colors = {
  primary: COLORS.primary.red,
  primaryDark: COLORS.primary.blue,
  success: COLORS.status.success,
  error: COLORS.status.error,
  warning: COLORS.status.warning,
  info: COLORS.status.info,
  white: COLORS.neutral.white,
  black: COLORS.neutral.black,
  gray: COLORS.neutral.gray,
  background: COLORS.background,
  text: {
    primary: COLORS.neutral.gray[900],
    secondary: COLORS.neutral.gray[600],
    light: COLORS.neutral.gray[400],
    white: COLORS.neutral.white,
  },
  border: {
    light: COLORS.neutral.gray[200],
    medium: COLORS.neutral.gray[300],
    dark: COLORS.neutral.gray[400],
  }
};

export default COLORS;
