const expect = require('chai').expect;
const nock = require('nock');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const SiteMembershipCreator = require('../../../../api/services/SiteMembershipCreator');
const config = require('../../../../config');

describe('SiteMembershipCreator', () => {
  describe('.createSiteMembership({ siteParams, user })', () => {
    beforeEach(() => {
      githubAPINocks.repo({
        response: [
          200,
          {
            permissions: {
              admin: false,
              push: true,
            },
          },
        ],
      });
    });

    it('should add the user to the site', (done) => {
      let site;
      let user;

      Promise.props({
        userProm: factory.user(),
        siteProm: factory.site(),
      })
        .then(({ siteProm, userProm }) => {
          user = userProm;
          site = siteProm;

          return SiteMembershipCreator.createSiteMembership({
            user,
            siteParams: {
              owner: site.owner,
              repository: site.repository,
            },
          });
        })
        .then(() =>
          site.getUsers({
            where: {
              id: user.id,
            },
          }),
        )
        .then((users) => {
          expect(users).to.have.lengthOf(1);
          done();
        })
        .catch(done);
    });

    it('should reject with 404 if the site does not exist', (done) => {
      factory
        .user()
        .then((user) =>
          SiteMembershipCreator.createSiteMembership({
            user,
            siteParams: {
              owner: 'not-a',
              repository: 'real-site',
            },
          }),
        )
        .catch((err) => {
          expect(err.status).to.equal(404);
          expect(err.message).to.equal('The site you are trying to add does not exist');
          done();
        })
        .catch(done);
    });

    it('should reject if the user does not have write access to the site', (done) => {
      let site;
      let user;

      Promise.props({
        userProm: factory.user({
          githubAccessToken: 'mytoken',
        }),
        siteProm: factory.site(),
      })
        .then(({ siteProm, userProm }) => {
          user = userProm;
          site = siteProm;

          nock.cleanAll();
          githubAPINocks.repo({
            accessToken: user.githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: [
              200,
              {
                permissions: {
                  admin: false,
                  push: false,
                },
              },
            ],
          });

          githubAPINocks.getOrganizationMembers({
            accessToken: user.githubAccessToken,
            organization: 'federalist-users',
            role: 'admin',
          });
          githubAPINocks.getOrganizationMembers({
            accessToken: user.githubAccessToken,
            organization: 'federalist-users',
            role: 'admin',
            page: 2,
            response: [],
          });

          return SiteMembershipCreator.createSiteMembership({
            user,
            siteParams: {
              owner: site.owner,
              repository: site.repository,
            },
          });
        })
        .catch((err) => {
          expect(err.status).to.eq(400);
          expect(err.message).to.equal('You do not have write access to this repository');
          done();
        })
        .catch(done);
    });

    it('should reject if the user has already added the site', (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({
        users: Promise.all([userProm]),
      });

      Promise.props({
        user: userProm,
        site: siteProm,
      })
        .then(({ user, site }) =>
          SiteMembershipCreator.createSiteMembership({
            user,
            siteParams: {
              owner: site.owner,
              repository: site.repository,
            },
          }),
        )
        .catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal(
            `You've already added this site to ${config.app.appName}`,
          );
          done();
        })
        .catch(done);
    });

    it(`should reject if the user has already added the site
        and the name is different case`, (done) => {
      const userProm = factory.user();
      const siteProm = factory.site({
        users: Promise.all([userProm]),
      });

      Promise.props({
        user: userProm,
        site: siteProm,
      })
        .then(({ user, site }) =>
          SiteMembershipCreator.createSiteMembership({
            user,
            siteParams: {
              owner: site.owner.toUpperCase(),
              repository: site.repository.toUpperCase(),
            },
          }),
        )
        .catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal(
            `You've already added this site to ${config.app.appName}`,
          );
          done();
        })
        .catch(done);
    });

    it('should reject if the repository does not exist', (done) => {
      let site;

      Promise.props({
        user: factory.user(),
        site: factory.site(),
      })
        .then((models) => {
          site = models.site;

          nock.cleanAll();
          githubAPINocks.repo({
            accessToken: models.user.accessToken,
            owner: site.owner,
            repo: site.repository,
            response: [
              404,
              {
                message: 'Not Found',
              },
            ],
          });
          return SiteMembershipCreator.createSiteMembership({
            user: models.user,
            siteParams: {
              owner: site.owner.toUpperCase(),
              repository: site.repository.toUpperCase(),
            },
          });
        })
        .catch((err) => {
          expect(err.status).to.eq(400);
          expect(err.message).to.eq(
            `The repository ${site.owner}/${site.repository} does not exist.`,
          );
          done();
        })
        .catch(done);
    });
  });
});
