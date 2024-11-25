const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { createSiteUserOrg } = require('../support/site-user');
const { BuildLog, Organization, OrganizationRole, User } = require('../../../api/models');

function clean() {
  return Promise.all([
    Organization.truncate({
      force: true,
      cascade: true,
    }),
    OrganizationRole.truncate({
      force: true,
      cascade: true,
    }),
    User.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('Build Log API', () => {
  before(async () => {
    await clean();
  });

  afterEach(clean);

  describe('GET /v0/build/:build_id/log', () => {
    it('should require authentication', (done) => {
      factory
        .buildLog()
        .then((buildLog) =>
          request(app).get(`/v0/build/${buildLog.build}/log`).expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 403, response.body);
          done();
        })
        .catch(done);
    });

    describe('successfully fetching build logs', () => {
      it('should response with builds logs for the given build', async () => {
        const { site, user } = await createSiteUserOrg();
        const cookie = await authenticatedSession(user);
        const build = await factory.build({ user, site });

        const logs = await BuildLog.bulkCreate(
          Array(2000)
            .fill(0)
            .map(() => ({
              output:
                // eslint-disable-next-line max-len
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fringilla, arcu ut ultricies auctor, elit quam consequat neque, eu blandit metus lorem non turpis.',
              source: 'ALL',
              build: build.id,
            })),
        );

        const buildId = logs[0].get({
          plain: true,
        }).build;

        const response = await request(app)
          .get(`/v0/build/${buildId}/log`)
          .set('Cookie', cookie)
          .expect(200);

        validateAgainstJSONSchema('GET', '/build/{build_id}/log', 200, response.body);
        expect(response.body).to.be.an('object');
        expect(response.body).to.have.keys([
          'build',
          'state',
          'origin',
          'offset',
          'output_count',
          'output',
        ]);
        expect(response.body.state).to.be.oneOf(['success', 'created', 'error']);
        expect(response.body.origin).to.equal('database');
        expect(response.body.offset).to.equal(0);
        expect(response.body.output_count).to.equal('1000');
        expect(response.body.output).to.have.length(1000);
      });

      it('should reject non-organization user build log requests', async () => {
        const { site, user } = await createSiteUserOrg();
        const nonOrgUser = await factory.user();
        const build = await factory.build({
          user,
          site: site.id,
        });

        const logs = await BuildLog.bulkCreate(
          Array(20)
            .fill(0)
            .map(() => ({
              output:
                // eslint-disable-next-line max-len
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fringilla, arcu ut ultricies auctor, elit quam consequat neque, eu blandit metus lorem non turpis.',
              source: 'ALL',
              build: build.id,
            })),
        );

        await authenticatedSession(nonOrgUser).then((cookie) => {
          const buildId = logs[0].get({
            plain: true,
          }).build;

          return request(app)
            .get(`/v0/build/${buildId}/log`)
            .set('Cookie', cookie)
            .expect(404);
        });
      });
    });

    it(`should respond with a 404
        if the given build is not associated with one of the user's sites`, (done) => {
      let build;

      factory
        .build()
        .then((model) => {
          build = model;

          return Promise.all(
            Array(3)
              .fill(0)
              .map(() => factory.buildLog()),
          );
        })
        .then(() => factory.user())
        .then((user) => authenticatedSession(user))
        .then((cookie) =>
          request(app).get(`/v0/build/${build.id}/log`).set('Cookie', cookie).expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should response with a 404 if the given build does not exist', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app).get('/v0/build/fake-id/log').set('Cookie', cookie).expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should response with a 404 if the given build does not exist', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app).get('/v0/build/-100/log').set('Cookie', cookie).expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 404, response.body);
          done();
        })
        .catch(done);
    });

    describe('build logs with source =`ALL`', () => {
      let build;
      let cookie;

      beforeEach(async () => {
        const { site, user } = await createSiteUserOrg();
        cookie = await authenticatedSession(user);
        build = await factory.build({ user, site });
      });

      it('only returns new build logs if source=`ALL` exists', async () => {
        const numLogs = 3;

        await Promise.all([
          ...Array(numLogs)
            .fill(0)
            .map(() =>
              factory.buildLog({
                build,
                source: 'foobar',
              }),
            ),
          ...Array(numLogs)
            .fill(0)
            .map(() =>
              factory.buildLog({
                build,
                source: 'ALL',
              }),
            ),
        ]);

        const { body } = await request(app)
          .get(`/v0/build/${build.id}/log/offset/0`)
          .set('Cookie', cookie)
          .expect(200);

        validateAgainstJSONSchema('GET', '/build/{build_id}/log', 200, body);
        expect(body).to.be.an('object');
        expect(body.output).to.have.length(3);
      });

      it('paginates new build logs by groups of lines', async () => {
        const numLogs = 6;

        await factory.bulkBuildLogs(1000 + numLogs, {
          buildId: build.id,
          source: 'ALL',
        });

        let resp = await request(app)
          .get(`/v0/build/${build.id}/log/offset/0`)
          .set('Cookie', cookie)
          .expect(200);

        validateAgainstJSONSchema('GET', '/build/{build_id}/log', 200, resp.body);
        expect(resp.body).to.be.an('object');
        expect(resp.body.output).to.have.length(1000);

        resp = await request(app)
          .get(`/v0/build/${build.id}/log/offset/1000`)
          .set('Cookie', cookie)
          .expect(200);

        validateAgainstJSONSchema('GET', '/build/{build_id}/log', 200, resp.body);
        expect(resp.body).to.be.an('object');
        expect(resp.body.output).to.have.length(numLogs);

        resp = await request(app)
          .get(`/v0/build/${build.id}/log/offset/3000`)
          .set('Cookie', cookie)
          .expect(200);

        expect(resp.body).to.be.an('object');
        expect(resp.body.output).to.have.length(0);
      }).timeout(5000);
    });
  });
});
