import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * SquadLayout - A specialized full-screen layout for the Squad Selection feature.
 * Uses 100dvh to perfectly fit mobile screens without scrolling.
 * Features a dark vibrant theme (Midnight Blue).
 */
const SquadLayout = ({ children }) => {
  return (
    <div className="h-[100dvh] w-full bg-[#0a192f] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* 
        This wrapper ensures the content takes up exactly the screen height.
        We use flex-col so header, pitch, and footer can share the vertical space.
      */}
      <main className="flex-1 w-full max-w-md mx-auto relative flex flex-col h-full bg-[#0d213d] shadow-2xl border-x border-[#1a365d] overflow-hidden">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default SquadLayout;
