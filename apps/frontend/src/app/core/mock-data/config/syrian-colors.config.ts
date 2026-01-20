/**
 * Syrian Colors Configuration
 *
 * Extracted from Tailwind configuration - provides Golden Wheat, Syrian Flag,
 * and heritage color palettes for consistent branding across mock data.
 *
 * @fileoverview Central color configuration for Syrian marketplace mock data system
 * @description Defines color palettes matching Tailwind config for product cards, badges, CTAs
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianColorPalette:
 *       type: object
 *       description: Syrian marketplace color palette configuration
 *       properties:
 *         goldenWheat:
 *           $ref: '#/components/schemas/ColorScale'
 *         forest:
 *           $ref: '#/components/schemas/ColorScale'
 *         syrianFlag:
 *           $ref: '#/components/schemas/SyrianFlagColors'
 */

/**
 * Color scale interface for gradient palettes
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Simple color variant interface
 */
export interface ColorVariant {
  light: string;
  DEFAULT: string;
  dark: string;
}

/**
 * Golden Wheat Palette - Primary brand colors
 * Warm, inviting colors for primary actions and product highlights
 */
export const goldenWheatPalette: ColorScale = {
  50: '#f5f3f0',
  100: '#edebe0',
  200: '#ddd5c4',
  300: '#c8bba1',
  400: '#b9a779',
  500: '#a89862',
  600: '#988561',
  700: '#7d6e52',
  800: '#685a46',
  900: '#564a3d'
};

/**
 * Forest Palette - Secondary/accent colors
 * Natural, trustworthy colors for secondary elements
 */
export const forestPalette: ColorScale = {
  50: '#f0f8f7',
  100: '#d9f0ed',
  200: '#b8e1dc',
  300: '#8ccbc3',
  400: '#5fb0a6',
  500: '#428177',
  600: '#3a735f',
  700: '#305e4f',
  800: '#2a4d41',
  900: '#264037'
};

/**
 * Neutral Palette - Text and background colors
 * Charcoal-based neutral scale for typography and backgrounds
 */
export const neutralPalette: ColorScale = {
  50: '#ffffff',
  100: '#f9f9f9',
  200: '#e8e8e8',
  300: '#d1d1d1',
  400: '#9e9e9e',
  500: '#6d6d6d',
  600: '#4d4d4d',
  700: '#3d3a3b',
  800: '#2a2829',
  900: '#161616'
};

/**
 * Accent Palette - Deep Umber for special elements
 * Rich colors for attention-grabbing elements
 */
export const accentPalette: ColorScale = {
  50: '#fdf2f3',
  100: '#fce7e8',
  200: '#fad1d4',
  300: '#f5a3aa',
  400: '#ed6b76',
  500: '#e03d4a',
  600: '#cc1f2c',
  700: '#ac1621',
  800: '#8f151f',
  900: '#78151e'
};

/**
 * Syrian Flag Colors - Exact flag colors for cultural authenticity
 */
export const syrianFlagColors = {
  red: {
    light: '#FF4757',
    DEFAULT: '#CE1126', // Exact Syrian flag red
    dark: '#A50E20'
  },
  white: {
    light: '#FFFFFF',
    DEFAULT: '#FFFFFF',
    dark: '#F8F9FA'
  },
  black: {
    light: '#2F3640',
    DEFAULT: '#000000', // Exact Syrian flag black
    dark: '#000000'
  }
};

/**
 * Gold Palette - Traditional Syrian gold for premium products
 */
export const goldPalette: ColorScale = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#D4AF37', // Traditional Syrian gold
  600: '#B8860B',
  700: '#9A7E0A',
  800: '#7C6D08',
  900: '#5D5206'
};

/**
 * Cream Palette - Traditional Syrian cream/beige for heritage products
 */
export const creamPalette: ColorScale = {
  50: '#FEFDF8',
  100: '#FEFBF0',
  200: '#FCF7E1',
  300: '#F9F0CD',
  400: '#F5E8B5',
  500: '#F0DFA2', // Traditional Syrian cream
  600: '#E8D28F',
  700: '#D4B878',
  800: '#B8985D',
  900: '#8B6F2B'
};

/**
 * Syrian Navy - Heritage color inspired by Damascus steel
 */
export const syrianNavyPalette: ColorVariant = {
  light: '#1E3A8A',
  DEFAULT: '#1E40AF',
  dark: '#1E1B4B'
};

/**
 * Warm Gray - Authentic Syrian marketplace feel
 */
export const warmGrayPalette: ColorScale = {
  50: '#FAFAF9',
  100: '#F5F5F4',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C', // Warm gray for marketplace
  600: '#57534E',
  700: '#44403C',
  800: '#292524',
  900: '#1C1917'
};

/**
 * Category-specific color assignments
 * Maps product categories to their primary brand colors
 */
