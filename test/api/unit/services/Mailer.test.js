const { expect } = require('chai');

const { mail: mailConfig } = require('../../../../config');
const Mailer = require('../../../../api/services/Mailer');

describe('Mailer', () => {
  describe('.send()', () => {
    it('sends the email', async () => {
      const to = 'foo@bar.com';
      const subject = 'This is only a test';
      const content = 'For real, only a test';

      const mailer = new Mailer();
      const { envelope, message } = await mailer.send(to, subject, content);

      expect(envelope.to).to.have.members([to]);
      expect(envelope.from).to.eq(mailConfig.from);

      const parsedMessage = JSON.parse(message);

      expect(parsedMessage.subject).to.eq(subject);
      expect(parsedMessage.text).to.eq(content);
      expect(parsedMessage.html).to.contain(content);
    });
  });
});
