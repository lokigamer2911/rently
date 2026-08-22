module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          400: '#627d98',
          500: '#486581',
          600: '#334e68',
          700: '#243b53',
          900: '#102a43',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      boxShadow: {
        card: '0 32px 90px -52px rgba(20, 33, 25, 0.34)',
        soft: '0 20px 55px -36px rgba(20, 33, 25, 0.24)',
        glow: '0 28px 70px -40px rgba(200, 134, 67, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
