/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'blue': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: '#1f2937',
            h1: {
              fontWeight: 700,
              letterSpacing: '-0.025em',
            },
            h2: {
              fontWeight: 700,
              letterSpacing: '-0.025em',
            },
            h3: {
              fontWeight: 700,
              letterSpacing: '-0.025em',
            },
            'h4,h5,h6': {
              fontWeight: 600,
              letterSpacing: '-0.025em',
            },
          },
        },
      },
      // Ajout de breakpoints personnalisés pour une meilleure gestion du responsive
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Breakpoints spécifiques pour les appareils mobiles
        'mobile': {'max': '639px'},
        'tablet': {'min': '640px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        // Breakpoints pour l'orientation
        'portrait': {'raw': '(orientation: portrait)'},
        'landscape': {'raw': '(orientation: landscape)'},
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
};
