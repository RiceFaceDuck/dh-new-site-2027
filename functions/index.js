const verifySlipOcr = require('./slips/verifySlipOcr');
const purgeOldSlips = require('./slips/purgeOldSlips');
const nightlyChunkGuard = require('./inventory/nightlyChunkGuard');
const walletFunctions = require('./inventory/walletFunctions');
const ga4AdSync = require('./marketing/ga4AdSyncCron');
const userClaimsTrigger = require('./auth/userClaimsTrigger');

module.exports = {
  ...verifySlipOcr,
  ...purgeOldSlips,
  ...nightlyChunkGuard,
  ...walletFunctions,
  ...ga4AdSync,
  ...userClaimsTrigger
};
