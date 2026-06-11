import { useState, useCallback } from 'react';

// Mock data for the initial squad
const INITIAL_SQUAD = [
  { id: '1', name: 'Ederson', team: 'MCI', position: 'GK', price: 14.2, role: 'C' },
  { id: '2', name: 'Walker', team: 'MCI', position: 'DEF', price: 8.0, role: 'C' },
  { id: '3', name: 'Stones', team: 'MCI', position: 'DEF', price: 8.5, role: null },
  { id: '4', name: 'Saliba', team: 'ARS', position: 'DEF', price: 6.9, role: null },
  { id: '5', name: 'Robertson', team: 'LIV', position: 'DEF', price: 2.9, role: 'F' },
  { id: '6', name: 'Foden', team: 'MCI', position: 'MID', price: 6.0, role: 'C' },
  { id: '7', name: 'Odegaard', team: 'ARS', position: 'MID', price: 7.0, role: null },
  { id: '8', name: 'Saka', team: 'ARS', position: 'MID', price: 7.5, role: 'S' },
  { id: '9', name: 'Haaland', team: 'MCI', position: 'FW', price: 14.2, role: 'C' },
  { id: '10', name: 'Nketiah', team: 'ARS', position: 'FW', price: 6.3, role: 'C' },
  { id: '11', name: 'Rashford', team: 'MUN', position: 'FW', price: 4.5, role: 'VC' },
];

export const useSquadSelection = () => {
  const [squad, setSquad] = useState(INITIAL_SQUAD);
  const [formation, setFormation] = useState('4-3-3');
  const [bank, setBank] = useState(1.2);
  const [totalPoints, setTotalPoints] = useState(89);

  const handleAutoPick = useCallback(() => {
    // In a real app, this would call an API or complex logic
    console.log('Auto Pick triggered');
  }, []);

  const handleReset = useCallback(() => {
    // In a real app, this would clear the team or reset to last saved state
    console.log('Reset triggered');
  }, []);

  const handleSaveTeam = useCallback(() => {
    // In a real app, this would save to Firebase/API
    console.log('Save Team triggered');
  }, []);

  const changeFormation = useCallback((newFormation) => {
    setFormation(newFormation);
  }, []);

  return {
    squad,
    formation,
    bank,
    totalPoints,
    actions: {
      handleAutoPick,
      handleReset,
      handleSaveTeam,
      changeFormation
    }
  };
};
