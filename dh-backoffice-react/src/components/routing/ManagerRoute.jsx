import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ManagerRoute() {
  const { isManagerOrOwner, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isManagerOrOwner()) {
      alert("คุณไม่มีอำนาจเข้าใช้งาน\nกรุณาติดต่อผู้จัดการ");
    }
  }, [loading, isManagerOrOwner]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isManagerOrOwner() ? <Outlet /> : <Navigate to="/overview" replace state={{ from: location }} />;
}
