/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm, grounded palette centered on olive/ink rather than the
        // generic cream+terracotta pairing. Evokes rootedness/family, not a SaaS demo.
        sand: {
          50: '#FBF9F4',
          100: '#FAF7F1',
          200: '#F1EBDE',
          300: '#E4DBC6',
        },
        olive: {
          50: '#EEF1E9',
          100: '#D6DECB',
          400: '#6B8058',
          500: '#4A5D3A',
          600: '#3F5031',
          700: '#324027',
        },
        clay: {
          400: '#C99A3B',
          500: '#B5822B',
          600: '#96691E',
        },
        // Muted rose — warmth of friendship, distinct from the golden "relatives" clay.
        bloom: {
          50: '#F3E9E7',
          400: '#B37671',
          500: '#A65D5A',
          600: '#8A4744',
        },
        // Blue-grey — understated, professional register for Work.
        steel: {
          50: '#E9EDEF',
          400: '#6C8494',
          500: '#4F6373',
          600: '#3D4E5B',
        },
        ink: {
          400: '#6B6862',
          500: '#4A4741',
          600: '#2E2C27',
          700: '#211F1B',
        },
        // Dark-mode surfaces: warm near-black, not pure black — stays in
        // the same family as `sand` instead of switching to generic slate.
        night: {
          canvas: '#18170F',
          surface: '#221F19',
          raised: '#2B2721',
          line: '#3A3529',
        },
        // Dark-mode text tiers, paired with `night`.
        mist: {
          100: '#F4F1E8',
          300: '#C9C0A8',
          500: '#948C74',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(33, 31, 27, 0.04), 0 6px 16px -4px rgba(33, 31, 27, 0.08)',
        'soft-dark': '0 1px 2px rgba(0, 0, 0, 0.3), 0 6px 20px -4px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        display: ['"Cairo"', 'sans-serif'],
        body: ['"Tajawal"', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
