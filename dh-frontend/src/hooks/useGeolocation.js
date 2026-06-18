import { useState } from 'react';

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const getUserCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      setIsLocating(true);
      setLocationError(null);

      if (!navigator.geolocation) {
        const err = new Error("อุปกรณ์ของคุณไม่รองรับระบบ GPS");
        setLocationError(err.message);
        setIsLocating(false);
        reject(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMsg = "ไม่สามารถดึงตำแหน่งได้";
          if (error.code === 1) errorMsg = "ผู้ใช้งานไม่อนุญาตให้เข้าถึงตำแหน่งที่ตั้ง (Permission Denied)";
          if (error.code === 2) errorMsg = "ไม่พบสัญญาณ GPS (Position Unavailable)";
          if (error.code === 3) errorMsg = "หมดเวลาในการค้นหาตำแหน่ง (Timeout)";
          
          setLocationError(errorMsg);
          setIsLocating(false);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // รอนานสุด 10 วินาที
          maximumAge: 0
        }
      );
    });
  };

  return { getUserCurrentLocation, isLocating, locationError };
};
