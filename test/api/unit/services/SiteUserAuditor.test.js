const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const factory = require('../../support/factory');
const MockGitHub = require('../../support/mockGitHub');
const { SiteUser, User, UserAction } = require('../../../../api/models');

const SiteUserAuditor = proxyquire('../../../../api/services/SiteUserAuditor', {
  './GitHub': MockGitHub,
});

describe('SiteUserAuditor', () => {
  before(() =>
    factory.user({
      username: process.env.USER_AUDITOR,
    }),
  );
  after(() =>
    User.truncate({
      force: true,
      cascade: true,
    }),
  );

  context('auditAllUsers', () => {
    it('it should remove sites without push from user and site w/o repo', (done) => {
      let user;

      factory
        .user()
        .then((model) => {
          user = model;
          return Promise.resolve();
        })
        .then(() => MockGitHub.getRepositories(user.githubAccessToken))
        .then((repositories) => {
          const sites = [];
          repositories.forEach((r) => {
            const fullName = r.full_name.split('/');
            const owner = fullName[0];
            const repository = fullName[1];
            sites.push(
              factory.site({
                owner,
                repository,
                users: [user],
              }),
            );
          });
          sites.push(
            factory.site({
              owner: 'owner',
              repository: 'remove-repo',
              users: [user],
            }),
          );
          return Promise.all(sites);
        })
        .then(() =>
          UserAction.findAll({
            where: {
              targetId: user.id,
            },
          }),
        )
        .then((userActions) => {
          expect(userActions.length).to.eql(0);
          return SiteUser.findAll({
            where: {
              user_sites: user.id,
            },
          });
        })
        .then((siteUsers) => {
          expect(siteUsers.length).to.eql(11);
          return SiteUserAuditor.auditAllUsers();
        })
        .then(() =>
          SiteUser.findAll({
            where: {
              user_sites: user.id,
            },
          }),
        )
        .then((siteUsers) => {
          expect(siteUsers.length).to.eql(9);
          return UserAction.findAll({
            where: {
              targetId: user.id,
            },
          });
        })
        .then((userActions) => {
          expect(userActions.length).to.eql(2);
          done();
        })
        .catch(done);
    });
  });

  context('auditAllSites', () => {
    it('should remove user from site if not push collaborator', (done) => {
      let site;
      const owner = 'owner';
      const repository = 'repo';

      MockGitHub.getCollaborators('githubAccessToken', owner, repository)
        .then((collabos) => {
          const users = [];
          const signedInAt = new Date('2011-01-30');
          collabos.forEach((c) =>
            users.push(
              factory.user({
                username: c.login,
                signedInAt,
              }),
            ),
          );
          users.push(
            factory.user({
              username: 'non-collab1',
              githubAccessToken: 'reject',
            }),
          );
          users.push(
            factory.user({
              username: 'non-collab2',
              signedInAt,
            }),
          );
          return Promise.all(users);
        })
        .then((users) =>
          factory.site({
            owner,
            repository,
            users,
          }),
        )
        .then((model) => {
          site = model;
          return SiteUser.findAll({
            where: {
              site_users: site.id,
            },
          });
        })
        .then((siteUsers) => {
          expect(siteUsers.length).to.eql(12);
          return UserAction.findAll({
            where: {
              siteId: site.id,
            },
          });
        })
        .then((userActions) => {
          expect(userActions.length).to.eql(0);
          return SiteUserAuditor.auditAllSites();
        })
        .then(() =>
          SiteUser.findAll({
            where: {
              site_users: site.id,
            },
          }),
        )
        .then((siteUsers) => expect(siteUsers.length).to.eql(9))
        .then(() => SiteUserAuditor.auditAllSites())
        .then(() =>
          SiteUser.findAll({
            where: {
              site_users: site.id,
            },
          }),
        )
        .then((siteUsers) => {
          expect(siteUsers.length).to.eql(9);
          return UserAction.findAll({
            where: {
              siteId: site.id,
            },
          });
        })
        .then((userActions) => {
          expect(userActions.length).to.eql(3);
          done();
        })
        .catch(done);
    });
  });
});
