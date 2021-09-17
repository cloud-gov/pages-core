const { expect } = require('chai');
const nock = require('nock');

const Slack = require('../../../api/workers/Slack');

describe('Slack', () => {
  afterEach(() => expect(nock.isDone()).to.be.true);

  describe('.send()', () => {
    it('sends a POST request to slack', async () => {
      const url = 'http://localhost:2343/foo/bar';

      const channel = 'some channel';
      const text = '*For real, only a test*';
      const username = 'some user';

      const slack = new Slack({ url });

      nock('http://localhost:2343')
        .post('/foo/bar', { channel, text, username })
        .reply(200);

      await slack.send({ channel, text, username });
    });
  });
});
