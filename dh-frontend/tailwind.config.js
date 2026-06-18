/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ชุดสี Brand สำหรับความพรีเมียม (Dynamic Theming via CSS Variables)
        brand: {
          DEFAULT: 'var(--color-brand)',       // สีหลัก
          dark: 'var(--color-brand-dark)',     // สีหลักแบบเข้ม
          light: 'var(--color-brand-light)',   // สีสว่าง/ตัด (Mint/Light Blue)
          accent: 'var(--color-brand-accent)', // สีเน้น (Amber/Gold) สำหรับปุ่ม/Badge
          silver: '#E0E0E0',  // สีเงินสำหรับ Skeleton/Shimmer (คงไว้เป็นสีกลาง)
        }
      },
      boxShadow: {
        // มิติ แสง และเงา (Depth & Lighting) อิงตามสี Brand Accent
        'premium': '0 20px 50px rgba(0, 0, 0, 0.07)',
        'premium-hover': '0 25px 60px rgba(0, 0, 0, 0.12)',
        'premium-inner': 'inset 0 2px 10px rgba(0, 0, 0, 0.05)',
        'glow-brand': '0 0 15px var(--color-brand)',
        'glow-accent': '0 0 15px var(--color-brand-accent)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        }
      },
      animation: {
        // Tactic Animations สำหรับความน่าตื่นเต้นและลูกเล่น
        'shimmer': 'shimmer 2s infinite linear',
        'shine': 'shine 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}