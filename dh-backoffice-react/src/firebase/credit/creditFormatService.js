export const getUserTier = (points = 0) => {
  if (points >= 100000) return { name: 'Diamond', icon: '💎', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', multiplier: 1.5 };
  if (points >= 10000) return { name: 'Platinum', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', multiplier: 1.2 };
  if (points >= 5000) return { name: 'Gold', icon: '🥇', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', multiplier: 1.1 };
  if (points >= 1000) return { name: 'Silver', icon: '🥈', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', multiplier: 1.05 };
  return { name: 'Member', icon: '🌟', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', multiplier: 1 };
};

export const formatCredit = (points = 0) => {
  if (points === undefined || points === null) return '0';
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(points);
};

export const calculateEarnedPoints = (amount, config, userCurrentPoints = 0) => {
  if (!amount || amount <= 0 || !config) return 0;
  const earningRate = config.earningRate || 100;
  let basePoints = Math.floor(amount / earningRate);
  const userTier = getUserTier(userCurrentPoints);
  let multiplier = config.tierMultiplier || userTier.multiplier; 
  return Math.floor(basePoints * multiplier);
};
