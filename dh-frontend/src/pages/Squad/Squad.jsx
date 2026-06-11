import React from 'react';
import { useSquadSelection } from './hooks/useSquadSelection';
import SquadHeader from './components/SquadHeader';
import Pitch from './components/Pitch';
import SquadActions from './components/SquadActions';
import SquadBottomNav from './components/SquadBottomNav';

/**
 * Squad - Main Page Component for Fantasy Squad Selection.
 * Orchestrates the state from useSquadSelection and passes it to presentation components.
 * Designed to fit strictly within h-[100dvh] via SquadLayout.
 */
const Squad = () => {
  const { squad, formation, bank, totalPoints, actions } = useSquadSelection();

  return (
    <>
      {/* 1. Header Area (Static height) */}
      <SquadHeader 
        totalPoints={totalPoints} 
        formation={formation} 
        onFormationChange={actions.changeFormation} 
      />

      {/* 2. Pitch Area (Flexible height, takes up remaining space) */}
      <Pitch squad={squad} />

      {/* 3. Actions Area (Static height) */}
      <SquadActions 
        bank={bank} 
        squadCount={squad.length} 
        actions={actions} 
      />

      {/* 4. Bottom Navigation (Static height) */}
      <SquadBottomNav />
    </>
  );
};

export default Squad;
