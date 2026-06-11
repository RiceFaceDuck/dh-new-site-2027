import React, { useState } from 'react';

const SquadHeader = ({ totalPoints, formation, onFormationChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const formations = ['4-3-3', '4-4-2', '3-5-2', '3-4-3', '4-5-1', '5-3-2', '5-4-1'];

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectFormation = (f) => {
    onFormationChange(f);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex-shrink-0 w-full px-4 pt-4 pb-2 bg-gradient-to-b from-[#061121] to-[#0a192f] shadow-md z-10">
      
      {/* Top Banner Text */}
      <div className="text-center text-xs font-semibold text-[#8b9bb4] tracking-widest mb-3">
        MY DREAM TEAM - WEEK 1
      </div>

      {/* User Info & Points */}
      <div className="flex justify-between items-center mb-4">
        {/* User Info Placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1e3a8a] border-2 border-[#fbbf24] flex items-center justify-center text-[#fbbf24] font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]">
            JD
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <span className="font-bold text-white text-base">John Doe</span>
            <span className="text-xs text-[#8b9bb4]">RANK <span className="text-white font-semibold">1,500</span></span>
          </div>
        </div>

        {/* Title Center (Optional) */}
        <div className="absolute left-1/2 -translate-x-1/2 text-xl font-black tracking-widest text-white opacity-80 pointer-events-none hidden sm:block">
          SQUAD
        </div>

        {/* Total Points */}
        <div className="flex flex-col items-end leading-tight">
          <span className="text-xs text-[#8b9bb4]">TOTAL POINTS</span>
          <span className="font-bold text-2xl text-[#fbbf24] drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">{totalPoints}</span>
        </div>
      </div>

      {/* Formation Selector Dropdown */}
      <div className="flex justify-center relative">
        <button 
          onClick={toggleDropdown}
          className="bg-[#1e3a8a] hover:bg-[#2546a3] transition-colors border border-[#3b82f6] rounded-md px-4 py-1 flex flex-col items-center shadow-lg active:scale-95 cursor-pointer"
        >
          <span className="text-[10px] text-[#93c5fd] font-bold tracking-wider">FORMATION</span>
          <span className="text-sm text-white font-semibold flex items-center gap-1">
            Currently: {formation}
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </span>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full mt-1 bg-[#0f284e] border border-[#1e3a8a] rounded-md shadow-2xl overflow-hidden z-50 w-32 animate-in fade-in zoom-in-95 duration-150">
            {formations.map((f) => (
              <button
                key={f}
                onClick={() => selectFormation(f)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[#1e3a8a] ${formation === f ? 'text-[#fbbf24] font-bold bg-[#14325e]' : 'text-white'}`}
              >
                {f} {formation === f && '✓'}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SquadHeader;
