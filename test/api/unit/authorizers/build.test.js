const expect = require('chai').expect;
const factory = require('../../support/factory');
const authorizer = require('../../../../api/authorizers/build');
const buildErrors = require('../../../../api/responses/buildErrors');

const expectedUnauthorizedError = {
  status: 403,
  message: buildErrors.UNABLE_TO_BUILD,
};
const validateUnauthorizedError = (actual, done) => {
  expect(actual).to.deep.equal(expectedUnauthorizedError);
  done();
};

describe('Build authorizer', () => {
  describe('findOne(user, build)', () => {
    it("should resolve if the build is associated with one of the user's site", (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm]) });
      const buildProm = factory.build({ user: userProm, site: siteProm });

      Promise.props({ user: userProm, site: siteProm, build: buildProm })
        .then(({ user, build, site }) =>
          authorizer.findOne(user, { buildId: build.id, siteId: site.id })
        ).then((build) => {
          expect(build).to.exist;
          done();
        }).catch(done);
    });

    it("should reject if the build is not associated with one of the user's sites", (done) => {
      Promise.props({
        user: factory.user(),
        build: factory.build(),
      })
      .then(({ user, build }) => authorizer.findOne(user, { buildId: build.id, siteId: 1 }))
      .then(() => {
        done(new Error('Expected authorization error'));
      })
      .catch((err) => {
        validateUnauthorizedError(err, done);
      });
    });

    it('should reject if the build is not associated with one of the user\'s site even if the user started the build', (done) => {
      const userProm = factory.user();
      const buildProm = factory.build({ user: userProm, site: factory.site() });

      Promise.props({ user: userProm, build: buildProm })
      .then(({ user, build }) => authorizer.findOne(user, { buildId: build.id, siteId: 1 }))
      .then(() => {
        done(new Error('Expected authorization error'));
      })
      .catch((err) => {
        validateUnauthorizedError(err, done);
      });
    });
  });

  describe('create(user, params)', () => {
    it('should resolve if the build is associated with one of the user\'s site', (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm]) });
      const buildPromise = factory.build({ site: siteProm, user: userProm });

      Promise.props({
        user: userProm,
        site: siteProm,
        build: buildPromise,
      })
      .then(({ user, site, build }) =>
        authorizer.create(user, { buildId: build.id, siteId: site.id }))
      .then((build) => {
        expect(build).to.exist;
        done();
      })
      .catch(done);
    });

    it('should reject if the build is not associated with one of the user\'s sites', (done) => {
      const userProm = factory.user();
      const sitePromise = factory.site();
      const buildPromise = factory.build({ site: sitePromise });

      Promise.props({
        user: userProm,
        site: sitePromise,
        build: buildPromise,
      }).then(({ user, site, build }) =>
        authorizer.create(user, { buildId: build.id, siteId: site.id })
      )
      .then(() => {
        done(new Error('Expected authorization error'));
      })
      .catch((err) => {
        validateUnauthorizedError(err, done);
      });
    });

    it('should reject if the build is not associated with the current user', (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm]) });
      const buildProm = factory.build();
      Promise.props({ user: userProm, build: buildProm, site: siteProm })
        .then(({ user, build, site }) =>
          authorizer.create(user, { buildId: build.id, siteId: site.id })
        )
        .then(() => {
          done(new Error('Expected authorization error'));
        })
        .catch((err) => {
          validateUnauthorizedError(err, done);
        });
    });
  });
});
