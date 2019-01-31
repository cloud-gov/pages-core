const crypto = require('crypto');
const expect = require('chai').expect;
const nock = require('nock');
const request = require('supertest');
const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const { Build, Site, User } = require('../../../api/models');


describe('Webhook API', () => {
  const signWebhookPayload = (payload) => {
    const secret = config.webhook.secret;
    const blob = JSON.stringify(payload);
    return `sha1=${crypto.createHmac('sha1', secret).update(blob).digest('hex')}`;
  };

  const buildWebhookPayload = (user, site) => ({
    ref: 'refs/heads/master',
    commits: [{ id: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7' }],
    after: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
    sender: { login: user.username },
    repository: { full_name: `${site.owner}/${site.repository}` },
  });

  describe('POST /webhook/github', () => {
    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.status();
      githubAPINocks.repo({ response: [201, { permissions: { admin: false } }],
      });
    });

    it('should create a new site build for the sender', (done) => {
      let site;
      let user;
      let payload;

      factory.site()
        .then(s => Site.findById(s.id, { include: [User] }))
        .then((model) => {
          site = model;
          user = site.Users[0];
          return Build.findAll({ where: { site: site.id, user: user.id } });
        })
        .then((builds) => {
          expect(builds).to.have.length(0);

          payload = buildWebhookPayload(user, site);
          const signature = signWebhookPayload(payload);

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
        .then(() => Build.findAll({
          where: {
            site: site.id,
            user: user.id,
            branch: payload.ref.split('/')[2],
            commitSha: payload.after,
          },
        }))
        .then((builds) => {
          expect(builds).to.have.length(1);
          done();
        })
        .catch(done);
    });

    it('should create a user associated with the site for the sender if no user exists', (done) => {
      let site;
      const username = crypto.randomBytes(3).toString('hex');

      factory.site()
        .then((model) => {
          site = model;

          const payload = buildWebhookPayload({ username }, site);
          const signature = signWebhookPayload(payload);

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
        .then(response => Build.findById(response.body.id, { include: [User] }))
        .then((build) => {
          expect(build.User.username).to.equal(username);
          return User.findById(build.User.id, { include: [Site] });
        })
        .then((user) => {
          expect(user.Sites).to.have.length(1);
          expect(user.Sites[0].id).to.equal(site.id);
          done();
        })
        .catch(done);
    });

    it('should find the site by the lowercased owner and repository and upper cased github user', (done) => {
      let site;
      let user;
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });

      Promise.props({ user: userPromise, site: sitePromise })
        .then((models) => {
          site = models.site;
          user = models.user;
          user.username = user.username.toUpperCase();

          const payload = buildWebhookPayload(user, site);
          payload.repository.full_name = `${site.owner.toUpperCase()}/${site.repository.toUpperCase()}`;
          const signature = signWebhookPayload(payload);

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
        .then((response) => {
          expect(response.body.site.id).to.equal(site.id);
          done();
        })
        .catch(done);
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

    it('should not schedule a build if there are no new commits', (done) => {
      let site;
      let user;

      factory.site()
        .then(s => Site.findById(s.id, { include: [User] }))
        .then((model) => {
          site = model;
          user = site.Users[0];
          return Build.findAll({ where: { site: site.id, user: user.id } });
        })
        .then((builds) => {
          expect(builds).to.have.length(0);

          const payload = buildWebhookPayload(user, site);
          payload.commits = [];
          const signature = signWebhookPayload(payload);

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
        .then(() => Build.findAll({ where: { site: site.id, user: user.id } }))
        .then((builds) => {
          expect(builds).to.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if the site does not exist on Federalist', (done) => {
      factory.user().then((user) => {
        const payload = buildWebhookPayload(user, {
          owner: user.username,
          repository: 'fake-repo-name',
        });
        const signature = signWebhookPayload(payload);

        request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(400, done);
      }).catch(done);
    });

    it('should respond with a 400 if the site is inactive on Federalist', (done) => {
      let user;
      factory.user()
      .then((model) => {
        user = model;
        return factory.site({ users: [user], buildStatus: 'inactive' });
      })
      .then((site) => {
        const payload = buildWebhookPayload(user, {
          owner: site.owner,
          repository: site.repository,
        });
        const signature = signWebhookPayload(payload);

        request(app)
          .post('/webhook/github')
          .send(payload)
          .set({
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': signature,
            'X-GitHub-Delivery': '123abc',
          })
          .expect(400, done);
      }).catch(done);
    });

    it('should respond with a 400 if the signature is invalid', (done) => {
      let site;

      factory.site()
        .then(s => Site.findById(s.id, { include: [User] }))
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
  });
});
