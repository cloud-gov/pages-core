const expect = require('chai').expect;
const factory = require('../../support/factory');
const RepositoryVerifier = require('../../../../api/services/RepositoryVerifier');
const { Site, User } = require('../../../../api/models');
const githubAPINocks = require('../../support/githubAPINocks');

describe('RepositoryVerifier', () => {
  context('verifyRepos', () => {
    it('verify site', (done) => {
      let users;
      let site;

      Promise.all([factory.user(), factory.user()])
        .then((_users) => {
          users = _users;
          return  factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          expect(site.repoLastVerified).to.be.null;
          githubAPINocks.repo({
            accessToken: users[0].githubAccessToken,
            owner: site.owner,
            repo: site.repository
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() => Site.findById(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).to.be.an.instanceOf(Date);
          done();
        })
        .catch(done);
    });

    it('verify site with second users', (done) => {
      let users;
      let site;

      Promise.all([factory.user(), factory.user(), factory.user()])
        .then((_users) => {
          users = _users;
          return  factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          expect(site.repoLastVerified).to.be.null;
          githubAPINocks.repo({
            accessToken: users[0].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            response: 404,
          });
          githubAPINocks.repo({
            accessToken: users[1].githubAccessToken,
            owner: site.owner,
            repo: site.repository
          });
          return RepositoryVerifier.verifyRepos();
        })
        .then(() => Site.findById(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).to.be.an.instanceOf(Date);
          done();
        })
        .catch(done);
    });

    it('not able to verify sites with users that cannot access repository', (done) => {
      let users;
      let site;

      Promise.all([factory.user(), factory.user()])
        .then((_users) => {
          users = _users;
          return  factory.site({ users });
        })
        .then((_site) => {
          site = _site;
          expect(site.repoLastVerified).to.be.null;
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
        .then(() => Site.findById(site.id))
        .then((_site) => {
          expect(_site.repoLastVerified).to.be.null;
          done();
        })
        .catch(done);
    });

    it('verify sites only with users that have githubAccessToken', (done) => {
      let users;
      Site.destroy({ where: {}, truncate: true })
        .then(() => factory.site({ users: [] }))
        .then(() => factory.user({ githubAccessToken: null }))
        .then((user) => factory.site({ users: [user] }))
        .then(() => Promise.all([factory.user(), factory.user()]))
        .then((_users) => {
          users = _users;
          return Promise.all([
            factory.site({ users }),
            factory.site({ users }),
            factory.site({ users }),
          ]);
        })
        .then((sites) => {
          sites.forEach(site => {
            expect(site.repoLastVerified).to.be.null;
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
        .then(() => Site.findAll({ include: User }))
        .then((sites) => {
          expect(sites.length).to.equal(5);
          expect(sites.filter(site => site.Users.length > 0).length).to.equal(4);
          expect(sites.filter(site => site.repoLastVerified).length).to.equal(3);
          done();
        })
        .catch(done);
    });
  });
});
