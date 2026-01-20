/**
 * Design Tokens Configuration
 *
 * Defines reusable design tokens for product cards, badges, prices, and CTAs
 * ensuring consistent UI styling across all mock data components.
 *
 * @fileoverview Design system tokens for Syrian marketplace mock data
 * @description Centralized design tokens for product cards, badges, pricing, and buttons
 *
 * @swagger
 * components:
 *   schemas:
 *     DesignTokens:
 *       type: object
 *       description: Design system tokens for consistent UI styling
 *       properties:
 *         productCard:
 *           $ref: '#/components/schemas/ProductCardTokens'
 *         badges:
 *           $ref: '#/components/schemas/BadgeTokens'
 *         pricing:
 *           $ref: '#/components/schemas/PricingTokens'
 */

import { syrianColors } from './syrian-colors.config';

/**
 * Product card design tokens
 * Defines styling for product card components
 */
export interface ProductCardTokens {
  background: string;
  border: {
    color: string;
    width: string;
    radius: string;
  };
  shadow: {
    default: string;
    hover: string;
  };
  padding: string;
  gap: string;
  hover: {
    transform: string;
    transition: string;
    borderColor: string;
  };
}

/**
 * Badge design tokens
 * Defines styling for product badges (heritage, sale, new, etc.)
 */
export interface BadgeTokens {
  padding: string;
  fontSize: string;
  fontWeight: string;
  borderRadius: string;
  borderWidth: string;
  textTransform: string;
  gap: string;
  iconSize: string;
}

/**
 * Pricing design tokens
 * Defines styling for price display
 */
export interface PricingTokens {
  current: {
    fontSize: string;
    fontWeight: string;
    color: string;
  };
  original: {
    fontSize: string;
    fontWeight: string;
    color: string;
    textDecoration: string;
  };
  discount: {
    fontSize: string;
    fontWeight: string;
    padding: string;
    borderRadius: string;
  };
  currency: {
    fontSize: string;
    fontWeight: string;
  };
}

/**
 * CTA (Call-to-Action) design tokens
 * Defines styling for buttons
 */
export interface CTATokens {
  padding: {
    small: string;
    medium: string;
    large: string;
  };
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
  fontWeight: string;
  borderRadius: string;
  borderWidth: string;
  transition: string;
  iconGap: string;
  minWidth: string;
}

/**
 * Image design tokens
 * Defines styling for product images
 */
export interface ImageTokens {
  aspectRatio: string;
  objectFit: string;
  borderRadius: string;
  background: string;
  loading: {
    background: string;
    animation: string;
  };
}

/**
 * Typography design tokens
 * Defines font styles for different text elements
 */
export interface TypographyTokens {
  productName: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    color: string;
    maxLines: number;
  };
  productDescription: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    color: string;
    maxLines: number;
  };
  categoryLabel: {
    fontSize: string;
    fontWeight: string;
    letterSpacing: string;
    textTransform: string;
    color: string;
  };
  sellerName: {
    fontSize: string;
    fontWeight: string;
    color: string;
  };
}

/**
 * Product card design tokens implementation
 */
