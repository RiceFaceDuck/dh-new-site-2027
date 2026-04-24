/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // เพิ่มสี Tech Dashboard สำหรับองค์กร
        'cyber-emerald': '#10B981', // สีหลักแสดงสถานะปกติ / In-stock
        'cyber-blue': '#0EA5E9',    // สีรองสำหรับเน้นข้อมูล Tech
        'dh-dark': '#0F172A',       // พื้นหลังโซนเข้ม
        'dh-gray': '#F8FAFC',       // พื้นหลังโซนสว่าง (Clean UI)
      },
      fontFamily: {
        // ฟอนต์พิเศษสำหรับข้อมูลเชิงเทคนิค เช่น รหัสสินค้า (SKU), ราคา
        tech: ['"Space Grotesk"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // เพิ่มเงาสไตล์ Tech & Glassmorphism
        'glow-emerald': '0 0 12px -2px rgba(16, 185, 129, 0.4)',
        'glow-blue': '0 0 12px -2px rgba(14, 165, 233, 0.4)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'tech-card': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0,0,0,0.1)',
      },
      animation: {
        // แอนิเมชันสำหรับโหลดดิ้งและ Micro-interactions
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}