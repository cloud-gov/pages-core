const crypto = require('crypto');
const expect = require('chai').expect;
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const SiteCreator = require('../../../../api/services/SiteCreator');
const { Build, Site, User } = require('../../../../api/models');

describe('SiteCreator', () => {
  describe('.createSite', () => {
    context('from a GitHub repo', () => {
      let user;
      let webhookNock;

      const validateSiteExpectations = (params, site) => {
        expect(site).to.not.be.undefined;
        expect(site.owner).to.equal(params.owner);
        expect(site.repository).to.equal(params.repository);
        expect(site.Users).to.have.length(1);
        expect(site.Users[0].id).to.equal(user.id);

        expect(site.Builds).to.have.length(1);
        expect(site.Builds[0].user).to.equal(user.id);

        expect(webhookNock.isDone()).to.equal(true);
      };

      const afterCreateSite = (owner, repository) =>
        Site.findOne({
          where: {
            owner,
            repository,
          },
          include: [User, Build],
        });

      const setupWebhook = (accessToken, owner, repo) =>
        githubAPINocks.webhook({
          accessToken,
          owner,
          repo,
        });

      context('when the owner of the repo is an authorized federalist org', () => {
        it('creates new site record for the given repository, adds the user, webhook, and build', (done) => {
          const siteParams = {
            owner: crypto.randomBytes(3).toString('hex'),
            repository: crypto.randomBytes(3).toString('hex'),
          };

          factory.user().then((model) => {
            user = model;
            githubAPINocks.repo();

            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [{ login: siteParams.owner }],
            });

            webhookNock = setupWebhook(
              user.githubAccessToken,
              siteParams.owner,
              siteParams.repository
            );

            return SiteCreator.createSite({ user, siteParams });
          })
          .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
          .then((site) => {
            validateSiteExpectations(siteParams, site);
            done();
          })
          .catch(done);
        });
      });

      context('when the user that owns the repo is a federalist user', () => {
        it('creates new site record for the given repository, adds the user, webhook, and build', (done) => {
          const siteParams = {
            repository: crypto.randomBytes(3).toString('hex'),
          };

          factory.user().then((model) => {
            user = model;
            siteParams.owner = user.username;

            githubAPINocks.repo();
            webhookNock = setupWebhook(
              user.githubAccessToken,
              siteParams.owner,
              siteParams.repository
            );

            return SiteCreator.createSite({ user, siteParams });
          })
          .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
          .then((site) => {
            validateSiteExpectations(siteParams, site);
            done();
          })
          .catch(done);
        });
      });

      it('should reject if the user does not have admin access to the site', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
        };

        factory.user().then((model) => {
          user = model;
          githubAPINocks.repo({
            accessToken: user.accessToken,
            owner: siteParams.owner,
            repo: siteParams.repository,
            response: [200, { permissions: {
              admin: false,
              push: true,
            } }],
          });
          return SiteCreator.createSite({ user, siteParams });
        }).catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('You do not have admin access to this repository');
          done();
        });
      });

      it('should reject if the site already exists in Federalist', (done) => {
        Promise.props({ site: factory.site(), user: factory.user() })
        .then((values) => {
          const siteParams = {
            owner: values.site.owner,
            repository: values.site.repository,
          };
          return SiteCreator.createSite({ user: values.user, siteParams });
        }).catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('This site has already been added to Federalist.');
          done();
        }).catch(done);
      });

      it('should reject if the GitHub repository does not exist', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
        };

        factory.user().then((model) => {
          user = model;
          githubAPINocks.repo({
            accessToken: user.accessToken,
            org: siteParams.owner,
            repo: siteParams.repository,
            response: [404, { message: 'Not Found' }],
          });
          return SiteCreator.createSite({ user, siteParams });
        }).catch((err) => {
          expect(err.status).to.eq(400);
          expect(err.message).to.eq(`The repository ${siteParams.owner}/${siteParams.repository} does not exist.`);
          done();
        }).catch(done);
      });

      it('rejects if the org that owns the repo has not authorized federalist', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
        };

        factory.user()
        .then((model) => {
          user = model;
          githubAPINocks.repo();
          githubAPINocks.userOrganizations({
            accessToken: user.githubAccessToken,
          });

          return SiteCreator.createSite({ user, siteParams });
        })
        .catch((err) => {
          const expectedError = `Organization '${siteParams.owner}' hasn't approved access for Federalist. Ask an owner to authorize it.`;

          expect(err.message).to.equal(expectedError);
          expect(err.status).to.equal(403);
          done();
        });
      });
    });

    context('when the site is created from a template', () => {
      it('should create a new site record for the given repository and add the user', (done) => {
        let user;
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          template: 'team',
        };

        factory.user().then((model) => {
          user = model;
          githubAPINocks.createRepoForOrg();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ user, siteParams });
        }).then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.owner).to.equal(siteParams.owner);
          expect(site.repository).to.equal(siteParams.repository);

          return Site.findOne({
            where: {
              owner: siteParams.owner,
              repository: siteParams.repository,
            },
            include: [User],
          });
        }).then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.Users).to.have.length(1);
          expect(site.Users[0].id).to.equal(user.id);
          done();
        })
        .catch(done);
      });

      it('should use jekyll as the build engine', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          template: 'team',
        };

        factory.user().then((user) => {
          githubAPINocks.createRepoForOrg();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ siteParams, user });
        }).then((site) => {
          expect(site.engine).to.equal('jekyll');
          done();
        }).catch(done);
      });

      it('should trigger a build that pushes the source repo to the destiantion repo', (done) => {
        let user;
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          template: 'team',
        };

        factory.user().then((model) => {
          user = model;
          githubAPINocks.createRepoForOrg();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ siteParams, user });
        }).then(site => Site.findById(site.id, { include: [Build] })).then((site) => {
          expect(site.Builds).to.have.length(1);
          expect(site.Builds[0].user).to.equal(user.id);
          expect(site.Builds[0].branch).to.equal('master');
          expect(site.Builds[0].source).to.deep.equal({
            repository: 'federalist-modern-team-template',
            owner: '18f',
          });
          done();
        })
        .catch(done);
      });

      it('should create a webhook for the new site', (done) => {
        let webhookNock;
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          template: 'team',
        };

        factory.user().then((user) => {
          githubAPINocks.createRepoForOrg();
          webhookNock = githubAPINocks.webhook({
            accessToken: user.githubAccessToken,
            owner: siteParams.owner,
            repo: siteParams.repository,
          });
          return SiteCreator.createSite({ user, siteParams });
        }).then(() => {
          expect(webhookNock.isDone()).to.equal(true);
          done();
        }).catch(done);
      });

      it('should reject if the repo already exists on GitHub', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          template: 'team',
        };

        factory.user().then((user) => {
          githubAPINocks.createRepoForOrg({
            accessToken: user.accessToken,
            org: siteParams.owner,
            repo: siteParams.repository,
            response: [422, {
              errors: [{ message: 'name already exists on this account' }],
            }],
          });
          return SiteCreator.createSite({ user, siteParams });
        }).catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('A repo with that name already exists.');
          done();
        }).catch(done);
      });

      it('should reject if the template does not exist', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          template: 'not-a-template',
        };

        factory.user().then(user =>
          SiteCreator.createSite({ user, siteParams })
        ).catch((err) => {
          expect(err.status).to.eq(400);
          expect(err.message).to.eq('No such template: not-a-template');
          done();
        }).catch(done);
      });
    });
  });
});
