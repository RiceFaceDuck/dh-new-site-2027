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
          const isPermissionDenied = error.code === 1;
          if (isPermissionDenied) {
            errorMsg = "ผู้ใช้งานยังไม่ได้เปิดการอนุญาตตำแหน่ง";
          } else if (error.code === 2) {
            errorMsg = "ไม่พบสัญญาณ GPS (Position Unavailable)";
          } else if (error.code === 3) {
            errorMsg = "หมดเวลาในการค้นหาตำแหน่ง (Timeout)";
          }
          
          if (!isPermissionDenied) {
            setLocationError(errorMsg);
          } else {
            setLocationError(null);
          }
          setIsLocating(false);
          
          const err = new Error(errorMsg);
          err.code = error.code;
          err.isPermissionDenied = isPermissionDenied;
          reject(err);
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
