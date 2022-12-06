const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const {
  BuildLog, Organization, OrganizationRole, User, Role,
} = require('../../../api/models');

function clean() {
  return Promise.all([
    Organization.truncate({ force: true, cascade: true }),
    OrganizationRole.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('Build Log API', () => {
  let userRole;
  let managerRole;

  before(async () => {
    await clean();
    [userRole, managerRole] = await Promise.all([
      Role.findOne({ where: { name: 'user' } }),
      Role.findOne({ where: { name: 'manager' } }),
    ]);
  });

  afterEach(clean);

  describe('GET /v0/build/:build_id/log', () => {
    it('should require authentication', (done) => {
      factory.buildLog().then(buildLog => request(app)
        .get(`/v0/build/${buildLog.build}/log`)
        .expect(403)).then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 403, response.body);
          done();
        }).catch(done);
    });

    describe('successfully fetching build logs', () => {
      const prepareAndFetchLogData = () => {
        const userPromise = factory.user();
        const sitePromise = factory.site({ users: Promise.all([userPromise]) });
        const buildPromise = factory.build({ user: userPromise, site: sitePromise });

        return Promise.props({ user: userPromise, site: sitePromise, build: buildPromise })
          .then(({ build, user }) => Promise.all([
            BuildLog.bulkCreate(
              Array(2000).fill(0).map(() => ({
                output: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fringilla, arcu ut ultricies auctor, elit quam consequat neque, eu blandit metus lorem non turpis.',
                source: 'ALL',
                build: build.id,
              }))
            ),
            authenticatedSession(user),
          ])).then(([logs, cookie]) => {
            const buildId = logs[0].get({ plain: true }).build;

            return request(app)
              .get(`/v0/build/${buildId}/log`)
              .set('Cookie', cookie)
              .expect(200);
          });
      };

      const expectedResponse = (response, done) => {
        validateAgainstJSONSchema('GET', '/build/{build_id}/log', 200, response.body);
        expect(response.body).to.be.an('object');
        expect(response.body).to.have.keys([
          'build',
          'state',
          'origin',
          'offset',
          'output_count',
          'output'
        ]);
        expect(response.body.state).to.be.oneOf(['success', 'created', 'error'])
        expect(response.body.origin).to.equal('database');
        expect(response.body.offset).to.equal(0);
        expect(response.body.output_count).to.equal('1000');
        expect(response.body.output).to.have.length(1000);
        done();
      };

      it('should render builds logs for the given build', (done) => {
        prepareAndFetchLogData()
          .then(response => expectedResponse(response, done))
          .catch(done);
      });

      it('should render logs if user is not associated to the build', (done) => {
        prepareAndFetchLogData()
          .then(response => expectedResponse(response, done))
          .catch(done);
      });
    });

    describe('successfully handling organization build logs', () => {
      it('should accept organization user build log requests', async () => {
        const user = await factory.user();
        const orgUser = await factory.user();
        const org = await factory.organization.create();
        const site = await factory.site({ users: [user], organizationId: org.id });
        const build = await factory.build({ user, site: site.id });

        await org.addUser(orgUser, { through: { roleId: userRole.id } });

        const logs = await BuildLog.bulkCreate(
          Array(20).fill(0).map(() => ({
            output: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fringilla, arcu ut ultricies auctor, elit quam consequat neque, eu blandit metus lorem non turpis.',
            source: 'ALL',
            build: build.id,
          }))
        );

        await authenticatedSession(orgUser).then((cookie) => {
          const buildId = logs[0].get({ plain: true }).build;

          return request(app)
            .get(`/v0/build/${buildId}/log`)
            .set('Cookie', cookie)
            .expect(200);
        });
      });

      it('should reject non-organization user build log requests', async () => {
        const user = await factory.user();
        const nonOrgUser = await factory.user();
        const org = await factory.organization.create();
        const site = await factory.site({ users: [user], organizationId: org.id });
        const build = await factory.build({ user, site: site.id });

        const logs = await BuildLog.bulkCreate(
          Array(20).fill(0).map(() => ({
            output: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fringilla, arcu ut ultricies auctor, elit quam consequat neque, eu blandit metus lorem non turpis.',
            source: 'ALL',
            build: build.id,
          }))
        );

        await authenticatedSession(nonOrgUser).then((cookie) => {
          const buildId = logs[0].get({ plain: true }).build;

          return request(app)
            .get(`/v0/build/${buildId}/log`)
            .set('Cookie', cookie)
            .expect(404);
        });
      });
    });

    it("should respond with a 404 if the given build is not associated with one of the user's sites", (done) => {
      let build;

      factory.build().then((model) => {
        build = model;

        return Promise.all(Array(3).fill(0).map(() => factory.buildLog()));
      })
        .then(() => factory.user()).then(user => authenticatedSession(user))
        .then(cookie => request(app)
          .get(`/v0/build/${build.id}/log`)
          .set('Cookie', cookie)
          .expect(404))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should response with a 404 if the given build does not exist', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/v0/build/fake-id/log')
          .set('Cookie', cookie)
          .expect(404))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/log', 404, response.body);
          done();
        })
        .catch(done);
    });

    it('should response with a 404 if the given build does not exist', (done) => {
      authenticatedSession()
        .then(cookie => request(app)
          .get('/v0/build/-100/log')
          .set('Cookie', cookie)
          .expect(404))
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
        const user = await factory.user();
        const site = await factory.site({ users: [user] });
        cookie = await authenticatedSession(user);
        build = await factory.build({ user, site });
      });

      it('only returns new build logs if source=`ALL` exists', async () => {
        const numLogs = 3;

        await Promise.all([
          ...Array(numLogs).fill(0).map(() => factory.buildLog({ build, source: 'foobar' })),
          ...Array(numLogs).fill(0).map(() => factory.buildLog({ build, source: 'ALL' })),
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

        await factory.bulkBuildLogs((1000 + numLogs), { buildId: build.id, source: 'ALL' });

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
