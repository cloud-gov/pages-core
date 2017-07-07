const expect = require('chai').expect;
const factory = require('../../support/factory');

const authorizer = require('../../../../api/authorizers/build.js');

describe('Build authorizer', () => {
  describe('findOne(user, build)', () => {
    it("should resolve if the build is associated with one of the user's site", (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm]) });
      const buildProm = factory.build({ siteProm });

      Promise.props({ user: userProm, site: siteProm, build: buildProm })
        .then(({ user, build }) => {
          authorizer.findOne(user, build);
        }).then(() => {
          done();
        }).catch(done);
    });

    it("should reject if the build is not associated with one of the user's sites", (done) => {
      Promise.props({
        user: factory.user(),
        build: factory.build(),
      })
      .then(({ user, build }) => authorizer.findOne(user, build))
      .then(() => {
        done(new Error('Expected authorization error'));
      })
      .catch((err) => {
        expect(err).to.equal(403);
        done();
      })
      .catch(done);
    });

    it("should reject if the build is not associated with one of the user's site even if the user started the build", (done) => {
      const userProm = factory.user();
      const buildProm = factory.build({ user: userProm, site: factory.site() });

      Promise.props({ user: userProm, build: buildProm })
      .then(({ user, build }) => authorizer.findOne(user, build))
      .then(() => {
        done(new Error('Expected authorization error'));
      })
      .catch((err) => {
        expect(err).to.equal(403);
        done();
      })
      .catch(done);
    });
  });

  describe('create(user, params)', () => {
    it("should resolve if the build is associated with one of the user's site", (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm]) });

      Promise.props({ user: userProm, site: siteProm })
        .then(({ user, site }) => authorizer.create(user, { user: user.id, site: site.id }))
        .then(() => {
          done();
        })
        .catch(done);
    });

    it("should reject if the build is not associated with one of the user's sites", (done) => {
      const userProm = factory.user();
      const authorizedSiteProm = factory.site({ users: Promise.all([userProm]) });
      const notAuthorizedSiteProm = factory.site();

      Promise.props({
        user: userProm,
        authorizedSite: authorizedSiteProm,
        notAuthorizedSite: notAuthorizedSiteProm,
      }).then(({ user, notAuthorizedSite }) =>
        authorizer.create(user, { user: user.id, site: notAuthorizedSite.id })
      )
      .then(() => {
        done(new Error('Expected authorization error'));
      })
      .catch((err) => {
        expect(err).to.equal(403);
        done();
      })
      .catch(done);
    });

    it('should reject if the build is not associated with the current user', (done) => {
      const userProm = factory.user();
      const otherUserProm = factory.user();
      const siteProm = factory.site({ users: Promise.all([userProm, otherUserProm]) });
      Promise.props({ user: userProm, otherUser: otherUserProm, site: siteProm })
        .then(({ user, otherUser, site }) =>
          authorizer.create(user, { user: otherUser.id, site: site.id })
        )
        .then(() => {
          done(new Error('Expected authorization error'));
        })
        .catch((err) => {
          expect(err).to.equal(403);
          done();
        })
        .catch(done);
    });
  });
});