export const categoryColorMapping = {
  'damascus-steel': {
    primary: neutralPalette[700],
    secondary: syrianNavyPalette.DEFAULT,
    accent: goldPalette[500]
  },
  'aleppo-soap': {
    primary: forestPalette[500],
    secondary: creamPalette[400],
    accent: goldenWheatPalette[500]
  },
  'textiles-fabrics': {
    primary: accentPalette[600],
    secondary: goldPalette[400],
    accent: creamPalette[500]
  },
  'food-spices': {
    primary: accentPalette[500],
    secondary: goldenWheatPalette[600],
    accent: warmGrayPalette[700]
  },
  'jewelry-accessories': {
    primary: goldPalette[500],
    secondary: syrianFlagColors.red.DEFAULT,
    accent: neutralPalette[900]
  },
  'traditional-crafts': {
    primary: goldenWheatPalette[500],
    secondary: creamPalette[600],
    accent: forestPalette[700]
  },
  'ceramics-pottery': {
    primary: creamPalette[500],
    secondary: goldenWheatPalette[600],
    accent: accentPalette[600]
  },
  'oud-perfumes': {
    primary: neutralPalette[800],
    secondary: goldPalette[600],
    accent: accentPalette[700]
  },
  'nuts-snacks': {
    primary: goldenWheatPalette[600],
    secondary: creamPalette[700],
    accent: forestPalette[500]
  },
  'sweets-desserts': {
    primary: accentPalette[400],
    secondary: goldPalette[300],
    accent: creamPalette[500]
  },
  'musical-instruments': {
    primary: goldenWheatPalette[700],
    secondary: neutralPalette[700],
    accent: goldPalette[600]
  },
  'calligraphy-art': {
    primary: neutralPalette[900],
    secondary: goldPalette[500],
    accent: creamPalette[300]
  }
};

/**
 * Badge colors for product labels
 */
export const badgeColors = {
  heritage: {
    background: goldPalette[100],
    text: goldPalette[800],
    border: goldPalette[300]
  },
  sale: {
    background: accentPalette[500],
    text: '#FFFFFF',
    border: accentPalette[600]
  },
  new: {
    background: forestPalette[500],
    text: '#FFFFFF',
    border: forestPalette[600]
  },
  artisan: {
    background: goldenWheatPalette[400],
    text: neutralPalette[900],
    border: goldenWheatPalette[600]
  },
  unesco: {
    background: syrianNavyPalette.DEFAULT,
    text: '#FFFFFF',
    border: syrianNavyPalette.dark
  },
  verified: {
    background: forestPalette[600],
    text: '#FFFFFF',
    border: forestPalette[700]
  },
  bestseller: {
    background: goldPalette[500],
    text: neutralPalette[900],
    border: goldPalette[700]
  },
  limited: {
    background: accentPalette[600],
    text: '#FFFFFF',
    border: accentPalette[700]
  }
};

/**
 * Price display colors
 */
export const priceColors = {
  current: {
    text: neutralPalette[900],
    emphasis: syrianFlagColors.red.DEFAULT
  },
  original: {
    text: neutralPalette[500],
    strikethrough: neutralPalette[400]
  },
  discount: {
    background: accentPalette[100],
    text: accentPalette[700],
    badge: accentPalette[500]
  },
  free: {
    background: forestPalette[100],
    text: forestPalette[700],
    badge: forestPalette[500]
  }
};

/**
 * CTA (Call-to-Action) button colors
 */
export const ctaColors = {
  primary: {
    background: goldenWheatPalette[500],
    hover: goldenWheatPalette[600],
    text: '#FFFFFF',
    border: goldenWheatPalette[600]
  },
  secondary: {
    background: forestPalette[500],
    hover: forestPalette[600],
    text: '#FFFFFF',
    border: forestPalette[600]
  },
  accent: {
    background: syrianFlagColors.red.DEFAULT,
    hover: syrianFlagColors.red.dark,
    text: '#FFFFFF',
    border: syrianFlagColors.red.dark
  },
  outline: {
    background: 'transparent',
    hover: goldenWheatPalette[50],
    text: goldenWheatPalette[600],
    border: goldenWheatPalette[400]
  },
  ghost: {
    background: 'transparent',
    hover: neutralPalette[100],
    text: neutralPalette[700],
    border: 'transparent'
  }
};

/**
 * Syrian marketplace color configuration object
 * Aggregates all color palettes for easy access
 */
export const syrianColors = {
  palettes: {
    goldenWheat: goldenWheatPalette,
    forest: forestPalette,
    neutral: neutralPalette,
    accent: accentPalette,
    gold: goldPalette,
    cream: creamPalette,
    warmGray: warmGrayPalette
  },
  flag: syrianFlagColors,
  navy: syrianNavyPalette,
  categories: categoryColorMapping,
  badges: badgeColors,
  prices: priceColors,
  cta: ctaColors
};

/**
 * Export default configuration
 */
export default syrianColors;
