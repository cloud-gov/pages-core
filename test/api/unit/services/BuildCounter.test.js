const expect = require('chai').expect;
const factory = require('../../support/factory');
const moment = require('moment');
const BuildCounter = require('../../../../api/services/BuildCounter');
const { Build } = require('../../../../api/models');

describe('BuildCounter', () => {
  describe('countBuildsFromPastWeek', () => {
    it('counts how many builds occured in the past week', (done) => {
      Build.destroy({ where: {} }).then(() => {
        const promises = Array.from(Array(10).keys()).map((day) => {
          const date = moment().subtract(day + 1, 'days');
          return factory.build({ createdAt: date });
        });
        return Promise.all(promises);
      })
      .then(() =>
        BuildCounter.countBuildsFromPastWeek()
      )
      .then((count) => {
        expect(count).to.equal(7);
        done();
      })
      .catch(done);
    });
  });
});
