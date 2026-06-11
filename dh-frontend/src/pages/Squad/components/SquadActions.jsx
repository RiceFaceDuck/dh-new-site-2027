import React from 'react';

/**
 * SquadActions - Bottom action bar for Auto Pick, Reset, and Save Team.
 * Also displays the remaining bank balance and squad count.
 */
const SquadActions = ({ bank, squadCount, actions }) => {
  return (
    <div className="flex-shrink-0 w-full px-4 py-3 bg-[#0a192f] border-t border-[#1a365d] shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-20">
      
      {/* Action Buttons */}
      <div className="flex justify-between gap-2 mb-3">
        <button 
          onClick={actions.handleAutoPick}
          className="flex-1 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0a192f] font-bold py-2 rounded-md shadow flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <span className="text-sm">AUTO PICK</span>
        </button>
        
        <button 
          onClick={actions.handleReset}
          className="flex-1 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0a192f] font-bold py-2 rounded-md shadow flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span className="text-sm">RESET</span>
        </button>
        
        <button 
          onClick={actions.handleSaveTeam}
          className="flex-1 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0a192f] font-bold py-2 rounded-md shadow flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          <span className="text-sm">SAVE TEAM</span>
        </button>
      </div>

      {/* Squad Status */}
      <div className="flex justify-between items-center text-xs font-semibold text-white px-1">
        <span className="opacity-80">MY SQUAD ({squadCount}/11)</span>
        <span className="opacity-80">
          REMAINING BANK: <span className="text-[#fbbf24] text-sm">£{bank}m</span>
        </span>
      </div>
      
    </div>
  );
};

export default SquadActions;
