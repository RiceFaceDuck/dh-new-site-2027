import { useRef, useEffect, useState } from 'react';

/**
 * ScrollReveal - คอมโพเนนต์อัจฉริยะสำหรับสร้างแอนิเมชัน Animate On Scroll (AOS) แบบไร้ปลั๊กอิน
 * ทำงานโดยใช้ IntersectionObserver แบบ Native ซึ่งกินทรัพยากรน้อยมาก
 */
const ScrollReveal = ({ 
  children, 
  className = '', 
  direction = 'up', 
  delay = 0,
  duration = 700
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    // ป้องกัน Error หากเปิดในเบราว์เซอร์ที่เก่ามาก
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const currentRef = domRef.current;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // เมื่อ Element เลื่อนเข้ามาในจอ (Viewport)
        if (entry.isIntersecting) {
          setIsVisible(true);
          // เลิกติดตามทันทีที่แอนิเมชันทำงานไปแล้ว 1 ครั้ง เพื่อลดภาระเครื่อง
          if (currentRef) {
            observer.unobserve(currentRef);
          }
        }
      });
    }, { 
      // เริ่มแอนิเมชันตอนที่ขอบบนของ Component โผล่มา 10%
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px" 
    });

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => { 
      if (currentRef) {
        observer.unobserve(currentRef); 
      }
    };
  }, []);

  // สร้าง Classes สำหรับทิศทางต่างๆ
  const getDirectionClasses = () => {
    if (isVisible) {
      return 'translate-y-0 translate-x-0 opacity-100';
    }

    switch (direction) {
      case 'up': return 'translate-y-12 opacity-0';
      case 'down': return '-translate-y-12 opacity-0';
      case 'left': return 'translate-x-12 opacity-0';
      case 'right': return '-translate-x-12 opacity-0';
      default: return 'translate-y-12 opacity-0';
    }
  };

  return (
    <div 
      ref={domRef} 
      className={`transition-all ease-out ${getDirectionClasses()} ${className}`} 
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms` 
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
