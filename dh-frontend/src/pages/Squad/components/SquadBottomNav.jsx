import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SquadBottomNav - The dedicated bottom navigation for the Fantasy Squad module.
 */
const SquadBottomNav = () => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'HOME', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'squad', label: 'SQUAD', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', active: true },
    { id: 'transfers', label: 'TRANSFERS', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { id: 'leagues', label: 'LEAGUES', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { id: 'more', label: 'MORE', icon: 'M4 6h16M4 12h16M4 18h16' },
  ];

  return (
    <div className="flex-shrink-0 w-full h-16 bg-[#040f1d] border-t-2 border-[#1e3a8a] flex items-center justify-around z-30 pb-safe">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.id === 'home') navigate('/');
          }}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            item.active 
              ? 'text-[#fbbf24] border-b-2 border-[#fbbf24]' 
              : 'text-[#8b9bb4] hover:text-white'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
          </svg>
          <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SquadBottomNav;
