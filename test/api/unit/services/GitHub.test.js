const expect = require('chai').expect;
const config = require('../../../../config');
const factory = require('../../support/factory');
const GitHub = require('../../../../api/services/GitHub');
const githubAPINocks = require('../../support/githubAPINocks');

describe('GitHub', () => {
  describe('.getRepository(user, owner, repository)', () => {
    it('should resolve with the repository data if the repo exists', (done) => {
      factory.user().then((user) => {
        githubAPINocks.repo({
          accessToken: user.accessToken,
          owner: 'repo-owner',
          repo: 'repo-name',
          response: [200, {
            name: 'repo-name',
            owner: {
              login: 'repo-owner',
            },
            meta: {},
          }],
        });

        return GitHub.getRepository(user, 'repo-owner', 'repo-name');
      }).then((data) => {
        expect(data).to.deep.equal({
          name: 'repo-name',
          owner: {
            login: 'repo-owner',
          },
          meta: {},
        });
        done();
      }).catch(done);
    });

    it('should resolve with null if the repo does not exist', (done) => {
      factory.user().then((user) => {
        githubAPINocks.repo({
          accessToken: user.accessToken,
          owner: 'repo-owner',
          repo: 'repo-name',
          response: [404, {
            message: 'Not Found',
            documentation_url: 'https://developer.github.com/v3',
          }],
        });

        return GitHub.getRepository(user, 'repo-owner', 'repo-name');
      }).then((result) => {
        expect(result).to.be.null;
        done();
      }).catch(done);
    });
  });

  describe('.createRepository(user, owner, repository)', () => {
    it('should create a repository for the user if the user is the owner', (done) => {
      let createRepoNock;

      factory.user().then((user) => {
        createRepoNock = githubAPINocks.createRepoForUser({
          accessToken: user.accessToken,
          repo: 'repo-name',
        });

        return GitHub.createRepo(user, user.username, 'repo-name');
      }).then(() => {
        expect(createRepoNock.isDone()).to.equal(true);
        done();
      }).catch(done);
    });

    it('should create a repository for an org if the user is not the owner', (done) => {
      let createRepoNock;

      factory.user().then((user) => {
        createRepoNock = githubAPINocks.createRepoForOrg({
          accessToken: user.accessToken,
          org: 'org-name',
          repo: 'repo-name',
        });

        return GitHub.createRepo(user, 'org-name', 'repo-name');
      }).then(() => {
        expect(createRepoNock.isDone()).to.equal(true);
        done();
      }).catch(done);
    });

    it('should create a user repository even if the case for the owner and username don\'t match', (done) => {
      let createRepoNock;

      factory.user().then((user) => {
        createRepoNock = githubAPINocks.createRepoForUser({
          accessToken: user.accessToken,
          repo: 'repo-name',
        });

        return GitHub.createRepo(user, user.username.toUpperCase(), 'repo-name');
      }).then(() => {
        expect(createRepoNock.isDone()).to.equal(true);
        done();
      }).catch(done);
    });

    it('should reject if the user is not authorized to create a repository', (done) => {
      factory.user().then((user) => {
        githubAPINocks.createRepoForOrg({
          accessToken: user.accessToken,
          org: 'org-name',
          repo: 'repo-name',
          response: [403, {
            message: 'You need admin access to the organization before adding a repository to it.',
          }],
        });

        return GitHub.createRepo(user, 'org-name', 'repo-name');
      }).catch((err) => {
        expect(err.status).to.equal(400);
        expect(err.message).to.equal('You need admin access to the organization before adding a repository to it.');
        done();
      }).catch(done);
    });

    it('should reject if the repo already exists', (done) => {
      factory.user().then((user) => {
        githubAPINocks.createRepoForOrg({
          accessToken: user.accessToken,
          org: 'org-name',
          repo: 'repo-name',
          response: [422, {
            errors: [{ message: 'name already exists on this account' }],
          }],
        });

        return GitHub.createRepo(user, 'org-name', 'repo-name');
      }).catch((err) => {
        expect(err.status).to.equal(400);
        expect(err.message).to.equal('A repo with that name already exists.');
        done();
      }).catch(done);
    });
  });

  describe('.setWebhook(site, user)', () => {
    it('should set a webhook on the repository', (done) => {
      let site;
      let user;

      factory.user()
        .then((model) => {
          user = model;
          return factory.site();
        })
        .then((model) => {
          site = model;
          githubAPINocks.webhook({
            accessToken: user.accessToken,
            owner: site.owner,
            repo: site.repository,
            response: 201,
          });
          return GitHub.setWebhook(site, user.id);
        })
        .then(() => {
          done();
        })
        .catch(done);
    });

    it('should resolve if the webhook already exists', (done) => {
      let site;
      let user;

      factory.user()
        .then((model) => {
          user = model;
          return factory.site();
        })
        .then((model) => {
          site = model;
          githubAPINocks.webhook({
            accessToken: user.accessToken,
            owner: site.owner,
            repo: site.repository,
            response: [400, {
              errors: [{ message: 'Hook already exists on this repository' }],
            }],
          });
          return GitHub.setWebhook(site, user.id);
        })
        .then(() => {
          done();
        })
        .catch(done);
    });

    it('should reject if the user does not have admin access to the repository', (done) => {
      let site;
      let user;

      factory.user()
        .then((model) => {
          user = model;
          return factory.site();
        })
        .then((model) => {
          site = model;
          githubAPINocks.webhook({
            accessToken: user.accessToken,
            owner: site.owner,
            repo: site.repository,
            response: [404, {
              message: 'Not Found',
            }],
          });
          return GitHub.setWebhook(site, user.id);
        })
        .then(() => {
          throw new Error('Expected admin access error');
        })
        .catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('You do not have admin access to this repository');
          done();
        })
        .catch(done);
    });
  });

  describe('.validateUser(accessToken)', () => {
    it('should resolve if the user is on a whitelisted team', (done) => {
      githubAPINocks.userOrganizations({
        accessToken: '123abc',
        organizations: [{ id: config.passport.github.organizations[0] }],
      });

      GitHub.validateUser('123abc').then(() => {
        done();
      }).catch(done);
    });

    it('should reject if the user is not on a whitelisted team', (done) => {
      const FAKE_INVALID_ORG_ID = 4598345;

      githubAPINocks.userOrganizations({
        accessToken: '123abc',
        organizations: [{ id: FAKE_INVALID_ORG_ID }],
      });

      GitHub.validateUser('123abc').catch((err) => {
        expect(err.message).to.equal('Unauthorized');
        done();
      });
    });

    it('should reject if access token is not a valid GitHub access token', (done) => {
      githubAPINocks.userOrganizations({
        accessToken: '123abc',
        response: 403,
      });

      GitHub.validateUser('123abc').catch(() => done());
    });
  });

  describe('.getBranch', () => {
    let promised;
    let mockGHRequest;

    beforeEach(() => {
      mockGHRequest = null;
      const userPromise = factory.user();
      const sitePromise = factory.site({ users: Promise.all([userPromise]) });

      promised = Promise.props({
        user: userPromise,
        site: sitePromise,
      });
    });

    it('returns a branch based on the supplied parameters', (done) => {
      promised.then((values) => {
        const { owner, repository } = values.site;
        const branch = 'master';

        mockGHRequest = githubAPINocks.getBranch({
          owner,
          repo: repository,
          branch,
        });

        return GitHub.getBranch(values.user, owner, repository, branch);
      })
      .then((branchInfo) => {
        expect(branchInfo).to.be.defined;
        expect(branchInfo.name).to.be.defined;
        expect(branchInfo.commit).to.be.defined;
        expect(mockGHRequest.isDone()).to.be.true;
        done();
      })
      .catch(done);
    });

    it('returns an error if branch is not defined', (done) => {
      promised.then((values) => {
        const { owner, repository } = values.site;
        const branch = 'master';

        mockGHRequest = githubAPINocks.getBranch({
          owner,
          repo: repository,
          branch,
        });

        return GitHub.getBranch(values.user, owner, repository)
          .catch((err) => {
            expect(err.status).to.equal('400');
            done();
          });
      })
      .catch(done);
    });
  });
});