export const productCardTokens: ProductCardTokens = {
  background: syrianColors.palettes.neutral[50],
  border: {
    color: syrianColors.palettes.neutral[200],
    width: '1px',
    radius: '0.5rem' // 8px
  },
  shadow: {
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    hover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  padding: '1rem', // 16px
  gap: '0.75rem', // 12px
  hover: {
    transform: 'translateY(-4px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderColor: syrianColors.palettes.goldenWheat[400]
  }
};

/**
 * Badge design tokens implementation
 */
export const badgeTokens: BadgeTokens = {
  padding: '0.25rem 0.75rem', // 4px 12px
  fontSize: '0.75rem', // 12px
  fontWeight: '600',
  borderRadius: '9999px', // Full rounded
  borderWidth: '1px',
  textTransform: 'uppercase',
  gap: '0.375rem', // 6px
  iconSize: '1rem' // 16px
};

/**
 * Pricing design tokens implementation
 */
export const pricingTokens: PricingTokens = {
  current: {
    fontSize: '1.5rem', // 24px
    fontWeight: '700',
    color: syrianColors.palettes.neutral[900]
  },
  original: {
    fontSize: '1rem', // 16px
    fontWeight: '400',
    color: syrianColors.palettes.neutral[500],
    textDecoration: 'line-through'
  },
  discount: {
    fontSize: '0.875rem', // 14px
    fontWeight: '600',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem'
  },
  currency: {
    fontSize: '1rem', // 16px
    fontWeight: '600'
  }
};

/**
 * CTA (Call-to-Action) design tokens implementation
 */
export const ctaTokens: CTATokens = {
  padding: {
    small: '0.5rem 1rem', // 8px 16px
    medium: '0.75rem 1.5rem', // 12px 24px
    large: '1rem 2rem' // 16px 32px
  },
  fontSize: {
    small: '0.875rem', // 14px
    medium: '1rem', // 16px
    large: '1.125rem' // 18px
  },
  fontWeight: '600',
  borderRadius: '0.375rem', // 6px
  borderWidth: '2px',
  transition: 'all 0.2s ease-in-out',
  iconGap: '0.5rem', // 8px
  minWidth: '120px'
};

/**
 * Image design tokens implementation
 */
export const imageTokens: ImageTokens = {
  aspectRatio: '1 / 1',
  objectFit: 'cover',
  borderRadius: '0.375rem', // 6px
  background: syrianColors.palettes.neutral[100],
  loading: {
    background: `linear-gradient(90deg, ${syrianColors.palettes.neutral[100]} 0%, ${syrianColors.palettes.neutral[200]} 50%, ${syrianColors.palettes.neutral[100]} 100%)`,
    animation: 'shimmer 2s infinite'
  }
};

/**
 * Typography design tokens implementation
 */
export const typographyTokens: TypographyTokens = {
  productName: {
    fontSize: '1.125rem', // 18px
    fontWeight: '600',
    lineHeight: '1.5',
    color: syrianColors.palettes.neutral[900],
    maxLines: 2
  },
  productDescription: {
    fontSize: '0.875rem', // 14px
    fontWeight: '400',
    lineHeight: '1.6',
    color: syrianColors.palettes.neutral[600],
    maxLines: 3
  },
  categoryLabel: {
    fontSize: '0.75rem', // 12px
    fontWeight: '500',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: syrianColors.palettes.neutral[500]
  },
  sellerName: {
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    color: syrianColors.palettes.neutral[700]
  }
};

/**
 * Spacing design tokens
 * Consistent spacing values across components
 */
export const spacingTokens = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  '4xl': '4rem' // 64px
};

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

/**
 * Animation tokens
 * Defines consistent animation timings
 */
export const animationTokens = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

/**
 * Z-index tokens
 * Consistent layering for overlapping elements
 */
export const zIndexTokens = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070
};

/**
 * Rating star design tokens
 */
export const ratingTokens = {
  starSize: '1rem', // 16px
  starColor: {
    filled: syrianColors.palettes.gold[500],
    empty: syrianColors.palettes.neutral[300],
    half: syrianColors.palettes.gold[400]
  },
  fontSize: '0.875rem', // 14px
  fontWeight: '500',
  gap: '0.25rem' // 4px
};

/**
 * Inventory status design tokens
 */
export const inventoryTokens = {
  inStock: {
    color: syrianColors.palettes.forest[600],
    icon: 'check_circle'
  },
  lowStock: {
    color: syrianColors.palettes.accent[500],
    icon: 'warning'
  },
  outOfStock: {
    color: syrianColors.palettes.neutral[400],
    icon: 'cancel'
  },
  preOrder: {
    color: syrianColors.palettes.goldenWheat[600],
    icon: 'schedule'
  }
};

/**
 * Aggregated design tokens export
 */
export const designTokens = {
  productCard: productCardTokens,
  badge: badgeTokens,
  pricing: pricingTokens,
  cta: ctaTokens,
  image: imageTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  breakpoints,
  animation: animationTokens,
  zIndex: zIndexTokens,
  rating: ratingTokens,
  inventory: inventoryTokens
};

/**
 * Export default configuration
 */
export default designTokens;
