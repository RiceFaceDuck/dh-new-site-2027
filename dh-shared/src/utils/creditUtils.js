/**
 * Canonical helper to unwrap nested credit_config documents from Firestore.
 * Supports both legacy flat documents and current nested `{ config: { ... }, ledger: { ... } }` structures.
 */
export const unwrapCreditConfig = (docData) => {
  if (!docData || typeof docData !== 'object') return null;
  const innerConfig = docData.config && typeof docData.config === 'object' ? docData.config : {};
  return {
    ...docData,
    ...innerConfig,
    earningRate: innerConfig.earningRate || innerConfig.pointsEarningRate || docData.earningRate || docData.pointsEarningRate || 100,
    pointsEarningRate: innerConfig.pointsEarningRate || innerConfig.earningRate || docData.pointsEarningRate || docData.earningRate || 100,
    skuBonusRules: innerConfig.skuBonusRules || docData.skuBonusRules || '',
    adClickCost: innerConfig.adClickCost ?? docData.adClickCost ?? 5,
    adImpressionCost: innerConfig.adImpressionCost ?? docData.adImpressionCost ?? 0.1,
    adImpressionCount: innerConfig.adImpressionCount ?? docData.adImpressionCount ?? 1000,
    partnerRankingCost: innerConfig.partnerRankingCost ?? docData.partnerRankingCost ?? 50,
    tiers: innerConfig.tiers || docData.tiers || null
  };
};
