export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17352c',
        forest: '#285d45',
        leaf: '#5f8c57',
        moss: '#9aae7d',
        cream: '#f7f8f2',
        sand: '#e7eadc',
      },
      boxShadow: {
        soft: '0 24px 70px rgba(30, 72, 53, 0.12)',
        gentle: '0 12px 40px rgba(23, 53, 44, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Aptos', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'Aptos', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
