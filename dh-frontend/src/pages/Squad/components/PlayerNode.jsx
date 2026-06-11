import React from 'react';

/**
 * PlayerNode - Displays an individual player on the pitch.
 * Includes a simple CSS-based shirt, player name, price, and role (Captain, etc).
 */
const PlayerNode = ({ player }) => {
  if (!player) return <EmptyNode />;

  // Determine shirt color based on team (mock logic for vibrant theme)
  const getShirtColor = (team) => {
    switch(team) {
      case 'MCI': return 'bg-[#60A5FA] border-white'; // Light blue
      case 'ARS': return 'bg-[#EF4444] border-white'; // Red
      case 'LIV': return 'bg-[#DC2626] border-white'; // Dark Red
      case 'MUN': return 'bg-[#B91C1C] border-[#FBBF24]'; // Red with Gold
      default: return 'bg-gray-400 border-white';
    }
  };

  return (
    <div className="flex flex-col items-center justify-end w-16 sm:w-20 group relative cursor-pointer">
      {/* Player Shirt (Simple CSS) */}
      <div className="relative mb-1">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-t-lg rounded-b-md border-2 shadow-md ${getShirtColor(player.team)} transition-transform group-hover:scale-110 flex items-center justify-center`}>
          {/* Mock collar/neck */}
          <div className="absolute top-0 w-3 h-1 bg-white rounded-b-full opacity-50"></div>
          {/* Position text small inside shirt */}
          <span className="text-[8px] font-bold text-white opacity-60 mix-blend-overlay">{player.position}</span>
        </div>
        
        {/* Role Badge (C/VC) */}
        {player.role && (
          <div className="absolute -top-2 -right-2 bg-black border border-[#fbbf24] text-[#fbbf24] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg">
            {player.role}
          </div>
        )}
      </div>

      {/* Player Info Card */}
      <div className="bg-white rounded shadow-sm w-full overflow-hidden flex flex-col transition-all group-hover:shadow-md group-hover:-translate-y-0.5 border border-gray-200">
        <div className="bg-white text-[#0f284e] text-[10px] sm:text-xs font-bold text-center px-1 truncate py-0.5">
          {player.name}
        </div>
        <div className="bg-[#0f284e] text-[#93c5fd] text-[9px] sm:text-[10px] font-semibold text-center flex justify-between px-1.5 py-0.5">
          <span>{player.team}</span>
          <span className="text-[#fbbf24]">£{player.price}</span>
        </div>
      </div>
    </div>
  );
};

const EmptyNode = () => (
  <div className="flex flex-col items-center justify-end w-16 sm:w-20 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-t-lg rounded-b-md border-2 border-dashed border-gray-400 bg-black/20 mb-1 flex items-center justify-center">
      <span className="text-gray-300 text-xl font-light">+</span>
    </div>
    <div className="bg-gray-200 rounded w-full h-4"></div>
    <div className="bg-gray-300 rounded-b w-full h-3"></div>
  </div>
);

export default PlayerNode;
