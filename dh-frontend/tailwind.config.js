/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ชุดสี Brand สำหรับความพรีเมียม
        brand: {
          DEFAULT: '#0870B8', // สีน้ำเงินหลักของ DH
          dark: '#054D80',
          light: '#E6F0F9',
          gold: '#D4AF37',    // สีทองสำหรับ Badge/Premium
          silver: '#E0E0E0',  // สีเงินสำหรับ Skeleton/Shimmer
        }
      },
      boxShadow: {
        // มิติ แสง และเงา (Depth & Lighting)
        'premium': '0 20px 50px rgba(8, 112, 184, 0.07)',
        'premium-hover': '0 25px 60px rgba(8, 112, 184, 0.15)',
        'premium-inner': 'inset 0 2px 10px rgba(0, 0, 0, 0.05)',
        'glow-brand': '0 0 15px rgba(8, 112, 184, 0.4)',
        'glow-gold': '0 0 15px rgba(212, 175, 55, 0.4)',
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