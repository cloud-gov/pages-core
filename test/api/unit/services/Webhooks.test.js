const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../../../app');
const { Build, Site, User, Event } = require('../../../../api/models');
const SiteBuildQueue = require('../../../../api/services/SiteBuildQueue');
const EventCreator = require('../../../../api/services/EventCreator');
const GithubBuildHelper = require('../../../../api/services/GithubBuildHelper');

const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');

const Webhooks = require('../../../../api/services/Webhooks');

describe('Webhooks Service', () => {
  const buildWebhookPayload = (user, site, pushedAt = new Date().getTime()/1000) => ({
    ref: 'refs/heads/main',
    commits: [{ id: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7' }],
    after: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
    sender: { login: user.username },
    repository: { full_name: `${site.owner}/${site.repository}`, pushed_at: pushedAt },
  });

  const organizationWebhookPayload = (action, login, organization='federalist-users') => ({
    action,
    membership: {
      user: {
        login,
      },
    },
    organization: {
      login: organization,
      id: 123,
    }
  });

  let errorStub;
  let auditStub;
  beforeEach(() => {
    errorStub = sinon.stub(EventCreator, 'error').resolves();
    auditStub = sinon.stub(EventCreator, 'audit').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('pushWebhookRequest', () => {
    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.status();
      githubAPINocks.repo({ response: [201, { permissions: { admin: false, push: true } }] });
      sinon.stub(SiteBuildQueue, 'sendBuildMessage').resolves();
    });

    it('should create a new site build for the sender', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: [user] });
      const numBuildsBefore = await Build.count({ where: { site: site.id, user: user.id } });
      expect(numBuildsBefore).to.eq(0);

      const payload = buildWebhookPayload(user, site);


      await Webhooks.pushWebhookRequest(payload);

      const numBuildsAfter = await Build.count({
        where: {
          site: site.id,
          user: user.id,
          branch: payload.ref.split('/')[2],
          requestedCommitSha: payload.after,
        },
      });

      expect(numBuildsAfter).to.eq(1);
    });

    it('should not create a user associated with the site for the sender if no user exists', async () => {
      const username = crypto.randomBytes(3).toString('hex');

      const site = await factory.site();
      const payload = buildWebhookPayload({ username }, site);


      await Webhooks.pushWebhookRequest(payload);

      const build = await Build.findOne({
        where: { username },
        limit: 1,
        order: [ [ 'createdAt', 'DESC' ]],
        include: [User]
      });

      expect(build.username).to.equal(username);
      expect(build.User).to.be.null;
    });

    it('should find the site by the lowercased owner and repository and upper cased github user', async () => {
      const reporterSpy = sinon.stub(GithubBuildHelper, 'reportBuildStatus').resolves();
      const user = await factory.user();
      const site = await factory.site({ users: [user] });

      user.username = user.username.toUpperCase();

      const payload = buildWebhookPayload(user, site);
      payload.repository.full_name = `${site.owner.toUpperCase()}/${site.repository.toUpperCase()}`;

      expect(reporterSpy.calledOnce).to.be.false;

      await Webhooks.pushWebhookRequest(payload);

      const build = await Build.findOne({
        where: { username: user.username.toLowerCase() },
        limit: 1,
        order: [ [ 'createdAt', 'DESC' ]],
        include: [User],
      });
      expect(reporterSpy.calledOnce).to.be.true;
      expect(reporterSpy.args[0][0].id).to.equal(build.id);
    });

    it('should report the status of the new build to GitHub', (done) => {
      nock.cleanAll();
      const statusNock = githubAPINocks.status({ state: 'pending' });

      const userProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm]) });
      Promise.props({ user: userProm, site: siteProm })
        .then(({ user, site }) => {
          const payload = buildWebhookPayload(user, site);
          payload.repository.full_name = `${site.owner.toUpperCase()}/${site.repository.toUpperCase()}`;


          githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            username: user.username,
          });

          return Webhooks.pushWebhookRequest(payload);
        })
        .then(() => {
          expect(statusNock.isDone()).to.be.true;
          done();
        })
        .catch(done);
    });

    it('should not schedule a build if there are no new commits', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: [user] });
      const numBuildsBefore = await Build.count({ where: { site: site.id, user: user.id } });
      expect(numBuildsBefore).to.eq(0);

      const payload = buildWebhookPayload(user, site);
      payload.commits = [];


      await Webhooks.pushWebhookRequest(payload);

      const numBuildsAfter = await Build.count({ where: { site: site.id, user: user.id } });
      expect(numBuildsAfter).to.eq(0);
    });

    it('should respond with a 200 if the site does not exist on Federalist', async () => {
      const user = await factory.user();
      const payload = buildWebhookPayload(user, {
        owner: user.username,
        repository: 'fake-repo-name',
      });
      const startCount = await Build.count();


      await Webhooks.pushWebhookRequest(payload);

      const endCount = await Build.count();
      expect(endCount).to.equal(startCount);
    });

    it('sites should not build if site is inactive', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: [user], buildStatus: 'inactive' });
      const payload = buildWebhookPayload(user, {
        owner: site.owner,
        repository: site.repository,
      });

      const startCount = await Build.count();

      await Webhooks.pushWebhookRequest(payload);

      const endCount = await Build.count();
      expect(endCount).to.equal(startCount);
    });

    it('sites should build if organization is active', async () => {
      const user = await factory.user();
      const org = await factory.organization.create();
      expect(org.isActive).to.be.true;
      const site = await factory.site({ users: [user], organizationId: org.id });
      const numBuildsBefore = await Build.count({ where: { site: site.id, user: user.id } });
      expect(numBuildsBefore).to.eq(0);

      const payload = buildWebhookPayload(user, site);

      await Webhooks.pushWebhookRequest(payload);

      const numBuildsAfter = await Build.count({
        where: {
          site: site.id,
          user: user.id,
          branch: payload.ref.split('/')[2],
          requestedCommitSha: payload.after,
        },
      });

      expect(numBuildsAfter).to.eq(1);
    });

    it('sites should not build if organization is inactive', async () => {
      const user = await factory.user();
      const org = await factory.organization.create({ isActive: false });
      expect(org.isActive).to.be.false;
      const site = await factory.site({ users: [user], organizationId: org.id });
      const numBuildsBefore = await Build.count({ where: { site: site.id, user: user.id } });
      expect(numBuildsBefore).to.eq(0);

      const payload = buildWebhookPayload(user, site);

      await Webhooks.pushWebhookRequest(payload);

      const numBuildsAfter = await Build.count({
        where: {
          site: site.id,
          user: user.id,
          branch: payload.ref.split('/')[2],
          requestedCommitSha: payload.after,
        },
      });

      expect(numBuildsAfter).to.eq(0);
    });

    describe('when a queued build for the branch exists', () => {
      it('should not create a new build', async () => {
        const user = await factory.user();
        const site = await factory.site({ users: [user] });
        await Build.create({
          site: site.id,
          user: user.id,
          branch: 'main',
          requestedCommitSha: 'a172b66a31319d456a448041a5b3c2a70c32d8b7',
          state: 'queued',
          token: 'token',
          username: user.username,
        }, { hooks: false });

        const numBuildsBefore = await Build.count({ where: { site: site.id, user: user.id } });

        expect(numBuildsBefore).to.eq(1);

        const payload = buildWebhookPayload(user, site);


        await Webhooks.pushWebhookRequest(payload);

        const numBuildsAfter = await Build.count({ where: { site: site.id, user: user.id } });

        expect(numBuildsAfter).to.eq(1);
      });

      it('should update the requestedCommitSha and user of build', async () => {
        const branch = 'main';
        const origSha = 'aaa2b66a31319d456a448041a5b3c2a70c32d8b7';
        const userProms = Promise.all([factory.user(), factory.user()]);
        const site = await factory.site({ users: userProms });
        const [user1, user2] = await userProms;
        await Build.create({
          site: site.id,
          user: user1.id,
          branch,
          requestedCommitSha: origSha,
          state: 'queued',
          token: 'token',
          username: user1.username,
        }, { hooks: false });

        const numBuildsBefore = await Build.count({ where: { site: site.id, branch } });

        expect(numBuildsBefore).to.eq(1);

        const payload = buildWebhookPayload(user2, site);


        await Webhooks.pushWebhookRequest(payload);

        const build = await Build.findOne({ where: { site: site.id, branch }, include: [User] });

        expect(build.requestedCommitSha).to.eq(payload.after);
        expect(build.user).to.eq(user2.id);
      });

      it('should report the status of the new build to GitHub', async () => {
        nock.cleanAll();
        const statusNock = githubAPINocks.status({ state: 'pending' });

        const userProm = factory.user();
        const site = await factory.site({ users: Promise.all([userProm]) });
        const user = await userProm;
        await Build.create({
          site: site.id,
          user: user.id,
          branch: 'main',
          requestedCommitSha: 'a172b66a31319d456a448041a5b3c2a70c32d8b7',
          state: 'queued',
          token: 'token',
          username: user.username,
        }, { hooks: false });

        const payload = buildWebhookPayload(user, site);
        payload.repository.full_name = `${site.owner.toUpperCase()}/${site.repository.toUpperCase()}`;


        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });

        await Webhooks.pushWebhookRequest(payload);

        expect(statusNock.isDone()).to.be.true;
      });
    });

    describe('when a created build for the branch exists', () => {
      it('should not create a new build', async () => {
        const userProm = factory.user();
        const site = await factory.site({ users: Promise.all([userProm]) });
        const user = await userProm;
        await Build.create({
          site: site.id,
          user: user.id,
          branch: 'main',
          requestedCommitSha: 'a172b66a31319d456a448041a5b3c2a70c32d8b7',
          state: 'created',
          token: 'token',
          username: user.username,
        }, { hooks: false });

        const numBuildsBefore = await Build.count({ where: { site: site.id, user: user.id } });

        expect(numBuildsBefore).to.eq(1);

        const payload = buildWebhookPayload(user, site);


        await Webhooks.pushWebhookRequest(payload);

        const numBuildsAfter = await Build.count({ where: { site: site.id, user: user.id } });

        expect(numBuildsAfter).to.eq(1);
      });

      it('should update the requestedCommitSha and user of build', async () => {
        const branch = 'main';
        const origSha = 'aaa2b66a31319d456a448041a5b3c2a70c32d8b7';
        const userProms = Promise.all([factory.user(), factory.user()]);
        const site = await factory.site({ users: userProms });
        const [user1, user2] = await userProms;
        await Build.create({
          site: site.id,
          user: user1.id,
          branch,
          requestedCommitSha: origSha,
          state: 'created',
          token: 'token',
          username: user1.username,
        }, { hooks: false });

        const numBuildsBefore = await Build.count({ where: { site: site.id, branch } });

        expect(numBuildsBefore).to.eq(1);

        const payload = buildWebhookPayload(user2, site);


        await Webhooks.pushWebhookRequest(payload);

        const build = await Build.findOne({ where: { site: site.id, branch }, include: [User] });

        expect(build.requestedCommitSha).to.eq(payload.after);
        expect(build.user).to.eq(user2.id);
      });

      it('should report the status of the new build to GitHub', async () => {
        nock.cleanAll();
        const statusNock = githubAPINocks.status({ state: 'pending' });

        const userProm = factory.user();
        const site = await factory.site({ users: Promise.all([userProm]) });
        const user = await userProm;
        await Build.create({
          site: site.id,
          user: user.id,
          branch: 'main',
          requestedCommitSha: 'a172b66a31319d456a448041a5b3c2a70c32d8b7',
          state: 'created',
          token: 'token',
          username: user.username,
        }, { hooks: false });

        const payload = buildWebhookPayload(user, site);
        payload.repository.full_name = `${site.owner.toUpperCase()}/${site.repository.toUpperCase()}`;


        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });

        await Webhooks.pushWebhookRequest(payload);

        expect(statusNock.isDone()).to.be.true;
      });
    });
  });

  describe('organizationWebhookRequest', () => {
    it('should set a user to inActive if removed from federalist-users', (done) => {
      let user;
      let payload;

      factory.user({ isActive: true })
        .then((model) => {
          user = model;
          expect(user.isActive).to.be.true;
          payload = organizationWebhookPayload('member_removed', user.username);


          return Webhooks.organizationWebhookRequest(payload);
        })
        .then(() => user.reload())
        .then((model) => {
          user = model;
          expect(user.isActive).to.be.false;
          expect(auditStub.args[0][0]).to.equal(Event.labels.FEDERALIST_USERS_MEMBERSHIP);
          expect(auditStub.args[0][1].id).to.eql(user.id);
          done();
        });
    });
    it('should create a new user added to federalist-users', (done) => {
      const username = 'added_member';
      User.findOne({ where: { username } })
        .then((user) => {
          expect(user).to.be.null;
          const payload = organizationWebhookPayload('member_added', username);


          return Webhooks.organizationWebhookRequest(payload);
        })
        .then(() => User.findOne({ where: { username } }))
        .then((user) => {
          expect(user.isActive).to.be.true;
          expect(auditStub.args[0][0]).to.equal(Event.labels.FEDERALIST_USERS_MEMBERSHIP);
          expect(auditStub.args[0][1].id).to.eql(user.id);
          done();
        });
    });

    it('should set an existing user to Active if added to federalist-users', (done) => {
      let user;

      factory.user({ isActive: false})
        .then((model) => {
          user = model;
          expect(user.isActive).to.be.false;
          const payload = organizationWebhookPayload('member_added', user.username);


          return Webhooks.organizationWebhookRequest(payload);
        })
        .then(() => user.reload())
        .then((model) => {
          user = model;
          expect(user.isActive).to.be.true;
          expect(auditStub.args[0][0]).to.equal(Event.labels.FEDERALIST_USERS_MEMBERSHIP);
          expect(auditStub.args[0][1].id).to.eql(user.id);
          done();
        })
        .catch(done);
    });

    it('should do nothing if org webhook for non added/removed_member', async () => {
      const user = User.build({ username: 'rando-user' })
      const payload = organizationWebhookPayload('member_invited', user.username);


      await Webhooks.organizationWebhookRequest(payload);

      expect(auditStub.notCalled).to.be.true;
    });

    it('should do nothing if org webhook for removal of non-existent user', (done) => {
      let payload;
      let origUserCount;
      payload = organizationWebhookPayload('member_removed', 'rando-user');

      User.count()
        .then((count) => {
          origUserCount = count;
          return Webhooks.organizationWebhookRequest(payload);
        })
        .then(() => {
          expect(auditStub.notCalled).to.be.true;
          return User.count();
        })
        .then((count) => {
          expect(count).to.equal(origUserCount);
          done()
        });
    });

    it('should do nothing if not federalist-org webhook', (done) => {
      factory.user({ isActive: true })
        .then((user) => {
          const payload = organizationWebhookPayload('member_removed', user.username, 'not-federalist-users');

          return Webhooks.organizationWebhookRequest(payload);
        })
        .then(() => {
          expect(auditStub.notCalled).to.be.true;
          done();
        });
    });

    it('should do nothing if action not added, removed nor invited', (done) => {
      factory.user({ isActive: true })
        .then((user) => {
          expect(user.isActive).to.be.true;
          const payload = organizationWebhookPayload('member_ignored_action', user.username);


          return Webhooks.organizationWebhookRequest(payload);
        })
        .then(() => {
          expect(auditStub.notCalled).to.be.true;
          done();
        });
    });

    it('should do nothing if the user has a uaa identity', async () => {
      const isActive = false;
      const user = await factory.user({ isActive });
      await user.createUAAIdentity({
        uaaId: `${user.username}-placeholder-id`,
        email: `${user.username}@example.com`,
        userName: `${user.username}@example.com`,
        origin: 'example.com',
      });

      const payload = organizationWebhookPayload('member_added', user.username);

      await Webhooks.organizationWebhookRequest(payload);

      await user.reload();

      expect(user.isActive).to.be.false;
    });
  });
});
