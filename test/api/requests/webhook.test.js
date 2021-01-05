const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { Build, Site, User, Event } = require('../../../api/models');
const SQS = require('../../../api/services/SQS');
const EventCreator = require('../../../api/services/EventCreator');
const GithubBuildHelper = require('../../../api/services/GithubBuildHelper');

describe('Webhook API', () => {
  const signWebhookPayload = (payload) => {
    const { secret } = config.webhook;
    const blob = JSON.stringify(payload);
    return `sha1=${crypto.createHmac('sha1', secret).update(blob).digest('hex')}`;
  };

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
  let warnStub;
  beforeEach(() => {
    errorStub = sinon.stub(EventCreator, 'error').resolves();
    auditStub = sinon.stub(EventCreator, 'audit').resolves();
    warnStub = sinon.stub(EventCreator, 'warn').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });
  
  describe('POST /webhook/github', () => {
    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.status();
      githubAPINocks.repo({ response: [201, { permissions: { admin: false, push: true } }] });
      sinon.stub(SQS, 'sendBuildMessage').resolves();
    });

    it('should create a new site build for the sender', async () => {
      let builds;
      const user = await factory.user();
      const site = await factory.site({ users: [user] });
      builds = await Build.findAll({ where: { site: site.id, user: user.id } });
      expect(builds).to.have.length(0);

      const payload = buildWebhookPayload(user, site);
      const signature = signWebhookPayload(payload);

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);
      builds = await Build.findAll({
        where: {
          site: site.id,
          user: user.id,
          branch: payload.ref.split('/')[2],
          requestedCommitSha: payload.after,
        },
      });
        
      expect(builds).to.have.length(1);
        
    });

    it('should not create a user associated with the site for the sender if no user exists', async () => {
      const username = crypto.randomBytes(3).toString('hex');

      const site = await factory.site();
      const payload = buildWebhookPayload({ username }, site);
      const signature = signWebhookPayload(payload);

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);

        const build = await Build.findOne({ where: { username }, limit: 1, order: [ [ 'createdAt', 'DESC' ]], include: [User] });
        expect(build.username).to.equal(username);
        expect(build.User).to.be.null;
    });

    it('should find the site by the lowercased owner and repository and upper cased github user', async () => {
      const reporterSpy = sinon.spy(GithubBuildHelper, 'reportBuildStatus');
      const user = await factory.user();
      const site = await factory.site({ users: [user] });

      user.username = user.username.toUpperCase();

      const payload = buildWebhookPayload(user, site);
      payload.repository.full_name = `${site.owner.toUpperCase()}/${site.repository.toUpperCase()}`;
      const signature = signWebhookPayload(payload);
      expect(reporterSpy.calledOnce).to.be.false;

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);

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
          const signature = signWebhookPayload(payload);

          githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            username: user.username,
          });

          return request(app)
            .post('/webhook/github')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
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
      let builds = await Build.findAll({ where: { site: site.id, user: user.id } });
      expect(builds).to.have.length(0);

      const payload = buildWebhookPayload(user, site);
      payload.commits = [];
      const signature = signWebhookPayload(payload);

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);
      builds = await Build.findAll({ where: { site: site.id, user: user.id } });
      expect(builds).to.have.length(0);
    });

    it('should respond with a 200 if the site does not exist on Federalist', async () => {
      const user = await factory.user();
      const payload = buildWebhookPayload(user, {
        owner: user.username,
        repository: 'fake-repo-name',
      });
      const startCount = await Build.count();
      const signature = signWebhookPayload(payload);

      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);
        const endCount = await Build.count();
        expect(endCount).to.equal(startCount);
        expect(warnStub.calledOnce).to.be.true;
    });

    it('should respond with a 200 if the site is inactive on Federalist', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: [user], buildStatus: 'inactive' });
      const payload = buildWebhookPayload(user, {
        owner: site.owner,
        repository: site.repository,
      });
      const signature = signWebhookPayload(payload);
      const startCount = await Build.count();
      await request(app)
        .post('/webhook/github')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200);

        const endCount = await Build.count();
        expect(endCount).to.equal(startCount);
    });

    it('should respond with a 400 if the signature is invalid', (done) => {
      let site;

      factory.site()
        .then(s => Site.findByPk(s.id, { include: [User] }))
        .then((model) => {
          site = model;

          const payload = buildWebhookPayload(site.Users[0], site);
          const signature = '123abc';

          request(app)
            .post('/webhook/github')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(400, done);
        })
        .catch(done);
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
        const signature = signWebhookPayload(payload);

        await request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(200);

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
        const signature = signWebhookPayload(payload);

        await request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(200);

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
        const signature = signWebhookPayload(payload);

        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });

        await request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(200);

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
        const signature = signWebhookPayload(payload);

        await request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(200);

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
        const signature = signWebhookPayload(payload);

        await request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(200);

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
        const signature = signWebhookPayload(payload);

        githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });

        await request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(200);

        expect(statusNock.isDone()).to.be.true;
      });
    });
  });
  describe('POST /webhook/organization', () => {
    it('should set a user to inActive if removed from federalist-users', (done) => {
      let user;
      let payload;

      factory.user({ isActive: true })
        .then((model) => {
          user = model;
          expect(user.isActive).to.be.true;
          payload = organizationWebhookPayload('member_removed', user.username);
          const signature = signWebhookPayload(payload);

          return request(app)
            .post('/webhook/organization')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
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
          const signature = signWebhookPayload(payload);

          return request(app)
            .post('/webhook/organization')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
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
          const signature = signWebhookPayload(payload);

          return request(app)
            .post('/webhook/organization')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
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

    it('should do nothing if org webhook for non added/removed_member', (done) => {
      let payload;
      const user = User.build({ username: 'rando-user' })
      payload = organizationWebhookPayload('member_invited', user.username);
      const signature = signWebhookPayload(payload);

      request(app)
        .post('/webhook/organization')
        .send(payload)
        .set({
          'X-GitHub-Event': 'push',
          'X-Hub-Signature': signature,
          'X-GitHub-Delivery': '123abc',
        })
        .expect(200)
        .then(() => {
          expect(auditStub.notCalled).to.be.true;
          done()
        });
    });

    it('should do nothing if org webhook for removal of non-existent user', (done) => {
      let payload;
      let origUserCount;
      payload = organizationWebhookPayload('member_removed', 'rando-user');
      const signature = signWebhookPayload(payload);
      User.count()
        .then((count) => {
          origUserCount = count;
          return request(app)
            .post('/webhook/organization')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
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
          const signature = signWebhookPayload(payload);
          return request(app)
            .post('/webhook/organization')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
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
          const signature = signWebhookPayload(payload);

          return request(app)
            .post('/webhook/organization')
            .send(payload)
            .set({
              'X-GitHub-Event': 'push',
              'X-Hub-Signature': signature,
              'X-GitHub-Delivery': '123abc',
            })
            .expect(200);
        })
        .then(() => {
          expect(auditStub.notCalled).to.be.true;
          done();
        });
    });
  });
});
