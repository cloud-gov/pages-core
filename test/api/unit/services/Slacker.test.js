const { expect } = require('chai');

const config = require('../../../../config');
const Slacker = require('../../../../api/services/slacker');
const Templates = require('../../../../api/services/slacker/templates');

describe('slacker', () => {
  context('when the Slacker has not been initialized', () => {
    // This test can only be run once since Slacker is a singleton
    it('throws an error', async () => {
      const error = await Slacker.sendAlert().catch(e => e);

      expect(error).to.be.an('error');
      expect(error.message).to.eq('Slack Queue is not initialized, did you forget to call `init()`?');
    });
  });

  context('when the Slacker has been initialized', () => {
    before(() => {
      Slacker.init();
    });

    describe('.sendAlert()', () => {
      it('adds a `alert` job to the slack queue', async () => {
        const errors = ['some error message'];
        const reason = 'something bad happened';

        const job = await Slacker.sendAlert(reason, errors);

        expect(job.name).to.eq('alert');
        expect(job.data.channel).to.eq('federalist-supportstream');
        expect(job.data.text).to.eq(Templates.alert({ errors, reason }));
        expect(job.data.username).to.eq(`Federalist ${config.app.appEnv} Alerts`);
      });
    });
  });
});
