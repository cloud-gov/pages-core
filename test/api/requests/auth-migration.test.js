const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const app = require('../../../app');
const AuthMigration = require('../../../api/services/AuthMigration');

const { authenticatedSession } = require('../support/session');
const { sessionForCookie, sessionCookieFromResponse } = require('../support/cookieSession');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');

async function expectFlash(response, key, message) {
  const cookie = sessionCookieFromResponse(response);
  const session = await sessionForCookie(cookie);

  expect(session.flash[key]).to.contain(message);
}

function itRequiresAuthentication(method, path) {
  it('requires authentication', async () => {
    const response = await request(app)[method](path)
      .expect(302)
      .expect('Location', '/');

    await expectFlash(response, 'error', 'You are not permitted to perform this action. Are you sure you are logged in?');
  });
}

describe('Auth Migration', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('/migrate/new', () => {
    itRequiresAuthentication('get', '/migrate/new');

    it('redirects to /sites if the user has a UAA identity', async () => {
      const user = await factory.user();
      await factory.uaaIdentity({ userId: user.id });

      const cookie = await authenticatedSession(user);
      await request(app)
        .get('/migrate/new')
        .set('Cookie', cookie)
        .expect(302)
        .expect('Location', '/sites');
    });

    it('renders the migrate page', async () => {
      const cookie = await authenticatedSession();
      await request(app)
        .get('/migrate/new')
        .set('Cookie', cookie)
        .expect(200)
        .expect(/Migrate to cloud.gov authentication/);
    });
  });

  describe('/migrate/create', () => {
    itRequiresAuthentication('post', '/migrate/create');

    it('requires csrf', async () => {
      const cookie = await authenticatedSession();

      await request(app)
        .post('/migrate/create')
        .set('Cookie', cookie)
        .expect(403);
    });

    it('redirects to /logout/github when the user has a UAA identity', async () => {
      const user = await factory.user();
      await factory.uaaIdentity({ userId: user.id });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .post('/migrate/create')
        .set('Cookie', cookie)
        .send(`_csrf=${csrfToken.getToken()}`)
        .expect(302)
        .expect('Location', '/logout/github');

      await expectFlash(response, 'error', 'You already have a cloud.gov account, please logout and log back in using cloud.gov authentication.');
    });

    it('redirects to /migrate/new when the `uaaEmail` field is missing', async () => {
      const cookie = await authenticatedSession();

      const response = await request(app)
        .post('/migrate/create')
        .set('Cookie', cookie)
        .send(`_csrf=${csrfToken.getToken()}`)
        .expect(302)
        .expect('Location', '/migrate/new');

      await expectFlash(response, 'error', 'Please provide a valid email address for your cloud.gov account.');
    });

    it('calls `migrateUser` with the user and uaaEmail', async () => {
      const uaaEmail = 'email@example.com';
      const user = await factory.user();
      const cookie = await authenticatedSession(user);

      sinon.stub(AuthMigration, 'migrateUser')
        .resolves();

      await request(app)
        .post('/migrate/create')
        .set('Cookie', cookie)
        .send(`_csrf=${csrfToken.getToken()}`)
        .send(`uaaEmail=${uaaEmail}`)
        .expect(302)
        .expect('Location', '/migrate/success');

      sinon.assert.calledOnceWithMatch(
        AuthMigration.migrateUser,
        sinon.match({ id: user.id }),
        uaaEmail
      );
    });
  });

  describe('/migrate/success', () => {
    itRequiresAuthentication('get', '/migrate/success');

    it('renders the success page', async () => {
      const user = await factory.user();
      await factory.uaaIdentity({ userId: user.id });
      const cookie = await authenticatedSession(user);

      await request(app)
        .get('/migrate/success')
        .set('Cookie', cookie)
        .expect(200)
        .expect(/You have successfully migrated to cloud.gov authentication/);
    });
  });
});
