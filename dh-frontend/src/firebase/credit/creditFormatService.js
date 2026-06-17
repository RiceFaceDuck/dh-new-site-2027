export const getUserTier = (points = 0) => {
  if (points >= 100000) return { name: 'Diamond', icon: '💎', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' };
  if (points >= 10000) return { name: 'Platinum', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
  if (points >= 5000) return { name: 'Gold', icon: '🥇', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (points >= 1000) return { name: 'Silver', icon: '🥈', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
  return { name: 'Member', icon: '🌟', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
};

export const formatCredit = (points = 0) => {
  if (points === undefined || points === null) return '0';
  return new Intl.NumberFormat('th-TH').format(points);
};
