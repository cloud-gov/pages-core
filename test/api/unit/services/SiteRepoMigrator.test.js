const crypto = require('node:crypto');
const { expect } = require('chai');
const {
  getUserGHCredentials,
  setRepoWebhook,
} = require('../../../../api/services/SiteRepoMigrator');
const { Site, User, UAAIdentity } = require('../../../../api/models');
const githubAPINocks = require('../../support/githubAPINocks');
const factory = require('../../support/factory');

async function cleanDb() {
  return await Promise.all([
    User.truncate({
      force: true,
      cascade: true,
    }),
    Site.truncate({
      force: true,
      cascade: true,
    }),
    UAAIdentity.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('SiteRepoMigrator', () => {
  beforeEach(async () => await cleanDb);

  afterEach(async () => await cleanDb);

  describe('getUserGHCredentials', () => {
    it(`Should get the Github credentials
        of a user based on their UAA email`, async () => {
      const githubAccessToken = crypto.randomUUID();
      const githubUserId = crypto.randomUUID();
      const user = await factory.user({
        githubAccessToken,
        githubUserId,
      });
      const uaaId = await factory.uaaIdentity({
        userId: user.id,
      });

      const creds = await getUserGHCredentials(uaaId.email);

      expect(creds).to.have.keys(['githubAccessToken', 'githubUserId']);
      expect(creds.githubAccessToken).to.equal(githubAccessToken);
      expect(creds.githubUserId).to.equal(githubUserId);
    });

    it(`Should throw an error if UAA
        Identity does not exist with the email`, async () => {
      const nonExistingEmail = 'does.not.exist@agency.gov';
      const user = await factory.user();
      await factory.uaaIdentity({
        userId: user.id,
      });

      try {
        await getUserGHCredentials(nonExistingEmail);
      } catch (error) {
        expect(error).to.throw;
        expect(error.message).to.equal('No UAA Identity exists with that email.');
      }
    });
  });

  describe('setRepoWebhook', () => {
    it(`should set a webhook on the
        repository and return the site instance`, async () => {
      const oldWebhookId = 90210;
      const webhookId = 8675309;
      const githubAccessToken = crypto.randomUUID();
      const githubUserId = crypto.randomUUID();
      const site = await factory.site({
        webhookId: oldWebhookId,
      });
      const user = await factory.user({
        githubAccessToken,
        githubUserId,
      });
      const uaaId = await factory.uaaIdentity({
        userId: user.id,
      });

      githubAPINocks.webhook(
        {
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          response: 201,
        },
        { id: webhookId },
      );

      const updatedSite = await setRepoWebhook(site, uaaId.email);
      expect(updatedSite.webhookId).to.equal(webhookId);
    });

    it(`should resolve if the webhook
        already exists on the site repository`, async () => {
      const oldWebhookId = 90210;
      const githubAccessToken = crypto.randomUUID();
      const githubUserId = crypto.randomUUID();
      const site = await factory.site({
        webhookId: oldWebhookId,
      });
      const user = await factory.user({
        githubAccessToken,
        githubUserId,
      });
      const uaaId = await factory.uaaIdentity({
        userId: user.id,
      });

      githubAPINocks.webhook({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        response: [
          400,
          {
            errors: [
              {
                message: 'Hook already exists on this repository',
              },
            ],
          },
        ],
      });

      const updatedSite = await setRepoWebhook(site, uaaId.email);
      expect(updatedSite.webhookId).to.equal(oldWebhookId);
    });
  });
});
