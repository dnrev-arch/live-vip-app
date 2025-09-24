/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: '#E50914',
          'red-dark': '#B81D24',
          black: '#000000',
          'dark-gray': '#141414',
          gray: '#333333',
          'light-gray': '#757575',
          white: '#FFFFFF',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.netflix-gradient': {
          background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
        },
        '.glass-effect': {
          backdropFilter: 'blur(10px)',
          background: 'rgba(0, 0, 0, 0.7)',
        },
        '.btn-netflix': {
          backgroundColor: '#E50914',
          color: 'white',
          fontWeight: '600',
          padding: '12px 24px',
          borderRadius: '8px',
          transition: 'all 0.2s ease-in-out',
        },
        '.btn-netflix:hover': {
          backgroundColor: '#B81D24',
        },
      };
      addUtilities(newUtilities);
    },
  ],
  darkMode: 'class',
};
