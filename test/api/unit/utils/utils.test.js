const expect = require('chai').expect;
const moment = require('moment');

const config = require('../../../../config');
const utils = require('../../../../api/utils');

describe('utils', () => {
  describe('.isPastAuthThreshold', () => {
    const threshAmount = config.policies.authRevalidationMinutes;

    it(`returns true when given datetime is older than ${threshAmount} minutes`, (done) => {
      const expiredAuthDate = moment().subtract(threshAmount + 5, 'minutes').toDate();
      expect(utils.isPastAuthThreshold(expiredAuthDate)).to.equal(true);
      done();
    });

    it(`returns false when given datetime is newer than ${threshAmount} minutes`, (done) => {
      const goodAuthDate = moment().subtract(threshAmount - 5, 'minutes').toDate();
      expect(utils.isPastAuthThreshold(goodAuthDate)).to.equal(false);
      done();
    });
  });
});
