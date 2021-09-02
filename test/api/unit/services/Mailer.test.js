const { expect } = require('chai');

const Mailer = require('../../../../api/services/mailer');
const Templates = require('../../../../api/services/mailer/templates');

describe('mailer', () => {
  context('when the Mailer has not been initialized', () => {
    // This test can only be run once since Mailer is a singleton
    it('throws an error', async () => {
      const error = await Mailer.sendUAAInvite().catch(e => e);

      expect(error).to.be.an('error');
      expect(error.message).to.eq('Mail Queue is not initialized, did you forget to call `init()`?');
    });
  });

  context('when the Mailer has been initialized', () => {
    before(() => {
      Mailer.init();
    });

    describe('.sendUAAInvite()', () => {
      it('adds a `uaa-invite` job to the mail queue', async () => {
        const email = 'foo@bar.gov';
        const link = 'https://foobar.gov';

        const job = await Mailer.sendUAAInvite(email, link);

        expect(job.name).to.eq('uaa-invite');
        expect(job.data.to).to.deep.eq([email]);
        expect(job.data.html).to.eq(Templates.uaaInvite({ link }));
      });
    });

    describe('.sendAlert()', () => {
      it('adds a `alert` job to the mail queue', async () => {
        const errors = ['some error message'];
        const reason = 'something bad happened';

        const job = await Mailer.sendAlert(reason, errors);

        expect(job.name).to.eq('alert');
        expect(job.data.to).to.deep.eq(['federalist-alerts@gsa.gov']);
        expect(job.data.html).to.eq(Templates.alert({ errors, reason }));
      });
    });
  });
});
