const verifySlipOcr = require('./verifySlipOcr');
const purgeOldSlips = require('./purgeOldSlips');

module.exports = {
  ...verifySlipOcr,
  ...purgeOldSlips
};
