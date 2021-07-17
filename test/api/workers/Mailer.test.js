const { expect } = require('chai');
const sinon = require('sinon');

const { mail: mailConfig } = require('../../../config');
const Mailer = require('../../../api/workers/Mailer');

describe('Mailer', () => {
  afterEach(() => sinon.restore());

  describe('.send()', () => {
    context('sends an email', () => {
      const to = 'foo@bar.com';
      const subject = 'This is only a test';
      const html = '<p>For real, only a test<p>';

      let result;
      let parsedMessage;

      before(async () => {
        const mailer = new Mailer();
        result = await mailer.send({ to, subject, html });
        parsedMessage = JSON.parse(result.message);
      });

      it('to the specified addresses', () => {
        expect(result.envelope.to).to.have.members([to]);
      });

      it('from the configured address', () => {
        expect(result.envelope.from).to.eq(mailConfig.from);
      });

      it('with the specified content', () => {
        expect(parsedMessage.subject).to.eq(subject);
        expect(parsedMessage.html).to.contain(html);
      });

      it('with a text version of the html', () => {
        expect(parsedMessage.text).to.eq('For real, only a test\n\n');
      });
    });
  });

  describe('.close()', () => {
    it('closes the transporter', async () => {
      const mailer = new Mailer();
      mailer.transporter.close = sinon.stub().resolves();

      await mailer.close();

      sinon.assert.calledOnce(mailer.transporter.close);
    });
  });

  describe('.verify()', () => {
    it('verifies the transporter', async () => {
      const mailer = new Mailer();
      mailer.transporter.verify = sinon.stub().resolves();

      await mailer.verify();

      sinon.assert.calledOnce(mailer.transporter.verify);
    });
  });
});
