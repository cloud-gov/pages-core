const { expect } = require('chai');
const factory = require('../../support/factory');
const RepositoryVerifier = require('../../../../api/services/RepositoryVerifier');
const { Site } = require('../../../../api/models');
const githubAPINocks = require('../../support/githubAPINocks');
const { createSiteUserOrg } = require('../../support/site-user');

describe('RepositoryVerifier', () => {
  context('verifyRepos', () => {
    it('verify site', async () => {
      const { site, user } = await createSiteUserOrg();

      githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
      });

      await RepositoryVerifier.verifyRepos();
      const latestSite = await Site.findByPk(site.id);
      expect(latestSite.repoLastVerified).gt(site.repoLastVerified);
    });

    it('verify site with second users', async () => {
      const { site, user: user1, org } = await createSiteUserOrg();
      const user2 = await factory.user();
      await org.addRoleUser(user2);

      githubAPINocks.repo({
        accessToken: user1.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        response: 404,
      });
      githubAPINocks.repo({
        accessToken: user2.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
      });
      await RepositoryVerifier.verifyRepos();
      const latestSite = await Site.findByPk(site.id);
      expect(latestSite.repoLastVerified).gt(site.repoLastVerified);
    });

    it('not able to verify sites with users that cannot access repository', async () => {
      const { site, user } = await createSiteUserOrg();

      githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        response: 404,
      });
      await RepositoryVerifier.verifyRepos();

      const latestSite = await Site.findByPk(site.id);
      expect(latestSite.repoLastVerified).deep.equal(site.repoLastVerified);
    });

    it('not able to verify sites with users without access tokens', async () => {
      const user = await factory.user({
        githubAccessToken: null,
      });
      const { site } = await createSiteUserOrg({ user });

      githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        response: 404,
      });
      await RepositoryVerifier.verifyRepos();
      const latestSite = await Site.findByPk(site.id);
      expect(latestSite.repoLastVerified).deep.equal(site.repoLastVerified);
    });
  });
});
