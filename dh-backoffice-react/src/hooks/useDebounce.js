import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // กำหนดเวลาให้หน่วง (ตั้งเวลาใหม่ทุกครั้งที่มีการพิมพ์)
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // ถ้ามีการพิมพ์ใหม่ก่อนครบเวลา ให้ยกเลิกการตั้งเวลาอันเก่าทิ้งไป
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
