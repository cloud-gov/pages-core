const { expect } = require('chai');

const Mailer = require('../../../../api/services/mailer');
const Templates = require('../../../../api/services/mailer/templates');

describe('mailer', () => {
  describe('.sendUAAInvite()', () => {
    context('when the Mailer has not been initialized', () => {
      it('throws an error', async () => {
        const error = await Mailer.sendUAAInvite().catch(e => e);

        expect(error).to.be.an('error');
        expect(error.message).to.eq('Mail Queue is not initialized, did you forget to call `init()`?');
      });
    });

    context('when the Mailer has been initialized', async () => {
      it('adds a `uaa-invite` job to the mail queue', async () => {
        const email = 'foo@bar.gov';
        const link = 'https://foobar.gov';

        Mailer.init();
        const job = await Mailer.sendUAAInvite(email, link);

        expect(job.name).to.eq('uaa-invite');
        expect(job.data.to).to.eq(email);
        expect(job.data.html).to.eq(Templates.uaaInvite({ link }));
      });
    });
  });
});
