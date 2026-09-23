import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import useGenerateSync, { resetStore, cleanupListeners } from './hooks/useGenerateSync';

export default function GenerateSyncLayout() {
  // Initialize the central store & sync lifecycle for the subsystem
  useGenerateSync();

  useEffect(() => {
    return () => {
      cleanupListeners();
      resetStore();
    };
  }, []);

  return (
    <div className="w-full h-full min-h-screen flex flex-col">
      <Outlet />
    </div>
  );
}
