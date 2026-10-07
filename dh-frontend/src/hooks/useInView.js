import { useState, useEffect, useRef } from 'react';

/**
 * ⚡ useInView - High Performance Viewport Intersection Hook
 * ตรวจจับการเลื่อนหน้าจอว่า Component เข้ามาในพื้นที่การมองเห็น (Viewport) หรือยัง
 * เพื่อทำ Lazy Fetching ข้อมูลหนักๆ (เช่น รีวิว, สินค้าที่เกี่ยวข้อง) ช่วยเซฟโควต้า Firestore ได้มหาศาล
 */
export function useInView({ threshold = 0.05, rootMargin = '150px 0px', triggerOnce = true } = {}) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // ป้องกันกรณีเบราว์เซอร์เก่าหรือไม่รองรับ
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        setInView(true);
        if (triggerOnce) {
          observer.unobserve(element);
        }
      } else if (!triggerOnce) {
        setInView(false);
      }
    }, { threshold, rootMargin });

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, inView];
}

export default useInView;
