import { Platform } from 'react-native';

/**
 * Font utility for consistent font usage across the app
 * Handles Android-specific font weight issues
 */

// Base font family
export const FONT_FAMILY = 'Agency';

/**
 * Get font style with proper weight handling for Android
 * On Android, custom fonts don't support fontWeight well, so we only use fontFamily
 * @param {string|number} weight - Font weight (100-900 or 'normal', 'bold')
 * @returns {object} Font style object
 */
export const getFontStyle = (weight = '400') => {
  if (Platform.OS === 'android') {
    // Android: Only use fontFamily, skip fontWeight for custom fonts
    return {
      fontFamily: FONT_FAMILY,
    };
  }

  // iOS: Can handle font weights
  const numericWeight = typeof weight === 'string' && weight !== 'normal' && weight !== 'bold'
    ? weight
    : weight === 'bold'
    ? '700'
    : weight === 'normal'
    ? '400'
    : String(weight);

  return {
    fontFamily: FONT_FAMILY,
    fontWeight: numericWeight,
  };
};

/**
 * Predefined font styles for common use cases
 */
export const FONT_STYLES = {
  // Headers
  h1: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '700' }),
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '700' }),
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '700' }),
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h4: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '600' }),
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  h5: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '600' }),
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  h6: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '600' }),
    fontSize: 14,
    lineHeight: 22,
  },

  // Body text
  bodyLarge: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '400' }),
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '400' }),
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodySmall: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '400' }),
    fontSize: 13,
    lineHeight: 20,
  },

  // Labels
  label: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '500' }),
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '500' }),
    fontSize: 12,
    lineHeight: 18,
  },

  // Captions
  caption: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '400' }),
    fontSize: 12,
    lineHeight: 18,
  },
  captionSmall: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '400' }),
    fontSize: 10,
    lineHeight: 16,
  },

  // Buttons
  button: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '600' }),
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  buttonSmall: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '600' }),
    fontSize: 13,
    lineHeight: 20,
  },

  // Special
  bold: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '700' }),
  },
  semibold: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '600' }),
  },
  medium: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '500' }),
  },
  regular: {
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'ios' && { fontWeight: '400' }),
  },
};

/**
 * Get font size with platform-specific adjustments
 * @param {number} size - Base font size
 * @returns {number} Adjusted font size
 */
export const getFontSize = (size) => {
  // Android typically needs slightly larger fonts for better readability
  if (Platform.OS === 'android') {
    return size + 1;
  }
  return size;
};

/**
 * Apply font style to existing style object
 * @param {object} style - Existing style object
 * @param {string|number} weight - Font weight
 * @returns {object} Combined style object
 */
export const applyFontStyle = (style = {}, weight = '400') => {
  return {
    ...style,
    ...getFontStyle(weight),
  };
};
