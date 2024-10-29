const expect = require('chai').expect;
const factory = require('../../support/factory');
const { User, Site, SiteUser } = require('../../../../api/models');

describe('SiteUser model', () => {
  it('returns the site object with user association', (done) => {
    let user1;
    let user2;
    let site1;
    let site2;

    factory
      .user()
      .then((user) => {
        user1 = user;
        return factory.site({
          users: [user1],
        });
      })
      .then((model) => {
        site1 = model;
        return SiteUser.findOne({
          where: {
            site_users: site1.id,
            user_sites: user1.id,
          },
          include: [User, Site],
        });
      })
      .then((siteUser) => {
        expect(siteUser.site_users).to.equal(site1.id);
        expect(siteUser.user_sites).to.equal(user1.id);
        expect(siteUser.buildNotificationSetting).to.equal('site');

        expect(siteUser.Site.id).to.equal(site1.id);
        expect(siteUser.User.id).to.equal(user1.id);
        expect(siteUser.buildNotificationSetting).to.equal('site');
        return factory.user();
      })
      .then((user) => {
        user2 = user;
        return Site.withUsers(site1.id);
      })
      .then((siteWithUsers) => {
        expect(siteWithUsers.Users).to.be.an('array');
        expect(siteWithUsers.Users.length).to.equal(1);
        return factory.site({
          users: [user1, user2],
        });
      })
      .then((site) => {
        site2 = site;
        return Site.withUsers(site2.id);
      })
      .then((siteWithUsers) => {
        expect(siteWithUsers.Users).to.be.an('array');
        expect(siteWithUsers.Users.length).to.equal(2);

        return Promise.all([
          User.findOne({
            where: {
              id: user1.id,
            },
            include: [Site],
          }),
          User.findOne({
            where: {
              id: user2.id,
            },
            include: [Site],
          }),
        ]);
      })
      .then((usersWithSites) => {
        expect(usersWithSites[0].Sites.length).to.equal(2);
        expect(usersWithSites[1].Sites.length).to.equal(1);
        done();
      })
      .catch(done);
  });
});
