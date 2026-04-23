/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dh: {
          base: 'var(--dh-bg-base)',
          surface: 'var(--dh-bg-surface)',
          border: 'var(--dh-border)',
          main: 'var(--dh-text-main)',
          muted: 'var(--dh-text-muted)',
          accent: 'var(--dh-accent)',
          'accent-hover': 'var(--dh-accent-hover)',
          'accent-light': 'var(--dh-accent-light)',
        }
      },
      boxShadow: {
        /* ชุดเงาสำเร็จรูป เอาไว้ใช้กับการ์ด เมนู หรือปุ่มต่างๆ ให้มีมิติลอยขึ้นมา */
        'dh-card': '0 4px 20px -2px var(--dh-shadow-color), 0 0 3px var(--dh-shadow-color)',
        'dh-elevated': '0 10px 30px -5px var(--dh-shadow-color), 0 0 5px var(--dh-shadow-color)',
      }
    }
  },
  plugins: []
}