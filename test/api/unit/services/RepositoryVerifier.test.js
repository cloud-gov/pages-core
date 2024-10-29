const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const moment = require('moment');
const factory = require('../../support/factory');
const RepositoryVerifier = require('../../../../api/services/RepositoryVerifier');
const { Site, User } = require('../../../../api/models');
const githubAPINocks = require('../../support/githubAPINocks');
const MockGitHub = require('../../support/mockGitHub');

describe('RepositoryVerifier', () => {
  context('verifyRepos', () => {
    it('verify site', (done) => {
      let users;
      let site;

      Promise.all([factory.user(), factory.user()])
        .then((_users) => {
          users = _users;
          return factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          githubAPINocks.repo({
            accessToken: users[0].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() => Site.findByPk(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).gt(site.repoLastVerified);
          done();
        })
        .catch(done);
    }).timeout(10000);

    it('verify site with second users', (done) => {
      let users;
      let site;

      Promise.all([factory.user(), factory.user(), factory.user()])
        .then((_users) => {
          users = _users;
          return factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          githubAPINocks.repo({
            accessToken: users[0].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: 404,
          });
          githubAPINocks.repo({
            accessToken: users[1].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() => Site.findByPk(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).gt(site.repoLastVerified);
          done();
        })
        .catch(done);
    }).timeout(12000);

    it('not able to verify sites with users that cannot access repository', (done) => {
      let users;
      let site;

      Promise.all([factory.user(), factory.user()])
        .then((_users) => {
          users = _users;
          return factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          githubAPINocks.repo({
            accessToken: users[0].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: 404,
          });
          githubAPINocks.repo({
            accessToken: users[1].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: 404,
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() => Site.findByPk(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).deep.equal(site.repoLastVerified);
          done();
        })
        .catch(done);
    });

    it('not able to verify sites with users without access tokens', (done) => {
      let users;
      let site;
      Promise.all([
        factory.user({
          githubAccessToken: null,
        }),
        factory.user({
          githubAccessToken: null,
        }),
      ])
        .then((_users) => {
          users = _users;
          return factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          githubAPINocks.repo({
            accessToken: users[0].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: 404,
          });
          githubAPINocks.repo({
            accessToken: users[1].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: 404,
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() => Site.findByPk(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).deep.equal(site.repoLastVerified);
          done();
        })
        .catch(done);
    });

    it('verify sites only with users that have githubAccessToken', (done) => {
      let users;
      const repoLastVerified = moment().subtract(1, 'day').toDate();
      Site.destroy({
        where: {},
        truncate: true,
      })
        .then(() =>
          factory.site({
            users: [],
            repoLastVerified,
          }),
        )
        .then(() =>
          factory.user({
            githubAccessToken: null,
            repoLastVerified,
          }),
        )
        .then((user) =>
          factory.site({
            users: [user],
            repoLastVerified,
          }),
        )
        .then(() => Promise.all([factory.user(), factory.user()]))
        .then((_users) => {
          users = _users;
          return Promise.all([
            factory.site({
              users,
              repoLastVerified,
            }),
            factory.site({
              users,
              repoLastVerified,
            }),
            factory.site({
              users,
              repoLastVerified,
            }),
          ]);
        })
        .then((sites) => {
          sites.forEach((site) => {
            githubAPINocks.repo({
              accessToken: users[0].githubAccessToken,
              owner: site.owner,
              repo: site.repository,
              response: 404,
            });
            githubAPINocks.repo({
              accessToken: users[1].githubAccessToken,
              owner: site.owner,
              repo: site.repository,
            });
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() =>
          Site.findAll({
            include: User,
          }),
        )
        .then((sites) => {
          expect(sites.length).to.equal(5);
          expect(sites.filter((site) => site.Users.length > 0).length).to.equal(4);
          expect(
            sites.filter((site) => site.repoLastVerified > repoLastVerified).length,
          ).to.equal(3);
          done();
        })
        .catch(done);
    });
  });

  context('verifyUserRepos', () => {
    it('verify sites only with users that have githubAccessToken', (done) => {
      const MockRepositoryVerifier = proxyquire(
        '../../../../api/services/RepositoryVerifier',
        {
          './GitHub': MockGitHub,
        },
      );
      let user;
      let sites;
      const repoLastVerified = moment().subtract(1, 'day').toDate();
      factory
        .user()
        .then((model) => {
          user = model;
          const owner = 'owner';
          return Promise.all([
            factory.site({
              owner,
              repository: 'repo-0',
              users: [user],
              repoLastVerified,
            }),
            factory.site({
              owner,
              repository: 'repo-1',
              users: [user],
              repoLastVerified,
            }),
            factory.site({
              owner,
              repository: 'repo-2',
              repoLastVerified,
            }),
          ]);
        })
        .then((models) => {
          sites = models;
          return MockRepositoryVerifier.verifyUserRepos(user);
        })
        .then(() =>
          Site.findAll({
            where: {
              id: sites.map((s) => s.id),
            },
          }),
        )
        .then((models) => {
          sites = models;
          expect(sites.length).equal(3);
          expect(
            sites.filter((s) => s.repoLastVerified > repoLastVerified).length,
          ).to.equal(2);
          done();
        })
        .catch(done);
    });
  });
});
