/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./projects/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      // ✅ UPDATED Color Palette - Pixorus-inspired Modern E-commerce
      colors: {
        // Golden Wheat - PRIMARY (warmth, trust, heritage)
        'golden-wheat': {
          100: '#edebe0',    // Lightest - backgrounds, hover states
          200: '#b9a779',    // Light - secondary buttons, borders
          300: '#988561',    // Base - primary buttons, links, icons
          DEFAULT: '#988561',
          light: '#b9a779',
          lighter: '#edebe0',
          dark: '#988561'
        },
        // Forest Green - SECONDARY (stability, nature, growth)
        forest: {
          100: '#428177',    // Lightest - backgrounds, subtle accents
          200: '#054239',    // Medium - secondary buttons, badges
          300: '#002623',    // Darkest - headers, dark sections
          DEFAULT: '#002623',
          light: '#054239',
          lighter: '#428177',
          dark: '#002623'
        },
        // Charcoal - TEXT & UI (clarity, professionalism)
        charcoal: {
          100: '#ffffff',    // White - light text on dark backgrounds
          200: '#3d3a3b',    // Medium - secondary text, muted elements
          300: '#161616',    // Darkest - primary text, headers
          DEFAULT: '#161616',
          light: '#3d3a3b',
          lighter: '#ffffff',
          dark: '#161616'
        },
        // Deep Umber - ACCENT (urgency, calls-to-action)
        'deep-umber': {
          100: '#6b1f2a',    // Lighter - sale tags, warnings
          200: '#4a151e',    // Medium - discount badges, urgent buttons
          300: '#260f14',    // Darkest - critical alerts, deep accents
          DEFAULT: '#4a151e',
          light: '#6b1f2a',
          dark: '#260f14'
        },
        // Semantic color mapping
        primary: {
          50: '#FAF6EB',
          100: '#F2E9D0',
          200: '#E5D4A1',
          300: '#D4BC6A',
          400: '#C4A052',
          500: '#B8943D',
          600: '#9A7B32',
          700: '#7D6329',
          800: '#5F4B1F',
          900: '#423518'
        },
        secondary: {
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
        },
        neutral: {
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
        },
        accent: {
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
        },
        // Authentic Syrian Flag Colors for Cultural Authenticity
        'syrian-red': {
          light: '#FF4757',
          DEFAULT: '#CE1126', // Exact Syrian flag red
          dark: '#A50E20'
        },
        'syrian-white': {
          light: '#FFFFFF',
          DEFAULT: '#FFFFFF',
          dark: '#F8F9FA'
        },
        'syrian-black': {
          light: '#2F3640',
          DEFAULT: '#000000', // Exact Syrian flag black
          dark: '#000000'
        },
        'gold': {
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
        },
        // Syrian heritage colors inspired by traditional Damascus steel and culture
        'syrian-navy': {
          light: '#1E3A8A',
          DEFAULT: '#1E40AF',
          dark: '#1E1B4B'
        },
        'cream': {
          50: '#FEFDF8',
          100: '#FEFBF0',
          200: '#FCF7E1',
          300: '#F9F0CD',
          400: '#F5E8B5',
          500: '#F0DFA2', // Traditional Syrian cream/beige
          600: '#E8D28F',
          700: '#D4B878',
          800: '#B8985D',
          900: '#8B6F2B'
        },
        'warm-gray': {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C', // Warm gray for authentic Syrian marketplace feel
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917'
        },
        // Prototype design tokens for mega menus
        'surface': '#FFFFFF',
        'background': '#FAFAFA',
        'on-surface': '#1F1F1F',
        'on-surface-variant': '#5F6368',
        'outline': '#DADCE0'
      },
      // Custom box shadows for mega menus
      boxShadow: {
        'menu': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.1)'
      },
      // Custom spacing for consistent design
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      // Custom fonts including Arabic support
      fontFamily: {
        sans: ['Roboto', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Amiri', 'Scheherazade New', 'Noto Sans Arabic', 'system-ui', 'sans-serif']
      },
      // RTL-specific utilities
      margin: {
        'rtl-0': '0',
        'rtl-1': '0.25rem',
        'rtl-2': '0.5rem', 
        'rtl-3': '0.75rem',
        'rtl-4': '1rem',
        'rtl-6': '1.5rem',
        'rtl-8': '2rem'
      },
      padding: {
        'rtl-0': '0',
        'rtl-1': '0.25rem',
        'rtl-2': '0.5rem',
        'rtl-3': '0.75rem', 
        'rtl-4': '1rem',
        'rtl-6': '1.5rem',
        'rtl-8': '2rem'
      }
    },
  },
  plugins: [],
}

