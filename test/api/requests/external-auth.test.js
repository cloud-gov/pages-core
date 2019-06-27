const { expect } = require('chai');
const request = require('supertest');
const githubAPINocks = require('../support/githubAPINocks');
const { sessionForCookie } = require('../support/cookieSession');
const { unauthenticatedSession } = require('../support/session');
const app = require('../../../app');
const factory = require('../support/factory');
const config = require('../../../config');
const { generateS3ServiceName } = require('../../../api/utils');

describe('External authentication request', () => {
  describe('GET /external/auth/github', () => {
    it('should redirect to GitHub for OAuth2 authentication', (done) => {
      const siteId = 'cg.test1-site.gov';
      const domain = `https://${siteId}`;
      const repository = 'repo1'
      const owner = 'owner1'
      const s3ServiceName =  `owner-${owner}-repo-${repository}`;
      factory.site({
        repository,
        owner,
        domain,
        s3ServiceName,
        users: Promise.all([factory.user()]),
      })
      .then(() => {
        request(app)
          .get(`/external/auth/github?site_id=${siteId}`)
          .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
          .expect(302, done);
      });
    });

    it('should redirect to GitHub for OAuth2 authentication - demoDomain', (done) => {
      const siteId = 'cg.test4-site.gov';
      const demoDomain = `https://${siteId}`;
      const repository = 'repo2'
      const owner = 'owner2'
      const s3ServiceName =  `owner-${owner}-repo-${repository}`;
      factory.site({
        repository,
        owner,
        demoDomain,
        s3ServiceName,
        users: Promise.all([factory.user()]),
      })
      .then(() => {
        request(app)
          .get(`/external/auth/github?site_id=${siteId}`)
          .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
          .expect(302, done);
      });
    });

    it('should redirect to GitHub for OAuth2 authentication - bucketname', (done) => {
      const siteId = 'cg.test3-site.gov';
      const awsBucketName = 'cg';
      const repository = 'repo1'
      const owner = 'owner1'
      const s3ServiceName =  `owner-${owner}-repo-${repository}`;
      factory.site({
        repository,
        owner,
        s3ServiceName,
        awsBucketName,
        users: Promise.all([factory.user()]),
      })
      .then(() => {
        request(app)
          .get(`/external/auth/github?site_id=${siteId}`)
          .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize.*/)
          .expect(302, done);
      });
    });
  });

  it('should not redirect to GitHub for OAuth2 authentication shared bucket', (done) => {
    const siteId = 'test2-site.gov';
    const domain = `https://${siteId}`;
    const s3ServiceName = `federalist-${config.app.app_env}-s3`;
    factory.site({
      domain,
      s3ServiceName,
      users: Promise.all([factory.user()]),
    })
    .then(() => {
      request(app)
        .get(`/external/auth/github?site_id=${siteId}`)
        .expect(403, done);
    });
  });

  it('should not redirect to GitHub for OAuth2 authentication w/o site_id', (done) => {
    const repository = 'repo3'
    const owner = 'owner3'
    const s3ServiceName =  `owner-${owner}-repo-${repository}`;
    factory.site({
      repository,
      owner,
      s3ServiceName,
      users: Promise.all([factory.user()]),
    })
    .then(() => {
      request(app)
        .get('/external/auth/github')
        .expect(403, done);
    });
  });

  describe('GET /external/auth/github/callback', () => {
    it('return unauthorized if the user is not in a whitelisted GitHub organization', (done) => {
      githubAPINocks.githubAuth('unauthorized-user', [{ id: 654321 }]);
      request(app)
        .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
        .expect(401, done);
    });

    describe('when successful', () => {
      beforeEach(() => {
        githubAPINocks.githubAuth('user', [{ id: 123456 }]);
      });

      it('returns a script tag', (done) => {
        request(app)
          .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
          .expect((res) => {
            expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
          })
          .expect(200, done);
      });

      it('does not add the user to the session', (done) => {
        let cookie;
        unauthenticatedSession({ oauthState: 'state-123abc' })
          .then((session) => {
            cookie = session;
            return request(app)
              .get('/external/auth/github/callback?code=auth-code-123abc&state=state-123abc')
              .set('Cookie', cookie)
              .expect(200)
              .expect((res) => {
                expect(res.text.trim()).to.match(/^<script>(.|\n)*<\/script>$/g);
              });
          })
          .then(() => sessionForCookie(cookie))
          .then((session) => {
            expect(session.passport).to.be.empty;
            done();
          })
          .catch(done);
      });
    });
  });
});
