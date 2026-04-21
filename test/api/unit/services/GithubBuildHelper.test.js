const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { Site } = require('../../../../api/models');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const { createSiteUserOrg } = require('../../support/site-user');
const GitHub = require('../../../../api/services/GitHub');
const GithubBuildHelper = require('../../../../api/services/GithubBuildHelper');
// eslint-disable-next-line max-len
const SourcecodePlatformHelper = require('../../../../api/services/SourceCodePlatformHelper');

const requestedCommitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';
const clonedCommitSha = '7b8d23c07a2c3b5a140844a654d91e13c66b271a';

describe('GithubBuildHelper', () => {
  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('fetchContent(build, site, users, path)', () => {
    let user;
    let site;
    let build;

    const path = 'filePath.txt';
    beforeEach(async () => {
      ({ site, user } = await createSiteUserOrg());
      build = await factory.build({
        state: 'success',
        requestedCommitSha,
        clonedCommitSha,
        user,
        site,
      });
    });

    it('should fetch the content requested', async () => {
      sinon.stub(GitHub, 'getContent').resolves('testContent');
      sinon.stub(GitHub, 'getRepoPermissions').resolves({
        push: true,
      });
      await build.reload({ include: Site });
      const content = await GithubBuildHelper.fetchContent(
        build,
        path,
        SourcecodePlatformHelper.loadBuildUserAccessToken,
      );
      expect(content).to.equal('testContent');
    });

    it('should not fetch the content requested w/o clonedCommitSha', async () => {
      await build.update({
        requestedCommitSha: null,
        clonedCommitSha: null,
      });
      await build.reload({ include: Site });
      const err = await GithubBuildHelper.fetchContent(
        build,
        path,
        SourcecodePlatformHelper.loadBuildUserAccessToken,
      ).catch((e) => e);
      expect(err.message).to.equal(
        `Build or commit sha undefined. Unable to fetch ${path} for build@id=${build.id}`,
      );
    });
  });

  describe('.loadBuildUserAccessToken', () => {
    let user;
    let site;
    let build;
    let org;

    beforeEach(async () => {
      ({ site, user, org } = await createSiteUserOrg());
      build = await factory.build({
        site,
        user,
      });
    });

    it('should fetch buildUser token', async () => {
      const repoNock = githubAPINocks.repo({
        accessToken: user.githubAccessToken,
        owner: site.owner,
        repo: site.repository,
        username: user.username,
      });
      await build.reload({ include: Site });
      const githubAccessToken =
        await SourcecodePlatformHelper.loadBuildUserAccessToken(build);
      expect(githubAccessToken).to.equal(user.githubAccessToken);
      expect(repoNock.isDone()).to.be.true;
    });

    it(`should fetch another org user token
        - build user has no access to private repo`, async () => {
      const orgUser = await factory.user();
      await org.addRoleUser(orgUser);
      const repoNocks = [];
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
          response: [
            403,
            {
              permissions: {},
            },
          ],
        }),
      );
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: orgUser.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: orgUser.username,
        }),
      );
      await build.reload({ include: Site });
      const githubAccessToken =
        await SourcecodePlatformHelper.loadBuildUserAccessToken(build);
      expect(githubAccessToken).to.equal(orgUser.githubAccessToken);
      repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
    });

    it('should fetch an org user token - build user with no permission', async () => {
      const orgUser = await factory.user();
      await org.addRoleUser(orgUser);
      const repoNocks = [];
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
          response: [
            201,
            {
              permissions: {},
            },
          ],
        }),
      );
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: orgUser.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: orgUser.username,
        }),
      );
      await build.reload({ include: Site });
      const githubAccessToken =
        await SourcecodePlatformHelper.loadBuildUserAccessToken(build);
      expect(githubAccessToken).to.equal(orgUser.githubAccessToken);
      repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
    });

    it('all org users w/o permissions to private repo', async () => {
      const orgUser = await factory.user();
      await org.addRoleUser(orgUser);
      const repoNocks = [];
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
          response: [
            403,
            {
              permissions: {},
            },
          ],
        }),
      );
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: orgUser.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: orgUser.username,
          response: [
            403,
            {
              permissions: {},
            },
          ],
        }),
      );
      await build.reload({ include: Site });
      const err = await SourcecodePlatformHelper.loadBuildUserAccessToken(build).catch(
        (e) => e,
      );
      repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
      expect(err.message).to.equal(
        `Unable to find valid access token to report build@id=${build.id} status`,
      );
    });

    it('all site users withouth write access', async () => {
      const orgUser = await factory.user();
      await org.addRoleUser(orgUser);
      const repoNocks = [];
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
          response: [
            201,
            {
              permissions: {},
            },
          ],
        }),
      );
      repoNocks.push(
        githubAPINocks.repo({
          accessToken: orgUser.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: orgUser.username,
          response: [
            201,
            {
              permissions: {},
            },
          ],
        }),
      );
      await build.reload({ include: Site });
      const err = await SourcecodePlatformHelper.loadBuildUserAccessToken(build).catch(
        (e) => e,
      );
      repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
      expect(err.message).to.equal(
        `Unable to find valid access token to report build@id=${build.id} status`,
      );
    });
  });
});
