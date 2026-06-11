import React, { useMemo } from 'react';
import PlayerNode from './PlayerNode';

/**
 * Pitch - Renders the football pitch background and distributes players into rows.
 * Uses flexbox to ensure vertical distribution fits perfectly without scrolling.
 */
const Pitch = ({ squad }) => {
  // Group players by position
  const { gk, def, mid, fw } = useMemo(() => {
    return {
      gk: squad.filter(p => p.position === 'GK'),
      def: squad.filter(p => p.position === 'DEF'),
      mid: squad.filter(p => p.position === 'MID'),
      fw: squad.filter(p => p.position === 'FW'),
    };
  }, [squad]);

  const rows = [fw, mid, def, gk]; // Bottom to top logically, but visually top to bottom is GK, DEF, MID, FW. Wait.
  // The screenshot shows GK at the top.
  const visualRows = [gk, def, mid, fw];

  return (
    <div className="relative flex-1 w-full flex flex-col overflow-hidden bg-[#228B22] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
      
      {/* CSS Gradient Pitch Stripes (Underlay) */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.1) 20%)'
        }}
      />
      
      {/* Pitch Lines (Penalty box, half way line) */}
      <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-between">
        {/* Top Penalty Box */}
        <div className="w-1/2 h-[15%] border-b-2 border-x-2 border-white/40 mt-0 flex justify-center items-end pb-2">
           <div className="w-1/3 h-1/2 border-t-2 border-x-2 border-white/40 rounded-t-full"></div>
        </div>
        
        {/* Halfway Line */}
        <div className="w-full border-t-2 border-white/40 relative flex justify-center items-center">
           <div className="w-16 h-16 border-2 border-white/40 rounded-full absolute -top-8 bg-transparent"></div>
        </div>
        
        {/* Bottom Penalty Box */}
        <div className="w-1/2 h-[15%] border-t-2 border-x-2 border-white/40 mb-0 flex justify-center items-start pt-2">
           <div className="w-1/3 h-1/2 border-b-2 border-x-2 border-white/40 rounded-b-full"></div>
        </div>
      </div>

      {/* Player Rows (Overlay) */}
      <div className="relative z-10 flex-1 flex flex-col justify-evenly py-4">
        {visualRows.map((row, index) => (
          <div key={index} className="flex justify-center gap-2 sm:gap-6 w-full px-2">
            {row.map((player) => (
              <PlayerNode key={player.id} player={player} />
            ))}
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default Pitch;
