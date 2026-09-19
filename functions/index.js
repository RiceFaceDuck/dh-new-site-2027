const verifySlipOcr = require('./slips/verifySlipOcr');
const purgeOldSlips = require('./slips/purgeOldSlips');

module.exports = {
  ...verifySlipOcr,
  ...purgeOldSlips
};
