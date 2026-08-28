import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // salon mio mio palette: neon fuchsia, glowing lime, deep black, cream
        fuchsia: '#FF00B7',
        lime: '#B6FF00',
        ink: '#0B0B0F',
        cream: '#F5EFE6',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["black"],
    logs: false,
  },
}
